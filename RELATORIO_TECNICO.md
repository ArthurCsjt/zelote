# Relatório Técnico do Projeto: Zelote (Sistema de Gestão de Chromebooks)

## 1. Visão Geral
O **Zelote** é uma aplicação web robusta desenvolvida para gerenciar o inventário, empréstimos, devoluções e agendamentos de Chromebooks e equipamentos auxiliares em um ambiente educacional. O sistema integra-se ao Supabase para autenticação e persistência de dados, oferecendo suporte a diferentes perfis de usuários (Alunos, Professores, Funcionários).

## 2. Stack Técnica
A aplicação utiliza tecnologias modernas para garantir performance, escalabilidade e uma experiência de usuário (UX) premium:

- **Frontend:** React 18 com Vite e TypeScript.
- **Estilização:** Tailwind CSS com componentes [shadcn/ui](https://ui.shadcn.com/) (Radix UI).
- **Gerenciamento de Estado:**
  - **Estado de Servidor:** TanStack Query (@tanstack/react-query) para cache e sincronização.
  - **Estado Local/Global:** React Context (Auth, Print, Theme).
- **Backend (BaaS):** Supabase (PostgreSQL, Auth, Edge Functions, RLS).
- **Formulários:** React Hook Form integrado com Zod para validação de schemas.
- **Feedback Visual:** Sonner (Toasts) e Lucide React (Ícones).
- **Relatórios e Dados:** jsPDF (Geração de PDFs) e PapaParse (Processamento de CSV).
- **QR Codes:** Geração (`qrcode.react`) e Leitura (`html5-qrcode`).
- **PWA:** Suporte a Progressive Web App para instalação e atualizações via Service Worker.

## 3. Arquitetura de Dados e Lógica de Negócio

### 3.1. Núcleo de Dados (`useDatabase.ts`)
O hook `useDatabase` centraliza toda a comunicação com o Supabase. É o arquivo mais crítico do projeto, contendo mais de 1500 linhas de lógica para:
- **CRUD de Chromebooks:** Gerenciamento de status (disponível, emprestado, manutenção, extraviado).
- **Operações de Empréstimo (Loans):** Registro individual e em lote (Bulk), suporte a reservas.
- **Operações de Devolução (Returns):** Registro de devoluções com sincronização automática de status através de RPCs (`sync_chromebook_status`).
- **Gerenciamento de Usuários:** Cadastro de Alunos, Professores e Funcionários via RPCs (`create_student`, etc.) para garantir integridade.

### 3.2. Fluxo de Empréstimo
O sistema permite associar empréstimos a uma **Reserva** prévia, facilitando a entrega de equipamentos em lote para turmas específicas.

### 3.3. Segurança e Regras de Negócio
- **Autenticação:** Baseada em Supabase Auth.
- **RBAC (Role-Based Access Control):** Controle de acesso baseado em perfis (Admin, Staff, Professor).
- **Audit:** Sistema de auditoria via `AuditProvider`.

## 4. Estrutura de Pastas e Componentes

- `src/pages/`: Contém as visualizações principais:
  - `Index.tsx`: Dashboard com métricas e alertas de atrasos.
  - `SchedulingPage.tsx`: Interface de agendamento por data e turno.
  - `Login.tsx`: Autenticação e recuperação de senha.
  - `Settings.tsx`: Configurações de sistema e perfil.
- `src/components/`: Componentes reutilizáveis (Layout, ErrorBoundary, UI Elements).
- `src/hooks/`: Lógica extraída, como `useDashboardData`, `useOverdueLoans`, e `usePushNotifications`.
- `src/integrations/supabase/`: Configuração do cliente Supabase e definições de tipos gerados.
- `supabase/`: Migrações SQL e Edge Functions (ex: `send-push-notification`).

## 5. Funcionalidades Principais Destacadas

1.  **Dashboard Dinâmico:** Visualização clara de equipamentos disponíveis vs. ocupados.
2.  **Agendamento Prévio:** Professores podem reservar quantidades específicas de Chromebooks para aulas futuras, incluindo acessórios (TV, som, mic).
3.  **Sistema de Devolução Inteligente:** Permite "forçar" devoluções em caso de inconsistência de dados por administradores.
4.  **Notificações Push:** Alertas automatizados para novas retiradas ou devoluções enviadas aos administradores.
5.  **Exportação de Dados:** Suporte total para exportação de históricos em PDF e CSV.
6.  **Pesquisa Avançada:** Busca refinada de Chromebooks e usuários por múltiplos critérios (RA, Serial, Email).

## 6. Observações de Manutenção
O projeto segue regras estritas definidas em `AI_RULES.md`, priorizando o uso de Tailwind CSS e componentes shadcn/ui. Existe um foco significativo em tratamento de erros de rede e resiliência (retry logic com backoff).

---
*Relatório gerado em 16/04/2026 às 12:20.*
