-- Criar função para execução segura de SQL
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  -- Apenas permite a execução de comandos SELECT para segurança
  IF lower(trim(query)) NOT LIKE 'select%' THEN
    RAISE EXCEPTION 'Apenas consultas SELECT são permitidas.';
  END IF;

  EXECUTE 'SELECT json_agg(t) FROM (' || query || ') t' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;