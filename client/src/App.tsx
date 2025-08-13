import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Suppliers from "@/pages/suppliers";
import Products from "@/pages/products";
import Quotations from "@/pages/quotations";
import Analytics from "@/pages/analytics";
import PurchaseOrders from "@/pages/purchase-orders";
import Settings from "@/pages/settings";
import Chat from "@/pages/chat";
import Audit from "@/pages/audit";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/suppliers" component={Suppliers} />
          <Route path="/products" component={Products} />
          <Route path="/quotations" component={Quotations} />
          <Route path="/purchase-orders" component={PurchaseOrders} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/chat" component={Chat} />
          <Route path="/audit" component={Audit} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="trustcota-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
