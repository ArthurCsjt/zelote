
import { useState } from "react";
import { LoanForm } from "@/components/LoanForm";
import { ActiveLoans, Loan } from "@/components/ActiveLoans";

const Index = () => {
  const [loans, setLoans] = useState<Loan[]>([]);

  const handleNewLoan = (formData: {
    studentName: string;
    ra: string;
    chromebookId: string;
  }) => {
    const newLoan: Loan = {
      id: Math.random().toString(36).substring(7),
      ...formData,
      timestamp: new Date(),
    };
    setLoans([...loans, newLoan]);
  };

  const handleReturn = (loanId: string) => {
    setLoans(loans.filter((loan) => loan.id !== loanId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight fade-enter">
            Sistema de Empréstimo de Chromebooks
          </h1>
          <p className="text-muted-foreground fade-enter">
            Gerencie os empréstimos de Chromebooks para os alunos
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2">
          <LoanForm onSubmit={handleNewLoan} />
          <ActiveLoans loans={loans} onReturn={handleReturn} />
        </div>
      </div>
    </div>
  );
};

export default Index;
