// @ts-nocheck
import React, { useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Monitor, Info, Save, Tv, Volume2, Mic, User, ListFilter, CalendarDays, X as CloseIcon, ArrowRight, Plus, Minus, CheckCircle, Search, ChevronDown, Trash2, AlertTriangle, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDatabase, ReservationData, Reservation, Space } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { SuggestiveSearch } from '@/components/ui/SuggestiveSearch';
import { isChromebookSpace as checkChromebookSpace } from '@/utils/scheduling';
import { useSchedulingResponsible } from '@/hooks/useSchedulingResponsible';
import { ProfessorAutocomplete } from './ProfessorAutocomplete';

interface ExtendedSpace extends Space {
  isVirtual?: boolean;
}

const DEFAULT_TURMAS = [
  "1CEXL - CURSO EXTRA LIVRE",
  "1EFMA - 1º ANO MANHÃ A",
  "1EFTB - 1º ANO TARDE B",
  "1EFTC - 1º ANO TARDE C",
  "2CEXL - CURSO EXTRA LIVRE",
  "IF1TB - INFANTIL I - TARDE B",
  "IF2TB - INFANTIL II - TARDE B",
  "IF2TC - INFANTIL II - TARDE C",
  "IF3TB - INFANTIL III - TARDE B",
  "IF3TC - INFANTIL III - TARDE C",
  "MATTB - MATERNAL TARDE B",
  "MIMTB - MINIMATERNAL TARDE B"
];

interface ReservationDialogProps {
  children: ReactNode;
  date: Date;
  timeSlot: string;
  totalAvailableChromebooks: number;
  currentReservations: Reservation[];
  onReservationSuccess: () => void;
  maxQuantity: number;
  professores?: { id: string; nome_completo: string }[];
}

