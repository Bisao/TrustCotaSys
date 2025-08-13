import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-surface dark:bg-surface flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-icons text-white text-2xl">shopping_cart</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">TrustCota Sys</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">Sistema de Compras e Cotações</p>
            </div>
          </div>
          
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Sistema completo de compras e cotações com IA integrada para LP Administradora, 
            incluindo gestão de fornecedores, automação de processos e analytics avançados.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                <span className="material-icons text-primary">auto_awesome</span>
              </div>
              <CardTitle>IA Integrada</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Análise de mercado automatizada, detecção de anomalias de preços e insights inteligentes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-2">
                <span className="material-icons text-secondary">business</span>
              </div>
              <CardTitle>Gestão de Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sistema completo de scoring automático, histórico de performance e avaliação contínua.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-2">
                <span className="material-icons text-accent">compare</span>
              </div>
              <CardTitle>Cotações Inteligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Comparação automática, workflows configuráveis e aprovações em múltiplos níveis.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-2">
                <span className="material-icons text-purple-600">analytics</span>
              </div>
              <CardTitle>Analytics Avançados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Dashboard executivo, relatórios de economia e análise de tendências de mercado.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center mb-2">
                <span className="material-icons text-red-600">security</span>
              </div>
              <CardTitle>Segurança Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Controle de acesso baseado em roles, auditoria completa e conformidade garantida.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-2">
                <span className="material-icons text-indigo-600">automation</span>
              </div>
              <CardTitle>Automação Completa</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Comunicação automatizada, processamento de planilhas e workflows inteligentes.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-700">
            Pronto para revolucionar seus processos de compras?
          </p>
          <Button 
            onClick={handleLogin}
            size="lg" 
            className="bg-primary hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <span className="material-icons mr-2">login</span>
            Acessar Sistema
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            © 2024 LP Administradora. TrustCota Sys - Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
