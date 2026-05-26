-- Adiciona colunas para equipamentos auxiliares na tabela de reservas
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS tv_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sound_qty INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS mic_qty INTEGER DEFAULT 0;

-- Atualiza ou recria a função create_reservation para aceitar os novos parâmetros
CREATE OR REPLACE FUNCTION create_reservation(
  p_date DATE,
  p_time_slot TEXT,
  p_professor_id UUID,
  p_subject TEXT,
  p_quantity_requested INTEGER,
  p_created_by UUID,
  p_tv_qty INTEGER DEFAULT 0,
  p_sound_qty INTEGER DEFAULT 0,
  p_mic_qty INTEGER DEFAULT 0
) 
RETURNS UUID AS $$
DECLARE
  v_reservation_id UUID;
BEGIN
  INSERT INTO reservations (
    date, 
    time_slot, 
    professor_id, 
    subject, 
    quantity_requested, 
    created_by,
    tv_qty,
    sound_qty,
    mic_qty
  )
  VALUES (
    p_date, 
    p_time_slot, 
    p_professor_id, 
    p_subject, 
    p_quantity_requested, 
    p_created_by,
    p_tv_qty,
    p_sound_qty,
    p_mic_qty
  )
  RETURNING id INTO v_reservation_id;
  
  RETURN v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
