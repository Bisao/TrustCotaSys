import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertQuotationRequestSchema } from "@shared/schema";
import { z } from "zod";

const quotationFormSchema = insertQuotationRequestSchema.extend({
  title: z.string().min(1, "Título é obrigatório"),
  department: z.string().min(1, "Departamento é obrigatório"),
});

export default function Quotations() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");

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

  const form = useForm<z.infer<typeof quotationFormSchema>>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      title: "",
      description: "",
      department: "",
      costCenter: "",
      urgency: "normal",
      expectedDeliveryDate: undefined,
      totalBudget: undefined,
    },
  });

  const { data: quotationRequests, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["/api/quotation-requests"],
    enabled: isAuthenticated,
  });

  const createQuotationMutation = useMutation({
    mutationFn: async (quotationData: z.infer<typeof quotationFormSchema>) => {
      await apiRequest("POST", "/api/quotation-requests", quotationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-requests"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Requisição de cotação criada com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao criar requisição de cotação",
        variant: "destructive",
      });
    },
  });

  const approveQuotationMutation = useMutation({
    mutationFn: async ({ id, approvedAmount }: { id: string; approvedAmount: number }) => {
      await apiRequest("POST", `/api/quotation-requests/${id}/approve`, { approvedAmount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-requests"] });
      toast({
        title: "Sucesso",
        description: "Cotação aprovada com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao aprovar cotação",
        variant: "destructive",
      });
    },
  });

  const rejectQuotationMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
      await apiRequest("POST", `/api/quotation-requests/${id}/reject`, { rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotation-requests"] });
      toast({
        title: "Sucesso",
        description: "Cotação rejeitada com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao rejeitar cotação",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      'rascunho': { variant: 'outline' as const, label: 'Rascunho', className: 'bg-gray-100 text-gray-800' },
      'em_cotacao': { variant: 'secondary' as const, label: 'Em Cotação', className: 'bg-blue-100 text-blue-800' },
      'aguardando_aprovacao': { variant: 'outline' as const, label: 'Aguardando Aprovação', className: 'bg-yellow-100 text-yellow-800' },
      'aprovado': { variant: 'default' as const, label: 'Aprovado', className: 'bg-green-100 text-green-800' },
      'rejeitado': { variant: 'destructive' as const, label: 'Rejeitado', className: 'bg-red-100 text-red-800' },
      'cancelado': { variant: 'secondary' as const, label: 'Cancelado', className: 'bg-gray-100 text-gray-800' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.rascunho;
    
    return (
      <Badge variant={config.variant} className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const variants = {
      'baixa': { className: 'bg-green-100 text-green-800', label: 'Baixa' },
      'normal': { className: 'bg-blue-100 text-blue-800', label: 'Normal' },
      'alta': { className: 'bg-yellow-100 text-yellow-800', label: 'Alta' },
      'critica': { className: 'bg-red-100 text-red-800', label: 'Crítica' }
    };
    
    const config = variants[urgency as keyof typeof variants] || variants.normal;
    
    return (
      <Badge className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const filteredRequests = quotationRequests?.filter((request: any) =>
    request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.department?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const pendingApprovals = filteredRequests.filter((request: any) => request.status === 'aguardando_aprovacao');

  const onSubmit = (data: z.infer<typeof quotationFormSchema>) => {
    createQuotationMutation.mutate(data);
  };

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
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Cotações" subtitle="Gestão de Requisições e Cotações" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="requests">Requisições</TabsTrigger>
                <TabsTrigger value="quotations">Cotações</TabsTrigger>
                <TabsTrigger value="approvals">Aprovações</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Buscar cotações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-blue-700 text-white">
                      <span className="material-icons mr-2 text-sm">add</span>
                      Nova Requisição
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Requisição de Cotação</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título da Requisição *</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Departamento *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o departamento" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="compras">Compras</SelectItem>
                                    <SelectItem value="ti">TI</SelectItem>
                                    <SelectItem value="manutencao">Manutenção</SelectItem>
                                    <SelectItem value="limpeza">Limpeza</SelectItem>
                                    <SelectItem value="administrativo">Administrativo</SelectItem>
                                    <SelectItem value="financeiro">Financeiro</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="costCenter"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Centro de Custo</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="urgency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Urgência</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="baixa">Baixa</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="alta">Alta</SelectItem>
                                    <SelectItem value="critica">Crítica</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="totalBudget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Orçamento Estimado</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    step="0.01"
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            disabled={createQuotationMutation.isPending}
                            className="bg-primary hover:bg-blue-700 text-white"
                          >
                            {createQuotationMutation.isPending ? "Criando..." : "Criar Requisição"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <TabsContent value="requests" className="space-y-4">
              {isLoadingRequests ? (
                <div className="grid gap-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                          <div className="space-y-2">
                            <div className="h-6 bg-gray-200 rounded w-20"></div>
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <span className="material-icons text-4xl text-gray-300 mb-4">request_quote</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma requisição encontrada</h3>
                    <p className="text-gray-500 text-center mb-4">
                      {searchQuery ? "Nenhuma requisição corresponde à sua busca." : "Comece criando sua primeira requisição de cotação."}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setIsDialogOpen(true)}
                        className="bg-primary hover:bg-blue-700 text-white"
                      >
                        <span className="material-icons mr-2 text-sm">add</span>
                        Nova Requisição
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredRequests.map((request: any) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{request.requestNumber}</h3>
                              {getStatusBadge(request.status)}
                              {getUrgencyBadge(request.urgency)}
                            </div>
                            <p className="text-gray-900 font-medium mb-1">{request.title}</p>
                            <p className="text-sm text-gray-500 mb-2">{request.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Departamento: {request.department}</span>
                              {request.totalBudget && (
                                <span>Orçamento: R$ {Number(request.totalBudget).toLocaleString('pt-BR')}</span>
                              )}
                              <span>Criado em: {new Date(request.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            {request.status === 'aguardando_aprovacao' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveQuotationMutation.mutate({ 
                                    id: request.id, 
                                    approvedAmount: request.totalBudget || 0 
                                  })}
                                  disabled={approveQuotationMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <span className="material-icons mr-1 text-sm">check</span>
                                  Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectQuotationMutation.mutate({ 
                                    id: request.id, 
                                    rejectionReason: "Requisição rejeitada" 
                                  })}
                                  disabled={rejectQuotationMutation.isPending}
                                  className="border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <span className="material-icons mr-1 text-sm">close</span>
                                  Rejeitar
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost">
                              <span className="material-icons text-sm">visibility</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="quotations" className="space-y-4">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <span className="material-icons text-4xl text-gray-300 mb-4">compare</span>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Cotações de Fornecedores</h3>
                  <p className="text-gray-500 text-center">
                    Visualize e compare as cotações recebidas dos fornecedores.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-4">
              {pendingApprovals.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <span className="material-icons text-4xl text-gray-300 mb-4">approval</span>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma aprovação pendente</h3>
                    <p className="text-gray-500 text-center">
                      Todas as requisições foram processadas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {pendingApprovals.map((request: any) => (
                    <Card key={request.id} className="border-l-4 border-l-yellow-400">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{request.requestNumber}</h3>
                              {getUrgencyBadge(request.urgency)}
                            </div>
                            <p className="text-gray-900 font-medium mb-1">{request.title}</p>
                            <p className="text-sm text-gray-500 mb-2">{request.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Departamento: {request.department}</span>
                              {request.totalBudget && (
                                <span>Valor: R$ {Number(request.totalBudget).toLocaleString('pt-BR')}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => approveQuotationMutation.mutate({ 
                                id: request.id, 
                                approvedAmount: request.totalBudget || 0 
                              })}
                              disabled={approveQuotationMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <span className="material-icons mr-2 text-sm">check</span>
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => rejectQuotationMutation.mutate({ 
                                id: request.id, 
                                rejectionReason: "Requisição rejeitada" 
                              })}
                              disabled={rejectQuotationMutation.isPending}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <span className="material-icons mr-2 text-sm">close</span>
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
