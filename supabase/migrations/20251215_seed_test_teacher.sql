-- Cria um usuário de teste na tabela pública de professores
-- NOTA: O login deve ser criado via Auth do Supabase (SignUp). Mas podemos pré-cadastrar o professor na tabela 'professores'.

INSERT INTO professores (nome_completo, email, materia)
VALUES ('Professor Teste', 'teste@sj.pro.br', 'Matemática')
ON CONFLICT (email) DO NOTHING;

-- Para testar o login, você precisará criar a conta no Auth (SignUp) com este email e uma senha.
-- Como não posso criar senhas criptografadas diretamente no banco 'auth' facilmente por aqui, 
-- recomendo registrar esse usuário na tela de login ou pelo painel do Supabase.
