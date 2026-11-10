# Detalhes da Reserva — melhorias de design e organização

## Problemas vistos na imagem
1. **Dois botões de fechar**: há um "X" grande no quadrado e outro "x" pequeno sobreposto no canto. Deixar só um.
2. **Cabeçalho apertado**: título e a pílula de data ficam colados; falta respiro e a data poderia ter ícone de relógio.
3. **Bloco do professor solto**: avatar, nome e e-mail sem moldura; o e-mail longo quebra a leitura. Colocar em um cartão com rótulo "Solicitante" e cortar o e-mail com reticências.
4. **Selos (Não retirada / Minecraft) sem hierarquia**: o status é a informação mais importante e tem o mesmo peso do recurso extra. Subir o status para o cabeçalho (ao lado da data) e deixar "Minecraft" junto dos recursos.
5. **Cartões de quantidade e sala desequilibrados**: número "1" pequeno ao lado de "SALA GOOGLE" grande; rótulos embaixo. Padronizar: rótulo em cima (pequeno, maiúsculo), valor embaixo com o mesmo tamanho, ícone em destaque.
6. **Faltam informações úteis**: horário de retirada/devolução, IDs dos Chromebooks (se houver), aulas seguidas (bloco), repetição, observações/conteúdo da aula.
7. **Aviso amarelo longo**: texto grande em duas linhas. Encurtar ("Encerrada sem retirada no balcão") e usar a cor do status (vermelho), já que repete o selo.
8. **Rodapé só com "Fechar"**: o botão amarelo grande chama atenção para a ação menos importante. Trocar por ações reais conforme permissão: "Cancelar reserva", "Editar", "Duplicar", e "Fechar" como botão secundário.
9. **Estilo fora do padrão neo-brutalista**: gradiente azul, cantos muito arredondados e sombras suaves. Alinhar ao resto do sistema (bordas pretas grossas, sombra dura, cores sólidas) ou ao visual do novo modal de agendamento — escolher um.
10. **Celular**: no mobile, abrir como painel de baixo para cima e empilhar os cartões em uma coluna.
11. **Acessibilidade**: contraste do texto do aviso, foco visível no botão fechar, rótulos para leitores de tela nos ícones.

## Nova ordem sugerida dos campos
```text
[Cabeçalho] Detalhes da Reserva            [X]
            Terça, 10 nov · 08:00–08:50  [Não retirada]
[Solicitante] Avatar · Nome (você) · e-mail
[Grade 2x2]  Chromebooks | Sala/Local
             Retirada    | Devolução
[Recursos]   Minecraft Education · outros
[Observações / conteúdo da aula]
[Aviso curto de status]
[Rodapé]  Cancelar   Editar        Fechar
```

## Próximo passo
Aprovando, aplico só neste modal, sem mexer nas regras de reserva. Itens 8 (novas ações) e 6 (novos campos) dependem do que você quiser incluir.
