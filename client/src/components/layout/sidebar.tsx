import { Link, useLocation } from "wouter";

const navigationItems = [
  {
    label: "Fornecedores",
    icon: "business",
    path: "/suppliers",
    section: "gestao"
  },
  {
    label: "Produtos",
    icon: "inventory_2",
    path: "/products",
    section: "gestao"
  },
  {
    label: "Requisições",
    icon: "request_quote",
    path: "/quotations",
    section: "cotacoes"
  },
  {
    label: "Cotações",
    icon: "compare",
    path: "/quotations?tab=quotations",
    section: "cotacoes"
  },
  {
    label: "Aprovações",
    icon: "approval",
    path: "/quotations?tab=approvals",
    section: "cotacoes"
  },
  {
    label: "Ordens de Compra",
    icon: "shopping_cart",
    path: "/purchase-orders",
    section: "cotacoes"
  },
  {
    label: "Relatórios",
    icon: "analytics",
    path: "/analytics",
    section: "analytics"
  },
  {
    label: "Economia",
    icon: "savings",
    path: "/analytics?tab=savings",
    section: "analytics"
  },
  {
    label: "Chat Interno",
    icon: "chat",
    path: "/chat",
    section: "sistema"
  },
  {
    label: "Auditoria",
    icon: "history",
    path: "/audit",
    section: "sistema"
  },
  {
    label: "Configurações",
    icon: "settings",
    path: "/settings",
    section: "sistema"
  }
];

const sectionLabels = {
  gestao: "Gestão",
  cotacoes: "Cotações",
  analytics: "Analytics",
  sistema: "Sistema"
};

export default function Sidebar() {
  const [location] = useLocation();

  const isActiveLink = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path.split("?")[0]);
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigationItems>);

  return (
    <aside className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white dark:bg-sidebar border-r border-gray-200 dark:border-sidebar-border">
        {/* Logo Header */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-icons text-white text-lg">shopping_cart</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">TrustCota</h1>
              <p className="text-xs text-gray-500">Sistema de Compras</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {/* Dashboard Link */}
          <Link href="/" className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
              isActiveLink("/") && location === "/"
                ? "text-primary bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}>
              <span className="material-icons mr-3 text-sm">dashboard</span>
              Dashboard
          </Link>

          {/* Grouped Navigation Items */}
          {Object.entries(groupedItems).map(([section, items]) => (
            <div key={section}>
              <div className="pt-4 pb-2">
                <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {sectionLabels[section as keyof typeof sectionLabels]}
                </p>
              </div>
              
              {items.map((item) => (
                <Link key={item.path} href={item.path} className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                    isActiveLink(item.path)
                      ? "text-primary bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}>
                    <span className="material-icons mr-3 text-sm">{item.icon}</span>
                    {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="material-icons text-gray-600 text-sm">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Usuário do Sistema</p>
              <p className="text-xs text-gray-500">Cotador</p>
            </div>
            <button 
              onClick={() => window.location.href = "/api/logout"}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="material-icons text-sm">logout</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
