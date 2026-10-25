# Plano: novo modal de agendamento + aulas seguidas

## 1. Arquivos

Criados:
- `src/components/scheduling/ReservationDialog.tsx`: reescrito com a mesma assinatura de props (`children, date, timeSlot, totalAvailableChromebooks, currentReservations, onReservationSuccess, maxQuantity, professores`).
- `src/components/scheduling/reservation-dialog/reservation-dialog.css`: todo escopado em `.ag-modal` e `.dark .ag-modal`, com variáveis `--ag-*`, keyframes `ag-rise`, `ag-pop`, `ag-sheet` e `ag-check`, e bloco `@media (prefers-reduced-motion)`. Nenhum seletor global.
- Subcomponentes na mesma pasta, para tirar peso do arquivo principal: `RoomSheet.tsx` (bottom sheet de sala), `ProfessorSheet.tsx`, `ChromebookStepper.tsx`, `MinecraftBlock.tsx` (com o SVG do creeper), `RepeatDays.tsx`, `GuideArrow.tsx`, `SuccessScreen.tsx`, `useConsecutiveSlots.ts` e `slotUtils.ts`. Os arquivos novos já nascem tipados, sem `@ts-nocheck`.
- `src/components/scheduling/reservation-dialog/slotUtils.test.ts`: testes das regras das aulas seguidas.

Alterados fora do modal (o mínimo, e precisa da sua aprovação, ver seção 5):
- `src/services/reservationService.ts`: campo opcional `block_id` em `ReservationData` e nos inserts. `bulkCreateReservations` passa a aceitar a lista de horários. Uma função nova, `getReservationsForSlots(date, slots)`, só de leitura.
- `src/hooks/useDatabase.ts`: repassa os novos parâmetros. As funções continuam compatíveis com quem já as usa.
- Migração SQL (abaixo): só escrita para você revisar, não será aplicada.

Não mudam: ui/dialog.tsx, CSS global, tailwind.config, as outras telas, SchedulingSlot/SchedulingCalendar, .env e keys.json.

## 2. Seções

- **Casca**: Radix `DialogPrimitive.Root/Portal/Overlay/Content` usado direto (fica com foco, Esc e aria-modal) e overlay/conteúdo próprios animados com `framer-motion` (`AnimatePresence` + `forceMount`), o que permite animação de saída. Abrir: `y:40 scale:.94` para normal em .55s `cubic-bezier(.34,1.4,.64,1)`. Fechar: .2s ease-in. Overlay `rgba(8,14,34,.5)` com blur 8, margem 12px mais `env(safe-area-inset-*)`. As fontes Lexend e Silkscreen entram por um `<link>` do Google Fonts injetado uma única vez pelo componente.
- **Cascata**: classe `ag-rise` com `animation-delay` por índice (.05 / .12…​.47 / .52). Minecraft usa `ag-pop`.
- **Cabeçalho**: gradiente e brilho radial. A pílula usa `format(date,"EEE, dd MMM",ptBR)` mais o horário e " · N aulas". A sombra liga com um listener de scroll (`scrollTop > 0`).
- **Cartão de seção**: título, círculo numerado de 28px que vira check verde conforme um `isDone` derivado do estado.
- **0 Reservar para**: reaproveita `isBookingForOther`, `selectedProfessorId` e `professores`. A busca fica numa sheet com letras de seção e avatar pela inicial. "Disciplina" e "Livre/Em aula" só aparecem se existir dado (ver seção 5). O aviso de professor ocupado vem do cruzamento das reservas das aulas escolhidas com `professor_id`.
- **2 Sala**: reaproveita `classroom`, `recentClassrooms`, `saveRecentClassroom`, `combinedSpaces` (com a mesma classificação), `ACTIVE_CLASSROOM_MAP` e a regra atual de conflito, agora aplicada a todas as aulas. A `RoomSheet` tem alça arrastável (`drag="y"`: mais de 110px fecha), busca fixa no topo, filtro sem acento (`normalize NFD`), trecho destacado, cabeçalhos fixos com contador, `aria-live` com a contagem e `inert` no conteúdo de trás. Esc fecha a sheet (com `stopPropagation`, para não fechar o modal) e devolve o foco.
- **3 Chromebooks**: stepper com botões de 58px e input numérico que só corrige o valor no `onBlur`. Atalhos: "Só a sala", 15, 30 e "Turma toda", este só se existir contagem de alunos por turma. O Slider sai. A faixa de resumo e o bloqueio usam `hasInteractedQuantity`. O limite é `isMinecraft ? 40 : effectiveMax`.
- **4 Minecraft**: mesma condição de hoje (`!isManutencao && isChromebookSpace`), com o visual descrito e o texto atual.
- **5 Recursos**: mesma regra de exibição, chips com `aria-pressed`, Mic de 1 a 2.
- **6 Repetir**: switch 52x30. Reaproveita `extraDates`, `isMultiMode`, `handleAddSameWeekday`, `handleAddNextSchoolDays` e o `CalendarUI` atual, com `classNames` e `modifiers` novos (passado, fim de semana, principal, extra, ocupado). A seleção é imediata. "Concluir · N datas" só fecha o calendário. O ponto vermelho e os conflitos usam uma leitura das datas extras e aulas.
- **7 Conteúdo**: textarea com `maxLength 200` e contador.
- **Seta guia**: calcula o primeiro alvo pendente (professor, sala, sala ocupada, quantidade, conflitos). A posição vem de `getBoundingClientRect` relativo ao scroller, recalculada em render, scroll e resize (`ResizeObserver`). Se o alvo estiver fora da área visível, vira o botão flutuante "↓ …", que faz `scrollIntoView` e dá foco. Some com a sheet aberta e na tela de sucesso.
- **Rodapé**: resumo com `aria-live`. O botão mostra o motivo do bloqueio pela ordem de prioridade. Enquanto envia, fica com o spinner e um `ref` trava o duplo envio.
- **Sucesso**: tela no próprio modal com check em SVG animado por `stroke-dashoffset` e o resumo. Toast, som e `onReservationSuccess()` disparam assim que salvar. "Nova reserva" limpa o estado.

