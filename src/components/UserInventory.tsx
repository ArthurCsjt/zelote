import { useState, useEffect, useCallback, useMemo } from "react";
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
import { toast } from "./ui/use-toast";
import { Search, Filter, Edit3, Trash2, Users, GraduationCap, UserCheck, Briefcase, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "./ui/pagination";
import { useProfileRole } from "@/hooks/use-profile-role";
import { supabase } from "@/integrations/supabase/client";
import { useDatabase } from "@/hooks/useDatabase"; // Importando useDatabase
import { UserEditDialog } from "./UserEditDialog"; // Importando o novo diálogo
import { GlassCard } from "./ui/GlassCard"; // Importando GlassCard

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
  
  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
        throw new Error('Erro ao carregar usuários');
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
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    filtered = filtered.filter((user) => {
      const matchesSearch = 
        user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.ra && user.ra.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.turma && user.turma.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || user.tipo === typeFilter;
      const matchesClass = classFilter === 'all' || user.turma === classFilter;

      return matchesSearch && matchesType && matchesClass;
    });
    
    // Resetar página para 1 se o filtro mudar
    setCurrentPage(1);

    return filtered;
  }, [users, searchTerm, typeFilter, classFilter]);
  
  // Lógica de Paginação
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Get statistics
  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.tipo === 'Aluno').length;
  const totalTeachers = users.filter(u => u.tipo === 'Professor').length;
  const totalStaff = users.filter(u => u.tipo === 'Funcionário').length;

  const handleEdit = (user: User) => {
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };
  
  const handleEditSuccess = () => {
    // Recarrega a lista de usuários após a edição bem-sucedida
    fetchUsers();
  };

  const handleDeleteClick = (user: User) => {
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
  
  // Função para renderizar os botões de página (apenas 5 visíveis)
  const renderPageButtons = () => {
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const buttons = [];
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return buttons;
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
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStudents}</div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalTeachers}</div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalStaff}</div>
          </CardContent>
        </GlassCard>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nome, email, RA ou turma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] pl-10">
              <SelectValue placeholder="Tipo de usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Aluno">Alunos</SelectItem>
              <SelectItem value="Professor">Professores</SelectItem>
              <SelectItem value="Funcionário">Funcionários</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {typeFilter === 'Aluno' && (
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[180px] pl-10">
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                {availableClasses.map(turma => (
                  <SelectItem key={turma} value={turma}>{turma}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="text-sm text-gray-500 flex items-center">
          Resultados: {totalItems}
        </div>
      </div>

      {/* Users table */}
      <GlassCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Detalhe</TableHead>
              {isAdmin && <TableHead>Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.nome_completo}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.tipo === 'Aluno' 
                        ? 'bg-green-100 text-green-800' 
                        : user.tipo === 'Professor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {user.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {user.tipo === 'Aluno' ? (
                      <div>
                        <div>RA: {user.ra}</div>
                        <div className="text-xs text-muted-foreground">Turma: {user.turma}</div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(user)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={isDeleting} // Usando o estado de exclusão
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
                <TableCell colSpan={isAdmin ? 5 : 4} className="h-32 text-center text-gray-500">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </GlassCard>
      
      {/* Paginação e Itens por Página */}
      {totalPages > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          {/* Items Per Page Selector */}
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Itens por página:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pagination Controls */}
          <Pagination className="mx-0">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>

              {/* Renderizar botões de página */}
              {renderPageButtons()}

              <PaginationItem>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          
          {/* Page Info */}
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de {userToDelete?.tipo}</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o registro de <strong>{userToDelete?.nome_completo}</strong> ({userToDelete?.email})? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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