
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Computer, Plus, QrCode } from "lucide-react";

interface LoanFormData {
  studentName: string;
  ra?: string;
  email: string;
  chromebookId: string;
  purpose: string;
  userType: 'aluno' | 'professor' | 'funcionario';
  loanType: 'individual' | 'lote';
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
    userType: 'aluno',
    loanType: 'individual'
  });

  const [batchDevices, setBatchDevices] = useState<string[]>([]);
  const [currentBatchInput, setCurrentBatchInput] = useState("");

  const addDeviceToBatch = () => {
    if (currentBatchInput.trim() && !batchDevices.includes(currentBatchInput.trim())) {
      setBatchDevices([...batchDevices, currentBatchInput.trim()]);
      setCurrentBatchInput("");
    }
  };

  const removeDeviceFromBatch = (deviceId: string) => {
    setBatchDevices(batchDevices.filter(id => id !== deviceId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.loanType === 'lote') {
      if (batchDevices.length === 0) {
        toast({
          title: "Erro",
          description: "Adicione pelo menos um dispositivo para empréstimo em lote",
          variant: "destructive",
        });
        return;
      }
      
      // Se for empréstimo em lote, processa cada dispositivo individualmente
      let processedCount = 0;
      
      batchDevices.forEach(deviceId => {
        const loanData = {
          ...formData,
          chromebookId: deviceId
        };
        
        if (!loanData.studentName || !loanData.email || !loanData.purpose) {
          toast({
            title: "Erro",
            description: "Por favor, preencha todos os campos obrigatórios",
            variant: "destructive",
          });
          return;
        }
        
        onSubmit(loanData);
        processedCount++;
      });
      
      if (processedCount > 0) {
        setBatchDevices([]);
        setCurrentBatchInput("");
        setFormData({ 
          studentName: "", 
          ra: "", 
          email: "", 
          chromebookId: "", 
          purpose: "", 
          userType: 'aluno',
          loanType: 'individual'
        });
        
        toast({
          title: "Sucesso",
          description: `${processedCount} Chromebooks emprestados com sucesso`,
        });
      }
      
    } else {
      // Empréstimo individual (lógica original)
      if (!formData.studentName || !formData.email || !formData.chromebookId || !formData.purpose) {
        toast({
          title: "Erro",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
      
      onSubmit(formData);
      setFormData({ 
        studentName: "", 
        ra: "", 
        email: "", 
        chromebookId: "", 
        purpose: "", 
        userType: 'aluno',
        loanType: 'individual'
      });
      
      toast({
        title: "Sucesso",
        description: "Chromebook emprestado com sucesso",
      });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Novo Empréstimo
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="loanType" className="text-gray-700">
            Tipo de Empréstimo
          </Label>
          <Select
            value={formData.loanType}
            onValueChange={(value: 'individual' | 'lote') =>
              setFormData({ ...formData, loanType: value })
            }
          >
            <SelectTrigger className="border-gray-200">
              <SelectValue placeholder="Selecione o tipo de empréstimo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Individual</SelectItem>
              <SelectItem value="lote">Em Lote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.loanType === 'individual' ? (
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
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="batchDevices" className="text-gray-700">
                Dispositivos em Lote
              </Label>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {batchDevices.length} dispositivos
              </Badge>
            </div>
            
            <div className="space-y-2">
              <div className="flex flex-col gap-2">
                <div className="relative w-full">
                  <Input
                    id="batchInput"
                    value={currentBatchInput}
                    onChange={(e) => setCurrentBatchInput(e.target.value)}
                    placeholder="Digite o ID do dispositivo"
                    className="border-gray-200 pr-16"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDeviceToBatch();
                      }
                    }}
                  />
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={addDeviceToBatch}
                    className="absolute right-1 top-1 h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="text-xs">Adicionar</span>
                  </Button>
                </div>
              </div>
              
              <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200 max-h-[150px] overflow-y-auto">
                {batchDevices.length > 0 ? (
                  <div className="space-y-2">
                    {batchDevices.map((device, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100">
                        <div className="flex items-center gap-2">
                          <Computer className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{device}</span>
                        </div>
                        <Button 
                          type="button"
                          variant="ghost"
                          onClick={() => removeDeviceFromBatch(device)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <Computer className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Nenhum dispositivo adicionado</p>
                  </div>
                )}
              </div>
              
              {batchDevices.length > 0 && (
                <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-green-700">Resumo do Empréstimo</h4>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Em Lote
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center bg-white p-3 rounded-md mb-2 border border-green-100">
                    <span className="text-2xl font-bold text-green-700 mr-2">{batchDevices.length}</span>
                    <span className="text-green-600">dispositivos para empréstimo</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
          {formData.loanType === 'lote' 
            ? `Emprestar ${batchDevices.length} Chromebooks` 
            : "Emprestar Chromebook"}
        </Button>
      </form>
    </div>
  );
}
