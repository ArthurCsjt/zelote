# Redesenho dos bloquinhos de reserva na grade do Agendamento

Escopo: somente o quadrado de um horário que já tem reservas (as etiquetas de cada reserva e o botão "Adicionar"). Não muda: regras de quem pode abrir/cancelar, o balão de detalhes ao passar o mouse, a janela de detalhes, os horários encerrados e os horários vazios.

## O que está ruim hoje (pela imagem)
- Etiquetas em azul-roxo degradê com contorno no texto: aparência de botão genérico e leitura cansativa.
- Sala e quantidade numa frase só ("SALA DE ARTES + 1 CHROMEBOOKS"): corta fácil e o plural sai errado.
- Grande área bege vazia entre as etiquetas e o "Adicionar".
- "Adicionar" cinza e arredondado, fora do estilo neo-brutalista.
- Não dá para ver de relance quanto do horário já está ocupado.

## Como vai ficar

```text
┌────────────────────────────┐  borda preta 2px, cantos retos, sombra dura 3px
│ 22/30  ▓▓▓▓▓▓▓▓░░  RESTAM 8 │  1. cabeçalho de ocupação
├────────────────────────────┤
│▌SALA GOOGLE                │  2. etiqueta sem Chromebooks
│▌SALA DE ARTES       [▭ 1]  │  3. selo com a quantidade
│▌SALA DE ESTUDOS     [▭ 5]  │
│  +2 reservas               │  6. excedente
├────────────────────────────┤
│  + ADICIONAR               │  7. botão tracejado
└────────────────────────────┘
```

### 1. Cabeçalho de ocupação
- Linha fina no topo: "22/30" à esquerda, mini barra no meio, "RESTAM 8" à direita.
- Cor da barra segue a mesma escala do mapa de calor: amarelo (pouco uso), laranja (parcial/elevado), vermelho (lotado).
- Quando lotar, o texto vira "LOTADO" em selo vermelho com borda preta.
- O fundo bege inteiro sai; o bloco fica com fundo do cartão e a cor de estado aparece só na borda e na barra.

### 2. Etiqueta de cada reserva
- Fundo claro sólido, borda preta 2px, cantos retos, texto escuro em negrito (sem contorno no texto).
- Faixa colorida de 4px à esquerda indicando o tipo:
  - Azul (cor principal do sistema): reserva normal.
  - Verde: aula com Minecraft (com um pequeno ícone de bloco).
  - Cinza: manutenção.
- Nome da sala em maiúsculas, cortado com "..." se não couber; o nome completo continua no balão ao passar o mouse.
- Sem inicial ou nome do professor na etiqueta (continua só no balão de detalhes, como hoje).

### 3. Selo de quantidade
- Selo pequeno à direita com ícone de notebook + número (ex.: "▭ 5").
- Some quando a reserva é só da sala (0 Chromebooks) ou é manutenção.
- Resolve o problema do plural e libera espaço para o nome da sala.

### 4. Minhas reservas
- A etiqueta do próprio usuário ganha sombra dura de 2px e borda um pouco mais forte, para achar rápido "o que é meu".
- Reservas de outras pessoas ficam planas (sem sombra).
- Etiquetas que o usuário não pode abrir não mostram efeito de clique.

### 5. Espaçamento
- Etiquetas empilhadas a partir do topo com 4px entre elas.
- "Adicionar" logo abaixo da última etiqueta; o bloco cresce só o necessário, sem área vazia.
- Altura mínima igual à dos horários vazios para manter a grade alinhada.

### 6. Muitas reservas no mesmo horário
- Mostra até 3 etiquetas; a partir da 4ª aparece um chip "+2 reservas".
- Ao passar o mouse no chip, aparece a lista das restantes (mesmo balão já usado hoje).

### 7. Botão Adicionar
- Borda tracejada preta, cantos retos, texto preto "+ ADICIONAR".
- Ao passar o mouse, fica amarelo sólido com sombra dura.
- Escondido quando o horário está lotado ou encerrado.

### 8. Celular
- Etiqueta mostra só a sala abreviada + selo numérico.
- Texto mínimo de 9px; área de toque de pelo menos 32px de altura.
- Cabeçalho de ocupação vira só "22/30" com a barra (sem "RESTAM").

### 9. Movimento e modo escuro
- Ao passar o mouse: deslocamento de 1px para cima, sem aumentar tamanho (como você pediu antes no mapa de calor).
- Sem animação para quem ativou "reduzir movimento".
- Modo escuro: etiquetas em fundo escuro com borda clara, mesmas faixas coloridas.

## Técnico
- Arquivo único: `src/components/scheduling/SchedulingSlot.tsx`, somente o trecho do estado com reservas (linhas ~120–260).
- Trocar hex fixos e degradês por tokens existentes (primary, warning, error, foreground, card, muted).
- Ocupação calculada com dados já presentes (`jaReservados` e o limite atual); nenhuma busca nova no banco.
- Tooltip, cliques, permissões e diálogo de detalhes mantidos exatamente como estão.
