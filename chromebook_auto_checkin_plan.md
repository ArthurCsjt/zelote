# Plano de Engenharia Detalhado: Check-in Automático de Chromebooks

Este documento apresenta a arquitetura completa e a prova de falhas para o sistema de **Check-in Invisível e Rastreabilidade Individual de Chromebooks no Zelote**, utilizando uma **Mini-Extensão ChromeOS gerenciada pelo Google Workspace** e o **Backend Supabase**.

---

## 1. Visão Geral da Arquitetura

```
┌────────────────────────────────────────────────────────┐
│               Chromebook do Aluno (ChromeOS)           │
│                                                        │
│  1. Aluno faz login com conta @sj.g12.br               │
│  2. Extensão Corporativa inicia em background          │
│  3. Coleta:                                            │
│     - Email (chrome.identity)                          │
│     - Asset ID (chrome.enterprise.deviceAttributes)    │
│     - Serial Number (chrome.enterprise.deviceAttributes)
│  4. Envia payload autenticado para o Supabase          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS POST (com retry e cache offline)
                            ▼
┌────────────────────────────────────────────────────────┐
│            Edge Function (chromebook-checkin)          │
│                                                        │
│  1. Valida integridade do e-mail (@sj.g12.br)          │
│  2. Localiza aparelho por Asset ID ou Serial Number    │
│  3. Enriquece dados com tabela `students` (RA, Turma)  │
│  4. Localiza empréstimo ativo do lote                  │
│  5. Registra sessão na tabela `loan_checkins`          │
└───────────────────────────┬────────────────────────────┘
                            │ Supabase Realtime
                            ▼
┌────────────────────────────────────────────────────────┐
│                Painel Zelote (Coordenação/Prof)         │
│                                                        │
│  - Grade de máquinas pisca verde em tempo real         │
│  - Linha do tempo exibe quem usou e em qual horário    │
│  - Alertas para aparelhos sem check-in ou sem lote     │
└────────────────────────────────────────────────────────┘
```

---

## 2. A Mini-Extensão ChromeOS (Resiliente e Segura)

A extensão é instalada de forma forçada pelo Google Admin Console para a Unidade Organizacional (OU) dos Alunos. O aluno não tem permissão para desativar, desinstalar ou inspecionar o código.

### 2.1 Estrutura de Arquivos
* `manifest.json`: Manifesto V3 com permissões mínimas e estritas.
* `background.js`: Service worker responsável pela leitura dos dados e envio resiliente.

### 2.2 Permissões Estritas (`manifest.json`)
```json
{
  "manifest_version": 3,
  "name": "Zelote Check-in",
  "version": "1.0.0",
  "permissions": [
    "enterprise.deviceAttributes",
    "identity",
    "identity.email",
    "storage"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

### 2.3 Tratamento de Falhas na Extensão (Blindagem)
1. **Queda de Wi-Fi / Sem Internet no Momento do Login**:
   * *Risco*: O aluno abre o Chromebook em sala antes do Wi-Fi conectar.
   * *Solução*: A extensão tenta o envio imediato. Se falhar, armazena o check-in em `chrome.storage.local` e adiciona um listener para o evento `navigator.onLine`, além de tentar novamente a cada 15 segundos (com limite de 5 tentativas).
2. **Asset ID Não Preenchido no Google Admin**:
   * *Risco*: O TI da escola não cadastrou o campo "Asset ID" de um Chromebook novo.
   * *Solução*: A extensão envia **obrigatoriamente o Serial Number físico da placa-mãe**. Se o Asset ID for vazio, o backend do Zelote busca o aparelho pelo número de série.

---

## 3. Modelagem do Banco de Dados (Suporte a Múltiplos Alunos por Aparelho)

Para resolver o caso de **troca de turma** ou **múltiplos alunos no mesmo Chromebook**, **não** sobrescrevemos a linha de empréstimo. Criamos uma tabela filha especializada em sessões de uso.

### 3.1 Nova Tabela: `loan_checkins`
```sql
CREATE TABLE public.loan_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE,
  chromebook_id TEXT NOT NULL REFERENCES public.chromebooks(id),
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_ra TEXT,
  student_class TEXT,
  serial_number TEXT,
  checkin_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para buscas ultrarrápidas
