import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "@/hooks/use-toast";
import { Search, Filter, Edit3, Trash2, Users, GraduationCap, UserCheck, Briefcase, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "./ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useProfileRole } from "@/hooks/use-profile-role";
import { useDatabase } from "@/hooks/useDatabase"; // Usando useDatabase
import { UserEditDialog } from "./UserEditDialog"; // Importando o novo diálogo
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard
import { cn } from "@/lib/utils"; // Importando cn

interface User {
  id: string;
  nome_completo: string;
  email: string;
  tipo: 'Aluno' | 'Professor' | 'Funcionário';
  detalhe?: string; // RA para alunos, turma para alunos
  turma?: string;
  ra?: string;
  created_at: string;
}

export function UserInventory() {
  const { isAdmin } = useProfileRole();
  const { deleteUserRecord } = useDatabase(); // Usando a nova função
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true); // Carregamento inicial
  const [isDeleting, setIsDeleting] = useState(false); // Carregamento de exclusão
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Estados para edição
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Estados para exclusão
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // Fetch students
      const { data: alunos, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch teachers
      const { data: professores, error: professoresError } = await supabase
        .from('professores')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch staff
      const { data: funcionarios, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (alunosError || professoresError || funcionariosError) {
        throw new Error('Erro ao carregar dados de usuários.');
      }

      // Combine all users
      const allUsers: User[] = [
        ...(alunos || []).map(aluno => ({
          id: aluno.id,
          nome_completo: aluno.nome_completo,
          email: aluno.email,
          tipo: 'Aluno' as const,
          detalhe: aluno.ra,
          turma: aluno.turma,
          ra: aluno.ra,
          created_at: aluno.created_at
        })),
        ...(professores || []).map(professor => ({
          id: professor.id,
          nome_completo: professor.nome_completo,
          email: professor.email,
          tipo: 'Professor' as const,
          created_at: professor.created_at
        })),
        ...(funcionarios || []).map(funcionario => ({
          id: funcionario.id,
          nome_completo: funcionario.nome_completo,
          email: funcionario.email,
          tipo: 'Funcionário' as const,
          created_at: funcionario.created_at
        }))
      ];

      setUsers(allUsers);

      // Extract unique classes for filter
      const classes = [...new Set(alunos?.map(a => a.turma).filter(Boolean) || [])];
      setAvailableClasses(classes);

    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.ra && user.ra.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.turma && user.turma.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || user.tipo === typeFilter;
    const matchesClass = classFilter === 'all' || user.turma === classFilter;

    return matchesSearch && matchesType && matchesClass;
  });

  // Get statistics
  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.tipo === 'Aluno').length;
  const totalTeachers = users.filter(u => u.tipo === 'Professor').length;
  const totalStaff = users.filter(u => u.tipo === 'Funcionário').length;

  const handleEdit = (user: User) => {
    if (!isAdmin) {
      toast({ title: 'Permissão negada', description: 'Apenas administradores podem editar usuários.', variant: 'destructive' });
      return;
    }
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    // Recarrega a lista de usuários após a edição bem-sucedida
    fetchUsers();
  };

  const handleDeleteClick = (user: User) => {
    if (!isAdmin) {
      toast({ title: 'Permissão negada', description: 'Apenas administradores podem excluir usuários.', variant: 'destructive' });
      return;
    }
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);

    // Mapeia o tipo de exibição para o tipo de banco de dados
    const userTypeMap = {
      'Aluno': 'aluno',
      'Professor': 'professor',
      'Funcionário': 'funcionario'
    };

    const dbUserType = userTypeMap[userToDelete.tipo];

    try {
      const success = await deleteUserRecord(userToDelete.id, dbUserType as any);

      if (success) {
        // Atualiza o estado local
        setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      }

    } catch (error) {
      // O toast de erro já é tratado dentro do useDatabase
      console.error('Erro ao excluir usuário:', error);
    } finally {
      setUserToDelete(null);
      setIsDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  if (isLoadingData && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics - ESTILO NEO-BRUTALISM */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: "Total de Usuários", value: totalUsers, icon: Users, color: "text-gray-500", border: "border-black" },
          { title: "Alunos", value: totalStudents, icon: GraduationCap, color: "text-green-600", border: "border-black" },
          { title: "Professores", value: totalTeachers, icon: UserCheck, color: "text-blue-600", border: "border-black" },
          { title: "Funcionários", value: totalStaff, icon: Briefcase, color: "text-purple-600", border: "border-black" }
        ].map((stat, index) => (
          <div key={index} className="relative p-4 border-2 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-xs font-black uppercase tracking-tight text-gray-500 dark:text-gray-400">
                {stat.title}
              </h3>
              <div className="p-1.5 border-2 border-black dark:border-white rounded-none">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </div>
            <div className={cn("text-2xl font-black", stat.color)}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Search and filters - ESTILO NEO-BRUTALISM */}
      <div className="p-6 border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] relative z-10">
        <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2">
          <Filter className="h-4 w-4" /> Filtros
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="relative flex-1 w-full space-y-1">
            <span className="text-xs font-bold uppercase text-gray-500">Buscar Usuário</span>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-black dark:text-white" />
              <Input
                placeholder="NOME, EMAIL, RA OU TURMA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 uppercase font-mono text-sm border-2 border-black dark:border-white rounded-none h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="relative w-full sm:w-[200px] space-y-1">
            <span className="text-xs font-bold uppercase text-gray-500">Tipo</span>
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-black dark:text-white pointer-events-none z-10" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full pl-10 border-2 border-black dark:border-white rounded-none h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950 font-bold uppercase text-xs focus:ring-0">
                  <SelectValue placeholder="TIPO DE USUÁRIO" />
                </SelectTrigger>
                <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <SelectItem value="all" className="uppercase font-bold text-xs">Todos</SelectItem>
                  <SelectItem value="Aluno" className="uppercase font-bold text-xs">Alunos</SelectItem>
                  <SelectItem value="Professor" className="uppercase font-bold text-xs">Professores</SelectItem>
                  <SelectItem value="Funcionário" className="uppercase font-bold text-xs">Funcionários</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {typeFilter === 'Aluno' && (
            <div className="relative w-full sm:w-[200px] space-y-1">
              <span className="text-xs font-bold uppercase text-gray-500">Turma</span>
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-5 w-5 text-black dark:text-white pointer-events-none z-10" />
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full pl-10 border-2 border-black dark:border-white rounded-none h-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-950 font-bold uppercase text-xs focus:ring-0">
                    <SelectValue placeholder="FILTRAR POR TURMA" />
                  </SelectTrigger>
                  <SelectContent className="border-2 border-black dark:border-white rounded-none bg-white dark:bg-zinc-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <SelectItem value="all" className="uppercase font-bold text-xs">Todas as Turmas</SelectItem>
                    {availableClasses.map(turma => (
                      <SelectItem key={turma} value={turma} className="uppercase font-bold text-xs">{turma}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t-2 border-black/10 dark:border-white/10">
          <div className="text-xs font-black uppercase text-gray-500">
            Resultados: {filteredUsers.length} Usuários
          </div>
        </div>
      </div>

      {/* Users table - ESTILO NEO-BRUTALISM */}
      <div className="border-4 border-black dark:border-white bg-white dark:bg-zinc-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] p-0 mb-8 overflow-hidden">
        <Table>
          <TableHeader className="bg-yellow-300 dark:bg-yellow-900/50 border-b-4 border-black dark:border-white">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white text-xs">Nome Completo</TableHead>
              <TableHead className="font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white text-xs">Email</TableHead>
              <TableHead className="font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white text-xs">Tipo</TableHead>
              <TableHead className="font-black text-black dark:text-white uppercase tracking-tight border-r-2 border-black dark:border-white text-xs">Detalhe</TableHead>
              {isAdmin && <TableHead className="font-black text-black dark:text-white uppercase tracking-tight text-center text-xs">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-b-2 border-black/10 dark:border-white/10 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors">
                  <TableCell className="font-medium font-mono text-xs py-3 align-middle border-r-2 border-black/10 dark:border-white/10 uppercase">{user.nome_completo}</TableCell>
                  <TableCell className="text-xs text-muted-foreground py-3 align-middle border-r-2 border-black/10 dark:border-white/10">{user.email}</TableCell>
                  <TableCell className="py-3 align-middle border-r-2 border-black/10 dark:border-white/10">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[10px] font-bold uppercase tracking-wider",
                      user.tipo === 'Aluno'
                        ? 'bg-green-200 text-green-900'
                        : user.tipo === 'Professor'
                          ? 'bg-blue-200 text-blue-900'
                          : 'bg-purple-200 text-purple-900'
                    )}>
                      {user.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs py-3 align-middle border-r-2 border-black/10 dark:border-white/10">
                    {user.tipo === 'Aluno' ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="font-bold text-xs">RA: {user.ra}</div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground bg-gray-100 dark:bg-zinc-800 px-1 border border-black dark:border-white w-fit">Turma: {user.turma}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-center py-3 align-middle">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white dark:bg-zinc-800"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(user)}
                          className="h-8 w-8 p-0 border-2 border-black dark:border-white rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-red-100 hover:bg-red-200 text-red-700 border-red-900"
                          disabled={isDeleting || !isAdmin}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 5 : 4}
                  className="h-32 text-center text-gray-500 font-mono uppercase"
                >
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="border-4 border-black dark:border-white rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white dark:bg-zinc-900 max-w-md">
          <AlertDialogHeader className="border-b-4 border-black dark:border-white pb-4 mb-4">
            <AlertDialogTitle className="font-black uppercase text-xl flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-black dark:text-white font-medium">
              Tem certeza que deseja excluir permanentemente o registro de <strong className="bg-yellow-300 px-1 border border-black text-black">{userToDelete?.nome_completo}</strong>?
              <br /><br />
              <span className="text-sm font-mono text-red-600 font-bold uppercase">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-white font-bold uppercase">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="border-2 border-black dark:border-white rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none bg-red-600 hover:bg-red-700 text-white font-bold uppercase"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <UserEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={userToEdit}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}