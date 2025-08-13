import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function SupplierQuotationsSection() {
  const [selectedRequestId, setSelectedRequestId] = useState<string>("");
  const { toast } = useToast();

  // Fetch quotation requests
  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ['/api/quotation-requests'],
    enabled: true,
  });

  // Fetch supplier quotations for selected request
  const { data: quotations = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/quotation-requests', selectedRequestId, 'supplier-quotations'],
    enabled: !!selectedRequestId,
  });

  // Select quotation mutation
  const selectQuotationMutation = useMutation({
    mutationFn: async (quotationId: string) => {
      const response = await fetch(`/api/supplier-quotations/${quotationId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to select quotation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/quotation-requests'] });
      toast({ title: "Cotação selecionada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao selecionar cotação", variant: "destructive" });
    },
  });

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_cotacao': return 'bg-blue-100 text-blue-800';
      case 'aguardando_aprovacao': return 'bg-yellow-100 text-yellow-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const eligibleRequests = requests.filter((req: any) => 
    req.status === 'em_cotacao' || req.status === 'aguardando_aprovacao'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Cotações de Fornecedores</h2>
        <Select value={selectedRequestId} onValueChange={setSelectedRequestId}>
          <SelectTrigger className="w-80">
            <SelectValue placeholder="Selecione uma requisição" />
          </SelectTrigger>
          <SelectContent>
            {eligibleRequests.map((request: any) => (
              <SelectItem key={request.id} value={request.id}>
                {request.requestNumber} - {request.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedRequestId && (
        <>
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">Carregando cotações...</div>
              </CardContent>
            </Card>
          ) : quotations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <span className="material-icons text-4xl text-gray-300 mb-4">receipt_long</span>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma cotação encontrada</h3>
                <p className="text-gray-500 text-center">
                  Ainda não há cotações de fornecedores para esta requisição.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                {quotations.map((quotation: any) => (
                  <Card key={quotation.id} className={`${quotation.isSelected ? 'ring-2 ring-green-500' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Fornecedor: {quotation.supplier?.name || 'N/A'}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {quotation.isSelected && (
                            <Badge className="bg-green-100 text-green-800">
                              Selecionada
                            </Badge>
                          )}
                          <Badge className="bg-blue-100 text-blue-800">
                            {quotation.quotationNumber || 'Sem número'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Valor Total</label>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(quotation.totalAmount)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Prazo de Entrega</label>
                          <p className="text-sm">{quotation.deliveryTime ? `${quotation.deliveryTime} dias` : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Condições de Pagamento</label>
                          <p className="text-sm">{quotation.paymentTerms || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Válida até</label>
                          <p className="text-sm">
                            {quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('pt-BR') : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {quotation.observations && (
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-500">Observações</label>
                          <p className="text-sm text-gray-700">{quotation.observations}</p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        {!quotation.isSelected && (
                          <Button
                            onClick={() => selectQuotationMutation.mutate(quotation.id)}
                            disabled={selectQuotationMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {selectQuotationMutation.isPending ? 'Selecionando...' : 'Selecionar Cotação'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Comparison Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparação de Preços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {quotations.map((quotation: any, index: number) => {
                      const maxValue = Math.max(...quotations.map((q: any) => parseFloat(q.totalAmount)));
                      const percentage = (parseFloat(quotation.totalAmount) / maxValue) * 100;
                      
                      return (
                        <div key={quotation.id} className="flex items-center gap-4">
                          <div className="w-40 text-sm truncate">
                            {quotation.supplier?.name || `Fornecedor ${index + 1}`}
                          </div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                            <div
                              className={`h-6 rounded-full ${quotation.isSelected ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${percentage}%` }}
                            />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                              {formatCurrency(quotation.totalAmount)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}