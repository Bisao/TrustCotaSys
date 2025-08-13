import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { purchaseOrders } from "@shared/schema";
import { like, desc } from "drizzle-orm";
import { insertSupplierSchema, insertProductSchema, insertCategorySchema, insertQuotationRequestSchema, insertSupplierQuotationSchema } from "@shared/schema";
import { openaiService } from "./services/openai";
import { emailService } from "./services/email";
import { requireAdmin, requireApprover, requireQuotationProcessor, requireRequester, requireOwnershipOrRole } from "./middleware/rbac";
import multer from "multer";
import * as XLSX from "xlsx";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
  });

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/recent-quotations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quotations = await storage.getRecentQuotations(userId, 5);
      res.json(quotations);
    } catch (error) {
      console.error("Error fetching recent quotations:", error);
      res.status(500).json({ message: "Failed to fetch recent quotations" });
    }
  });

  app.get('/api/dashboard/pending-approvals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const approvals = await storage.getPendingApprovals(userId, 5);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  app.get('/api/dashboard/ai-insights', isAuthenticated, async (req, res) => {
    try {
      const insights = await openaiService.generateDashboardInsights();
      res.json(insights);
    } catch (error) {
      console.error("Error generating AI insights:", error);
      res.status(500).json({ message: "Failed to generate AI insights" });
    }
  });

  // Supplier routes (Admin and Quotation Processors can manage suppliers)
  app.get('/api/suppliers', isAuthenticated, requireQuotationProcessor, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get('/api/suppliers/:id', isAuthenticated, requireQuotationProcessor, async (req, res) => {
    try {
      const supplier = await storage.getSupplier(req.params.id);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({ message: "Failed to fetch supplier" });
    }
  });

  app.post('/api/suppliers', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'create',
        entityType: 'supplier',
        entityId: supplier.id,
        changes: validatedData,
      });

      res.status(201).json(supplier);
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(400).json({ message: "Failed to create supplier" });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'update',
        entityType: 'supplier',
        entityId: req.params.id,
        changes: validatedData,
      });

      res.json(supplier);
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(400).json({ message: "Failed to update supplier" });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteSupplier(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'delete',
        entityType: 'supplier',
        entityId: req.params.id,
        changes: {},
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  app.get('/api/suppliers/search/:query', isAuthenticated, requireQuotationProcessor, async (req, res) => {
    try {
      const suppliers = await storage.searchSuppliers(req.params.query);
      res.json(suppliers);
    } catch (error) {
      console.error("Error searching suppliers:", error);
      res.status(500).json({ message: "Failed to search suppliers" });
    }
  });

  // Product routes (Admin can manage, others can view)
  app.get('/api/products', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', isAuthenticated, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'create',
        entityType: 'product',
        entityId: product.id,
        changes: validatedData,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(400).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'update',
        entityType: 'product',
        entityId: req.params.id,
        changes: validatedData,
      });

      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'delete',
        entityType: 'product',
        entityId: req.params.id,
        changes: {},
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.get('/api/products/search/:query', isAuthenticated, async (req, res) => {
    try {
      const products = await storage.searchProducts(req.params.query);
      res.json(products);
    } catch (error) {
      console.error("Error searching products:", error);
      res.status(500).json({ message: "Failed to search products" });
    }
  });

  // Category routes
  app.get('/api/categories', isAuthenticated, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, requireAdmin, async (req: any, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'create',
        entityType: 'category',
        entityId: category.id,
        changes: validatedData,
      });

      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Failed to create category" });
    }
  });

  // Quotation Request routes (Requesters can create, others can view based on role)
  app.get('/api/quotation-requests', isAuthenticated, async (req, res) => {
    try {
      const requests = await storage.getQuotationRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching quotation requests:", error);
      res.status(500).json({ message: "Failed to fetch quotation requests" });
    }
  });

  app.get('/api/quotation-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const request = await storage.getQuotationRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ message: "Quotation request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching quotation request:", error);
      res.status(500).json({ message: "Failed to fetch quotation request" });
    }
  });

  app.post('/api/quotation-requests', isAuthenticated, requireRequester, async (req: any, res) => {
    try {
      const validatedData = insertQuotationRequestSchema.parse({
        ...req.body,
        requesterId: req.user.claims.sub,
      });
      const request = await storage.createQuotationRequest(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'create',
        entityType: 'quotation_request',
        entityId: request.id,
        changes: validatedData,
      });

      // Generate AI analysis for the request
      try {
        const analysis = await openaiService.analyzeQuotationRequest(request);
        await storage.createAiAnalysis({
          type: 'quotation_analysis',
          entityType: 'quotation_request',
          entityId: request.id,
          analysis,
          confidence: "0.85",
        });
      } catch (aiError) {
        console.error("Error generating AI analysis:", aiError);
      }

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating quotation request:", error);
      res.status(400).json({ message: "Failed to create quotation request" });
    }
  });

  app.put('/api/quotation-requests/:id', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertQuotationRequestSchema.partial().parse(req.body);
      const request = await storage.updateQuotationRequest(req.params.id, validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'update',
        entityType: 'quotation_request',
        entityId: req.params.id,
        changes: validatedData,
      });

      res.json(request);
    } catch (error) {
      console.error("Error updating quotation request:", error);
      res.status(400).json({ message: "Failed to update quotation request" });
    }
  });

  app.post('/api/quotation-requests/:id/approve', isAuthenticated, requireApprover, async (req: any, res) => {
    try {
      const { approvedAmount } = req.body;
      const request = await storage.updateQuotationRequest(req.params.id, {
        status: 'aprovado',
        approverId: req.user.claims.sub,
        approvedAmount,
        approvedAt: new Date(),
      });
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'approve',
        entityType: 'quotation_request',
        entityId: req.params.id,
        changes: { status: 'aprovado', approvedAmount },
      });

      // Send notification email
      try {
        await emailService.sendApprovalNotification(request);
      } catch (emailError) {
        console.error("Error sending approval notification:", emailError);
      }

      res.json(request);
    } catch (error) {
      console.error("Error approving quotation request:", error);
      res.status(500).json({ message: "Failed to approve quotation request" });
    }
  });

  app.post('/api/quotation-requests/:id/reject', isAuthenticated, requireApprover, async (req: any, res) => {
    try {
      const { rejectionReason } = req.body;
      const request = await storage.updateQuotationRequest(req.params.id, {
        status: 'rejeitado',
        approverId: req.user.claims.sub,
        notes: rejectionReason,
      });
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'reject',
        entityType: 'quotation_request',
        entityId: req.params.id,
        changes: { status: 'rejeitado', rejectionReason },
      });

      res.json(request);
    } catch (error) {
      console.error("Error rejecting quotation request:", error);
      res.status(500).json({ message: "Failed to reject quotation request" });
    }
  });

  // Supplier Quotation routes (Quotation processors can manage supplier quotations)
  app.get('/api/quotation-requests/:id/supplier-quotations', isAuthenticated, requireQuotationProcessor, async (req, res) => {
    try {
      const quotations = await storage.getSupplierQuotations(req.params.id);
      res.json(quotations);
    } catch (error) {
      console.error("Error fetching supplier quotations:", error);
      res.status(500).json({ message: "Failed to fetch supplier quotations" });
    }
  });

  app.post('/api/quotation-requests/:id/supplier-quotations', isAuthenticated, requireQuotationProcessor, async (req: any, res) => {
    try {
      const validatedData = insertSupplierQuotationSchema.parse({
        ...req.body,
        quotationRequestId: req.params.id,
      });
      const quotation = await storage.createSupplierQuotation(validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'create',
        entityType: 'supplier_quotation',
        entityId: quotation.id,
        changes: validatedData,
      });

      // Update quotation request status to "em_cotacao" if it's still in draft
      const request = await storage.getQuotationRequest(req.params.id);
      if (request && request.status === 'rascunho') {
        await storage.updateQuotationRequest(req.params.id, { status: 'em_cotacao' });
      }

      // Send notification to other suppliers if this is the first quotation
      try {
        const allQuotations = await storage.getSupplierQuotations(req.params.id);
        if (allQuotations.length === 1 && request) {
          const allSuppliers = await storage.getSuppliers();
          const selectedSuppliers = allSuppliers.filter(s => s.status === 'ativo').slice(0, 5);
          await emailService.sendQuotationRequestNotification(selectedSuppliers, request);
        }
      } catch (emailError) {
        console.error("Error sending quotation notifications:", emailError);
      }

      res.status(201).json(quotation);
    } catch (error) {
      console.error("Error creating supplier quotation:", error);
      res.status(400).json({ message: "Failed to create supplier quotation" });
    }
  });

  app.put('/api/supplier-quotations/:id', isAuthenticated, requireQuotationProcessor, async (req: any, res) => {
    try {
      const validatedData = insertSupplierQuotationSchema.partial().parse(req.body);
      const quotation = await storage.updateSupplierQuotation(req.params.id, validatedData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'update',
        entityType: 'supplier_quotation',
        entityId: req.params.id,
        changes: validatedData,
      });

      res.json(quotation);
    } catch (error) {
      console.error("Error updating supplier quotation:", error);
      res.status(400).json({ message: "Failed to update supplier quotation" });
    }
  });

  app.post('/api/supplier-quotations/:id/select', isAuthenticated, requireQuotationProcessor, async (req: any, res) => {
    try {
      const quotation = await storage.getSupplierQuotation(req.params.id);
      if (!quotation) {
        return res.status(404).json({ message: "Supplier quotation not found" });
      }

      // Unselect all other quotations for this request
      const allQuotations = await storage.getSupplierQuotations(quotation.quotationRequestId);
      for (const q of allQuotations) {
        if (q.id !== req.params.id) {
          await storage.updateSupplierQuotation(q.id, { isSelected: false });
        }
      }

      // Select this quotation
      const selectedQuotation = await storage.updateSupplierQuotation(req.params.id, { isSelected: true });

      // Update quotation request status to "aguardando_aprovacao"
      await storage.updateQuotationRequest(quotation.quotationRequestId, { 
        status: 'aguardando_aprovacao',
        totalBudget: quotation.totalAmount 
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'select',
        entityType: 'supplier_quotation',
        entityId: req.params.id,
        changes: { isSelected: true },
      });

      res.json(selectedQuotation);
    } catch (error) {
      console.error("Error selecting supplier quotation:", error);
      res.status(500).json({ message: "Failed to select supplier quotation" });
    }
  });

  // Purchase Order routes (Generated after approval)
  app.get('/api/purchase-orders', isAuthenticated, async (req, res) => {
    try {
      const orders = await storage.getPurchaseOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      res.status(500).json({ message: "Failed to fetch purchase orders" });
    }
  });

  app.get('/api/purchase-orders/:id', isAuthenticated, async (req, res) => {
    try {
      const order = await storage.getPurchaseOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Purchase order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching purchase order:", error);
      res.status(500).json({ message: "Failed to fetch purchase order" });
    }
  });

  app.post('/api/quotation-requests/:id/generate-purchase-order', isAuthenticated, requireApprover, async (req: any, res) => {
    try {
      const request = await storage.getQuotationRequest(req.params.id);
      if (!request || request.status !== 'aprovado') {
        return res.status(400).json({ message: "Quotation request must be approved first" });
      }

      // Find the selected supplier quotation
      const quotations = await storage.getSupplierQuotations(req.params.id);
      const selectedQuotation = quotations.find(q => q.isSelected);
      
      if (!selectedQuotation) {
        return res.status(400).json({ message: "No supplier quotation selected" });
      }

      const purchaseOrder = await storage.createPurchaseOrder({
        quotationRequestId: req.params.id,
        supplierId: selectedQuotation.supplierId,
        totalAmount: selectedQuotation.totalAmount,
        deliveryAddress: req.body.deliveryAddress,
        expectedDeliveryDate: selectedQuotation.deliveryTime 
          ? new Date(Date.now() + selectedQuotation.deliveryTime * 24 * 60 * 60 * 1000)
          : null,
        status: 'pendente',
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'create',
        entityType: 'purchase_order',
        entityId: purchaseOrder.id,
        changes: { orderNumber: purchaseOrder.orderNumber, supplierId: selectedQuotation.supplierId },
      });

      res.status(201).json(purchaseOrder);
    } catch (error) {
      console.error("Error generating purchase order:", error);
      res.status(500).json({ message: "Failed to generate purchase order" });
    }
  });

  // Audit log routes (Admin and Approvers can view audit logs)
  app.get('/api/audit-logs', isAuthenticated, requireApprover, async (req, res) => {
    try {
      const { entityId } = req.query;
      const logs = await storage.getAuditLogs(entityId as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // File upload routes
  app.post('/api/upload/quotation-spreadsheet', isAuthenticated, requireRequester, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const buffer = req.file.buffer;
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Try different parsing strategies for malformed spreadsheets
      let jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // If we only have __EMPTY columns, try parsing without headers
      const hasOnlyEmptyColumns = jsonData.length > 0 && 
        Object.keys(jsonData[0] as any).every(key => key.includes('__EMPTY') || key.includes('Material de limpeza'));
      
      if (hasOnlyEmptyColumns) {
        console.log("Detected malformed spreadsheet, trying alternative parsing...");
        jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert array format to object format with proper headers
        const convertedData = [];
        for (let i = 1; i < jsonData.length; i++) { // Skip first row if it's headers
          const row = jsonData[i] as any[];
          if (row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
            convertedData.push({
              'Título da Requisição': row[0] || row[1] || row[2], // Try first non-empty cell
              'Descrição': row[1] || row[2] || row[3],
              'Departamento': 'Material de limpeza - CCL Cajamar', // From the header
              'Quantidade': row[3] || row[4],
              'Valor': row[4] || row[5] || row[6]
            });
          }
        }
        jsonData = convertedData;
      }

      // Log available columns for debugging
      console.log("Available columns in spreadsheet:", jsonData.length > 0 ? Object.keys(jsonData[0] as any) : 'No data');
      console.log("First 3 rows sample:", jsonData.slice(0, 3));

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          // Mapear diferentes variações de nomes de colunas
          const getColumnValue = (possibleNames: string[]) => {
            for (const name of possibleNames) {
              if ((row as any)[name] !== undefined && (row as any)[name] !== null && (row as any)[name] !== '') {
                return (row as any)[name];
              }
            }
            return undefined;
          };

          const quotationData = {
            title: getColumnValue([
              'Título da Requisição', 'Titulo da Requisição', 'Título', 'Titulo', 
              'título', 'titulo', 'Title', 'Nome', 'Descrição do Item', 'Item',
              // Handle cases where title might be in column key itself
              'Material de limpeza - CCL Cajamar'
            ]) || (Object.keys(row as any).find(key => 
              key.includes('Material de limpeza') && (row as any)[key] && (row as any)[key].toString().trim()
            ) ? (row as any)[Object.keys(row as any).find(key => key.includes('Material de limpeza')) || ''] : undefined),
            description: getColumnValue([
              'Descrição', 'Descricao', 'Description', 'Detalhes', 'Observações', 'Quantidade'
            ]),
            department: getColumnValue([
              'Departamento', 'Department', 'Setor', 'Area', 'Área'
            ]) || 'Material de limpeza - CCL Cajamar', // Use the detected department from header
            costCenter: getColumnValue([
              'Centro de Custo', 'Centro Custo', 'Cost Center', 'CC'
            ]) || 'CCL Cajamar',
            urgency: getColumnValue([
              'Urgência', 'Urgencia', 'Prioridade', 'Priority'
            ]) || 'normal',
            totalBudget: getColumnValue([
              'Orçamento Estimado', 'Orcamento', 'Budget', 'Valor', 'Preço', 'Price'
            ]),
            requesterId: req.user.claims.sub,
            status: 'rascunho' as const,
          };

          // Debug log for troubleshooting (only first 3 rows to avoid spam)
          if (i < 3) {
            console.log(`Row ${i + 1} data:`, {
              title: quotationData.title,
              department: quotationData.department,
              allKeys: Object.keys(row as any),
              rawRow: row
            });
          }

          // Skip header/metadata rows
          const title = quotationData.title?.toString().trim() || '';
          if (!title || title.includes('EMPRESA:') || title.includes('CONTATO:') || title.includes('TELEFONE:') || 
              title.includes('EMAIL:') || title.includes('DATA:') || title.length < 3) {
            skipped++;
            continue;
          }

          // Validate required fields
          if (!quotationData.title || quotationData.title.toString().trim() === '') {
            errors.push(`Linha ${i + 2}: Título é obrigatório (colunas disponíveis: ${Object.keys(row as any).join(', ')})`);
            skipped++;
            continue;
          }

          // Clean title
          quotationData.title = quotationData.title.toString().trim();

          // Convert budget to proper format if provided
          if (quotationData.totalBudget && typeof quotationData.totalBudget === 'string') {
            const numericBudget = parseFloat(quotationData.totalBudget.replace(/[^\d.,]/g, '').replace(',', '.'));
            // Limit to reasonable budget range (max 99,999,999.99)
            if (!isNaN(numericBudget) && numericBudget <= 99999999.99 && numericBudget > 0) {
              quotationData.totalBudget = numericBudget.toString();
            } else {
              quotationData.totalBudget = undefined; // Invalid budget, set to undefined
            }
          }

          // Create quotation request
          await storage.createQuotationRequest(quotationData);
          created++;
          
        } catch (error) {
          console.error("Error processing row:", error);
          errors.push(`Linha ${i + 2}: Erro ao processar dados - ${(error as Error).message}`);
          skipped++;
        }
      }

      const processedData = {
        processed: jsonData.length,
        created,
        skipped,
        errors: errors.slice(0, 10) // Limit to 10 errors for display
      };
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'upload',
        entityType: 'quotation_request',
        entityId: 'bulk_upload',
        changes: { 
          filename: req.file.originalname,
          processed: processedData.processed,
          created: processedData.created,
          skipped: processedData.skipped
        },
      });

      res.json(processedData);
    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({ message: "Falha ao processar planilha" });
    }
  });

  // Upload supplier quotations (cotações de fornecedores)
  app.post('/api/upload/supplier-quotations', isAuthenticated, requireQuotationProcessor, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      const buffer = req.file.buffer;
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Parse the spreadsheet
      let jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Handle malformed spreadsheets
      const hasOnlyEmptyColumns = jsonData.length > 0 && 
        Object.keys(jsonData[0] as any).every(key => key.includes('__EMPTY'));
      
      if (hasOnlyEmptyColumns) {
        console.log("Detected malformed supplier quotation spreadsheet, trying alternative parsing...");
        jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Convert array format to object format with proper headers
        const convertedData = [];
        for (let i = 1; i < jsonData.length; i++) { // Skip header row
          const row = jsonData[i] as any[];
          if (row && row.length > 0 && row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
            convertedData.push({
              'Fornecedor': row[0],
              'Número da Cotação': row[1],
              'Requisição ID': row[2],
              'Produto/Serviço': row[3],
              'Quantidade': row[4],
              'Preço Unitário': row[5],
              'Preço Total': row[6],
              'Prazo de Entrega (dias)': row[7],
              'Condições de Pagamento': row[8],
              'Observações': row[9]
            });
          }
        }
        jsonData = convertedData;
      }

      console.log("Available columns in supplier quotation spreadsheet:", jsonData.length > 0 ? Object.keys(jsonData[0] as any) : 'No data');
      console.log("First 3 rows sample:", jsonData.slice(0, 3));

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        try {
          // Map column values for supplier quotations
          const getColumnValue = (possibleNames: string[]) => {
            for (const name of possibleNames) {
              if ((row as any)[name] !== undefined && (row as any)[name] !== null && (row as any)[name] !== '') {
                return (row as any)[name];
              }
            }
            return undefined;
          };

          console.log(`Row ${i + 1} data:`, {
            supplier: getColumnValue(['Fornecedor', 'Supplier', 'Nome do Fornecedor']),
            quotationNumber: getColumnValue(['Número da Cotação', 'Quotation Number', 'Numero Cotacao']),
            quotationRequestId: getColumnValue(['Requisição ID', 'Request ID', 'ID da Requisição']),
            allKeys: Object.keys(row as any),
            rawRow: row
          });

          // Extract required fields for supplier quotation
          const supplierName = getColumnValue(['Fornecedor', 'Supplier', 'Nome do Fornecedor']);
          const quotationNumber = getColumnValue(['Número da Cotação', 'Quotation Number', 'Numero Cotacao']);
          const quotationRequestId = getColumnValue(['Requisição ID', 'Request ID', 'ID da Requisição']);
          const productName = getColumnValue(['Produto/Serviço', 'Product', 'Produto', 'Serviço', 'Item']);
          const quantity = getColumnValue(['Quantidade', 'Quantity', 'Qtd']);
          const unitPrice = getColumnValue(['Preço Unitário', 'Unit Price', 'Preco Unitario']);
          const totalPrice = getColumnValue(['Preço Total', 'Total Price', 'Preco Total']);
          const deliveryTime = getColumnValue(['Prazo de Entrega (dias)', 'Delivery Time', 'Prazo Entrega']);
          const paymentTerms = getColumnValue(['Condições de Pagamento', 'Payment Terms', 'Condicoes Pagamento']);
          const observations = getColumnValue(['Observações', 'Observations', 'Obs']);

          // Skip rows with metadata or empty essential data
          if (!supplierName || !quotationRequestId || !productName ||
              String(supplierName).includes(':') || 
              String(supplierName).toUpperCase().includes('EMPRESA') ||
              String(supplierName).toUpperCase().includes('CONTATO')) {
            console.log(`Skipping row ${i + 1}: ${supplierName} (metadata or missing data)`);
            skipped++;
            continue;
          }

          // Validate numeric fields
          const numericQuantity = parseFloat(String(quantity || '0').replace(',', '.'));
          const numericUnitPrice = parseFloat(String(unitPrice || '0').replace(',', '.'));
          const numericTotalPrice = parseFloat(String(totalPrice || '0').replace(',', '.'));
          const numericDeliveryTime = parseInt(String(deliveryTime || '0'));

          if (isNaN(numericQuantity) || isNaN(numericUnitPrice) || isNaN(numericTotalPrice)) {
            errors.push(`Linha ${i + 1}: Valores numéricos inválidos`);
            skipped++;
            continue;
          }

          // Find or create supplier
          let supplier = await storage.getSupplierByName(supplierName);
          if (!supplier) {
            supplier = await storage.createSupplier({
              name: supplierName,
              status: 'ativo'
            });
          }

          // Verify quotation request exists
          const quotationRequest = await storage.getQuotationRequest(quotationRequestId);
          if (!quotationRequest) {
            errors.push(`Linha ${i + 1}: Requisição ${quotationRequestId} não encontrada`);
            skipped++;
            continue;
          }

          // Create or update supplier quotation
          const existingQuotation = await storage.getSupplierQuotationByRequestAndSupplier(quotationRequestId, supplier.id);
          
          if (existingQuotation) {
            // Update existing quotation
            await storage.updateSupplierQuotation(existingQuotation.id, {
              quotationNumber: quotationNumber || existingQuotation.quotationNumber,
              deliveryTime: numericDeliveryTime || existingQuotation.deliveryTime,
              paymentTerms: paymentTerms || existingQuotation.paymentTerms,
              totalAmount: numericTotalPrice.toString(),
              observations: observations || existingQuotation.observations
            });
          } else {
            // Create new supplier quotation
            const supplierQuotation = await storage.createSupplierQuotation({
              quotationRequestId,
              supplierId: supplier.id,
              quotationNumber: quotationNumber || `COT-${Date.now()}`,
              deliveryTime: numericDeliveryTime,
              paymentTerms: paymentTerms || 'A vista',
              totalAmount: numericTotalPrice.toString(),
              observations
            });

            // Create quotation items (simplified - assumes one item per row)
            // In a real scenario, you'd need to map to existing quotation request items
            // For now, we'll create the quotation without detailed items
          }

          created++;

        } catch (error) {
          console.error(`Error processing row ${i + 1}:`, error);
          errors.push(`Linha ${i + 1}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          skipped++;
        }
      }

      const processedData = {
        processed: jsonData.length,
        created,
        skipped,
        errors: errors.slice(0, 10)
      };
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'upload',
        entityType: 'supplier_quotation',
        entityId: 'bulk_upload',
        changes: { 
          filename: req.file.originalname,
          processed: processedData.processed,
          created: processedData.created,
          skipped: processedData.skipped
        },
      });

      res.json(processedData);
    } catch (error) {
      console.error("Error processing supplier quotation upload:", error);
      res.status(500).json({ message: "Falha ao processar planilha de cotações" });
    }
  });

  // AI analysis routes
  app.get('/api/ai-analyses', isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const { entityType, entityId } = req.query;
      const analyses = await storage.getAiAnalyses(entityType as string, entityId as string);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching AI analyses:", error);
      res.status(500).json({ message: "Failed to fetch AI analyses" });
    }
  });

  app.post('/api/ai/analyze-market', isAuthenticated, async (req, res) => {
    try {
      const { productName, category } = req.body;
      const analysis = await openaiService.analyzeMarketTrends(productName, category);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing market:", error);
      res.status(500).json({ message: "Failed to analyze market" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
