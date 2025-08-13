import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-card border-b border-gray-200 dark:border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden text-gray-500 hover:text-gray-700">
            <span className="material-icons">menu</span>
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* AI Assistant Status */}
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">IA Ativa</span>
          </div>
          
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600">
            <span className="material-icons">notifications</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Quick Actions */}
          <Button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center space-x-2" data-testid="button-new-quotation">
            <span className="material-icons text-sm">add</span>
            <span>Nova Requisição</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
