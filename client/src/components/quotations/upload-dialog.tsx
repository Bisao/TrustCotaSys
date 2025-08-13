import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

type UploadType = "requisitions" | "supplier-quotations";

interface UploadDialogProps {
  uploadType: UploadType;
  triggerButton?: React.ReactNode;
  onUploadComplete?: () => void;
}

export function UploadDialog({ uploadType, triggerButton, onUploadComplete }: UploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const endpoint = uploadType === "requisitions" 
        ? '/api/upload/quotation-spreadsheet'
        : '/api/upload/supplier-quotations';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      const entityType = uploadType === "requisitions" ? "requisições" : "cotações";
      const successMessage = `${data.created} ${entityType} criadas`;
      const warningMessage = data.skipped > 0 ? `, ${data.skipped} ignoradas` : '';
      const errorMessage = data.errors.length > 0 ? `. Erros: ${data.errors.join('; ')}` : '';
      
      toast({ 
        title: "Planilha processada!", 
        description: `${successMessage}${warningMessage}${errorMessage}`,
        variant: data.errors.length > 0 ? "destructive" : "default"
      });
      
      // Invalidate appropriate queries based on upload type
      if (uploadType === "requisitions") {
        queryClient.invalidateQueries({ queryKey: ['/api/quotation-requests'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/supplier-quotations'] });
      }
      
      setSelectedFile(null);
      setIsDialogOpen(false);
      onUploadComplete?.();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erro ao carregar planilha", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV.",
        variant: "destructive"
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const getTitle = () => {
    return uploadType === "requisitions" ? "Importar Requisições" : "Importar Cotações de Fornecedores";
  };

  const getDescription = () => {
    return uploadType === "requisitions" 
      ? "Faça upload de uma planilha com requisições de cotação"
      : "Faça upload de uma planilha com cotações enviadas pelos fornecedores";
  };

  const getFieldRequirements = () => {
    if (uploadType === "requisitions") {
      return (
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Título da Requisição (obrigatório)</li>
          <li>• Descrição</li>
          <li>• Departamento</li>
          <li>• Centro de Custo</li>
          <li>• Urgência (baixa, normal, alta, critica)</li>
          <li>• Orçamento Estimado</li>
        </ul>
      );
    } else {
      return (
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Fornecedor (obrigatório)</li>
          <li>• Requisição ID (obrigatório)</li>
          <li>• Produto/Serviço (obrigatório)</li>
          <li>• Quantidade</li>
          <li>• Preço Unitário</li>
          <li>• Preço Total</li>
          <li>• Prazo de Entrega (dias)</li>
          <li>• Condições de Pagamento</li>
          <li>• Observações</li>
        </ul>
      );
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
      <span className="material-icons mr-2 text-sm">upload</span>
      Importar Planilha
    </Button>
  );

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="material-icons">upload_file</span>
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600">{getDescription()}</p>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <span className="material-icons text-4xl text-gray-400">cloud_upload</span>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Arraste e solte sua planilha aqui
                </p>
                <p className="text-sm text-gray-500">
                  ou clique para selecionar
                </p>
              </div>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Selecionar Arquivo
              </Button>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="material-icons text-green-600">description</span>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remover
                </Button>
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <span className="material-icons mr-2 text-sm animate-spin">sync</span>
                      Carregando...
                    </>
                  ) : (
                    <>
                      <span className="material-icons mr-2 text-sm">upload</span>
                      Carregar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Formato da Planilha:</h4>
            {getFieldRequirements()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}