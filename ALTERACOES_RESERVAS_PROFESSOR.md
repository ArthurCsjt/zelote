# Resumo das Alterações - Sistema de Reservas para Professores

## ✅ O que foi alterado:

### 1. **Estrutura de Dados (`useDatabase.ts`)**
- ❌ Removido: `professor_id` (obrigatório) e `subject`
- ✅ Adicionado: 
  - `justification` (obrigatório): Motivo/justificativa do agendamento
  - `needs_tv` (opcional): Necessidade de TV
  - `needs_sound` (opcional): Necessidade de equipamento de som
  - `needs_mic` (opcional): Necessidade de microfone
  - `mic_quantity` (opcional): Quantidade de microfones (se necessário)

### 2. **Interface do Formulário (`ReservationDialog.tsx`)**
O formulário agora mostra:
- ✅ Campo de texto grande para **Justificativa** (obrigatório)
- ✅ Slider para **Quantidade de Chromebooks**
- ✅ Seção de **Equipamentos Auxiliares** com:
  - Checkbox para TV
  - Checkbox para Som
  - Checkbox para Microfone + campo numérico para quantidade (1-10)
- ❌ Removido: Seletor de Professor e campo Matéria/Turma

### 3. **Banco de Dados**
Criada migração SQL que:
- Remove coluna `subject`
- Adiciona coluna `justification` (TEXT, NOT NULL)
- Adiciona colunas para equipamentos auxiliares:
  - `needs_tv` (BOOLEAN, DEFAULT FALSE)
  - `needs_sound` (BOOLEAN, DEFAULT FALSE)
  - `needs_mic` (BOOLEAN, DEFAULT FALSE)
  - `mic_quantity` (INTEGER, DEFAULT 0)

## 📋 Próximos Passos:

### Passo 1: Aplicar a migração no Supabase

Execute o SQL abaixo no **SQL Editor** do seu Dashboard do Supabase:

```sql
-- Migration to update reservations table for professor self-service
-- Date: 2025-12-19

-- 1. Add new columns
ALTER TABLE public.reservations 
ADD COLUMN IF NOT EXISTS justification TEXT,
ADD COLUMN IF NOT EXISTS needs_tv BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_sound BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_mic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mic_quantity INTEGER DEFAULT 0;

-- 2. Migrate existing data: copy 'subject' to 'justification' if exists
UPDATE public.reservations
SET justification = COALESCE(subject, 'Sem justificativa informada')
WHERE justification IS NULL;

-- 3. Make justification NOT NULL after migration
ALTER TABLE public.reservations
ALTER COLUMN justification SET NOT NULL;

-- 4. Drop the old 'subject' column
ALTER TABLE public.reservations
DROP COLUMN IF EXISTS subject;

-- 5. Add comments for documentation
COMMENT ON COLUMN public.reservations.justification IS 
  'Justificativa/motivo do agendamento fornecida pelo professor';

COMMENT ON COLUMN public.reservations.needs_tv IS 
  'Indica se o professor necessita de TV para a aula';

COMMENT ON COLUMN public.reservations.needs_sound IS 
  'Indica se o professor necessita de equipamento de som';

COMMENT ON COLUMN public.reservations.needs_mic IS 
  'Indica se o professor necessita de microfone(s)';

COMMENT ON COLUMN public.reservations.mic_quantity IS 
  'Quantidade de microfones solicitados (0 se não necessitar)';
```

### Passo 2: Criar o usuário de teste

No Dashboard do Supabase:
1. Vá em **Authentication → Users**
2. Clique em **Add user** ou **Invite**
3. Preencha:
   - Email: `teste@sj.pro.br`
   - Password: `123456`
   - Marque **Auto Confirm User**
4. Clique em **Create user**

### Passo 3: Testar o fluxo

1. Faça login com `teste@sj.pro.br` / `123456`
2. O sistema deve redirecionar automaticamente para **Agendamento**
3. Ao criar uma nova reserva, você verá:
   - Campo de justificativa (obrigatório)
   - Slider de quantidade
   - Checkboxes para TV, Som e Microfone
   - Campo de quantidade de microfones (aparece apenas se marcar "Microfone")

## 🎯 Resultado Final:

O formulário agora está otimizado para **professores** que fazem suas próprias reservas:
- Não precisa mais selecionar "qual professor" (usa o usuário logado)
- Não precisa mais informar "matéria/turma" (substituído por justificativa livre)
- Pode solicitar equipamentos auxiliares de forma opcional e clara
- Interface mais limpa e focada no que o professor realmente precisa informar

## 📸 Preview do Novo Formulário:

```
┌─────────────────────────────────────────┐
│ 📅 NOVA RESERVA                         │
│ sexta-feira, 19 de dezembro às 16h50   │
├─────────────────────────────────────────┤
│ ┌─────────────┬─────────────┐          │
│ │ Disponíveis │ Reservados  │          │
│ │     86      │      0      │          │
│ └─────────────┴─────────────┘          │
│                                         │
│ JUSTIFICATIVA / MOTIVO *                │
│ ┌─────────────────────────────────────┐ │
│ │ Ex: Aula de História sobre Segunda │ │
│ │ Guerra Mundial, turma 9A            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 💻 QUANTIDADE *              1          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ Mín: 1                      Máx: 86    │
│                                         │
│ EQUIPAMENTOS AUXILIARES (Opcional)      │
│ ☐ 📺 TV                                 │
│ ☐ 🔊 Som                                │
│ ☐ 🎤 Microfone                          │
│                                         │
│ [Cancelar]  [💾 CONFIRMAR RESERVA]     │
└─────────────────────────────────────────┘
```
