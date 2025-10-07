-- Função RPC para obter todos os usuários com status de convite
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id UUID,
    email TEXT,
    role TEXT,
    name TEXT,
    last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado. Apenas administradores podem acessar esta função.';
    END IF;

    -- Retornar usuários com JOIN entre auth.users e profiles
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        p.role,
        p.name,
        u.last_sign_in_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC;
END;
$$;
