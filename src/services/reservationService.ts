import { supabase } from '@/integrations/supabase/client';
import { formatLocalDate } from '@/utils/dateUtils';
import logger from '@/utils/logger';

// Converts UI format "07h10" → DB format "07:10:00"
const toDbTime = (slot: string): string => {
  if (!slot) return slot;
  // already in HH:MM or HH:MM:SS format
  if (slot.includes(':')) return slot.length === 5 ? `${slot}:00` : slot;
  // convert "07h10" → "07:10:00"
  return slot.replace('h', ':') + ':00';
};

// Converts DB format "07:10:00" or "07:10" → UI format "07h10"
const fromDbTime = (slot: string): string => {
  if (!slot) return slot;
  if (!slot.includes(':')) return slot; // already UI format
  const [h, m] = slot.split(':');
  return `${h}h${m}`;
};

export interface ReservationData {
  date: string; // ISO date string (YYYY-MM-DD)
  time_slot: string;
  professor_id?: string;
  justification: string;
  quantity_requested: number;
  needs_tv?: boolean;
  needs_sound?: boolean;
  needs_mic?: boolean;
  mic_quantity?: number;
  is_minecraft?: boolean;
  classroom?: string;
  space_id?: string | null;
}

export interface Reservation extends ReservationData {
  id: string;
  professor_id: string;
  created_by: string;
  created_at: string;
  prof_name: string;
  prof_email: string;
  prof_role?: string;
  associated_loans?: { chromebook_id: string }[];
}

export interface Space {
  id: string;
  name: string;
  color: string;
  capacity: number | null;
  created_at: string;
}

export const getReservationsForWeek = async (startDate: string, endDate: string): Promise<Reservation[]> => {
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      prof_data:profiles!professor_id (name, email, role),
      loans (
        chromebooks (chromebook_id)
      )
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (error) throw error;

  return (data || []).map(res => {
    const profData = (res as any).prof_data;
    const profName = profData?.name;
    const profEmail = profData?.email;

    const loans = (res as any).loans || [];
    const associatedLoans = loans.map((l: any) => {
      const cb = Array.isArray(l.chromebooks) ? l.chromebooks[0] : l.chromebooks;
      return { chromebook_id: cb?.chromebook_id };
    }).filter((l: any) => l.chromebook_id);

    return {
      ...res,
      time_slot: fromDbTime((res as any).time_slot || ''),
      prof_name: profName && profName !== 'Usuário Desconhecido' ? profName : (profEmail || 'Usuário Desconhecido'),
      prof_email: profEmail || '',
      prof_role: profData?.role || '',
      justification: (res as any).justification || '',
      associated_loans: associatedLoans
    };
  }) as Reservation[];
};

