
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { format } from "date-fns";
import { Loan } from "./ActiveLoans";
import { Badge } from "./ui/badge";

interface DashboardProps {
  activeLoans: Loan[];
  history: Loan[];
  onBack: () => void;
}

export function Dashboard({ activeLoans, history, onBack }: DashboardProps) {
  const totalChromebooks = 50; // This should come from your actual total
  const availableChromebooks = totalChromebooks - activeLoans.length;

  const pieData = [
    { name: "Em Uso", value: activeLoans.length },
    { name: "Disponíveis", value: availableChromebooks },
  ];

  const COLORS = ["#F97316", "#22C55E"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <Button variant="outline" onClick={onBack}>
          Voltar ao Menu
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status dos Chromebooks</CardTitle>
            <CardDescription>
              Total de {totalChromebooks} equipamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Empréstimos Ativos</CardTitle>
            <CardDescription>
              {activeLoans.length} Chromebooks em uso
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            {activeLoans.map((loan) => (
              <div
                key={loan.id}
                className="mb-3 p-3 bg-orange-50 border border-orange-100 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{loan.studentName}</p>
                    <p className="text-sm text-gray-600">ID: {loan.chromebookId}</p>
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    Pendente
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Retirada: {format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>
            Registro de retiradas e devoluções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((loan) => (
              <div
                key={loan.id}
                className="p-3 bg-gray-50 border border-gray-100 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{loan.studentName}</p>
                    <p className="text-sm text-gray-600">ID: {loan.chromebookId}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Devolvido
                  </Badge>
                </div>
                <div className="mt-2 text-sm space-y-1">
                  <p className="text-green-600">
                    Retirada: {format(loan.timestamp, "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                  {loan.returnRecord && (
                    <p className="text-orange-600">
                      Devolução: {format(loan.returnRecord.returnTime, "dd/MM/yyyy 'às' HH:mm")}
                      {loan.returnRecord.returnedBy.email !== loan.email && (
                        <span className="ml-2 text-gray-600">
                          (por {loan.returnRecord.returnedBy.name})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
