-- Criar função para execução segura de SQL
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Apenas permite a execução de comandos SELECT para segurança
  IF lower(trim(query)) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Apenas consultas SELECT são permitidas.';
  END IF;

  RETURN (SELECT json_agg(t) FROM (EXECUTE query) t);
END;
$$;