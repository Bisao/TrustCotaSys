import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardInsight {
  type: string;
  title: string;
  description: string;
  priority?: string;
  actionable?: boolean;
}

export default function AiInsights() {
  const { data: insights = [], isLoading } = useQuery<DashboardInsight[]>({
    queryKey: ["/api/dashboard/ai-insights"],
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'lightbulb';
      case 'warning':
        return 'warning';
      case 'trend':
        return 'trending_up';
      case 'recommendation':
        return 'auto_awesome';
      default:
        return 'info';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'bg-green-50 text-secondary';
      case 'warning':
        return 'bg-yellow-50 text-accent';
      case 'trend':
        return 'bg-blue-50 text-primary';
      case 'recommendation':
        return 'bg-purple-50 text-purple-600';
      default:
        return 'bg-gray-50 text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-100">
        <CardHeader className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="material-icons text-primary">auto_awesome</span>
              <CardTitle className="text-lg font-semibold text-gray-900">Insights da IA</CardTitle>
            </div>
            <Badge variant="outline">OpenAI</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-5 h-5 bg-gray-200 rounded mt-0.5"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const defaultInsights = [
    {
      type: 'opportunity',
      title: 'Oportunidade de Economia',
      description: 'Consolidar fornecedores de material de limpeza pode gerar economia significativa'
    },
    {
      type: 'warning',
      title: 'Alerta de Preço',
      description: 'Detectada variação atípica nos preços de materiais elétricos'
    },
    {
      type: 'trend',
      title: 'Tendência de Mercado',
      description: 'Previsão de alta nos preços de materiais de construção nos próximos meses'
    }
  ];

  const displayInsights = Array.isArray(insights) && insights.length > 0 ? insights : defaultInsights;

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-100">
      <CardHeader className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="material-icons text-primary">auto_awesome</span>
            <CardTitle className="text-lg font-semibold text-gray-900">Insights da IA</CardTitle>
          </div>
          <Badge variant="outline" className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium">
            OpenAI
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {displayInsights.map((insight: DashboardInsight, index: number) => (
          <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${getInsightColor(insight.type)}`}>
            <span className={`material-icons text-sm mt-0.5`}>
              {getInsightIcon(insight.type)}
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900">{insight.title}</p>
              <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
