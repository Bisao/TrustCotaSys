import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const statsData = [
    {
      title: "Gastos Mensais",
      value: stats?.monthlySpending ? `R$ ${stats.monthlySpending.toLocaleString('pt-BR')}` : "R$ 0",
      change: "-5.2% vs mês anterior",
      changeType: "positive",
      icon: "trending_down",
      iconBg: "bg-blue-50",
      iconColor: "text-primary"
    },
    {
      title: "Cotações Ativas",
      value: stats?.activeQuotations?.toString() || "0",
      change: `${stats?.pendingApprovals || 0} aguardando aprovação`,
      changeType: "neutral",
      icon: "request_quote",
      iconBg: "bg-orange-50",
      iconColor: "text-accent"
    },
    {
      title: "Economia Gerada",
      value: stats?.savings ? `R$ ${stats.savings.toLocaleString('pt-BR')}` : "R$ 0",
      change: "+12.3% este mês",
      changeType: "positive",
      icon: "savings",
      iconBg: "bg-green-50",
      iconColor: "text-secondary"
    },
    {
      title: "Fornecedores Ativos",
      value: stats?.activeSuppliers?.toString() || "0",
      change: "Score médio: 4.2/5",
      changeType: "neutral",
      icon: "business",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <Card key={index} className="bg-white rounded-lg shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm mt-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <span className={`material-icons ${stat.iconColor}`}>{stat.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