export const createReservation = async (
  data: ReservationData,
  userId: string,
  userEmail?: string,
  userFullName?: string
): Promise<Reservation> => {
  const { data: result, error } = await supabase
    .from('reservations')
    .insert({
      date: data.date,
      time_slot: toDbTime(data.time_slot),
      professor_id: data.professor_id || userId,
      justification: data.justification,
      quantity_requested: data.quantity_requested,
      needs_tv: data.needs_tv || false,
      needs_sound: data.needs_sound || false,
      needs_mic: data.needs_mic || false,
      mic_quantity: data.mic_quantity || 0,
      is_minecraft: data.is_minecraft || false,
      classroom: data.classroom || '',
      space_id: data.space_id || null,
      created_by: userId,
    })
    .select(`
      *,
      prof_data:profiles!professor_id (name, email)
    `)
    .single();

  if (error) throw error;

  const profData = (result as any).prof_data;
  const profName = profData?.name;
  const profEmail = profData?.email;

  const reservationResult = {
    ...result,
    prof_name: profName && profName !== 'Usuário Desconhecido' ? profName : (profEmail || 'Usuário Desconhecido'),
    prof_email: profEmail || '',
    justification: (result as any).justification || '',
  } as Reservation;

  // Disparo de e-mail de confirmação
  let professorEmail = reservationResult.prof_email || userEmail;
  const professorName = reservationResult.prof_name || userFullName || userEmail?.split('@')[0] || 'Professor';

  if (professorEmail === 'teste@sj.pro.br' || professorEmail === 'teste@colegiosaojudas.com.br') {
    professorEmail = 'arthur.alencar@colegiosaojudas.com.br';
  }

  if (professorEmail) {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      await supabase.functions.invoke('send-reservation-email', {
        body: {
          toEmail: professorEmail,
          professorName,
          justification: reservationResult.justification,
          date: formatLocalDate(reservationResult.date),
          time: reservationResult.time_slot,
          quantity: reservationResult.quantity_requested,
          needs_tv: reservationResult.needs_tv,
          needs_sound: reservationResult.needs_sound,
          needs_mic: reservationResult.needs_mic,
          mic_quantity: reservationResult.mic_quantity,
          is_minecraft: reservationResult.is_minecraft,
        },
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        }
      });
    } catch (emailErr) {
      logger.warn('Falha silenciosa ao enviar e-mail de reserva:', emailErr);
    }
  }

  // Notificação para os responsáveis
  try {
    const responsibleUserIds = [
      'e01b402a-3f99-48e5-84f6-3b23aad4fba9',
      '2c613746-af33-47b2-bc0a-cd965f8603de',
      'e9253b42-f52e-445b-b3ea-1f0c93e4c3f9'
    ];

    const notifications = responsibleUserIds
      .filter(id => id !== userId)
      .map(responsibleId => ({
        user_id: responsibleId,
        title: 'Nova Reserva de Chromebooks',
        message: `${reservationResult.prof_name} agendou ${reservationResult.quantity_requested} Chromebooks para o dia ${formatLocalDate(reservationResult.date)} às ${reservationResult.time_slot}.`,
        type: 'reservation',
        metadata: {
          reservation_id: reservationResult.id,
          prof_name: reservationResult.prof_name,
          date: reservationResult.date,
          time_slot: reservationResult.time_slot
        }
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications' as any).insert(notifications);
    }
  } catch (notifyError) {
    logger.warn('Falha silenciosa ao criar notificações:', notifyError);
  }

  return reservationResult;
};

export const bulkCreateReservations = async (
  dates: string[],
  baseData: Omit<ReservationData, 'date'>,
  userId: string,
  userEmail?: string
): Promise<{ success: boolean; count: number }> => {
  // Checar se a sala já está ocupada
  if (baseData.classroom && baseData.classroom.trim()) {
    const { data: existingReservations } = await supabase
      .from('reservations')
      .select('date, classroom')
      .in('date', dates)
      .eq('time_slot', toDbTime(baseData.time_slot));

    if (existingReservations && existingReservations.length > 0) {
      const conflictingDates = existingReservations
        .filter(r => r.classroom?.trim().toLowerCase() === baseData.classroom?.trim().toLowerCase())
        .map(r => formatLocalDate(r.date));

      if (conflictingDates.length > 0) {
        throw new Error(`A sala "${baseData.classroom}" já está ocupada em: ${conflictingDates.join(', ')}.`);
      }
    }
  }

  const inserts = dates.map(date => ({
    date,
    time_slot: toDbTime(baseData.time_slot),
    professor_id: baseData.professor_id || userId,
    justification: baseData.justification,
    quantity_requested: baseData.quantity_requested,
    needs_tv: baseData.needs_tv || false,
    needs_sound: baseData.needs_sound || false,
    needs_mic: baseData.needs_mic || false,
    mic_quantity: baseData.mic_quantity || 0,
    is_minecraft: baseData.is_minecraft || false,
    classroom: baseData.classroom || '',
    space_id: baseData.space_id || null,
    created_by: userId,
  }));

  const { data: results, error } = await supabase
    .from('reservations')
    .insert(inserts)
    .select();

  if (error) throw error;

  // Notificação para responsáveis
  try {
    const responsibleUserIds = [
      'e01b402a-3f99-48e5-84f6-3b23aad4fba9',
      '2c613746-af33-47b2-bc0a-cd965f8603de',
      'e9253b42-f52e-445b-b3ea-1f0c93e4c3f9'
    ];

    const batchNotifications = responsibleUserIds
      .filter(id => id !== userId)
      .map(responsibleId => ({
        user_id: responsibleId,
        title: 'Novas Reservas (Lote)',
        message: `${dates.length} novos agendamentos realizados por ${userEmail?.split('@')[0]} para o horário ${baseData.time_slot}.`,
        type: 'reservation_bulk',
        metadata: {
          count: dates.length,
          time_slot: baseData.time_slot,
          dates
        }
      }));

    if (batchNotifications.length > 0) {
      await supabase.from('notifications' as any).insert(batchNotifications);
    }
  } catch (notifyErr) {
    logger.warn('Falha silenciosa ao criar notificações em lote:', notifyErr);
  }

  return { success: true, count: results.length };
};

export const deleteReservation = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const getSpaces = async (): Promise<Space[]> => {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return (data || []) as Space[];
};

export const createSpace = async (name: string, color: string = '#3B82F6', capacity?: number): Promise<Space> => {
  const { data, error } = await supabase
    .from('spaces')
    .insert({
      name: name.trim(),
      color,
      capacity: capacity || null
    })
    .select()
    .single();

  if (error) throw error;
  return data as Space;
};

export const updateSpace = async (
  id: string,
  updates: Partial<{ name: string; color: string; capacity: number | null }>
): Promise<Space> => {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.color !== undefined) payload.color = updates.color;
  if (updates.capacity !== undefined) payload.capacity = updates.capacity;

  const { data, error } = await supabase
    .from('spaces')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Space;
};