## 3. Aulas seguidas

- **Fonte dos horários**: `timeSlots` em `src/utils/scheduling.ts`, que SchedulingCalendar já importa. Bate com a sua lista.
- **Chips 1 a 4 aulas**: limitados por `timeSlots.length - índice`. "Seguidas" quer dizer as próximas da lista, mesmo com o intervalo de 10h00.
- **Leitura**: quando o modal abre, ou quando muda o número de aulas ou as datas, roda `useQuery(['reservations','slots',datas,horários])` com `getReservationsForSlots` (`.in('date')`, `.in('time_slot')`). `currentReservations` continua sendo a base da primeira aula.
- **Regras** (com testes):
  - a sala só conta como livre se não estiver ocupada em nenhuma aula, e o aviso diz qual aula conflita;
  - o máximo de Chromebooks é o menor valor de `totalAvailableChromebooks - soma` entre as aulas, e nunca passa de `maxQuantity`;
  - professor ocupado em alguma aula gera só um aviso.
- **Gravação**: grava uma linha por data e aula, todas com o mesmo `block_id` (`crypto.randomUUID()`) quando houver mais de uma aula. Com uma aula e uma data, segue usando `createReservation`. Nos outros casos, um `bulkCreateReservations` em lote com a matriz datas x aulas. A checagem de sala ocupada vale para todas as aulas.
- **Grade e cancelamento**: cada linha continua sendo uma reserva normal, então a grade, os conflitos e o cancelamento por aula seguem funcionando. Cancelar o bloco inteiro fica de fora (é outra tela).
- **SQL para revisão** (não será aplicado):
```sql
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS block_id uuid;
CREATE INDEX IF NOT EXISTS reservations_block_id_idx ON public.reservations(block_id);
```
  As políticas de acesso atuais já controlam a gravação por linha, então não precisam mudar. Isso ainda vou conferir lendo as políticas antes de aplicar.

## 4. Riscos e testes

- O arquivo tem 1606 linhas, não ~1000, e usa `@ts-nocheck`. A reescrita fica dividida em subcomponentes tipados. A lógica de envio é copiada sem mudar comportamento.
- Radix com `forceMount` mais framer-motion: o foco e o Esc precisam continuar funcionando.
- Hoje cada reserva gera e-mail, notificações e push. No lote isso acontece uma vez só. No caminho de uma única reserva com várias aulas, o lote evita N e-mails.
- Testes: `bun run vitest slotUtils.test.ts`. No preview, com Playwright e sessão logada:
  - abrir um horário e reservar 2 aulas, conferindo as duas células na grade;
  - forçar uma sala ocupada;
  - repetir em 3 dias;
  - tela de sucesso;
  - modo escuro;
  - 390px de largura;
  - reduced-motion.

## 5. Divergências e perguntas

1. Para ter as aulas seguidas e o `block_id` é preciso mexer em `reservationService.ts`, `useDatabase.ts` e no banco, todos fora do modal. Você autoriza?
2. "Disciplina" (`professores.materia`) e "Livre/Em aula" não chegam ao modal hoje: `professores` só traz `id` e `nome_completo`. Posso buscar `materia` dentro do modal ou prefere esconder?
3. "Turma toda (n)": não há contagem de alunos por turma ligada à sala. Sugiro esconder.
4. `deleteReservation` hoje lê `prof_name`, que não é coluna da tabela. Fica como está, porque está fora do escopo.
5. No modo manutenção (`isManutencao`) a seção de Chromebooks fica oculta e a regra de quantidade atual continua valendo. Confirma?
