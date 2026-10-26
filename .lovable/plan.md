# Redesenho dos bloquinhos de reserva na grade do Agendamento

Escopo: somente o quadrado de um horário com reservas (pílulas + botão "Adicionar"). Lógica, cliques, tooltip, permissões e cores de estado (parcial/cheio/encerrado) não mudam.

## Problemas atuais
- Pílulas azul-gradiente com contorno de texto: parecem "botão genérico", pouca leitura.
- Sala e quantidade numa frase só ("SALA DE ARTES + 1 CHROMEBOOKS"), corta em telas menores e erra o plural.
- Espaço vazio bege grande entre as pílulas e o "Adicionar".
- "Adicionar" cinza e arredondado, fora do estilo neo-brutalista.
- Não mostra quem reservou nem quanto falta para lotar.

## Proposta (Neo-Brutalismo profissional)

```text
┌──────────────────────────┐  borda 2px preta, sombra dura 3px
│ 22/30 ▓▓▓▓▓▓▓░░ RESTAM 8 │  barra de ocupação no topo
├──────────────────────────┤
│▌SALA GOOGLE        [JS] │  faixa lateral colorida + inicial do professor
│▌SALA DE ARTES   [💻 1]  │  selo com a quantidade de Chromebooks
│▌SALA DE ESTUDOS    [MR] │
├──────────────────────────┤
│        + ADICIONAR       │  tracejado preto, preenche ao passar o mouse
└──────────────────────────┘
```

1. **Cabeçalho do bloco**: linha fina com "usados/total" e mini barra de ocupação (amarelo → laranja → vermelho quando cheio). Substitui o fundo bege inteiro por fundo do cartão.
2. **Cada reserva vira uma "etiqueta"**: fundo claro sólido, borda preta 2px, faixa colorida de 4px à esquerda indicando o tipo (azul = normal, verde = Minecraft, cinza = manutenção). Texto escuro em negrito, sem contorno.
3. **Quantidade separada**: selo pequeno à direita com ícone de laptop e número (ex.: "1"), em vez de "+ 1 Chromebooks". Sem Chromebooks, mostra a inicial do professor.
4. **Minhas reservas destacadas**: etiqueta do próprio usuário com sombra dura e um pontinho de cor; as dos outros mais discretas.
5. **Sem espaço morto**: etiquetas empilhadas no topo, "Adicionar" logo abaixo; altura acompanha o conteúdo.
6. **Botão Adicionar**: borda tracejada preta, cantos retos, vira amarelo sólido ao passar o mouse. Some quando o horário está cheio (aparece selo "LOTADO").
7. **Muitas reservas**: mostra até 3 e um chip "+2" que abre os detalhes.
8. **Mobile**: só sala abreviada + selo numérico, fonte mínima 9px, toque de 32px.
9. Movimento: apenas leve deslocamento de 1px no hover (sem aumentar o tamanho), respeitando "reduzir movimento".

## Técnico
- Arquivo único: `src/components/scheduling/SchedulingSlot.tsx` (marcação/classes do estado com reservas, linhas ~120–260).
- Usar tokens existentes (primary, warning, error, foreground, card); remover hex fixos e gradientes.
- Total/limite já disponíveis no componente (`jaReservados`); nenhuma busca nova no banco.
- Tooltip e diálogo de detalhes intactos.
