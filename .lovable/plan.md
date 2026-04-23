

## Redesign do Header de Agendamento

Vou reorganizar e refinar visualmente apenas o card do header (linhas 123-220 de `SchedulingPage.tsx`), mantendo a identidade Neo-Brutalismo (bordas grossas pretas, sombras duras, tipografia black uppercase, cantos retos).

### Problemas atuais

- Hierarquia confusa: título, toggle de modo e navegador de semana empilhados sem separação clara
- Toggle "Semanal/Histórico" usa `scale-90` e fontes 8px — parece "comprimido" e desalinhado
- Navegador de data com altura/peso visual diferentes do título e do grid de meses
- Grid de meses (2x6) tem sombras inconsistentes (`1px` vs `4px` do título) — quebra ritmo
- Espaçamento `space-y-8` entre linhas é exagerado para um header "ultra-slim"
- No viewport atual (1186px) sobra espaço lateral mal aproveitado

### Nova estrutura (uma única linha em desktop, duas em mobile)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ [📅 AGENDAMENTO] [SEMANAL│HISTÓRICO]      [JAN FEV MAR ABR MAI JUN]         │
│ [‹ SEMANA DE 20 A 24 DE ABRIL DE 2026 ›]  [JUL AGO SET OUT NOV DEZ]         │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Coluna esquerda** (agrupada verticalmente):
  - Linha 1: Pill do título + toggle de visualização (mesma altura, mesma sombra `[3px_3px_0_0_#000]`)
  - Linha 2: Navegador de data (mesma altura `h-9`, ocupa mesma largura visual da linha 1)
- **Coluna direita**: Grid 2×6 de meses, alinhado à direita, sombras unificadas `[2px_2px_0_0_#000]`

### Refinamentos visuais

1. **Toggle Semanal/Histórico**
   - Remover `scale-90` (causa pixelização)
   - Aumentar fonte para `text-[10px]`, padding `px-3 py-1.5`, altura igual ao pill do título (`h-9`)
   - Borda `border-2`, sombra `[3px_3px_0_0_#000]`
   - Estado ativo: `bg-primary text-white` com inset shadow simulando "pressionado"

2. **Pill do título**
   - Padronizar para `h-9`, sombra `[3px_3px_0_0_#000]` (remover sombra cinza dupla)
   - Ícone `Calendar` em fundo preto contrastante (quadradinho à esquerda)

3. **Navegador de data**
   - Altura `h-9`, fonte `text-[11px]`
   - Botões `‹ ›` com hover `bg-primary/10`
   - Sombra `[3px_3px_0_0_#000]` consistente
   - `min-w-[220px]` para evitar quebras

4. **Grid de meses (2×6)**
   - Botões `h-7 w-12`, fonte `text-[10px]`
   - Sombra padronizada `[2px_2px_0_0_#000]`, hover eleva para `[3px_3px_0_0_#000]` com `-translate-y-0.5`
   - Mês ativo: `bg-primary text-white` + `translate-y-[2px] shadow-none` (efeito "pressionado")
   - Mês corrente do ano (hoje): borda `border-primary` mesmo quando inativo
   - Gap reduzido para `gap-1`

5. **Card container**
   - Padding `p-3 sm:p-4`
   - Borda `border-2 border-black dark:border-white` (atualmente `border-black/10` — fraco demais para neo-brutalismo)
   - Sombra externa `[4px_4px_0_0_#000]`
   - Remover grid pattern interno (ruído visual desnecessário neste header slim)

6. **Responsivo**
   - `< lg`: meses vão para baixo, ocupam largura total, grid passa a `grid-cols-6` em uma única linha se couber, ou mantém 2×6 centralizado
   - `< sm`: título e toggle empilham; navegador de data full-width

### Arquivos alterados

- `src/pages/SchedulingPage.tsx` — apenas o bloco `motion.div` do header (linhas 123-220). Nenhuma lógica é alterada, somente JSX/classes.

### Fora de escopo

- Calendário, legenda, lógica de navegação e queries permanecem intactos
- Erros de build pré-existentes (listados em `<build-errors>`) não fazem parte desta tarefa

