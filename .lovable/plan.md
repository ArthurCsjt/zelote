# Relatório de refinamento — Tela de Login

Análise da tela de login (entrar, cadastro, recuperar senha e painel de agendamentos ao lado). Nada será alterado sem a sua aprovação; ao aprovar, escolha quais itens aplicar (ou todos).

## 1. Funcional

**Alta prioridade**
1. **Botão "Entrar" travado até o e-mail ficar válido** — quem digita o e-mail errado não entende o motivo. Proposta: deixar o botão sempre ativo e mostrar o erro só ao sair do campo ou ao clicar.
2. **A mensagem de erro aparece enquanto ainda se digita** — já na primeira letra aparece o texto vermelho longo. Proposta: mostrar o aviso só depois que a pessoa sai do campo, com uma frase mais curta: "Use seu e-mail @colegiosaojudas.com.br ou @sj.pro.br".
3. **Trocar de modo apaga o e-mail** — se a pessoa clica em "Esqueceu?", precisa digitar o e-mail de novo. Proposta: manter o e-mail ao trocar entre entrar, cadastro e recuperar.
4. **Erros genéricos** — "Email ou senha incorretos" aparece também para conta não confirmada ou falha de conexão. Proposta: uma mensagem clara para cada caso: senha errada, e-mail não confirmado (com botão "reenviar confirmação"), sem internet, muitas tentativas.
5. **Mensagem técnica para o usuário** — no cadastro aparece "Verifique se o auto-registro está ativo no Supabase". Proposta: trocar por uma frase simples.
6. **Senha: o checklist não confere letra minúscula**, mas a regra exige. Proposta: incluir "Letra minúscula" e mostrar em tempo real se a confirmação de senha está igual.

**Média prioridade**
7. **Avisos dentro do cartão** — hoje os erros só aparecem num aviso que some sozinho. Proposta: mostrar o erro também em uma faixa fixa dentro do cartão.
8. **Depois do cadastro e da recuperação**: mostrar uma tela de confirmação dentro do cartão ("Enviamos um link para fulano@..."), com botão "reenviar" liberado depois de 60 segundos, em vez de voltar direto ao login.
9. **Caps Lock ligado**: avisar no campo de senha.
10. **Voltar ao endereço certo depois de entrar**: hoje sempre vai para a página inicial; quem chegou por um link volta para a página que tentou abrir.
11. **"Lembrar meu e-mail"** neste aparelho (opcional).

**Acessibilidade**
12. O botão de mostrar a senha não tem nome para leitores de tela e não pode ser alcançado do jeito certo pelo teclado. Adicionar nome ("Mostrar senha") e estado.
13. Os erros precisam ser lidos automaticamente pelos leitores de tela, e o campo com erro deve ficar marcado.
14. Desligar as animações dos quadrados flutuantes para quem pede menos movimento no aparelho.

## 2. Design (mantendo o Neo-Brutalismo)

1. **Cabeçalho do cartão** — hoje o título é "Zelote / Sistema", com o ícone pequeno. Proposta: logotipo maior, "Zelote" em destaque e a frase "Gestão de Chromebooks · Colégio São Judas".
2. **Botões entrar e Google com o mesmo peso** — hoje os dois disputam atenção. Proposta: "Entrar" amarelo forte com sombra dura; Google branco com borda; divisor "ou" com borda grossa no lugar da linha fina.
3. **Espaçamento irregular** — o login usa um espaço menor que o cadastro e a recuperação. Proposta: padronizar o espaçamento, a altura dos campos (48px) e o tamanho dos textos.
4. **Faixa colorida degradê no rodapé do cartão** — foge do estilo (o Neo-Brutalismo usa cores sólidas). Proposta: três blocos de cor sólida.
5. **Sombra decorativa duplicada** atrás do cartão (uma sombra cinza clara além da sombra do próprio cartão). Proposta: deixar só a sombra preta dura.
6. **Quadrados flutuantes** ficam por cima do conteúdo em telas médias. Proposta: menores, só nos cantos, escondidos no celular.
7. **Troca entre entrar, cadastro e recuperar** — hoje é instantânea. Proposta: transição curta (entrada de lado) e abas "Entrar | Criar conta" no topo do cartão.
8. **Celular** — o painel de agendamentos some e o cartão fica solto. Proposta: cabeçalho com logotipo acima do cartão, cartão ocupando a largura, botões grandes para o dedo.
9. **Painel de agendamentos (lado esquerdo)** — título "Agenda da semana — ao vivo", legenda das cores e um aviso quando a semana não tiver reservas.
10. **Rodapé da página**: versão do sistema e "Problemas para entrar? Fale com a TI".