CREATE INDEX idx_loan_checkins_loan_id ON public.loan_checkins(loan_id);
CREATE INDEX idx_loan_checkins_chromebook ON public.loan_checkins(chromebook_id);
CREATE INDEX idx_loan_checkins_email ON public.loan_checkins(student_email);
```

### 3.2 Como o ciclo de vida é representado no banco:
* **`loans`**: Guarda o empréstimo mestre (ex: Retirada do lote com o Prof. Silva às 08:00).
* **`loan_checkins`**: Guarda cada entrada de aluno naquele aparelho:
  * Registro 1: `CHR001` ➔ Joãozinho às 08:12.
  * Registro 2: `CHR001` ➔ Pedrinho às 09:05 (mesmo aparelho, nova aula/troca de aluno).
* **`returns`**: Guarda a devolução física final do aparelho ao armário/carrinho às 10:00.

---

## 4. Backend: Edge Function (`chromebook-checkin`)

Criada no Supabase em TypeScript/Deno para processar as requisições da extensão com validação estrita.

### 4.1 Fluxo de Validação
1. **Validação de Domínio**:
   * Garante que o e-mail termina obrigatoriamente com `@sj.g12.br`. Rejeita qualquer outro domínio.
2. **Resolução de Hardware Dupla**:
   * Procura o Chromebook pelo `chromebook_id` (Asset ID).
   * Se não encontrar ou o Asset ID for nulo, procura pelo `serial_number`.
3. **Resolução do Aluno no Banco**:
   * Consulta a tabela `students` do Zelote pelo e-mail do aluno para obter o **RA** e a **Turma** oficiais.
   * Se o aluno não estiver cadastrado previamente na tabela `students`, utiliza o nome fornecido pelo Google e marca o RA como pendente (não trava a aula).
4. **Verificação de Empréstimo Ativo**:
   * **Cenário A (Normal)**: Existe um empréstimo ativo para o `CHR001` (retirado no lote pelo professor). A Edge Function insere a nova sessão em `loan_checkins`.
   * **Cenário B (Sem Lote Prévio)**: O aluno ligou o Chromebook, mas ninguém deu saída no Zelote.
     * A função registra o check-in com `loan_id = NULL` e dispara uma notificação de alerta para a equipe: *"⚠️ Uso detectado sem empréstimo prévio no CHR001 por aluno@sj.g12.br"*.
5. **Prevenção de Duplicidade de Check-in**:
   * Se o mesmo aluno fechar e abrir a tampa 5 vezes na mesma aula, a Edge Function verifica se o último check-in daquele aparelho nos últimos 45 minutos já pertence a esse mesmo aluno. Se for o mesmo, apenas atualiza o heartbeat sem poluir o histórico.

---

## 5. Interface do Usuário no Zelote (Front-end)

### 5.1 Painel de Empréstimos Ativos (`ActiveLoans.tsx`)
Quando um professor ou coordenador olha o lote em andamento:
* Cada Chromebook do lote exibe um status em tempo real via **Supabase Realtime**:
  * 🟢 **Em Uso**: `CHR001 — Joãozinho (9º Ano A) • 08:12`
  * 🟡 **Aguardando Aluno**: `CHR002 — Disponível na sala (nenhum login)`
  * 🔄 **Troca de Aluno**: `CHR003 — Pedrinho (09:05) [Anterior: Mariazinha 08:15]`

### 5.2 Histórico Completo de Empréstimos (`LoanHistory.tsx`)
Ao abrir os detalhes de um empréstimo passado, exibe a **Linha do Tempo Visual**:
```text
🕒 08:00 — Empréstimo em Lote iniciado por Prof. Carlos Silva (História)
   ├─ 💻 08:12 às 08:50 — Sessão 1: João Silva (joao.silva@sj.g12.br | RA: 12345)
   └─ 💻 09:05 às 09:50 — Sessão 2: Pedro Santos (pedro.santos@sj.g12.br | RA: 67890)
✅ 10:00 — Devolvido ao carrinho e conferido por Coordenação
```

---

## 6. Matriz de Riscos, Falhas Graves e Mitigações

| Risco Identificado | Gravidade | Mitigação Arquitetural |
| :--- | :---: | :--- |
| **Aluno tentar burlar a URL ou fingir ser outro aluno** | Alta | A extensão não passa pela URL do navegador. Ela chama a API de background diretamente do sistema operacional, onde o aluno não tem acesso. |
| **Chromebook formatado (Powerwash de fábrica)** | Média | A extensão é gerenciada via MDM (Google Admin). No primeiro login do aluno após a formatação, o ChromeOS baixa e ativa a extensão em 2 segundos. |
| **Aparelho sem conexão no login** | Média | Cache local em `chrome.storage.local` com retry exponencial e escuta do evento `online`. |
| **Spam de check-in (aluno fecha e abre a tampa)** | Baixa | Debounce no backend: ignora check-ins redundantes do mesmo aluno no mesmo aparelho em intervalo menor que 30 minutos. |
| **Aluno sem cadastro prévio no Zelote** | Baixa | Fallback gracioso: o sistema cria a sessão usando os dados do e-mail do Google e cria o vínculo automaticamente. |

---

## 7. Roteiro de Implantação no Google Admin Console

1. **Ativar Permissão de Atributos de Dispositivo**:
   * *Caminho*: `Dispositivos > Chrome > Configurações > Usuários e navegadores > Acesso às informações do dispositivo`.
   * *Ação*: Permitir que extensões corporativas acessem o número de série e Asset ID.
2. **Cadastrar a Extensão na OU dos Alunos**:
   * *Caminho*: `Dispositivos > Chrome > Apps e extensões > Usuários e navegadores`.
   * *Ação*: Selecionar a Unidade Organizacional "Alunos" (`@sj.g12.br`) e definir a política da extensão Zelote como **"Instalação forçada" (Force install)**.
3. **Bloqueio de Ferramentas de Desenvolvedor**:
   * Garantir que a política `Ferramentas de desenvolvedor` esteja como *Desativada* para alunos (padrão em escolas).

---

## 8. Fases Recomendadas de Execução

1. **Fase 1 (Banco & Backend)**: Criar a tabela `loan_checkins` e a Edge Function `chromebook-checkin` no Supabase com validação de payload.
2. **Fase 2 (Código da Mini-Extensão)**: Desenvolver os arquivos `manifest.json` e `background.js` da extensão corporativa.
3. **Fase 3 (Interface do Zelote)**: Atualizar o `ActiveLoans` e `LoanHistory` para exibir as sessões de check-in em tempo real.
4. **Fase 4 (Piloto Controlado)**: Testar a extensão em 2 ou 3 Chromebooks de um carrinho antes de distribuir para a escola inteira.
