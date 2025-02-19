
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
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
    <Card className="glass-card w-full max-w-md mx-auto fade-enter">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">
          Novo Empréstimo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="studentName">Nome do Aluno</Label>
            <Input
              id="studentName"
              placeholder="Digite o nome do aluno"
              value={formData.studentName}
              onChange={(e) =>
                setFormData({ ...formData, studentName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ra">RA do Aluno</Label>
            <Input
              id="ra"
              placeholder="Digite o RA"
              value={formData.ra}
              onChange={(e) => setFormData({ ...formData, ra: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chromebookId">ID do Chromebook</Label>
            <Input
              id="chromebookId"
              placeholder="Digite o ID do Chromebook"
              value={formData.chromebookId}
              onChange={(e) =>
                setFormData({ ...formData, chromebookId: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Emprestar Chromebook
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
