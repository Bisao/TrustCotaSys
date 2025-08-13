import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const quickActions = [
  {
    title: "Upload Planilha",
    icon: "upload_file",
    color: "text-primary",
    hoverColor: "hover:border-primary hover:bg-blue-50",
    action: () => console.log("Upload planilha")
  },
  {
    title: "Novo Fornecedor",
    icon: "add_business",
    color: "text-secondary",
    hoverColor: "hover:border-secondary hover:bg-green-50",
    action: () => window.location.href = "/suppliers"
  },
  {
    title: "Comparar Preços",
    icon: "compare_arrows",
    color: "text-accent",
    hoverColor: "hover:border-accent hover:bg-orange-50",
    action: () => console.log("Comparar preços")
  },
  {
    title: "Relatório Mensal",
    icon: "assessment",
    color: "text-purple-600",
    hoverColor: "hover:border-purple-600 hover:bg-purple-50",
    action: () => window.location.href = "/analytics"
  }
];

export default function QuickActions() {
  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-100">
      <CardHeader className="p-6">
        <CardTitle className="text-lg font-semibold text-gray-900">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={action.action}
              className={`flex flex-col items-center p-4 h-auto border border-gray-200 rounded-lg transition-colors ${action.hoverColor}`}
            >
              <span className={`material-icons ${action.color} text-2xl mb-2`}>
                {action.icon}
              </span>
              <span className="text-sm font-medium text-gray-900">{action.title}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
