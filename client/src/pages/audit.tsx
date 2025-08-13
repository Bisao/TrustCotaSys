import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function Audit() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs"],
  });

  const filteredLogs = auditLogs.filter((log: AuditLog) => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entityType === entityFilter;
    
    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      case 'approve': return 'bg-purple-100 text-purple-800';
      case 'reject': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create': return 'Criado';
      case 'update': return 'Atualizado';
      case 'delete': return 'Excluído';
      case 'approve': return 'Aprovado';
      case 'reject': return 'Rejeitado';
      default: return action;
    }
  };

  const getEntityLabel = (entityType: string) => {
    switch (entityType) {
      case 'quotation': return 'Cotação';
      case 'supplier': return 'Fornecedor';
      case 'product': return 'Produto';
      case 'purchase_order': return 'Ordem de Compra';
      case 'user': return 'Usuário';
      default: return entityType;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Auditoria" subtitle="Registro de atividades do sistema" />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="material-icons">history</span>
                  <span>Log de Auditoria</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Buscar por ação, entidade ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-audit"
                  />
                  
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      <SelectItem value="create">Criação</SelectItem>
                      <SelectItem value="update">Atualização</SelectItem>
                      <SelectItem value="delete">Exclusão</SelectItem>
                      <SelectItem value="approve">Aprovação</SelectItem>
                      <SelectItem value="reject">Rejeição</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={entityFilter} onValueChange={setEntityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por entidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as entidades</SelectItem>
                      <SelectItem value="quotation">Cotações</SelectItem>
                      <SelectItem value="supplier">Fornecedores</SelectItem>
                      <SelectItem value="product">Produtos</SelectItem>
                      <SelectItem value="purchase_order">Ordens de Compra</SelectItem>
                      <SelectItem value="user">Usuários</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={() => {
                    setSearchTerm("");
                    setActionFilter("all");
                    setEntityFilter("all");
                  }}>
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Audit Table */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center">
                    <div className="w-8 h-8 bg-primary rounded-full animate-pulse mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando logs...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>ID da Entidade</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Nenhum log encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log: AuditLog) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {new Date(log.createdAt).toLocaleString('pt-BR')}
                            </TableCell>
                            <TableCell>{log.userId || 'Sistema'}</TableCell>
                            <TableCell>
                              <Badge className={getActionColor(log.action)}>
                                {getActionLabel(log.action)}
                              </Badge>
                            </TableCell>
                            <TableCell>{getEntityLabel(log.entityType)}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {log.entityId.slice(0, 8)}...
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.ipAddress || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {log.changes ? (
                                <details className="cursor-pointer">
                                  <summary className="text-blue-600 hover:text-blue-800">
                                    Ver alterações
                                  </summary>
                                  <pre className="text-xs mt-2 p-2 bg-gray-50 rounded max-w-xs overflow-auto">
                                    {JSON.stringify(log.changes, null, 2)}
                                  </pre>
                                </details>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {filteredLogs.length}
                    </div>
                    <p className="text-sm text-muted-foreground">Total de Logs</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {filteredLogs.filter((log: AuditLog) => log.action === 'create').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Criações</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {filteredLogs.filter((log: AuditLog) => log.action === 'update').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Atualizações</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {filteredLogs.filter((log: AuditLog) => log.action === 'delete').length}
                    </div>
                    <p className="text-sm text-muted-foreground">Exclusões</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}