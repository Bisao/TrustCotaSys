import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import StatsCards from "@/components/dashboard/stats-cards";
import AiInsights from "@/components/dashboard/ai-insights";
import RecentQuotations from "@/components/dashboard/recent-quotations";
import PendingApprovals from "@/components/dashboard/pending-approvals";
import QuickActions from "@/components/dashboard/quick-actions";

export default function Dashboard() {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
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
        <Header title="Dashboard" subtitle="CCL Cajamar - Visão Geral" />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <StatsCards />

          {/* Charts and AI Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Spending Chart Placeholder */}
            <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-100 dark:border-border">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Gastos por Categoria</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <span className="material-icons">more_vert</span>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <span className="material-icons text-4xl text-gray-300 mb-2">bar_chart</span>
                    <p className="text-gray-500">Gráfico de Gastos por Categoria</p>
                    <p className="text-sm text-gray-400 mt-1">Implementação com Chart.js</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <AiInsights />
          </div>

          {/* Recent Activity and Pending Approvals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <RecentQuotations />
            </div>
            <PendingApprovals />
          </div>

          {/* Quick Actions */}
          <QuickActions />
        </main>
      </div>
    </div>
  );
}
