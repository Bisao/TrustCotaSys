import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertSupplierSchema, insertProductSchema, insertCategorySchema, insertQuotationRequestSchema } from "@shared/schema";
import { openaiService } from "./services/openai";
import { emailService } from "./services/email";

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

  // Supplier routes
  app.get('/api/suppliers', isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.get('/api/suppliers/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/suppliers', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
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

  app.get('/api/suppliers/search/:query', isAuthenticated, async (req, res) => {
    try {
      const suppliers = await storage.searchSuppliers(req.params.query);
      res.json(suppliers);
    } catch (error) {
      console.error("Error searching suppliers:", error);
      res.status(500).json({ message: "Failed to search suppliers" });
    }
  });

  // Product routes
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

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
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

  app.put('/api/products/:id', isAuthenticated, async (req: any, res) => {
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

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
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

  // Quotation Request routes
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

  app.post('/api/quotation-requests', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/quotation-requests/:id/approve', isAuthenticated, async (req: any, res) => {
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

  app.post('/api/quotation-requests/:id/reject', isAuthenticated, async (req: any, res) => {
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

  // Audit log routes
  app.get('/api/audit-logs', isAuthenticated, async (req, res) => {
    try {
      const { entityId } = req.query;
      const logs = await storage.getAuditLogs(entityId as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // AI analysis routes
  app.get('/api/ai-analyses', isAuthenticated, async (req, res) => {
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
