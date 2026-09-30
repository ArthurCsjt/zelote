# 💻 Zelote — Plataforma de Gestão de Recursos Tecnológicos Educacionais

> Uma plataforma moderna e centralizada para escolas gerenciarem equipamentos, reservas, empréstimos, manutenção e utilização dos seus recursos tecnológicos em um único ambiente.

---

## 📌 Sobre o Projeto

O **Zelote** foi desenvolvido para transformar a gestão de tecnologia educacional nas instituições de ensino. O sistema substitui controles manuais e planilhas descentralizadas por um ecossistema digital intuitivo, seguro e ágil, garantindo que Chromebooks, tablets, periféricos e salas multimídia estejam sempre organizados e disponíveis para as atividades pedagógicas.

A plataforma atende desde a coordenação e equipe de TI/mídias até os docentes, proporcionando controle total de patrimônio, prevenção de extravios e métricas reais de engajamento tecnológico escolar.

---

## ✨ Principais Funcionalidades

### 📅 Central de Reservas & Agendamento Inteligente
- **Ecossistema Multirrecursos**: Reserva simultânea de Chromebooks, equipamentos audiovisuais (TVs móveis, caixas de som, microfones) e suporte a projetos pedagógicos (como *Minecraft Education*).
- **Prevenção Ativa de Overbooking**: Algoritmo de cálculo de capacidade em tempo real por horário (vagas livres, reservas compartilhadas e esgotamento automático de saldo).
- **Visões Flexíveis**: Alternância rápida entre visão semanal detalhada por blocos de horários e visão mensal panorâmica.
- **Agendamento em Lote / Multi-datas**: Permite cadastrar reservas recorrentes para múltiplos dias em uma única operação.
- **Gestão de Espaços Escolares**: Alocação por salas e laboratórios com memória inteligente de locais frequentes.
- **Delegação Administrativa**: Permite que coordenadores reservem recursos em nome de qualquer docente.
- **Integração Reserva ➔ Retirada**: Conversão direta do agendamento em empréstimo ativo no momento da aula.

### 🔄 Controle Ágil de Empréstimos e Devoluções
- **Leitura por QR Code e Código de Barras**: Check-in e checkout ultrarrápidos utilizando a câmera de dispositivos móveis ou leitores dedicados.
- **Operação Individual ou em Lote**: Empréstimo para turmas inteiras ou devoluções em massa com poucos cliques.
- **Rastreamento de Prazos**: Alertas de devoluções pendentes, atrasos e histórico de movimentações por aluno e turma.

### 📦 Inventário & Gestão de Ativos
- **Ficha Completa do Dispositivo**: Número de série, patrimônio, lote, status operacional (*Disponível*, *Em Uso*, *Manutenção*, *Baixado*).
- **Geração e Impressão de Etiquetas**: Criação de etiquetas com QR Code prontas para impressão e afixação física nos equipamentos.
- **Importação e Exportação**: Suporte a importação e exportação de dados via CSV.

### 📊 Painel de Métricas & Auditoria
- **Dashboard em Tempo Real**: Gráficos e indicadores de taxa de ocupação, equipamentos mais utilizados e índice de devolução no prazo.
- **Trilha de Auditoria (Audit Log)**: Registro detalhado de operações críticas realizadas por administradores e usuários para total transparência.

### 📱 Experiência Mobile & PWA
- **Progressive Web App (PWA)**: Instalável nativamente em smartphones, tablets e desktops.
- **Suporte Offline**: Cache resiliente e sincronização para operação em locais com oscilação de conectividade.

### 🛡️ Controle de Acesso por Níveis (RBAC)
- Autenticação segura com suporte a múltiplos papéis de usuário:
  - **Super Admin / Administrador**: Acesso total a configurações, relatórios, cadastros e auditoria.
  - **Manutenção / Suporte**: Foco no status técnico, triagem e conserto de equipamentos.
  - **Professor / Docente**: Acesso facilitado para consultas de disponibilidade e reservas.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização & UI**: [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Animações**: [Framer Motion](https://www.framer.com/motion/), [GSAP](https://gsap.com/)
- **Gerenciamento de Estado & Requisições**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Backend as a Service (BaaS)**: [Supabase](https://supabase.com/) (PostgreSQL, Auth com RLS e Storage)
- **PWA & Utilitários**: `vite-plugin-pwa`, `html5-qrcode`, `qrcode.react`, `jspdf`, `papaparse`
- **Qualidade & Testes**: [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/), [Playwright](https://playwright.dev/)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- Gerenciador de pacotes `npm` ou `pnpm`

### 1. Clonar o repositório
```bash
git clone https://github.com/ArthurCsjt/zelote.git
cd zelote
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Configurar as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com base no arquivo `.env.example`:

```env
VITE_SUPABASE_PROJECT_ID="seu-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-anon-publica"
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

O aplicativo estará disponível em: `http://localhost:5173`

---

## 🧪 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento Vite com Hot Reload |
| `npm run build` | Gera o bundle otimizado para produção na pasta `dist/` |
| `npm run preview` | Visualiza localmente o build de produção |
| `npm run test` | Executa a suíte de testes unitários com Vitest |
| `npm run test:ui` | Abre a interface gráfica interativa do Vitest |
| `npm run coverage` | Gera o relatório de cobertura de testes |
| `npm run lint` | Executa o linter ESLint para validação de código |

---

## 📂 Estrutura Principal do Projeto

```text
├── src/
│   ├── components/       # Componentes modulares (agendamento, inventário, empréstimo, auditoria)
│   │   ├── audit/        # Módulo de trilha de auditoria
│   │   ├── dashboard/    # Gráficos e indicadores em tempo real
│   │   ├── scheduling/   # Calendário semanal/mensal, diálogo e cálculo de slots
│   │   └── ui/           # Componentes base de interface (shadcn/ui)
│   ├── contexts/         # Contextos React (Auth, PWA, Impressão)
│   ├── hooks/            # Hooks customizados (useDatabase, useProfileRole, etc.)
│   ├── integrations/     # Cliente e integração com Supabase
│   ├── pages/            # Páginas e rotas da aplicação
│   ├── utils/            # Utilitários, formatações e cálculos de regras de negócio
│   └── sw.ts             # Service Worker para funcionalidades PWA e cache offline
├── public/               # Ícones, manifest e assets estáticos
└── vitest.config.ts      # Configurações de testes automatizados
```

---

## 📄 Licença

Este projeto está sob desenvolvimento interno e possui todos os direitos reservados ou sob licença definida pela instituição proprietária.
