import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["/api/dashboard/ai-insights"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Analytics" subtitle="Relatórios e Análises" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="spending">Gastos</TabsTrigger>
              <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
              <TabsTrigger value="savings">Economia</TabsTrigger>
              <TabsTrigger value="trends">Tendências</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total de Gastos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      R$ {stats?.monthlySpending ? (stats.monthlySpending * 12).toLocaleString('pt-BR') : '0'}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Anual</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Economia Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      R$ {stats?.savings ? (stats.savings * 12).toLocaleString('pt-BR') : '0'}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Anual</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Fornecedores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.activeSuppliers || 0}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Ativos</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Eficiência</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">94.5%</div>
                    <p className="text-sm text-gray-500 mt-1">Aprovação</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Gastos Mensais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <span className="material-icons text-4xl text-gray-300 mb-2">trending_up</span>
                        <p className="text-gray-500">Gráfico de Tendência de Gastos</p>
                        <p className="text-sm text-gray-400 mt-1">Implementação com Chart.js</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <span className="material-icons text-4xl text-gray-300 mb-2">pie_chart</span>
                        <p className="text-gray-500">Gráfico de Pizza por Categoria</p>
                        <p className="text-sm text-gray-400 mt-1">Implementação com Chart.js</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span className="material-icons text-primary">auto_awesome</span>
                      <span>Insights de IA</span>
                    </CardTitle>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">OpenAI</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights && insights.length > 0 ? (
                      insights.map((insight: any, index: number) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start space-x-3">
                            <span className="material-icons text-primary mt-1">lightbulb</span>
                            <div>
                              <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                              <p className="text-sm text-gray-600">{insight.description}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 text-center py-8">
                        <span className="material-icons text-4xl text-gray-300 mb-2">auto_awesome</span>
                        <p className="text-gray-500">Gerando insights...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="spending" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Análise de Gastos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-icons text-4xl text-gray-300 mb-2">account_balance_wallet</span>
                      <p className="text-gray-500">Relatório Detalhado de Gastos</p>
                      <p className="text-sm text-gray-400 mt-1">Gráficos e tabelas interativas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suppliers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance de Fornecedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-icons text-4xl text-gray-300 mb-2">business</span>
                      <p className="text-gray-500">Análise de Performance de Fornecedores</p>
                      <p className="text-sm text-gray-400 mt-1">Scores, tempos de entrega e qualidade</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="savings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Economia Gerada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        R$ {stats?.savings ? (stats.savings * 12).toLocaleString('pt-BR') : '0'}
                      </div>
                      <p className="text-gray-500">Economia anual total</p>
                    </div>
                    <div className="space-y-4 mt-6">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Negociação de preços</span>
                        <span className="font-medium">R$ 45.200</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Consolidação de fornecedores</span>
                        <span className="font-medium">R$ 28.400</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Otimização de processos</span>
                        <span className="font-medium">R$ 15.800</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Oportunidades de Economia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                        <h4 className="font-medium text-green-900 mb-1">Material de Limpeza</h4>
                        <p className="text-sm text-green-700">Potencial de economia: R$ 3.200/mês</p>
                        <p className="text-xs text-green-600 mt-1">Consolidação de fornecedores</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                        <h4 className="font-medium text-blue-900 mb-1">Material de Escritório</h4>
                        <p className="text-sm text-blue-700">Potencial de economia: R$ 1.800/mês</p>
                        <p className="text-xs text-blue-600 mt-1">Compras em maior volume</p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                        <h4 className="font-medium text-yellow-900 mb-1">Serviços de TI</h4>
                        <p className="text-sm text-yellow-700">Potencial de economia: R$ 2.500/mês</p>
                        <p className="text-xs text-yellow-600 mt-1">Renegociação de contratos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendências de Mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="material-icons text-4xl text-gray-300 mb-2">trending_up</span>
                      <p className="text-gray-500">Análise de Tendências de Preços</p>
                      <p className="text-sm text-gray-400 mt-1">Previsões baseadas em IA</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