## 3. Ordem sugerida
1. Funcional de alta prioridade (1–6) e acessibilidade (12–14).
2. Design 1–5 (cartão).
3. Itens restantes (celular, transições, painel, extras).

## Detalhes técnicos
- Arquivos: `src/pages/Login.tsx`, `src/components/auth/LoginSchedulingShowcase.tsx`, `GoogleLoginButton.tsx`. Sem mudanças no banco nem em `AuthContext` (exceto mapear códigos de erro do Supabase para as mensagens, item 4).
- Validação "on blur" com estado `touched`; `aria-invalid`, `aria-describedby`, `role="alert"`.
- Redirecionar para `location.state.from` após o login.
- `motion-reduce:animate-none` nas formas flutuantes.

---

# Levantamento — Menu Agendamento (onde evoluir ou implementar)

O que já existe: grade semanal e mensal, mapa de calor, limite de Chromebooks ajustável, atualização ao vivo, novo modal com aulas seguidas e repetição, detalhes da reserva com cancelamento protegido e IDs retirados/devolvidos, e histórico.

## A. Novas funções (maior impacto)
1. **Editar reserva** — hoje só dá para cancelar e criar de novo. Permitir trocar a quantidade, a sala ou os recursos, conferindo a disponibilidade.
2. **Lista de espera** — quando o horário lota, o professor entra na fila e recebe um aviso se alguém cancelar.
3. **"Minhas reservas"** — filtro ou aba com as reservas do professor logado (próximas e passadas), com cancelamento rápido.
4. **Filtros na grade** — por professor, sala, Minecraft e recursos (TV/som/microfone).
5. **Aviso de não retirada** — reserva cujo horário passou sem empréstimo vira "não retirada", e o histórico conta essas faltas por professor.
6. **Lembrete antes da aula** — aviso no celular 15 min antes do horário reservado.
7. **Retirada direto da reserva** — botão "Registrar retirada" que já abre o empréstimo com professor, sala e quantidade preenchidos (hoje existe só em parte).
8. **Bloqueio de datas** — o administrador marca feriados, provas e manutenção e a grade fica fechada nesses dias.
9. **Exportar ou imprimir a semana** em PDF, para deixar no carrinho de Chromebooks.

## B. Melhorias no que já existe
10. **Celular**: modo "um dia por vez" com deslizar para os lados, em vez de espremer a semana inteira.
11. **Botão "Hoje"** e atalhos de teclado (setas para trocar de semana, N para nova reserva).
12. **Mostrar a ocupação no próprio horário** ("80/111") com cor forte quando estiver quase lotado.
13. **Detalhes da reserva**: mostrar quem criou e quando, e as reservas ligadas (aulas seguidas ou repetidas) com "cancelar todas".
14. **Visão mensal**: clicar no dia abre a semana daquele dia; marcar feriados.
15. **Mensagens vazias** mais claras ("Nenhuma reserva nesta semana — clique em um horário para reservar").

## C. Qualidade e segurança
16. **Conferir a lotação no banco também** (hoje a conferência é feita na tela; duas pessoas reservando ao mesmo tempo podem passar do limite).
17. **Revisar os 43 alertas de segurança** do banco já registrados.
18. Voltar a ligar a checagem de erros nos arquivos do agendamento.

## Ordem sugerida
1. Itens 16, 1, 3, 13 (base sólida).
2. Itens 4, 10, 12, 5.
3. Itens 2, 6, 8, 9 e o restante.

## Detalhes técnicos (Agendamento)
- 16: função/trigger no Postgres que soma `quantity_requested` por `date + time_slot` e bloqueia acima de `chromebook_operational_limit`.
- 2: nova tabela `reservation_waitlist` com RLS; aviso via a infraestrutura de push existente.
- 5/6: status derivado (`time_slot` passado sem `associated_loans`); lembrete por job agendado.
- 8: tabela `blocked_dates` só para administradores.
- 18: remover `// @ts-nocheck` de `ReservationDialog.tsx` e dos arquivos relacionados.
