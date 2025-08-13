import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PendingApprovals() {
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["/api/dashboard/pending-approvals"],
  });

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critica':
        return 'bg-red-50 text-red-600';
      case 'alta':
        return 'bg-yellow-50 text-yellow-600';
      case 'normal':
        return 'bg-blue-50 text-blue-600';
      case 'baixa':
        return 'bg-green-50 text-green-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  const calculateDaysUntilExpiry = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 7) return "Vencido";
    if (diffDays >= 5) return "Vence em 2 dias";
    if (diffDays >= 2) return "Vence em 5 dias";
    return "Vence em 1 semana";
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-100">
        <CardHeader className="p-6 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900">Aprovações Pendentes</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-100">
      <CardHeader className="p-6 border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-gray-900">Aprovações Pendentes</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {approvals && approvals.length > 0 ? (
          <>
            {approvals.map((approval: any) => (
              <div key={approval.id} className={`flex items-center justify-between p-3 rounded-lg ${getUrgencyColor(approval.urgency)}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{approval.requestNumber}</p>
                  <p className="text-xs text-gray-500">
                    {approval.title} - R$ {approval.totalBudget ? Number(approval.totalBudget).toLocaleString('pt-BR') : '0'}
                  </p>
                  <p className="text-xs mt-1">
                    {calculateDaysUntilExpiry(approval.createdAt)}
                  </p>
                </div>
                <Link href={`/quotations?id=${approval.id}`}>
                  <a className="p-1 hover:opacity-80">
                    <span className="material-icons text-sm">arrow_forward</span>
                  </a>
                </Link>
              </div>
            ))}
            
            <Link href="/quotations?tab=approvals">
              <Button variant="outline" className="w-full mt-4 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-blue-50">
                Ver Todas as Aprovações
              </Button>
            </Link>
          </>
        ) : (
          <div className="text-center py-8">
            <span className="material-icons text-2xl text-gray-300 mb-2">approval</span>
            <p className="text-gray-500">Nenhuma aprovação pendente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