export const ReservationDialog: React.FC<ReservationDialogProps> = ({
  children,
  date,
  timeSlot,
  totalAvailableChromebooks,
  currentReservations,
  onReservationSuccess,
  maxQuantity,
  professores = [],
}) => {
  useEffect(() => {
    // Add custom animation for room buttons
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes alternate-texts {
        0%, 35% { transform: translateY(0); }
        45%, 85% { transform: translateY(-100%); }
        95%, 100% { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [open, setOpen] = useState(false);
  const { createReservation, bulkCreateReservations, loading: isSaving, getSpaces, createSpace, deleteSpace } = useDatabase();
  const { user } = useAuth();
  const { role, isAdmin } = useProfileRole();
  const isManutencao = role === 'manutencao';

  const isSuperAdmin = role === 'super_admin';
  const { isResponsible } = useSchedulingResponsible();

  const [selectedProfessorId, setSelectedProfessorId] = useState<string>('');
  const [isBookingForOther, setIsBookingForOther] = useState(false);

  const [justification, setJustification] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [needsTv, setNeedsTv] = useState(false);
  const [needsSound, setNeedsSound] = useState(false);
  const [needsMic, setNeedsMic] = useState(false);
  const [micQuantity, setMicQuantity] = useState(1);
  const [isMinecraft, setIsMinecraft] = useState(false);
  const [classroom, setClassroom] = useState<string>('');
  const isChromebookSpace = useMemo(() => {
    return checkChromebookSpace(classroom);
  }, [classroom]);

  const [extraDates, setExtraDates] = useState<Date[]>([]);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // States for Spaces management
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [spaceSearch, setSpaceSearch] = useState<string>('');
  const [isSpaceDropdownOpen, setIsSpaceDropdownOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Armazenamento dos últimos espaços acessados/usados pelo professor
  const RECENT_SPACES_KEY = 'zelote_recent_classrooms';
  const [recentClassrooms, setRecentClassrooms] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SPACES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveRecentClassroom = (roomName: string) => {
    if (!roomName || !roomName.trim()) return;
    const clean = roomName.trim();
    setRecentClassrooms(prev => {
      const filtered = prev.filter(r => r.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5); // Mantém os 5 mais recentes
      try {
        localStorage.setItem(RECENT_SPACES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Merge static default classes with database spaces to show in dropdown
  const combinedSpaces = useMemo<ExtendedSpace[]>(() => {
    const virtualSpaces: ExtendedSpace[] = DEFAULT_TURMAS.map((name, index) => ({
      id: `virtual-${index}`,
      name,
      color: '#3B82F6', // Neo-Brutalist standard blue
      isVirtual: true
    }));
    
    // Avoid duplicates if database already has a space with the same name
    const dbSpaceNames = new Set(spaces.map(s => s.name.toLowerCase()));
    const filteredVirtuals = virtualSpaces.filter(v => !dbSpaceNames.has(v.name.toLowerCase()));
    
    return [...spaces, ...filteredVirtuals];
  }, [spaces]);

  // Dynamic suggestions for classroom booking
  const searchSuggestions = useMemo(() => {
    if (combinedSpaces.length > 0) {
      return [
        "Selecione ou digite a sala/turma...",
        ...combinedSpaces.map(s => `Ex: ${s.name}`),
        "Digite uma turma personalizada..."
      ];
    }
    return [
      "Selecione ou digite a sala/turma...",
      "Ex: Sala Maker",
      "Ex: Sala Google",
      "Ex: Sala de Estudos",
      "Digite uma turma personalizada..."
    ];
  }, [combinedSpaces]);

  // Click outside to close spaces dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSpaceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch spaces on dialog open
  useEffect(() => {
    if (open) {
      setJustification('');
      setQuantity(0);
      setNeedsTv(false);
      setNeedsSound(false);
      setNeedsMic(false);
      setMicQuantity(1);
      setIsMinecraft(false);
      setClassroom('');
      setExtraDates([]);
      setIsMultiMode(false);
      setShowCalendar(false);
      setSelectedProfessorId(user?.id || '');
      setIsBookingForOther(false);

      // Load spaces from db
      getSpaces().then(data => {
        setSpaces(data);
      });
    }
  }, [open, getSpaces, maxQuantity, user?.id]);

  // Regras de quantidade para Minecraft
  useEffect(() => {
    if (isMinecraft) {
      if (quantity === 0) setQuantity(1);
      if (quantity > 40) setQuantity(40);
    }
  }, [isMinecraft, quantity]);

  // Reset extra resources when the room is not eligible for Chromebooks
  useEffect(() => {
    if (!isChromebookSpace) {
      setNeedsTv(false);
      setNeedsSound(false);
      setNeedsMic(false);
      setMicQuantity(1);
      setIsMinecraft(false);
    }
  }, [isChromebookSpace]);

  const isExpired = date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isRoomOccupied = currentReservations.some(res => res.classroom?.toLowerCase() === classroom.trim().toLowerCase());
    if (isRoomOccupied) {
      toast({
        title: "Conflito de Sala",
        description: `A sala "${classroom}" já está reservada para este horário.`,
        variant: "destructive"
      });
      return;
    }

    if (!classroom.trim() || quantity < 0 || quantity > maxQuantity) {
      toast({
        title: "Erro de Validação",
        description: "Preencha a sala.",
        variant: "destructive"
      });
      return;
    }

    if (isBookingForOther && !selectedProfessorId) {
      toast({
        title: "Erro de Validação",
        description: "Selecione o professor para quem deseja agendar.",
        variant: "destructive"
      });
      return;
    }

    const matchedSpace = spaces.find(s => s.name.toLowerCase() === classroom.trim().toLowerCase());
    const spaceId = matchedSpace ? matchedSpace.id : null;
    const targetProfessorId = (isBookingForOther && selectedProfessorId) ? selectedProfessorId : user?.id;

    const allDates = [date, ...extraDates].map(d => format(d, 'yyyy-MM-dd'));
    const baseData = {
      time_slot: timeSlot,
      justification: justification.trim(),
      quantity_requested: quantity,
      needs_tv: needsTv,
      needs_sound: needsSound,
      needs_mic: needsMic,
      mic_quantity: needsMic ? micQuantity : 0,
      is_minecraft: isMinecraft,
      classroom: classroom.trim(),
      space_id: spaceId,
      professor_id: targetProfessorId,
    };

    if (isMultiMode && extraDates.length > 0) {
      const result = await bulkCreateReservations(allDates, baseData);
      if (result.success) {
        saveRecentClassroom(classroom.trim());
        setOpen(false);
        onReservationSuccess();
      }
    } else {
      const result = await createReservation({
        ...baseData,
        date: format(date, 'yyyy-MM-dd')
      });
      if (result) {
        saveRecentClassroom(classroom.trim());
        setOpen(false);
        onReservationSuccess();
      }
    }
  };

  const totalReserved = currentReservations.reduce((sum, res) => sum + res.quantity_requested, 0);
  const available = totalAvailableChromebooks - totalReserved;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div
        onClick={() => !isExpired && setOpen(true)}
        className={cn("cursor-pointer h-full flex flex-col", isExpired && "opacity-50 cursor-not-allowed grayscale")}
      >
        {children}
      </div>

      <DialogContent className="w-[calc(100vw-16px)] sm:w-full sm:max-w-[600px] max-h-[90dvh] flex flex-col p-0 border-[3px] sm:border-[4px] border-black dark:border-zinc-800 rounded-none shadow-[4px_4px_0px_0px_#000] sm:shadow-[10px_10px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)] sm:dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.05)] outline-none bg-white dark:bg-zinc-950 text-black dark:text-zinc-100 selection:bg-yellow-300 selection:text-black">

        {/* HEADER */}
        <DialogHeader className="shrink-0 p-3 sm:p-5 border-b-[4px] sm:border-b-[5px] border-black bg-[#3b82f6] text-white relative z-10 space-y-0">
          <div className="flex items-center gap-2.5 sm:gap-4 pr-12 sm:pr-14">
            <div className="bg-white p-2 sm:p-2.5 border-[2px] sm:border-[3px] border-black shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] shrink-0">
              <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6 text-black stroke-[3]" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl sm:text-3xl font-[1000] uppercase tracking-tighter leading-none">AGENDAMENTO</DialogTitle>
              <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="bg-black/25 px-1.5 py-0.5 border border-white/40 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.08em]">
                  {format(date, "EEE, dd 'de' MMM", { locale: ptBR })}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-[1000] tracking-wider">
                  <span className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" />
                  {timeSlot}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white border-[2px] sm:border-[3px] border-black shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all z-20 group"
          >
            <CloseIcon className="w-4 h-4 sm:w-6 sm:h-6 text-black stroke-[4] group-hover:rotate-90 transition-transform" />
          </button>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="p-3 sm:p-5 space-y-4 sm:space-y-5">

            {/* STATUS GRID - Visível a todos (Professores e Coordenadores) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pt-1">
              <div className="flex flex-col p-2.5 sm:p-3.5 border-[3px] border-black bg-[#00FF00]/10 dark:bg-green-950/20 shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                <div className="flex items-center gap-1.5 mb-1">
                  <Monitor className="h-3.5 w-3.5 text-green-700 dark:text-[#4ADE80] stroke-[3]" />
                  <span className="text-[9px] sm:text-[10px] font-[1000] uppercase text-black dark:text-white tracking-[0.12em]">Disponíveis</span>
                </div>
                <span className="text-2xl sm:text-4xl font-[1000] text-black dark:text-white leading-none tracking-tighter tabular-nums">{available}</span>
              </div>

              <div className="flex flex-col p-2.5 sm:p-3.5 border-[3px] border-black bg-[#8B5CF6]/10 dark:bg-purple-950/20 shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all">
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="h-3.5 w-3.5 text-purple-700 dark:text-[#8B5CF6] stroke-[3]" />
                  <span className="text-[9px] sm:text-[10px] font-[1000] uppercase text-black dark:text-white tracking-[0.12em]">Reservados</span>
                </div>
                <span className="text-2xl sm:text-4xl font-[1000] text-black dark:text-white leading-none tracking-tighter tabular-nums">{totalReserved}</span>
              </div>
            </div>

            {/* RESERVAS EXISTENTES NESTE HORÁRIO */}
            {currentReservations.length > 0 && (
              <div className="pt-3 border-t-[3px] border-black space-y-3 animate-in fade-in slide-in-from-top-3 duration-300">
                <div className="inline-block px-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ListFilter className="h-4 w-4 text-black dark:text-white stroke-[3]" />
                    <span className="text-[11px] sm:text-xs font-[1000] uppercase text-black dark:text-white tracking-widest">
                      Reservas Existentes ({currentReservations.length})
                    </span>
                  </div>
                  <div className="h-1 bg-black dark:bg-white w-full" />
                </div>

                <div className="space-y-3 pt-0.5">
                  {currentReservations.map((res) => {
                    const isMaint = res.prof_role === 'manutencao' || res.prof_email === 'paulo.geremias@colegiosaojudas.com.br' || res.prof_email === 'ivo@colegiosaojudas.com.br' || res.prof_email === 'manutencao.teste@colegiosaojudas.com.br';
                    return (
                      <div
                        key={res.id}
                        className={cn(
                          "border-[3px] bg-white dark:bg-zinc-900 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] overflow-hidden",
                          isMaint
                            ? "border-[#52525B] shadow-[4px_4px_0px_0px_#52525B]"
                            : "border-black dark:border-zinc-800 shadow-[4px_4px_0px_0px_#000]"
                        )}
                      >
                        <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50 px-2.5 py-2 border-b-[2px] border-black dark:border-zinc-700">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 flex items-center justify-center bg-white border-[2px] border-black rounded-full shrink-0 shadow-[2px_2px_0_0_#000]">
                              <User className="h-4 w-4 text-black stroke-[3]" />
                            </div>
                            <div className="flex flex-col truncate">
                              <span className="text-[11px] sm:text-xs font-[1000] uppercase text-black dark:text-white truncate leading-tight">
                                {res.prof_name || 'Professor'}
                              </span>
                              <span className="text-[10px] font-[900] text-zinc-500 dark:text-zinc-400 lowercase truncate tracking-tight">
                                {res.prof_email}
                              </span>
                            </div>
                          </div>
                          {isMaint ? (
                            <Badge className="bg-[#52525B] text-white border-[2px] border-black rounded-none h-7 text-[9px] font-[1000] uppercase px-2.5 shadow-[2px_2px_0px_0px_#000] shrink-0">
                              ⚠️ MANUTENÇÃO
                            </Badge>
                          ) : !isManutencao ? (
                            <Badge className="bg-[#8B5CF6] text-white border-[2px] border-black rounded-none h-7 text-[9px] font-[1000] uppercase px-2.5 shadow-[2px_2px_0px_0px_#000] shrink-0">
                              {res.quantity_requested} Chromebooks
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-500 text-white border-[2px] border-black rounded-none h-7 text-[9px] font-[1000] uppercase px-2.5 shadow-[2px_2px_0px_0px_#000] shrink-0">
                              Espaço Reservado
                            </Badge>
                          )}
                        </div>

                        <div className="p-2.5 sm:p-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-[#3B82F6] px-2 py-0.5 border border-black shadow-[2px_2px_0_0_#000]">
                              <span className="text-[9px] font-[1000] uppercase text-white tracking-widest">Sala / Turma</span>
                            </div>
                            <span className="text-xs sm:text-sm font-[1000] text-black dark:text-zinc-100 uppercase tracking-tight">
                              {res.classroom || 'Não informada'}
                            </span>
                          </div>

                          {res.justification && (
                            <div className="flex items-start gap-2 pt-0.5">
                              <div className="bg-[#FBBF24] px-2 py-0.5 border border-black shadow-[2px_2px_0_0_#000] shrink-0">
                                <span className="text-[9px] font-[1000] uppercase text-black tracking-widest">Motivo</span>
                              </div>
                              <p className="text-[11px] font-black italic text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2">
                                "{res.justification}"
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 pt-1">
                            {res.needs_tv && (
                              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 border border-black/40 text-[10px] font-black uppercase">
                                <Tv className="h-3 w-3 text-black" /> TV
                              </div>
                            )}
                            {res.needs_sound && (
                              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 border border-black/40 text-[10px] font-black uppercase">
                                <Volume2 className="h-3 w-3 text-black" /> Som
                              </div>
                            )}
                            {res.needs_mic && (
                              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 border border-black/40 text-[10px] font-black uppercase">
                                <Mic className="h-3 w-3 text-black" /> Mic ({res.mic_quantity})
                              </div>
                            )}
                            {res.is_minecraft && (
                              <div className="flex items-center gap-1.5 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 border border-green-700 text-green-800 text-[10px] font-black uppercase">
                                <Monitor className="h-3 w-3 text-green-700" /> Minecraft
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* DIVISOR NOVO AGENDAMENTO */}
                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-x-0 top-1/2 h-[2px] bg-black -translate-y-1/2" />
                  <div className="relative bg-[#3B82F6] text-white px-3 py-1 border-[2px] border-black shadow-[2px_2px_0_0_#000] flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 stroke-[3]" />
                    <span className="text-[10px] sm:text-xs font-[1000] uppercase tracking-wider">
                      Novo Agendamento Neste Horário
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SELEÇÃO DE PROFESSOR (APENAS ADMIN/COORDENAÇÃO) */}
            {(isAdmin || isResponsible) && professores && professores.length > 0 && (
              <div className="border-2 border-[#1e3a8a] bg-blue-50/30 overflow-hidden shadow-[3px_3px_0_0_rgba(30,58,138,0.15)]">
                <div className="bg-[#1e3a8a] px-3 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-white" />
                    <span className="text-[10px] sm:text-[11px] font-black uppercase text-white tracking-wider">
                      Professor Solicitante
                    </span>
                  </div>
                  <span className="bg-white/20 border border-white/50 px-1.5 py-0.5 text-white text-[8px] font-black uppercase">
                    Coordenação / Admin
                  </span>
                </div>

                <div className="p-3 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 leading-snug">
                      Deseja agendar esta aula em nome de outro professor?
                    </p>

                    <div className="flex border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-[2px_2px_0_0_#000] self-start sm:self-center overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setIsBookingForOther(false);
                          setSelectedProfessorId(user?.id || '');
                        }}
                        className={cn(
                          "px-3.5 py-1.5 text-[10px] sm:text-[11px] font-black uppercase transition-all",
                          !isBookingForOther ? "bg-zinc-800 text-white dark:bg-zinc-700" : "bg-white text-zinc-500 hover:text-black"
                        )}
                      >
                        Para Mim
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsBookingForOther(true)}
                        className={cn(
                          "px-3 py-1.5 text-[10px] sm:text-[11px] font-black uppercase transition-all border-l-2 border-black",
                          isBookingForOther ? "bg-[#1e3a8a] text-white" : "bg-white text-zinc-500 hover:text-black"
                        )}
                      >
                        Outro Professor
                      </button>
                    </div>
                  </div>

                  {isBookingForOther && (
                    <div className="pt-2 border-t border-blue-200 animate-in fade-in slide-in-from-top-1">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-[#1e3a8a] mb-1.5 block">
                        Selecione o Professor: <span className="text-red-500">*</span>
                      </Label>
                      <ProfessorAutocomplete
                        professores={professores}
                        selectedProfessorId={selectedProfessorId}
                        onSelect={(id) => setSelectedProfessorId(id)}
                        disabled={isSaving}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 1º PASSO: DADOS DA RESERVA (SALA / TURMA) */}
            <div className="border-2 border-[#1e3a8a] bg-[#1e3a8a]/5 dark:bg-[#1e3a8a]/10 overflow-hidden shadow-[4px_4px_0_0_rgba(30,58,138,0.15)]">
              <div className="bg-[#1e3a8a] px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-white" />
                  <span className="text-[11px] sm:text-[13px] font-black uppercase text-white tracking-wider">
                    {isManutencao ? "1. Espaço Físico Solicitado" : "1. Sala / Turma Solicitada"}
                  </span>
                </div>
                <span className="text-white text-[9px] font-bold bg-white/20 border border-white/40 px-1.5 py-0.5 uppercase">
                  Obrigatório
                </span>
              </div>
              <div className="p-3 sm:p-4 space-y-3">
                <div className="space-y-1.5 relative" ref={dropdownRef}>
                  <Label className="text-[11px] sm:text-xs font-black uppercase text-[#1e3a8a] dark:text-blue-400 tracking-wider">
                    Selecione ou Digite a Sala / Turma: <span className="text-red-500">*</span>
                  </Label>

                  {/* Input com Busca Preditiva */}
                  <div className="relative">
                    <SuggestiveSearch
                      value={classroom}
                      onChange={(val) => {
                        setClassroom(val);
                        setIsSpaceDropdownOpen(true);
                      }}
                      onFocus={() => setIsSpaceDropdownOpen(true)}
                      suggestions={searchSuggestions}
                      effect="typewriter"
                      showLeading={true}
                      Leading={() => <Search className="h-3.5 w-3.5 text-zinc-400/80 dark:text-zinc-500/80" strokeWidth={2.5} />}
                      className={cn(
                        "w-full border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-xl h-10 transition-all shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_rgba(255,255,255,0.05)]",
                        isSpaceDropdownOpen && "border-[#1e3a8a]",
                        currentReservations.find(res => res.classroom?.toLowerCase() === classroom.trim().toLowerCase()) && "border-red-500 ring-2 ring-red-500/30"
                      )}
                      inputClassName="pl-9 pr-14 w-full h-full bg-transparent text-xs font-bold uppercase outline-none text-black dark:text-zinc-100 placeholder:normal-case placeholder:text-zinc-400"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                      {classroom && (
                        <button
                          type="button"
                          onClick={() => {
                            setClassroom('');
                            setIsSpaceDropdownOpen(true);
                          }}
                          className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSpaceDropdownOpen(!isSpaceDropdownOpen);
                        }}
                        className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isSpaceDropdownOpen && "rotate-180")} />
                      </button>
                    </div>
                  </div>

                  {/* ALERTA EM TEMPO REAL DE SALA OCUPADA */}
                  {(() => {
                    const conflictingReservation = currentReservations.find(
                      res => classroom.trim() && res.classroom?.toLowerCase() === classroom.trim().toLowerCase()
                    );

                    if (!conflictingReservation) return null;

                    return (
                      <div className="mt-2 p-2.5 bg-red-100 dark:bg-red-950/50 border-2 border-red-600 dark:border-red-500 text-red-900 dark:text-red-200 text-xs font-black uppercase shadow-[3px_3px_0_0_rgba(220,38,38,0.3)] animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
                          <span>SALA OCUPADA NESTE HORÁRIO!</span>
                        </div>
                        <p className="text-[11px] font-bold text-red-800 dark:text-red-300 leading-tight">
                          Reservada por <span className="underline font-black">{conflictingReservation.prof_name || conflictingReservation.prof_email}</span> ({conflictingReservation.quantity_requested} Chromebooks).
                        </p>
                      </div>
                    );
                  })()}

                  {/* Dropdown Panel */}
                  {isSpaceDropdownOpen && (
                    <div className="relative z-10 w-full mt-1.5 border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-[3px_3px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)] rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100">
                      {/* Seção: Últimos Acessados */}
                      {recentClassrooms.length > 0 && !classroom && (
                        <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-b-2 border-black/10 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                            <History className="h-3.5 w-3.5 text-[#1e3a8a] dark:text-blue-400" />
                            <span className="text-[10px] font-black uppercase text-[#1e3a8a] dark:text-blue-300 tracking-wider">
                              Últimos Acessados:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {recentClassrooms.map((recentName, idx) => {
                              const isOccupied = currentReservations.some(res => res.classroom?.toLowerCase() === recentName.toLowerCase());
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  disabled={isOccupied}
                                  onClick={() => {
                                    if (isOccupied) return;
                                    setClassroom(recentName);
                                    saveRecentClassroom(recentName);
                                    setIsSpaceDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "px-2.5 py-1 text-[10px] font-bold uppercase border-2 border-black shadow-[2px_2px_0_0_#000] rounded-none transition-all flex items-center gap-1",
                                    isOccupied
                                      ? "bg-zinc-100 text-zinc-400 line-through cursor-not-allowed opacity-60 shadow-none border-zinc-400"
                                      : "bg-white hover:bg-yellow-200 text-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                                  )}
                                >
                                  <span>{recentName}</span>
                                  {isOccupied && <span className="text-[8px] text-red-500 font-black no-underline">(Ocupada)</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Header da Lista de Salas */}
                      <div className="px-3 pt-2 pb-1 bg-zinc-50/50 dark:bg-zinc-900/30 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-widest">
                        {recentClassrooms.length > 0 && !classroom ? "Todos os Espaços / Turmas:" : "Selecione a Sala / Turma:"}
                      </div>

                      {/* Spaces List */}
                      <div className="max-h-[180px] overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 pb-2">
                        {combinedSpaces.filter(s => s.name.toLowerCase().includes(classroom.toLowerCase())).length === 0 ? (
                          <div className="p-3 text-center text-xs text-zinc-400 font-bold uppercase">
                            Nenhum espaço encontrado
                          </div>
                        ) : (
                          combinedSpaces
                            .filter(s => s.name.toLowerCase().includes(classroom.toLowerCase()))
                            .map((s) => {
                              const isOccupied = currentReservations.some(res => res.classroom?.toLowerCase() === s.name.toLowerCase());
                              return (
                                <div
                                  key={s.id}
                                  onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('button')) return;
                                    if (isOccupied) return;
                                    setClassroom(s.name);
                                    saveRecentClassroom(s.name);
                                    setIsSpaceDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer group",
                                    isOccupied
                                      ? "bg-zinc-50 dark:bg-zinc-900/50 cursor-not-allowed opacity-60"
                                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900",
                                    classroom === s.name && "bg-blue-50 dark:bg-blue-950/20"
                                  )}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span
                                      className="w-1.5 h-1.5 rounded-full shrink-0"
                                      style={{ backgroundColor: s.color || '#3B82F6' }}
                                    />
                                    <span className={cn(
                                      "text-xs font-bold uppercase truncate",
                                      classroom === s.name ? "text-[#1e3a8a] dark:text-blue-400" : "text-black dark:text-zinc-200"
                                    )}>
                                      {s.name}
                                    </span>
                                    {isOccupied && (
                                      <span className="ml-2 bg-red-100 text-red-600 text-[8px] font-bold uppercase px-1.5 py-0.5 shrink-0 rounded-sm">
                                        Ocupada
                                      </span>
                                    )}
                                  </div>

                                  {/* Actions (Delete Space) - Admins only */}
                                  {isAdmin && !s.isVirtual && (
                                    <div className="flex items-center gap-1.5 shrink-0 z-20">
                                      {confirmDeleteId === s.id ? (
                                        <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-1 duration-150">
                                          <button
                                            type="button"
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              e.preventDefault();
                                              const success = await deleteSpace(s.id);
                                              if (success) {
                                                const updated = await getSpaces();
                                                setSpaces(updated);
                                                if (classroom === s.name) {
                                                  setClassroom('');
                                                }
                                              }
                                              setConfirmDeleteId(null);
                                            }}
                                            className="px-2 py-0.5 text-[9px] font-black uppercase text-white bg-red-600 hover:bg-red-700 transition-colors border border-black shadow-[1px_1px_0_0_#000] rounded-none"
                                          >
                                            SIM
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              e.preventDefault();
                                              setConfirmDeleteId(null);
                                            }}
                                            className="px-2 py-0.5 text-[9px] font-black uppercase text-black bg-zinc-200 hover:bg-zinc-300 transition-colors border border-black shadow-[1px_1px_0_0_#000] rounded-none"
                                          >
                                            NÃO
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            setConfirmDeleteId(s.id);
                                            setTimeout(() => {
                                              setConfirmDeleteId(current => current === s.id ? null : current);
                                            }, 4000);
                                          }}
                                          className="p-1 text-zinc-400 hover:text-red-500 rounded-sm transition-colors opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                                          title="Excluir espaço"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                        )}
                      </div>

                      {/* Add New Space panel (Admins only) */}
                      {isAdmin && (
                        <div className="p-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
                            Adicionar Espaço/Turma
                          </span>
                          <div className="flex gap-1.5">
                            <Input
                              placeholder="Nome da sala ou turma..."
                              value={newSpaceName}
                              onChange={(e) => setNewSpaceName(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (!newSpaceName.trim()) return;
                                  const created = await createSpace(newSpaceName, '#3B82F6');
                                  if (created) {
                                    setNewSpaceName('');
                                    const updated = await getSpaces();
                                    setSpaces(updated);
                                    setClassroom(created.name);
                                    setIsSpaceDropdownOpen(false);
                                  }
                                }
                              }}
                              className="h-8 border border-zinc-300 dark:border-zinc-700 rounded-sm text-xs font-bold bg-white dark:bg-zinc-800 focus-visible:ring-0 focus-visible:border-zinc-400"
                            />
                            <Button
                              type="button"
                              onClick={async () => {
                                if (!newSpaceName.trim()) return;
                                const created = await createSpace(newSpaceName, '#3B82F6');
                                if (created) {
                                  setNewSpaceName('');
                                  const updated = await getSpaces();
                                  setSpaces(updated);
                                  setClassroom(created.name);
                                  setIsSpaceDropdownOpen(false);
                                }
                              }}
                              className="h-8 bg-zinc-900 text-white hover:bg-zinc-800 rounded-sm px-3.5 py-0 text-xs font-bold transition-all shrink-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2º PASSO: QUANTIDADE DE CHROMEBOOKS */}
            {!isManutencao && (
              <div className={cn(
                "border-2 transition-all duration-300",
                isMinecraft
                  ? "border-[#3c8527] bg-green-50/30 dark:bg-green-950/10 shadow-[4px_4px_0_0_rgba(60,133,39,0.15)]"
                  : "border-[#1e3a8a] bg-blue-50/30 dark:bg-blue-950/10 shadow-[4px_4px_0_0_rgba(30,58,138,0.15)]"
              )}>
                <div className={cn(
                  "px-3 py-2 flex items-center justify-between transition-colors duration-300",
                  isMinecraft ? "bg-[#3c8527]" : "bg-[#1e3a8a]"
                )}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Monitor className={cn("h-4 w-4 text-white shrink-0", quantity === 0 && "opacity-50")} />
                    <span className="text-[12px] sm:text-[14px] font-black uppercase text-white tracking-wider truncate">
                      2. Quantidade de Chromebooks
                    </span>
                  </div>

                  {/* Controles de precisão (- e +) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(isMinecraft ? 1 : 0, prev - 1))}
                      disabled={quantity <= (isMinecraft ? 1 : 0)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white text-black border-2 border-black font-black shadow-[2px_2px_0_0_#000] hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
                      title="Diminuir 1 Chromebook"
                    >
                      <Minus className="h-3.5 w-3.5 stroke-[3]" />
                    </button>

                    <div className="bg-white text-black border-2 border-black px-2.5 sm:px-3 py-0.5 sm:py-1 font-black text-xs sm:text-sm min-w-[42px] text-center shadow-[2px_2px_0_0_#000] tabular-nums">
                      {quantity}
                    </div>

                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.min(isMinecraft ? 40 : maxQuantity, prev + 1))}
                      disabled={quantity >= (isMinecraft ? 40 : maxQuantity)}
                      className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white text-black border-2 border-black font-black shadow-[2px_2px_0_0_#000] hover:bg-zinc-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-40 disabled:pointer-events-none"
                      title="Aumentar 1 Chromebook"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                    </button>
                  </div>
                </div>

                <div className="p-3 sm:p-4">
                  <Slider
                    value={[quantity]}
                    onValueChange={(v) => setQuantity(v[0])}
                    min={isMinecraft ? 1 : 0}
                    max={isMinecraft ? 40 : maxQuantity}
                    step={1}
                    className="py-2"
                  />
                  <div className={cn(
                    "flex justify-between mt-1 text-[11px] sm:text-xs font-black uppercase transition-colors duration-300",
                    isMinecraft ? "text-[#3c8527]" : "text-[#1e3a8a] dark:text-blue-400"
                  )}>
                    <span>Mín: {isMinecraft ? 1 : 0}</span>
                    <span>Máx: {isMinecraft ? 40 : maxQuantity}</span>
                  </div>

                  {/* Atalhos Rápidos de Quantidade (Quick Presets) */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-black/10 dark:border-white/10">
                    <span className="text-[10px] font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider mr-1">
                      Atalhos Rápidos:
                    </span>
                    {!isMinecraft && (
                      <button
                        type="button"
                        onClick={() => setQuantity(0)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] transition-all",
                          quantity === 0 ? "bg-black text-white" : "bg-white hover:bg-zinc-100 text-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        )}
                      >
                        0 (Só Sala)
                      </button>
                    )}
                    {(isMinecraft ? 40 : maxQuantity) >= 15 && (
                      <button
                        type="button"
                        onClick={() => setQuantity(15)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] transition-all",
                          quantity === 15 ? "bg-black text-white" : "bg-white hover:bg-zinc-100 text-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        )}
                      >
                        15 (Meia Turma)
                      </button>
                    )}
                    {(isMinecraft ? 40 : maxQuantity) >= 30 && (
                      <button
                        type="button"
                        onClick={() => setQuantity(30)}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] transition-all",
                          quantity === 30 ? "bg-black text-white" : "bg-white hover:bg-zinc-100 text-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        )}
                      >
                        30 (Turma Cheia)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setQuantity(isMinecraft ? 40 : maxQuantity)}
                      className={cn(
                        "px-2.5 py-1 text-[10px] font-black uppercase border-2 border-black shadow-[2px_2px_0_0_#000] transition-all",
                        quantity === (isMinecraft ? 40 : maxQuantity) ? "bg-black text-white" : "bg-white hover:bg-zinc-100 text-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      )}
                    >
                      Máx ({isMinecraft ? 40 : maxQuantity})
                    </button>
                  </div>

                  {/* Descrição do pacote de reserva */}
                  {quantity === 0 && !isMinecraft ? (
                    <div className={cn(
                      "mt-3 p-2.5 border-2 border-black flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200 transition-colors",
                      isMinecraft ? "bg-[#3c8527]" : "bg-[#1e3a8a]"
                    )}>
                      <div className="bg-white p-1 rounded-sm shrink-0">
                        <CheckCircle className={cn("h-4 w-4", isMinecraft ? "text-[#3c8527]" : "text-[#1e3a8a]")} />
                      </div>
                      <span className="text-[11px] font-black uppercase text-white tracking-widest leading-none">
                        Apenas reserva do espaço físico (sem Chromebooks)
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 p-2.5 bg-[#a855f7] border-2 border-black flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="bg-white p-1 rounded-sm shrink-0">
                        <Monitor className="h-4 w-4 text-[#a855f7]" />
                      </div>
                      <span className="text-[11px] font-black uppercase text-white tracking-widest leading-none">
                        Espaço Físico + {quantity} Chromebooks
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3º PASSO: MINECRAFT & RECURSOS EXTRAS */}
            {!isManutencao && isChromebookSpace && (
              <div className="space-y-3">
                {/* OPÇÃO MINECRAFT */}
                <div className="border-2 border-[#3c8527] bg-[#3c8527]/5 dark:bg-[#3c8527]/10 overflow-hidden shadow-[3px_3px_0_0_rgba(60,133,39,0.15)]">
                  <div className="bg-[#3c8527] px-3 py-2 flex items-center justify-center border-b-2 border-black">
                    <span
                      className="uppercase select-none text-center leading-tight"
                      style={{
                        fontFamily: "'Press Start 2P', cursive",
                        fontSize: '12px',
                        letterSpacing: '1px',
                        color: '#FFFFFF',
                        textShadow: '2px 2px 0px #000000'
                      }}
                    >
                      Aula com Minecraft
                    </span>
                  </div>

                  <div className="p-2.5 sm:p-3 flex items-center justify-between gap-3 bg-white/50 backdrop-blur-sm">
                    <div className="flex-1">
                      <p className="text-[9px] sm:text-[10px] font-black text-black/70 uppercase leading-tight">
                        HABILITE PARA UTILIZAR O MINECRAFT EDUCATION. <br />
                        <span className="text-[#3c8527] font-[1000] tracking-tight">LIMITE DE 40 CHROMEBOOKS APLICADO.</span>
                      </p>
                    </div>

                    <div className="flex border-[2px] border-black bg-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] h-8">
                      <button
                        type="button"
                        onClick={() => setIsMinecraft(false)}
                        className={cn(
                          "px-3.5 sm:px-5 h-full text-[10px] font-[1000] uppercase tracking-wider transition-all",
                          !isMinecraft ? "bg-black text-white" : "bg-white text-black hover:bg-zinc-50"
                        )}
                      >
                        NÃO
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMinecraft(true)}
                        className={cn(
                          "px-3.5 sm:px-5 h-full text-[10px] font-[1000] uppercase tracking-wider transition-all border-l-[2px] border-black",
                          isMinecraft ? "bg-[#3c8527] text-white" : "bg-white text-black hover:bg-zinc-50"
                        )}
                      >
                        SIM
                      </button>
                    </div>
                  </div>
                </div>

                {/* RECURSOS EXTRAS (TV, SOM, MIC) */}
                <div className="border-2 border-[#1e3a8a] bg-[#1e3a8a]/5 dark:bg-[#1e3a8a]/10 overflow-hidden shadow-[3px_3px_0_0_rgba(30,58,138,0.15)] animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-[#1e3a8a] px-3 py-1.5 flex items-center gap-2">
                    <Tv className="h-3.5 w-3.5 text-white" />
                    <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider">
                      Recursos Extras da Sala
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                      {/* TV */}
                      <div
                        onClick={() => setNeedsTv(!needsTv)}
                        className={cn(
                          "flex items-center gap-2 p-2 border-2 border-black cursor-pointer transition-all",
                          needsTv ? "bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0_0_#000]"
                        )}
                      >
                        <Tv className={cn("h-3.5 w-3.5", needsTv ? "text-white" : "text-black")} />
                        <span className="text-[11px] font-black uppercase">TV</span>
                      </div>

                      {/* SOM */}
                      <div
                        onClick={() => setNeedsSound(!needsSound)}
                        className={cn(
                          "flex items-center gap-2 p-2 border-2 border-black cursor-pointer transition-all",
                          needsSound ? "bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0_0_#000]"
                        )}
                      >
                        <Volume2 className={cn("h-3.5 w-3.5", needsSound ? "text-white" : "text-black")} />
                        <span className="text-[11px] font-black uppercase">Som</span>
                      </div>

                      {/* MIC */}
                      <div
                        onClick={() => setNeedsMic(!needsMic)}
                        className={cn(
                          "flex items-center gap-2 p-2 border-2 border-black cursor-pointer transition-all col-span-2 sm:col-span-1 min-h-[44px]",
                          needsMic ? "bg-black text-white shadow-none translate-x-[1px] translate-y-[1px]" : "bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0_0_#000]"
                        )}
                      >
                        <Mic className={cn("h-3.5 w-3.5", needsMic ? "text-white" : "text-black")} />
                        <span className="text-[11px] font-black uppercase">Mic</span>

                        {needsMic && (
                          <div className="flex items-center gap-1.5 ml-auto" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setMicQuantity(Math.max(1, micQuantity - 1))}
                              className="w-6 h-6 flex items-center justify-center bg-zinc-800 text-white border border-white/40 hover:bg-zinc-700 active:scale-95"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-3 text-center text-xs font-black text-white">{micQuantity}</span>
                            <button
                              type="button"
                              onClick={() => setMicQuantity(Math.min(2, micQuantity + 1))}
                              disabled={micQuantity >= 2}
                              className="w-6 h-6 flex items-center justify-center bg-zinc-800 text-white border border-white/40 hover:bg-zinc-700 active:scale-95 disabled:opacity-30"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4º PASSO: RECORRÊNCIA (MÚLTIPLAS DATAS) */}
            {!isManutencao && (
              <div className="border-2 border-[#1e3a8a] bg-blue-50/30 overflow-hidden shadow-[3px_3px_0_0_rgba(30,58,138,0.15)] relative">
                <div className="bg-[#1e3a8a] px-3 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-white" />
                    <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wider">
                      Repetir em Outros Dias? (Recorrência)
                    </span>
                  </div>
                  <span className="bg-white/20 border border-white/50 px-1.5 py-0.5 text-white text-[8px] font-black uppercase">
                    Opcional
                  </span>
                </div>

                <div className="p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <p className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 leading-snug max-w-full sm:max-w-[280px]">
                      Deseja reservar este mesmo horário para outras datas da semana ou do mês?
                    </p>

                    <div className="flex border-2 border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-[2px_2px_0_0_#000] self-start sm:self-center overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setIsMultiMode(false)}
                        className={cn(
                          "px-4 py-1.5 text-[11px] font-black uppercase transition-all",
                          !isMultiMode ? "bg-zinc-800 text-white" : "bg-white text-zinc-500 hover:text-black"
                        )}
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMultiMode(true)}
                        className={cn(
                          "px-4 py-1.5 text-[11px] font-black uppercase transition-all border-l-2 border-black",
                          isMultiMode ? "bg-[#1e3a8a] text-white" : "bg-white text-zinc-500 hover:text-black"
                        )}
                      >
                        Sim
                      </button>
                    </div>
                  </div>

                  {isMultiMode && (
                    <div className="mt-3 pt-3 border-t-2 border-blue-200 animate-in fade-in slide-in-from-top-1">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-[#1e3a8a] mb-2 block">
                        Dias selecionados para este horário:
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 text-white text-[11px] font-black uppercase border border-black shadow-[2px_2px_0_0_#000]">
                          <Calendar className="h-3 w-3" />
                          {format(date, 'dd/MM')}
                          <span className="text-blue-300 text-[9px] font-bold">(atual)</span>
                        </div>
                        {extraDates.map((d, i) => (
                          <div key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1e40af] text-white text-[11px] font-black uppercase border border-black shadow-[2px_2px_0_0_#000] group">
                            <Calendar className="h-3 w-3" />
                            {format(d, 'dd/MM')}
                            <CloseIcon className="h-3 w-3 cursor-pointer opacity-70 group-hover:opacity-100" onClick={() => setExtraDates(extraDates.filter((_, idx) => idx !== i))} />
                          </div>
                        ))}
                        <Button
                          type="button"
                          onClick={() => setShowCalendar(!showCalendar)}
                          className="h-auto py-1 px-2.5 bg-white text-[#1e3a8a] border-2 border-dashed border-[#1e3a8a] text-[10px] font-black uppercase hover:bg-blue-50 rounded-none flex items-center gap-1 shadow-[1px_1px_0_0_rgba(30,58,138,0.1)]"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          Adicionar Dias
                        </Button>
                      </div>

                      {showCalendar && (
                        <div className="mt-2.5 border-2 border-black p-2 bg-white shadow-[3px_3px_0_0_#000]">
                          <CalendarUI
                            mode="multiple"
                            selected={extraDates}
                            onSelect={(dates) => setExtraDates(dates || [])}
                            disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0)) || format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')}
                            className="rounded-none w-full"
                            locale={ptBR}
                            classNames={{
                              day_selected: "bg-[#1e3a8a] text-white hover:bg-[#1e40af] hover:text-white rounded-none border-2 border-black shadow-[2px_2px_0_0_#000]",
                            }}
                          />
                          <Button
                            type="button"
                            onClick={() => setShowCalendar(false)}
                            className="w-full mt-3 bg-[#1e3a8a] text-white h-10 text-xs font-black uppercase rounded-none border-2 border-black shadow-[3px_3px_0_0_#000]"
                          >
                            Confirmar Dias Selecionados
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5º PASSO: JUSTIFICATIVA / MOTIVO (OPCIONAL) */}
            <div className="space-y-1.5 pt-1">
              <Label className="text-[11px] sm:text-xs font-black uppercase text-[#1e3a8a] dark:text-blue-400 tracking-wider">
                Justificativa / Conteúdo da Aula (Opcional):
              </Label>
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Trabalho de História sobre a Revolução Industrial / Avaliação no Forms"
                className="border-2 border-black dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-none min-h-[60px] text-xs resize-none focus-visible:ring-0 focus-visible:border-[#1e3a8a]"
              />
            </div>

            {/* BARRA DE RESUMO E VALIDAÇÃO PRÉ-CONFIRMAÇÃO */}
            <div className="pt-1">
              {!classroom.trim() ? (
                <div className="p-2.5 bg-yellow-50 border-2 border-yellow-500 text-yellow-900 text-xs font-bold uppercase flex items-center gap-2 shadow-[2px_2px_0_0_rgba(234,179,8,0.2)]">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                  <span>Selecione ou digite a <strong>Sala / Turma</strong> acima para habilitar o agendamento.</span>
                </div>
              ) : isBookingForOther && !selectedProfessorId ? (
                <div className="p-2.5 bg-yellow-50 border-2 border-yellow-500 text-yellow-900 text-xs font-bold uppercase flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                  <span>Selecione o <strong>Professor Solicitante</strong> para continuar.</span>
                </div>
              ) : currentReservations.some(res => classroom.trim() && res.classroom?.toLowerCase() === classroom.trim().toLowerCase()) ? (
                <div className="p-2.5 bg-red-50 border-2 border-red-500 text-red-900 text-xs font-bold uppercase flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>A sala <strong>"{classroom}"</strong> já está ocupada neste horário. Escolha outro espaço.</span>
                </div>
              ) : (
                <div className="p-2.5 bg-green-50 border-2 border-green-600 text-green-950 text-xs font-bold uppercase flex items-center justify-between gap-2 shadow-[2px_2px_0_0_rgba(22,163,74,0.15)]">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="truncate">
                      Pronto: <strong>{classroom}</strong> • {quantity === 0 ? 'Apenas Espaço Físico' : `${quantity} Chromebooks`}{isMinecraft ? ' (Minecraft)' : ''}{extraDates.length > 0 ? ` • +${extraDates.length} dias extras` : ''}
                    </span>
                  </div>
                  <span className="text-[9px] bg-green-200 border border-green-600 px-1.5 py-0.5 rounded-none font-black shrink-0">
                    OK
                  </span>
                </div>
              )}
            </div>

          </div>
        </form>

        {/* FOOTER */}
        <DialogFooter className="shrink-0 p-3 sm:p-5 bg-white dark:bg-zinc-950 border-t-[3px] sm:border-t-[4px] border-black dark:border-zinc-800 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 z-30 shadow-[0_-6px_14px_rgba(0,0,0,0.08)]">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto sm:flex-1 h-11 sm:h-12 font-[1000] uppercase tracking-wider border-[2px] sm:border-[3px] border-black dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none text-black dark:text-zinc-100 rounded-none shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] dark:shadow-[3px_3px_0_0_rgba(255,255,255,0.05)] text-xs sm:text-sm transition-all"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSaving || !classroom.trim() || quantity < 0 || (isBookingForOther && !selectedProfessorId) || currentReservations.some(res => classroom.trim() && res.classroom?.toLowerCase() === classroom.trim().toLowerCase())}
            onClick={handleSubmit}
            className="w-full sm:w-auto sm:flex-[2] h-11 sm:h-12 font-[1000] uppercase tracking-wider bg-[#3B82F6] hover:bg-[#2563EB] text-white border-[2px] sm:border-[3px] border-black rounded-none shadow-[3px_3px_0_0_#000] sm:shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none text-xs sm:text-sm disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_0_#000] sm:disabled:hover:shadow-[4px_4px_0_0_#000] transition-all flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 stroke-[3]" /> Confirmar Reserva</>}
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};
