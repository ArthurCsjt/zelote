import React, { useState, useEffect, useMemo } from 'react';
import { useDatabase, Space } from '@/hooks/useDatabase';
import { useProfileRole } from '@/hooks/use-profile-role';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Building2, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Loader2, 
  Sparkles, 
  School, 
  CheckCircle2, 
  Layers, 
  AlertTriangle,
  RotateCcw,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { INITIAL_DEFAULT_SPACES } from '@/services/reservationService';

const PRESET_COLORS = [
  { label: 'Azul Padrão', value: '#3B82F6' },
  { label: 'Verde Google', value: '#3C8527' },
  { label: 'Roxo Maker', value: '#8B5CF6' },
  { label: 'Âmbar Eventos', value: '#F59E0B' },
  { label: 'Rosa Pink', value: '#EC4899' },
  { label: 'Ciano Teal', value: '#14B8A6' },
  { label: 'Grafite', value: '#4B5563' },
];

export const SpacesManagement: React.FC = () => {
  const { getSpaces, createSpace, updateSpace, deleteSpace, seedDefaultSpaces } = useDatabase();
  const { isAdmin } = useProfileRole();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modais de Criação e Edição
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [spaceToEdit, setSpaceToEdit] = useState<Space | null>(null);

  // Campos do formulário
  const [roomPrefix, setRoomPrefix] = useState('');
  const [turmas, setTurmas] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isSaving, setIsSaving] = useState(false);

  // Diálogo de exclusão
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sincronização
  const [isSeeding, setIsSeeding] = useState(false);

  const loadSpaces = async () => {
    setLoading(true);
    try {
      const data = await getSpaces();
      setSpaces(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpaces();
  }, []);

  // Formata o nome composto: "SALA 21 - 5EFMB / 5EFTC" ou "SALA GOOGLE"
  const computedPreviewName = useMemo(() => {
    const p = roomPrefix.trim().toUpperCase();
    const t = turmas.trim().toUpperCase();
    if (p && t) return `${p} - ${t}`;
    if (p) return p;
    if (t) return t;
    return 'Ex: SALA 21 - 5EFMB / 5EFTC';
  }, [roomPrefix, turmas]);

  // Abre modal para criação
  const handleOpenCreate = () => {
    setRoomPrefix('');
    setTurmas('');
    setColor('#3B82F6');
    setIsCreateOpen(true);
  };

  // Abre modal para edição
  const handleOpenEdit = (sp: Space) => {
    setSpaceToEdit(sp);
    setColor(sp.color || '#3B82F6');

    // Tenta separar "SALA X - TURMA Y"
    if (sp.name.includes(' - ')) {
      const [p, ...rest] = sp.name.split(' - ');
      setRoomPrefix(p.trim());
      setTurmas(rest.join(' - ').trim());
    } else {
      setRoomPrefix(sp.name);
      setTurmas('');
    }

    setIsEditOpen(true);
  };

  // Salvar criação
  const handleSaveCreate = async () => {
    const finalName = computedPreviewName.trim();
    if (!finalName || finalName.startsWith('Ex:')) return;

    setIsSaving(true);
    try {
      const created = await createSpace(finalName, color);
      if (created) {
        setIsCreateOpen(false);
        await loadSpaces();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!spaceToEdit) return;
    const finalName = computedPreviewName.trim();
    if (!finalName || finalName.startsWith('Ex:')) return;

    setIsSaving(true);
    try {
      const updated = await updateSpace(spaceToEdit.id, {
        name: finalName,
        color
      });
      if (updated) {
        setIsEditOpen(false);
        setSpaceToEdit(null);
        await loadSpaces();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!spaceToDelete) return;
    setIsDeleting(true);
    try {
      const ok = await deleteSpace(spaceToDelete.id);
      if (ok) {
        setSpaceToDelete(null);
        await loadSpaces();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Sincronizar / Popular salas padrão no banco
  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      await seedDefaultSpaces();
      await loadSpaces();
    } finally {
      setIsSeeding(false);
    }
  };

  // Filtragem inteligente por busca
  const filteredSpaces = useMemo(() => {
    if (!search.trim()) return spaces;
    const q = search.toLowerCase().trim();
    return spaces.filter(s => s.name.toLowerCase().includes(q));
  }, [spaces, search]);

  // Estatísticas rápidas
  // Estatísticas rápidas
  const stats = useMemo(() => {
    const total = spaces.length;
    const multiTurno = spaces.filter(s => s.name.includes('/')).length;
    const especiais = spaces.filter(s => 
      s.name.includes('GOOGLE') || 
      s.name.includes('MAKER') || 
      s.name.includes('BIBLIOTECA') || 
      s.name.includes('AUDITÓRIO') ||
      s.name.includes('LABORATÓRIO') ||
      s.name.includes('QUADRA')
    ).length;
    return { total, multiTurno, especiais };
  }, [spaces]);

  // Identifica quantas salas ainda estão no padrão antigo sem turmas
  const legacyRoomsCount = useMemo(() => {
    return spaces.filter(s => {
      const isRoom = s.name.toUpperCase().startsWith('SALA') && !s.name.toUpperCase().includes('GOOGLE') && !s.name.toUpperCase().includes('MAKER');
      return isRoom && !s.name.includes('-');
    }).length;
  }, [spaces]);

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL DO CABEÇALHO */}
      <div className="neo-card p-5 sm:p-6 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-none bg-[#3B82F6] border-2 border-black dark:border-white shadow-[3px_3px_0_0_#000] flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-[1000] uppercase tracking-tight text-foreground">
                  Salas de Aula & Turmas
                </h3>
                <Badge className="bg-[#FACC15] text-black border-2 border-black font-[1000] text-[10px] uppercase shadow-[1px_1px_0_0_#000] rounded-none">
                  Agendamento Dinâmico
                </Badge>
              </div>
              <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">
                Cadastre e edite salas de aula, horários e espaços multiuso. Todas as alterações refletem no agendamento em tempo real.
              </p>
            </div>
          </div>

          {/* BOTÕES DE AÇÃO DO TOPO */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                onClick={handleSeedDefaults}
                disabled={isSeeding}
                variant="outline"
                className="neo-btn h-10 px-3.5 border-2 border-black dark:border-white font-black text-xs uppercase tracking-wider bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-200 shadow-[2px_2px_0_0_#000]"
                title="Atualiza todas as 24 salas com suas respectivas turmas e insere espaços multiuso no banco de dados"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <RotateCcw className="w-4 h-4 mr-1.5" />}
                Sincronizar Padrões
              </Button>

              <Button
                type="button"
                onClick={handleOpenCreate}
                className="neo-btn h-10 px-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_0_#000] flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Nova Sala / Turma
              </Button>
            </div>
          )}
        </div>

        {/* STATS RÁPIDOS */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 mt-5 pt-4 border-t-2 border-black/10 dark:border-white/10">
          <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/20 border-2 border-black dark:border-zinc-800">
            <span className="text-[10px] sm:text-xs font-black uppercase text-blue-900 dark:text-blue-300 block">Total Ativo</span>
            <span className="text-lg sm:text-2xl font-[1000] text-black dark:text-white tabular-nums">{stats.total}</span>
          </div>
          <div className="p-2.5 sm:p-3 bg-amber-50 dark:bg-amber-950/20 border-2 border-black dark:border-zinc-800">
            <span className="text-[10px] sm:text-xs font-black uppercase text-amber-900 dark:text-amber-300 block">Dois Turnos (M/T)</span>
            <span className="text-lg sm:text-2xl font-[1000] text-black dark:text-white tabular-nums">{stats.multiTurno}</span>
          </div>
          <div className="p-2.5 sm:p-3 bg-green-50 dark:bg-green-950/20 border-2 border-black dark:border-zinc-800">
            <span className="text-[10px] sm:text-xs font-black uppercase text-green-900 dark:text-green-300 block">Espaços Multiuso</span>
            <span className="text-lg sm:text-2xl font-[1000] text-black dark:text-white tabular-nums">{stats.especiais}</span>
          </div>
        </div>
      </div>

      {/* ALERTA DE ATUALIZAÇÃO NECESSÁRIA (TURMAS NÃO VINCULADAS) */}
      {isAdmin && legacyRoomsCount > 0 && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-950/60 border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-800 dark:text-yellow-300 stroke-[2.5] shrink-0" />
            <div>
              <h4 className="text-xs sm:text-sm font-[1000] uppercase text-yellow-950 dark:text-yellow-100">
                Atenção: Existem {legacyRoomsCount} salas cadastradas sem as turmas vinculadas
              </h4>
              <p className="text-[11px] font-bold text-yellow-900 dark:text-yellow-200 mt-0.5">
                Suas salas no banco de dados estão apenas com o número (ex: "SALA 21"). Clique ao lado para aplicar as turmas ativas agora (ex: "SALA 21 - 5EFMB / 5EFTC").
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSeeding}
            className="neo-btn bg-black hover:bg-zinc-800 text-yellow-300 font-[1000] uppercase text-xs h-10 px-4 shadow-[2px_2px_0_0_#FACC15] shrink-0 flex items-center gap-1.5"
          >
            {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Vincular Turmas Agora
          </Button>
        </div>
      )}

      {/* BARRA DE PESQUISA */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 stroke-[2.5]" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquise por número da sala (ex: SALA 21) ou turma (ex: 5EFMB, 1MDMA)..."
          className="pl-10 h-11 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white font-bold text-xs uppercase shadow-[2px_2px_0_0_#000] rounded-none focus-visible:ring-0"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black uppercase bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded-none"
          >
            Limpar
          </button>
        )}
      </div>

      {/* LISTAGEM DE SALAS E TURMAS */}
      {loading ? (
        <div className="p-12 text-center neo-card bg-white dark:bg-zinc-900 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
          <p className="text-xs font-black uppercase text-zinc-500">Carregando salas do banco de dados...</p>
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="p-10 text-center neo-card bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-400 space-y-4">
          <School className="w-12 h-12 text-zinc-400 mx-auto" />
          <div>
            <h4 className="text-base font-black uppercase text-foreground">
              {spaces.length === 0 ? "Nenhuma sala cadastrada no banco" : "Nenhuma sala corresponde à pesquisa"}
            </h4>
            <p className="text-xs text-muted-foreground font-bold mt-1 max-w-md mx-auto">
              {spaces.length === 0 
                ? "Clique no botão 'Sincronizar Padrões' acima para carregar automaticamente as 24 salas de aula e 6 espaços especiais."
                : "Tente buscar por outro número de sala ou sigla da turma."}
            </p>
          </div>
          {spaces.length === 0 && (
            <Button
              type="button"
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="neo-btn bg-[#3B82F6] text-white font-black uppercase text-xs h-10 px-5 shadow-[3px_3px_0_0_#000]"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Carregar Salas e Turmas Oficiais Agora
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSpaces.map((sp) => {
            const isSpecial = sp.name.includes('GOOGLE') || sp.name.includes('MAKER') || sp.name.includes('BIBLIOTECA') || sp.name.includes('AUDITÓRIO') || sp.name.includes('LABORATÓRIO') || sp.name.includes('QUADRA');
            const hasMultipleClasses = sp.name.includes('/');

            return (
              <div
                key={sp.id}
                className="neo-card p-3.5 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-[3px_3px_0_0_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3.5 h-3.5 border border-black shrink-0"
                        style={{ backgroundColor: sp.color || '#3B82F6' }}
                      />
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground truncate">
                        {isSpecial ? "Espaço Especial" : "Sala de Aula"}
                      </span>
                    </div>

                    {hasMultipleClasses && (
                      <Badge className="bg-amber-100 text-amber-900 border border-black text-[9px] font-black uppercase px-1.5 py-0 rounded-none shrink-0">
                        2 Turnos
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-[1000] uppercase tracking-tight text-foreground leading-snug break-words">
                      {sp.name.includes(' - ') ? (
                        <>
                          <span className="text-[#1e3a8a] dark:text-blue-400 font-[1000]">
                            {sp.name.split(' - ')[0]}
                          </span>
                          <span className="text-zinc-600 dark:text-zinc-300 font-bold ml-1.5">
                            • {sp.name.split(' - ').slice(1).join(' - ')}
                          </span>
                        </>
                      ) : (
                        sp.name
                      )}
                    </h4>

                    {sp.name.toUpperCase().startsWith('SALA') && !sp.name.toUpperCase().includes('GOOGLE') && !sp.name.toUpperCase().includes('MAKER') && !sp.name.includes('-') && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3" /> Sem turmas vinculadas
                      </span>
                    )}
                  </div>
                </div>

                {/* AÇÕES DE ADMIN */}
                {isAdmin && (
                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-black/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sp)}
                      className="px-2.5 py-1 text-[10px] font-black uppercase bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-black dark:text-white border border-black shadow-[1px_1px_0_0_#000] rounded-none flex items-center gap-1 transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpaceToDelete(sp)}
                      className="px-2.5 py-1 text-[10px] font-black uppercase bg-red-100 hover:bg-red-200 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-black shadow-[1px_1px_0_0_#000] rounded-none flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG DE CRIAR SALA / TURMA */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="neo-card p-5 sm:p-6 bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-[1000] uppercase tracking-tight">
              Cadastrar Nova Sala / Turma
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase">
              Preencha o número ou nome da sala e as turmas associadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-black uppercase tracking-wider block mb-1">
                Número da Sala ou Espaço: <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={roomPrefix}
                onChange={(e) => setRoomPrefix(e.target.value)}
                placeholder="Ex: SALA 21, SALA 42 ou SALA MAKER"
                className="h-10 border-2 border-black font-bold uppercase text-xs rounded-none"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase tracking-wider block mb-1">
                Turmas Atendidas (Opcional):
              </Label>
              <Input
                type="text"
                value={turmas}
                onChange={(e) => setTurmas(e.target.value)}
                placeholder="Ex: 5EFMB / 5EFTC ou 1MDMA ou INTEGRAL"
                className="h-10 border-2 border-black font-bold uppercase text-xs rounded-none"
              />
              <span className="text-[10px] text-muted-foreground font-bold mt-1 block">
                Dica: Se a sala tiver turmas nos dois períodos, separe por barra: <strong>5EFMB / 5EFTC</strong>
              </span>
            </div>

            {/* SELETOR DE COR */}
            <div>
              <Label className="text-xs font-black uppercase tracking-wider block mb-1.5">
                Cor de Destaque:
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "w-7 h-7 border-2 border-black rounded-none shadow-[2px_2px_0_0_#000] transition-all",
                      color === c.value && "scale-110 ring-2 ring-black ring-offset-2"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* PRÉVIA NO AGENDAMENTO */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border-2 border-[#1e3a8a] shadow-[2px_2px_0_0_#1e3a8a]">
              <span className="text-[10px] font-black uppercase text-[#1e3a8a] dark:text-blue-300 block mb-1">
                Como aparecerá na busca do agendamento:
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 border border-black shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-[1000] uppercase text-black dark:text-white">
                  {computedPreviewName}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="neo-btn font-black uppercase text-xs border-2 border-black rounded-none"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveCreate}
              disabled={isSaving || !computedPreviewName.trim() || computedPreviewName.startsWith('Ex:')}
              className="neo-btn bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] rounded-none"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Salvar Sala
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG DE EDITAR SALA / TURMA */}
      {/* ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="neo-card p-5 sm:p-6 bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] rounded-none max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-[1000] uppercase tracking-tight">
              Editar Sala / Turma
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase">
              Atualize a identificação ou turmas. Refletirá imediatamente no agendamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-black uppercase tracking-wider block mb-1">
                Número da Sala ou Espaço: <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={roomPrefix}
                onChange={(e) => setRoomPrefix(e.target.value)}
                placeholder="Ex: SALA 21"
                className="h-10 border-2 border-black font-bold uppercase text-xs rounded-none"
              />
            </div>

            <div>
              <Label className="text-xs font-black uppercase tracking-wider block mb-1">
                Turmas Atendidas:
              </Label>
              <Input
                type="text"
                value={turmas}
                onChange={(e) => setTurmas(e.target.value)}
                placeholder="Ex: 5EFMB / 5EFTC"
                className="h-10 border-2 border-black font-bold uppercase text-xs rounded-none"
              />
            </div>

            {/* SELETOR DE COR */}
            <div>
              <Label className="text-xs font-black uppercase tracking-wider block mb-1.5">
                Cor de Destaque:
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={cn(
                      "w-7 h-7 border-2 border-black rounded-none shadow-[2px_2px_0_0_#000] transition-all",
                      color === c.value && "scale-110 ring-2 ring-black ring-offset-2"
                    )}
                    style={{ backgroundColor: c.value }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* PRÉVIA NO AGENDAMENTO */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border-2 border-[#1e3a8a] shadow-[2px_2px_0_0_#1e3a8a]">
              <span className="text-[10px] font-black uppercase text-[#1e3a8a] dark:text-blue-300 block mb-1">
                Como aparecerá no agendamento:
              </span>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 border border-black shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs font-[1000] uppercase text-black dark:text-white">
                  {computedPreviewName}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="neo-btn font-black uppercase text-xs border-2 border-black rounded-none"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSaving || !computedPreviewName.trim() || computedPreviewName.startsWith('Ex:')}
              className="neo-btn bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] rounded-none"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ========================================================================= */}
      <AlertDialog open={!!spaceToDelete} onOpenChange={(open) => !open && setSpaceToDelete(null)}>
        <AlertDialogContent className="neo-card p-5 sm:p-6 bg-white dark:bg-zinc-950 border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] rounded-none max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertTriangle className="w-5 h-5 stroke-[3]" />
              <AlertDialogTitle className="text-lg font-[1000] uppercase">
                Excluir Sala / Espaço?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
              Tem certeza que deseja excluir o espaço <strong>"{spaceToDelete?.name}"</strong>? Ele deixará de aparecer nas opções do agendamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="neo-btn font-black uppercase text-xs border-2 border-black rounded-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="neo-btn bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0_0_#000] rounded-none"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
