
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface LoanFormData {
  studentName: string;
  ra?: string;
  email: string;
  chromebookId: string;
  purpose: string;
  userType: 'aluno' | 'professor' | 'funcionario';
}

interface LoanFormProps {
  onSubmit: (data: LoanFormData) => void;
}

export function LoanForm({ onSubmit }: LoanFormProps) {
  const [formData, setFormData] = useState<LoanFormData>({
    studentName: "",
    ra: "",
    email: "",
    chromebookId: "",
    purpose: "",
    userType: 'aluno'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.email || !formData.chromebookId || !formData.purpose) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }
    onSubmit(formData);
    setFormData({ studentName: "", ra: "", email: "", chromebookId: "", purpose: "", userType: 'aluno' });
    toast({
      title: "Sucesso",
      description: "Chromebook emprestado com sucesso",
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Novo Empréstimo
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="chromebookId" className="text-gray-700">
            ID do Chromebook
          </Label>
          <Input
            id="chromebookId"
            placeholder="Digite o ID do Chromebook"
            value={formData.chromebookId}
            onChange={(e) =>
              setFormData({ ...formData, chromebookId: e.target.value })
            }
            className="border-gray-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="userType" className="text-gray-700">
            Tipo de Solicitante
          </Label>
          <Select
            value={formData.userType}
            onValueChange={(value: 'aluno' | 'professor' | 'funcionario') =>
              setFormData({ ...formData, userType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de solicitante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aluno">Aluno</SelectItem>
              <SelectItem value="professor">Professor</SelectItem>
              <SelectItem value="funcionario">Funcionário</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentName" className="text-gray-700">
            Nome do Solicitante
          </Label>
          <Input
            id="studentName"
            placeholder="Digite o nome do solicitante"
            value={formData.studentName}
            onChange={(e) =>
              setFormData({ ...formData, studentName: e.target.value })
            }
            className="border-gray-200"
          />
        </div>

        {formData.userType === 'aluno' && (
          <div className="space-y-2">
            <Label htmlFor="ra" className="text-gray-700">
              RA do Aluno (opcional)
            </Label>
            <Input
              id="ra"
              placeholder="Digite o RA"
              value={formData.ra}
              onChange={(e) => setFormData({ ...formData, ra: e.target.value })}
              className="border-gray-200"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Digite o email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="border-gray-200"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose" className="text-gray-700">
            Finalidade
          </Label>
          <Input
            id="purpose"
            placeholder="Ex: Aula de Matemática"
            value={formData.purpose}
            onChange={(e) =>
              setFormData({ ...formData, purpose: e.target.value })
            }
            className="border-gray-200"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Emprestar Chromebook
        </Button>
      </form>
    </div>
  );
}
