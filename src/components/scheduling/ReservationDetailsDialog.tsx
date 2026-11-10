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
  Monitor,
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
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Reservation } from '@/hooks/useDatabase';
import type { Reservation as ServiceReservation } from '@/services/reservationService';
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

  const [hourStr, minuteStr] = (reservation.time_slot || '00h00').split('h');
  const slotStart = new Date(date);
  slotStart.setHours(parseInt(hourStr || '0', 10), parseInt(minuteStr || '0', 10), 0, 0);
  const slotEnd = new Date(slotStart.getTime() + 50 * 60 * 1000);
  const now = new Date();
  const isPast = now >= slotEnd;
  const loansCount = reservation.associated_loans?.length || 0;
  const isMissed = isPast && !isMaintRes && reservation.quantity_requested > 0 && loansCount === 0;

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
  const headerPillText = `${dayNameCap}, ${dayNum} ${monthShort} · ${startH}:${startM} – ${endH}:${endM}`;

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
        showEmail: Boolean(email && cleanName.toLowerCase() !== email.toLowerCase()),
      };
    }

    return {
      name: rawName,
      email: email.toLowerCase(),
      showEmail: Boolean(email && rawName.toLowerCase() !== email.toLowerCase()),
    };
  };

  const profile = getFormattedProfile();
  const initial = (profile.name.charAt(0) || 'U').toUpperCase();

  // Status unificado com historyData
  const currentStatus = status(reservation as unknown as ServiceReservation, now);
  const statusLabel = statusLabels[currentStatus] || 'Agendado';

  // Empréstimos e devoluções
  const totalLoans = reservation.associated_loans?.length || 0;
  const returnedLoans = reservation.associated_loans?.filter((l) => l.returned).length || 0;
  const pendingLoans = totalLoans - returnedLoans;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Drag handle — only visible on mobile bottom sheet */}
      <div className="zl-sheet-handle" aria-hidden />
      {/* ── Cabeçalho com Gradiente ── */}
      <div
        className={`zl-details-header ${
          isMaintRes || isManutencao ? 'header-maintenance' : 'header-blue'
        }`}
      >
        <div className="min-w-0 flex-1">
          <h2 className="zl-details-title">
            {isMaintRes ? 'Manutenção do Espaço' : 'Detalhes da Reserva'}
          </h2>
          <div className="zl-details-pill">{headerPillText}</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="zl-details-close"
          aria-label="Fechar"
        >
          <CloseIcon size={20} />
        </button>
      </div>

      {/* ── Corpo Rolável ── */}
      <div className="zl-details-body">
        {/* Linha do Responsável */}
        <div className="zl-details-owner">
          <div className="zl-details-avatar">{initial}</div>
          <div className="zl-details-owner-info">
            <div className="zl-details-owner-name">
              <span className="name" title={profile.name}>
                {profile.name}
              </span>
              {isOwner && <span className="zl-details-tag-you">você</span>}
            </div>
            {profile.showEmail && (
              <div className="zl-details-owner-email">{profile.email}</div>
            )}
          </div>
        </div>

        {/* Pills de Status */}
        <div className="zl-details-status-row">
          <span className={`zl-status-pill ${currentStatus}`}>
            <span className="h-2 w-2 rounded-full bg-current shrink-0 opacity-80" />
            {statusLabel}
          </span>

          {reservation.is_minecraft && (
            <span className="zl-status-pill minecraft">
              Minecraft Education
            </span>
          )}
        </div>

        {/* Grade de 2 Informações: Chromebooks e Sala */}
        <div
          className={`zl-details-grid ${
            isMaintRes || isManutencao ? 'grid-cols-1' : ''
          }`}
        >
          {!(isMaintRes || isManutencao) && (
            <div className="zl-details-card">
              <div className="zl-details-card-icon-row">
                <Laptop size={16} className="zl-details-card-icon" aria-hidden />
                <span className="zl-details-card-val">
                  {reservation.quantity_requested}
                </span>
              </div>
              <span className="zl-details-card-lbl">Chromebooks requisitados</span>
            </div>
          )}
          <div className="zl-details-card">
            <div className="zl-details-card-icon-row">
              <MapPin size={16} className="zl-details-card-icon" aria-hidden />
              <span className="zl-details-card-val zl-sala-name" title={reservation.classroom || 'Sala'}>
                {reservation.classroom || 'Não informada'}
              </span>
            </div>
            <span className="zl-details-card-lbl">Sala / Local</span>
          </div>
        </div>

        {/* Justificativa / Conteúdo da aula */}
        {reservation.justification && (
          <div className="zl-details-quote-box">
            <span className="zl-details-quote-lbl">
              {isMaintRes ? 'Motivo do serviço' : 'Conteúdo da aula'}
            </span>
            <blockquote className="zl-details-quote">
              "{reservation.justification}"
            </blockquote>
          </div>
        )}

        {/* Recursos Extras */}
        {(reservation.need_tv ||
          reservation.need_sound ||
          Boolean(reservation.mic_count && reservation.mic_count > 0)) && (
          <div className="flex flex-col gap-1.5">
            <span className="zl-details-quote-lbl">Recursos adicionais</span>
            <div className="zl-details-chips">
              {reservation.need_tv && (
                <span className="zl-details-chip">
                  <Tv size={15} />
                  <span>TV</span>
                </span>
              )}
              {reservation.need_sound && (
                <span className="zl-details-chip">
                  <Volume2 size={15} />
                  <span>Caixa de som</span>
                </span>
              )}
              {Boolean(reservation.mic_count && reservation.mic_count > 0) && (
                <span className="zl-details-chip">
                  <Mic size={15} />
                  <span>
                    {reservation.mic_count} Microfone
                    {(reservation.mic_count || 0) > 1 ? 's' : ''}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Retirados / Devolvidos */}
        {totalLoans > 0 && (
          <div className="zl-details-loans">
            <div className="zl-details-loans-header">
              <span>Equipamentos retirados</span>
              <span>
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
                    {loan.returned ? <Check size={13} /> : <AlertTriangle size={13} />}
                    <span>{tag}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Alerta de Não Retirada */}
        {isMissed && (
          <div className="zl-details-alert-missed">
            <AlertTriangle size={18} className="shrink-0" />
            <span>
              O horário desta reserva encerrou sem a retirada dos Chromebooks no balcão.
            </span>
          </div>
        )}
      </div>

      {/* ── Rodapé Fixo com Ações ── */}
      <div className="zl-details-footer">
        {showLoan ? (
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
        ) : (
          <button
            type="button"
            className="zl-btn-cta"
            onClick={onClose}
          >
            <span>Fechar</span>
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
        <DrawerContent className="zl-details zl-details-sheet p-0 max-h-[92dvh] border-0 bg-transparent">
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
      <DialogContent className="zl-details zl-details-dialog p-0 max-w-[520px] overflow-hidden border-0 bg-transparent">
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
