import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Trash2,
  ArrowRight,
  Tv,
  Volume2,
  Mic,
  X as CloseIcon,
  AlertTriangle,
  Loader2,
  Check,
  Laptop,
  MapPin,
  Clock,
  Layers,
  Gamepad2,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import type { Reservation } from '@/hooks/useDatabase';
import { getBlockSlots, type Reservation as ServiceReservation } from '@/services/reservationService';
import { useNavigate } from 'react-router-dom';
import { useProfileRole } from '@/hooks/use-profile-role';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatChromebookTag } from '@/utils/scheduling';
import { status, statusLabels } from './history/historyData';
import './reservation-details.css';

interface ReservationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation;
  date: Date;
  onCancel: () => void;
  isResponsible: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isCanceling?: boolean;
}

interface DetailsContentProps {
  reservation: Reservation;
  date: Date;
  onCancel: () => void;
  onClose: () => void;
  isResponsible: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isCanceling: boolean;
}

const DetailsContent: React.FC<DetailsContentProps> = ({
  reservation,
  date,
  onCancel,
  onClose,
  isResponsible,
  isOwner,
  isAdmin,
  isCanceling,
}) => {
  const navigate = useNavigate();
  const { role } = useProfileRole();
  const isManutencao = role === 'manutencao';
  const isMaintRes =
    reservation.prof_role === 'manutencao' ||
    reservation.prof_email === 'paulo.geremias@colegiosaojudas.com.br' ||
    reservation.prof_email === 'ivo@colegiosaojudas.com.br' ||
    reservation.prof_email === 'manutencao.teste@colegiosaojudas.com.br';

  const { data: blockSlots } = useQuery({
    queryKey: ['reservation-block', reservation.block_id],
    queryFn: () => getBlockSlots(reservation.block_id!),
    enabled: Boolean(reservation.block_id),
    staleTime: 60000,
  });

  const isBlock = Boolean(blockSlots && blockSlots.length >= 2);

  const [hourStr, minuteStr] = (reservation.time_slot || '00h00').split('h');
  const slotStart = new Date(date);
  slotStart.setHours(parseInt(hourStr || '0', 10), parseInt(minuteStr || '0', 10), 0, 0);

  const lastSlot = isBlock && blockSlots ? blockSlots[blockSlots.length - 1] : reservation.time_slot;
  const [lastHourStr, lastMinuteStr] = (lastSlot || '00h00').split('h');
  const lastSlotStart = new Date(date);
  lastSlotStart.setHours(parseInt(lastHourStr || '0', 10), parseInt(lastMinuteStr || '0', 10), 0, 0);
  const slotEnd = new Date(lastSlotStart.getTime() + 50 * 60 * 1000);
  const now = new Date();
  const isPast = now >= slotEnd;
  const loansCount = reservation.associated_loans?.length || 0;
  const isMissed = isPast && !isMaintRes && (reservation.quantity_requested || 0) > 0 && loansCount === 0;

  const showCancel = (isAdmin || isOwner) && !isPast;
  const showLoan =
    !(isManutencao || isMaintRes) &&
    isResponsible &&
    (!reservation.associated_loans || reservation.associated_loans.length < reservation.quantity_requested) &&
    !isPast;

  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // Formatação de data e horário para o cabeçalho
  const dayName = format(date, 'EEE', { locale: ptBR }).replace('.', '');
  const dayNameCap = dayName.charAt(0).toUpperCase() + dayName.slice(1);
  const dayNum = format(date, 'd');
  const monthShort = format(date, 'MMM', { locale: ptBR }).replace('.', '');
  const startH = (hourStr || '00').padStart(2, '0');
  const startM = (minuteStr || '00').padStart(2, '0');
  const endH = String(slotEnd.getHours()).padStart(2, '0');
  const endM = String(slotEnd.getMinutes()).padStart(2, '0');
  const headerDateText = `${dayNameCap}, ${dayNum} ${monthShort} · ${startH}:${startM} – ${endH}:${endM}`;

  // Perfil limpo (sem duplicar email como nome)
  const getFormattedProfile = () => {
    const rawName = reservation.prof_name || '';
    const email = reservation.prof_email || '';
    const isNameEmail = rawName.includes('@') || rawName.toLowerCase() === email.toLowerCase();

    if (isNameEmail) {
      const usernamePart = (rawName || email).split('@')[0];
      const cleanName = usernamePart.replace(/[._-]/g, ' ').trim();
      return {
        name: cleanName || rawName,
        email: email.toLowerCase(),
      };
    }

    return {
      name: rawName || 'Professor',
      email: email.toLowerCase(),
    };
  };

  const profile = getFormattedProfile();
  const initial = (profile.name.charAt(0) || 'P').toUpperCase();

  // Status unificado com historyData
  const currentStatus = status(reservation as unknown as ServiceReservation, now);
  const statusLabel = statusLabels[currentStatus] || 'Agendado';

  // Empréstimos e devoluções
  const totalLoans = reservation.associated_loans?.length || 0;
  const returnedLoans = reservation.associated_loans?.filter((l) => l.returned).length || 0;
  const pendingLoans = totalLoans - returnedLoans;

  // Recursos adicionais
  const hasExtraResources = Boolean(
    reservation.is_minecraft ||
    reservation.needs_tv ||
    reservation.needs_sound ||
    reservation.needs_mic ||
    Boolean(reservation.mic_quantity && reservation.mic_quantity > 0)
  );

  return (
    <div className="zl-details-container flex flex-col h-full w-full overflow-hidden">
      {/* ── 1. CABEÇALHO COM RESPIRO, STATUS E FECHAR ÚNICO ── */}
      <div
        className={`zl-details-header ${
          isMaintRes || isManutencao ? 'header-maintenance' : 'header-blue'
        }`}
      >
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="zl-details-title">
              {isMaintRes ? 'Manutenção do Espaço' : 'Detalhes da Reserva'}
            </h2>
            {/* Único botão de fechar */}
            <button
              type="button"
              onClick={onClose}
              className="zl-details-close"
              aria-label="Fechar detalhes da reserva"
              title="Fechar"
            >
              <CloseIcon size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Linha de Data/Horário + Selo de Status com Hierarquia */}
          <div className="zl-details-meta-row">
            <div className="zl-details-meta-pill" title={`Horário: ${startH}:${startM} às ${endH}:${endM}`}>
              <Clock size={13} className="shrink-0 opacity-90" aria-hidden />
              <span>{headerDateText}</span>
            </div>

            {/* Selo de Status no Cabeçalho */}
            <span className={`zl-status-pill ${currentStatus}`}>
              <span className="h-2 w-2 rounded-full bg-current shrink-0 opacity-80" aria-hidden />
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── CORPO ROLÁVEL ── */}
      <div className="zl-details-body">
        {/* ── 2. BLOCO DO SOLICITANTE ESTRUTURADO ── */}
        <div className="zl-details-section-card zl-requester-card">
          <div className="zl-card-header-lbl">Solicitante</div>
          <div className="flex items-center gap-3">
            <div className="zl-details-avatar" aria-hidden>{initial}</div>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="zl-requester-name truncate" title={profile.name}>
                  {profile.name}
                </span>
                {isOwner && <span className="zl-details-tag-you">você</span>}
              </div>
              {profile.email && (
                <span className="zl-requester-email truncate" title={profile.email}>
                  {profile.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. GRADE DE INFORMAÇÕES PADRONIZADA (2x2) ── */}
        <div className="zl-details-grid-2x2">
          {/* Card: Chromebooks */}
          <div className="zl-grid-card">
            <span className="zl-grid-card-lbl">
              <Laptop size={13} className="shrink-0 text-blue-500" aria-hidden />
              <span>Chromebooks</span>
            </span>
            <div className="zl-grid-card-val">
              {isMaintRes || isManutencao ? 'N/A' : (reservation.quantity_requested || 0)}
            </div>
          </div>

          {/* Card: Sala / Local */}
          <div className="zl-grid-card">
            <span className="zl-grid-card-lbl">
              <MapPin size={13} className="shrink-0 text-blue-500" aria-hidden />
              <span>Sala / Local</span>
            </span>
            <div className="zl-grid-card-val zl-grid-card-val-room" title={reservation.classroom || 'Sala'}>
              {reservation.classroom || 'Não informada'}
            </div>
          </div>

          {/* Card: Retirada Prevista */}
          <div className="zl-grid-card">
            <span className="zl-grid-card-lbl">
              <Clock size={13} className="shrink-0 text-zinc-400" aria-hidden />
              <span>Retirada</span>
            </span>
            <div className="zl-grid-card-val text-lg">
              {startH}:{startM}
            </div>
          </div>

          {/* Card: Devolução Prevista */}
          <div className="zl-grid-card">
            <span className="zl-grid-card-lbl">
              <ArrowRight size={13} className="shrink-0 text-zinc-400" aria-hidden />
              <span>Devolução</span>
            </span>
            <div className="zl-grid-card-val text-lg">
              {endH}:{endM}
            </div>
          </div>
        </div>

        {/* Bloco de Aulas Seguidas (se houver) */}
        {isBlock && blockSlots && (
          <div className="zl-details-block-info">
            <Layers size={14} className="shrink-0 text-blue-500" />
            <span>
              Reserva em bloco com {blockSlots.length} aulas ({blockSlots.join(', ')})
            </span>
          </div>
        )}

        {/* ── 4. RECURSOS PEDAGÓGICOS E ADICIONAIS ── */}
        {hasExtraResources && (
          <div className="zl-details-section-card">
            <div className="zl-card-header-lbl">Recursos adicionais</div>
            <div className="zl-details-chips">
              {reservation.is_minecraft && (
                <span className="zl-details-chip minecraft" title="Minecraft Education">
                  <Gamepad2 size={14} className="shrink-0" />
                  <span>Minecraft Education</span>
                </span>
              )}
              {reservation.needs_tv && (
                <span className="zl-details-chip">
                  <Tv size={14} className="shrink-0" />
                  <span>TV</span>
                </span>
              )}
              {reservation.needs_sound && (
                <span className="zl-details-chip">
                  <Volume2 size={14} className="shrink-0" />
                  <span>Caixa de som</span>
                </span>
              )}
              {(reservation.needs_mic || Boolean(reservation.mic_quantity && reservation.mic_quantity > 0)) && (
                <span className="zl-details-chip">
                  <Mic size={14} className="shrink-0" />
                  <span>
                    {(reservation.mic_quantity && reservation.mic_quantity > 0)
                      ? `${reservation.mic_quantity} Microfone${reservation.mic_quantity > 1 ? 's' : ''}`
                      : 'Microfone'}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── 5. EQUIPAMENTOS RETIRADOS / DEVOLVIDOS ── */}
        {totalLoans > 0 && (
          <div className="zl-details-section-card zl-details-loans">
            <div className="zl-details-loans-header">
              <span className="zl-card-header-lbl !mb-0">Equipamentos retirados</span>
              <span className="text-xs font-semibold text-muted-foreground">
                {returnedLoans} de {totalLoans} devolvidos
                {pendingLoans > 0 && ` (${pendingLoans} pendente${pendingLoans === 1 ? '' : 's'})`}
              </span>
            </div>

            <div className="zl-details-progress-bar">
              <div
                className="zl-details-progress-fill"
                style={{
                  width: `${Math.min(100, (returnedLoans / totalLoans) * 100)}%`,
                }}
              />
            </div>

            <div className="zl-details-tags">
              {reservation.associated_loans?.map((loan, idx) => {
                const tag = formatChromebookTag(loan.chromebook_id);
                return (
                  <span
                    key={`${loan.chromebook_id}-${idx}`}
                    className={`zl-details-tag ${loan.returned ? 'returned' : 'pending'}`}
                    title={loan.returned ? `${tag} - Devolvido` : `${tag} - Pendente`}
                  >
                    {loan.returned ? <Check size={12} /> : <AlertTriangle size={12} />}
                    <span>{tag}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 6. CONTEÚDO DA AULA / OBSERVAÇÕES ── */}
        {reservation.justification && (
          <div className="zl-details-section-card">
            <div className="zl-card-header-lbl">
              {isMaintRes ? 'Motivo do serviço' : 'Conteúdo da aula / Observações'}
            </div>
            <blockquote className="zl-details-quote">
              "{reservation.justification}"
            </blockquote>
          </div>
        )}

        {/* ── 7. AVISO ENXUTO DE STATUS (NÃO RETIRADA) ── */}
        {isMissed && (
          <div className="zl-details-alert-missed" role="alert">
            <AlertTriangle size={16} className="shrink-0 text-red-600 dark:text-red-400" />
            <span>Encerrada sem retirada dos Chromebooks no balcão.</span>
          </div>
        )}
      </div>

      {/* ── 8. RODAPÉ FIXO COM HIERARQUIA DE AÇÕES ── */}
      <div className="zl-details-footer">
        {showLoan && (
          <button
            type="button"
            disabled={isCanceling}
            className="zl-btn-cta"
            onClick={() => {
              navigate('/', {
                state: {
                  fromScheduling: true,
                  reservationData: {
                    ...reservation,
                    date: format(date, 'yyyy-MM-dd'),
                    time_slot: reservation.time_slot,
                  },
                },
              });
              onClose();
            }}
          >
            <ArrowRight size={17} />
            <span>Iniciar Empréstimo</span>
          </button>
        )}

        {showCancel && (
          isConfirmingCancel ? (
            <div className="zl-cancel-confirm-box">
              <span className="zl-cancel-confirm-msg">Cancelar esta reserva?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="zl-btn-confirm-cancel"
                  disabled={isCanceling}
                  onClick={onCancel}
                >
                  {isCanceling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span>Confirmar</span>
                </button>
                <button
                  type="button"
                  className="zl-btn-back"
                  disabled={isCanceling}
                  onClick={() => setIsConfirmingCancel(false)}
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="zl-btn-cancel-link"
              disabled={isCanceling}
              onClick={() => setIsConfirmingCancel(true)}
            >
              <Trash2 size={15} />
              <span>Cancelar reserva</span>
            </button>
          )
        )}

        {/* Botão Fechar Secundário/Neutro */}
        <button
          type="button"
          className="zl-btn-secondary"
          onClick={onClose}
        >
          <span>Fechar</span>
        </button>
      </div>
    </div>
  );
};

export const ReservationDetailsDialog: React.FC<ReservationDetailsDialogProps> = ({
  open,
  onOpenChange,
  reservation,
  date,
  onCancel,
  isResponsible,
  isOwner,
  isAdmin,
  isCanceling = false,
}) => {
  const isMobile = useIsMobile();

  const handleClose = () => {
    if (!isCanceling) {
      onOpenChange(false);
    }
  };

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(val) => {
          if (!isCanceling) {
            onOpenChange(val);
          }
        }}
      >
        <DrawerContent className="zl-details zl-details-sheet p-0 max-h-[92dvh] border-0 bg-transparent [&>button.absolute]:hidden">
          <DrawerTitle className="sr-only">Detalhes da Reserva</DrawerTitle>
          <DrawerDescription className="sr-only">
            Informações detalhadas sobre o agendamento de sala e Chromebooks
          </DrawerDescription>
          <DetailsContent
            reservation={reservation}
            date={date}
            onCancel={onCancel}
            onClose={handleClose}
            isResponsible={isResponsible}
            isOwner={isOwner}
            isAdmin={isAdmin}
            isCanceling={isCanceling}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isCanceling) {
          onOpenChange(val);
        }
      }}
    >
      <DialogContent className="zl-details zl-details-dialog p-0 max-w-[500px] overflow-hidden border-0 bg-transparent [&>button.absolute]:hidden">
        <DialogTitle className="sr-only">Detalhes da Reserva</DialogTitle>
        <DialogDescription className="sr-only">
          Informações detalhadas sobre o agendamento de sala e Chromebooks
        </DialogDescription>
        <DetailsContent
          reservation={reservation}
          date={date}
          onCancel={onCancel}
          onClose={handleClose}
          isResponsible={isResponsible}
          isOwner={isOwner}
          isAdmin={isAdmin}
          isCanceling={isCanceling}
        />
      </DialogContent>
    </Dialog>
  );
};
