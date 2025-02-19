
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { Label } from "./ui/label";

interface LoanFormData {
  studentName: string;
  ra: string;
  chromebookId: string;
}

interface LoanFormProps {
  onSubmit: (data: LoanFormData) => void;
}

export function LoanForm({ onSubmit }: LoanFormProps) {
  const [formData, setFormData] = useState<LoanFormData>({
    studentName: "",
    ra: "",
    chromebookId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.ra || !formData.chromebookId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    onSubmit(formData);
    setFormData({ studentName: "", ra: "", chromebookId: "" });
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
          <Label htmlFor="studentName" className="text-gray-700">
            Nome do Aluno
          </Label>
          <Input
            id="studentName"
            placeholder="Digite o nome do aluno"
            value={formData.studentName}
            onChange={(e) =>
              setFormData({ ...formData, studentName: e.target.value })
            }
            className="border-gray-200"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ra" className="text-gray-700">
            RA do Aluno
          </Label>
          <Input
            id="ra"
            placeholder="Digite o RA"
            value={formData.ra}
            onChange={(e) => setFormData({ ...formData, ra: e.target.value })}
            className="border-gray-200"
          />
        </div>
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
