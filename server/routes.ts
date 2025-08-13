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

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.get('/api/dashboard/recent-quotations', isAuthenticated, async (req, res) => {
    try {
      const quotations = await storage.getRecentQuotations(5);
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
  app.post('/api/upload/quotation-spreadsheet', isAuthenticated, requireRequester, async (req: any, res) => {
    try {
      // In a real implementation, you would use multer or similar for file handling
      // For now, we'll simulate the processing
      const mockProcessedData = {
        processed: 5,
        created: 5,
        skipped: 0,
        errors: []
      };
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: 'upload',
        entityType: 'quotation_request',
        entityId: 'bulk_upload',
        changes: { processed: mockProcessedData.processed },
      });

      res.json(mockProcessedData);
    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({ message: "Failed to process upload" });
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