export const deleteSpace = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('spaces')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Lista Oficial das 24 Salas de Aula Ativas + 6 Espaços Especiais
export const INITIAL_DEFAULT_SPACES: string[] = [
  "SALA 3 - 1EFMA / IF3TB",
  "SALA 4 - IF3TC / INTEGRAL",
  "SALA 5 - 1EFTB",
  "SALA 6 - INTEGRAL",
  "SALA 7 - MATTB",
  "SALA 8 - IF1TB",
  "SALA 9 - IF2TB",
  "SALA 10 - 1EFTC",
  "SALA 21 - 5EFMB / 5EFTC",
  "SALA 22 - 9EFMA / 6EFTC",
  "SALA 23 - 6EFMA",
  "SALA 24 - 9EFMB / 4EFTB",
  "SALA 29 - 1MDMA",
  "SALA 30 - 1MDMB",
  "SALA 31 - 3MDMA",
  "SALA 32 - 3MDMB",
  "SALA 33 - 2MDMC",
  "SALA 34 - 2MDMB",
  "SALA 35 - 2MDMA",
  "SALA 37 - INTEGRAL",
  "SALA 38 - 8EFMA",
  "SALA 39 - 8EFMB",
  "SALA 40 - 7EFMA",
  "SALA 41 - 7EFMB",
  "SALA GOOGLE",
  "SALA MAKER",
  "BIBLIOTECA",
  "AUDITÓRIO",
  "LABORATÓRIO DE CIÊNCIAS",
  "QUADRA POLIESPORTIVA"
];

// Mapeamento das 24 Salas de Aula Ativas com suas respectivas Turmas
export const ACTIVE_CLASSROOM_MAP: Record<string, string> = {
  "SALA 3": "SALA 3 - 1EFMA / IF3TB",
  "SALA 4": "SALA 4 - IF3TC / INTEGRAL",
  "SALA 5": "SALA 5 - 1EFTB",
  "SALA 6": "SALA 6 - INTEGRAL",
  "SALA 7": "SALA 7 - MATTB",
  "SALA 8": "SALA 8 - IF1TB",
  "SALA 9": "SALA 9 - IF2TB",
  "SALA 10": "SALA 10 - 1EFTC",
  "SALA 21": "SALA 21 - 5EFMB / 5EFTC",
  "SALA 22": "SALA 22 - 9EFMA / 6EFTC",
  "SALA 23": "SALA 23 - 6EFMA",
  "SALA 24": "SALA 24 - 9EFMB / 4EFTB",
  "SALA 29": "SALA 29 - 1MDMA",
  "SALA 30": "SALA 30 - 1MDMB",
  "SALA 31": "SALA 31 - 3MDMA",
  "SALA 32": "SALA 32 - 3MDMB",
  "SALA 33": "SALA 33 - 2MDMC",
  "SALA 34": "SALA 34 - 2MDMB",
  "SALA 35": "SALA 35 - 2MDMA",
  "SALA 37": "SALA 37 - INTEGRAL",
  "SALA 38": "SALA 38 - 8EFMA",
  "SALA 39": "SALA 39 - 8EFMB",
  "SALA 40": "SALA 40 - 7EFMA",
  "SALA 41": "SALA 41 - 7EFMB",
};

// Sincronização Inteligente: Atualiza salas existentes no banco e insere as que faltam
export const seedDefaultSpaces = async (): Promise<Space[]> => {
  const existing = await getSpaces();

  // Helper para identificar a sala pelo número (ex: "SALA 3", "sala 03", "SALA 3 - 1EFMA")
  const extractRoomKey = (name: string): string | null => {
    const match = name.trim().toUpperCase().match(/^SALA\s*0?(\d+)/);
    if (match) return `SALA ${parseInt(match[1], 10)}`;
    return null;
  };

  // Mapeia salas já existentes no banco
  const existingByRoomKey = new Map<string, Space>();
  for (const s of existing) {
    const rKey = extractRoomKey(s.name);
    if (rKey) {
      existingByRoomKey.set(rKey, s);
    }
  }

  // 1. Atualiza salas existentes no banco com as turmas ativas
  for (const [key, fullName] of Object.entries(ACTIVE_CLASSROOM_MAP)) {
    const found = existingByRoomKey.get(key);
    if (found) {
      if (found.name.trim().toLowerCase() !== fullName.toLowerCase()) {
        await supabase
          .from('spaces')
          .update({ name: fullName })
          .eq('id', found.id);
      }
    } else {
      // 2. Se a sala não existir no banco, insere
      await supabase
        .from('spaces')
        .insert({
          name: fullName,
          color: '#3B82F6',
          capacity: null
        });
    }
  }

  // 3. Garante que os espaços especiais estejam cadastrados
  const specialSpaces = [
    { name: 'SALA GOOGLE', color: '#3C8527' },
    { name: 'SALA MAKER', color: '#8B5CF6' },
    { name: 'BIBLIOTECA', color: '#3B82F6' },
    { name: 'AUDITÓRIO', color: '#F59E0B' },
    { name: 'LABORATÓRIO DE CIÊNCIAS', color: '#14B8A6' },
    { name: 'QUADRA POLIESPORTIVA', color: '#3B82F6' }
  ];

  for (const sp of specialSpaces) {
    const found = existing.find(e => e.name.trim().toLowerCase() === sp.name.toLowerCase());
    if (!found) {
      await supabase
        .from('spaces')
        .insert({
          name: sp.name,
          color: sp.color,
          capacity: null
        });
    }
  }

  return await getSpaces();
};


