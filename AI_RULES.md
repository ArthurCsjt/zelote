# Regras de Desenvolvimento e Stack Técnica (Zelote)

Este documento define a stack técnica do projeto e as regras de uso das bibliotecas para garantir consistência, performance e manutenibilidade.

## Stack Técnica Principal

1.  **Framework:** React (com Vite e TypeScript).
2.  **Linguagem:** TypeScript (obrigatório em todos os arquivos `src/`).
3.  **Estilização:** Tailwind CSS (com foco em classes utilitárias e responsividade).
4.  **Componentes UI:** shadcn/ui (construído sobre Radix UI).
5.  **Roteamento:** React Router DOM.
6.  **Gerenciamento de Estado/Dados:** TanStack Query (`@tanstack/react-query`) para estado de servidor (caching, sincronização).
7.  **Backend/DB/Auth:** Supabase (`@supabase/supabase-js`).
8.  **Notificações:** Sonner (via `use-toast` hook).
9.  **Ícones:** Lucide React.
10. **Formulários:** React Hook Form e Zod (para validação de schema).

## Regras de Uso de Bibliotecas

| Funcionalidade | Biblioteca Obrigatória | Regra de Uso |
| :--- | :--- | :--- |
| **UI/Estilo** | shadcn/ui + Tailwind CSS | **Obrigatório:** Priorizar componentes shadcn/ui e classes Tailwind. Evitar CSS customizado ou bibliotecas de estilo externas. |
| **Roteamento** | React Router DOM | Manter a definição das rotas principais em `src/App.tsx`. |
| **Estado de Servidor** | TanStack Query | Usar para todas as operações assíncronas de leitura/escrita que necessitem de caching, refetching ou gerenciamento de estado global. |
| **Acesso ao DB** | `@/hooks/useDatabase` | **Obrigatório:** Todas as interações com o Supabase (CRUD) devem ser encapsuladas e expostas através do `useDatabase` hook. |
| **Notificações** | Sonner (via `use-toast`) | Usar a função `toast` exportada de `@/hooks/use-toast` para todas as mensagens de feedback ao usuário. |
| **Formulários** | React Hook Form + Zod | Usar para formulários complexos que exigem validação de schema. |
| **Datas/Tempo** | `date-fns` | Usar `date-fns` para todas as manipulações e formatação de datas. |
| **QR Code** | `qrcode.react` (Geração) / `html5-qrcode` (Leitura) | Usar as bibliotecas específicas para cada função de QR Code. |
| **Relatórios** | `jspdf`, `papaparse` | Usar `jspdf` para exportação de PDF e `papaparse` para CSV. |

## Estrutura de Arquivos

*   `src/pages/`: Componentes de página (rotas).
*   `src/components/`: Componentes reutilizáveis.
*   `src/hooks/`: Lógica de negócio e hooks customizados.
*   `src/utils/`: Funções utilitárias puras (ex: `loanCalculations.ts`, `security.ts`).