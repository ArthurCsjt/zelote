
import { useState } from "react";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans, Loan } from "@/components/ActiveLoans";
import { toast } from "./ui/use-toast";

const Index = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [history, setHistory] = useState<Loan[]>([]);

  const handleNewLoan = (formData: {
    studentName: string;
    ra: string;
    chromebookId: string;
    purpose: string;
  }) => {
    const newLoan: Loan = {
      id: Math.random().toString(36).substring(7),
      ...formData,
      timestamp: new Date(),
    };
    setLoans([...loans, newLoan]);
  };

  const handleReturn = (loanId: string, returnData: { name: string; ra: string }) => {
    const loanToReturn = loans.find((loan) => loan.id === loanId);
    if (!loanToReturn) return;

    // Create return record
    const returnedLoan: Loan = {
      ...loanToReturn,
      returnRecord: {
        returnedBy: {
          name: returnData.name,
          ra: returnData.ra,
        },
        returnTime: new Date(),
      },
    };

    // Add to history
    setHistory([returnedLoan, ...history]);

    // Remove from active loans
    setLoans(loans.filter((loan) => loan.id !== loanId));

    // Show success message with details
    const returnedByDifferentStudent = 
      returnData.ra !== loanToReturn.ra || 
      returnData.name !== loanToReturn.studentName;

    toast({
      title: "Chromebook Devolvido",
      description: returnedByDifferentStudent
        ? `Devolvido por ${returnData.name} (RA: ${returnData.ra})`
        : "Devolvido pelo próprio aluno",
    });
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-blue-50 rounded-lg p-6 mb-8 text-center border border-blue-100">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Controle de Chromebooks
          </h1>
          <p className="text-blue-600">
            Escola - Sistema de Empréstimo
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <LoanForm onSubmit={handleNewLoan} />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <ActiveLoans loans={loans} onReturn={handleReturn} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
