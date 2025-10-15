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
import { toast } from "./ui/use-toast";
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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true); // Carregamento inicial
  const [isDeleting, setIsDeleting] = useState(false); // Carregamento de exclusão
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  
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
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A edição de usuários será implementada em breve.",
    });
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    const tableName = userToDelete.tipo === 'Aluno' ? 'alunos' : 
                     userToDelete.tipo === 'Professor' ? 'professores' : 
                     'funcionarios';

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', userToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${userToDelete.tipo} ${userToDelete.nome_completo} excluído com sucesso.`,
      });
      
      // Atualiza o estado local
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));

    } catch (error: any) {
      console.error(`Erro ao excluir ${userToDelete.tipo}:`, error);
      toast({
        title: "Erro",
        description: `Falha ao excluir ${userToDelete.tipo}: ${error.message}`,
        variant: "destructive",
      });
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
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalStudents}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalTeachers}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalStaff}</div>
          </CardContent>
        </Card>
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
          Resultados: {filteredUsers.length}
        </div>
      </div>

      {/* Users table */}
      <Card className="glass-card">
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
            {filteredUsers.map((user) => (
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
            ))}
          </TableBody>
        </Table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        )}
      </Card>

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
    </div>
  );
}