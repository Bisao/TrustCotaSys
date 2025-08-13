import {
  users,
  suppliers,
  products,
  categories,
  quotationRequests,
  quotationRequestItems,
  supplierQuotations,
  supplierQuotationItems,
  purchaseOrders,
  auditLogs,
  aiAnalyses,
  type User,
  type UpsertUser,
  type Supplier,
  type InsertSupplier,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type QuotationRequest,
  type InsertQuotationRequest,
  type QuotationRequestItem,
  type InsertQuotationRequestItem,
  type SupplierQuotation,
  type InsertSupplierQuotation,
  type SupplierQuotationItem,
  type InsertSupplierQuotationItem,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type AuditLog,
  type InsertAuditLog,
  type AiAnalysis,
  type InsertAiAnalysis,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql, count, avg, sum } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Supplier operations
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;
  searchSuppliers(query: string): Promise<Supplier[]>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  searchProducts(query: string): Promise<Product[]>;
  getProductsByCategory(categoryId: string): Promise<Product[]>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;

  // Quotation Request operations
  getQuotationRequests(): Promise<QuotationRequest[]>;
  getQuotationRequest(id: string): Promise<QuotationRequest | undefined>;
  createQuotationRequest(request: InsertQuotationRequest): Promise<QuotationRequest>;
  updateQuotationRequest(id: string, request: Partial<InsertQuotationRequest>): Promise<QuotationRequest>;
  deleteQuotationRequest(id: string): Promise<void>;
  getQuotationRequestsByUser(userId: string): Promise<QuotationRequest[]>;
  getQuotationRequestsForApproval(approverId: string): Promise<QuotationRequest[]>;

  // Quotation Request Item operations
  getQuotationRequestItems(quotationRequestId: string): Promise<QuotationRequestItem[]>;
  createQuotationRequestItem(item: InsertQuotationRequestItem): Promise<QuotationRequestItem>;
  updateQuotationRequestItem(id: string, item: Partial<InsertQuotationRequestItem>): Promise<QuotationRequestItem>;
  deleteQuotationRequestItem(id: string): Promise<void>;

  // Supplier Quotation operations
  getSupplierQuotations(quotationRequestId: string): Promise<SupplierQuotation[]>;
  getSupplierQuotation(id: string): Promise<SupplierQuotation | undefined>;
  createSupplierQuotation(quotation: InsertSupplierQuotation): Promise<SupplierQuotation>;
  updateSupplierQuotation(id: string, quotation: Partial<InsertSupplierQuotation>): Promise<SupplierQuotation>;
  deleteSupplierQuotation(id: string): Promise<void>;

  // Supplier Quotation Item operations
  getSupplierQuotationItems(supplierQuotationId: string): Promise<SupplierQuotationItem[]>;
  createSupplierQuotationItem(item: InsertSupplierQuotationItem): Promise<SupplierQuotationItem>;
  updateSupplierQuotationItem(id: string, item: Partial<InsertSupplierQuotationItem>): Promise<SupplierQuotationItem>;
  deleteSupplierQuotationItem(id: string): Promise<void>;

  // Purchase Order operations
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder>;
  updatePurchaseOrder(id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder>;

  // Audit Log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityId?: string): Promise<AuditLog[]>;

  // AI Analysis operations
  createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis>;
  getAiAnalyses(entityType?: string, entityId?: string): Promise<AiAnalysis[]>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    monthlySpending: number;
    activeQuotations: number;
    savings: number;
    activeSuppliers: number;
    pendingApprovals: number;
  }>;

  // Recent activities
  getRecentQuotations(limit?: number): Promise<any[]>;
  getPendingApprovals(userId: string, limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Supplier operations
  async getSuppliers(): Promise<Supplier[]> {
    return await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.id, id));
    return supplier;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [newSupplier] = await db.insert(suppliers).values(supplier).returning();
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier> {
    const [updatedSupplier] = await db
      .update(suppliers)
      .set({ ...supplier, updatedAt: new Date() })
      .where(eq(suppliers.id, id))
      .returning();
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<void> {
    await db.delete(suppliers).where(eq(suppliers.id, id));
  }

  async searchSuppliers(query: string): Promise<Supplier[]> {
    return await db
      .select()
      .from(suppliers)
      .where(
        or(
          like(suppliers.name, `%${query}%`),
          like(suppliers.cnpj, `%${query}%`),
          like(suppliers.email, `%${query}%`)
        )
      );
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(
        or(
          like(products.name, `%${query}%`),
          like(products.description, `%${query}%`)
        )
      );
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.categoryId, categoryId));
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Quotation Request operations
  async getQuotationRequests(): Promise<QuotationRequest[]> {
    return await db.select().from(quotationRequests).orderBy(desc(quotationRequests.createdAt));
  }

  async getQuotationRequest(id: string): Promise<QuotationRequest | undefined> {
    const [request] = await db.select().from(quotationRequests).where(eq(quotationRequests.id, id));
    return request;
  }

  async createQuotationRequest(request: InsertQuotationRequest): Promise<QuotationRequest> {
    // Generate request number
    const today = new Date();
    const yearMonth = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0');
    const [lastRequest] = await db
      .select({ requestNumber: quotationRequests.requestNumber })
      .from(quotationRequests)
      .where(like(quotationRequests.requestNumber, `REQ-${yearMonth}%`))
      .orderBy(desc(quotationRequests.requestNumber))
      .limit(1);

    let sequence = 1;
    if (lastRequest) {
      const lastSequence = parseInt(lastRequest.requestNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const requestNumber = `REQ-${yearMonth}-${sequence.toString().padStart(3, '0')}`;

    const [newRequest] = await db
      .insert(quotationRequests)
      .values({
        ...request,
        requestNumber,
      })
      .returning();
    return newRequest;
  }

  async updateQuotationRequest(id: string, request: Partial<InsertQuotationRequest>): Promise<QuotationRequest> {
    const [updatedRequest] = await db
      .update(quotationRequests)
      .set({ ...request, updatedAt: new Date() })
      .where(eq(quotationRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteQuotationRequest(id: string): Promise<void> {
    await db.delete(quotationRequests).where(eq(quotationRequests.id, id));
  }

  async getQuotationRequestsByUser(userId: string): Promise<QuotationRequest[]> {
    return await db
      .select()
      .from(quotationRequests)
      .where(eq(quotationRequests.requesterId, userId))
      .orderBy(desc(quotationRequests.createdAt));
  }

  async getQuotationRequestsForApproval(approverId: string): Promise<QuotationRequest[]> {
    return await db
      .select()
      .from(quotationRequests)
      .where(
        and(
          eq(quotationRequests.status, "aguardando_aprovacao"),
          eq(quotationRequests.approverId, approverId)
        )
      )
      .orderBy(desc(quotationRequests.createdAt));
  }

  // Quotation Request Item operations
  async getQuotationRequestItems(quotationRequestId: string): Promise<QuotationRequestItem[]> {
    return await db
      .select()
      .from(quotationRequestItems)
      .where(eq(quotationRequestItems.quotationRequestId, quotationRequestId));
  }

  async createQuotationRequestItem(item: InsertQuotationRequestItem): Promise<QuotationRequestItem> {
    const [newItem] = await db.insert(quotationRequestItems).values(item).returning();
    return newItem;
  }

  async updateQuotationRequestItem(id: string, item: Partial<InsertQuotationRequestItem>): Promise<QuotationRequestItem> {
    const [updatedItem] = await db
      .update(quotationRequestItems)
      .set(item)
      .where(eq(quotationRequestItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteQuotationRequestItem(id: string): Promise<void> {
    await db.delete(quotationRequestItems).where(eq(quotationRequestItems.id, id));
  }

  // Supplier Quotation operations
  async getSupplierQuotations(quotationRequestId: string): Promise<SupplierQuotation[]> {
    return await db
      .select()
      .from(supplierQuotations)
      .where(eq(supplierQuotations.quotationRequestId, quotationRequestId));
  }

  async getSupplierQuotation(id: string): Promise<SupplierQuotation | undefined> {
    const [quotation] = await db.select().from(supplierQuotations).where(eq(supplierQuotations.id, id));
    return quotation;
  }

  async createSupplierQuotation(quotation: InsertSupplierQuotation): Promise<SupplierQuotation> {
    const [newQuotation] = await db.insert(supplierQuotations).values(quotation).returning();
    return newQuotation;
  }

  async updateSupplierQuotation(id: string, quotation: Partial<InsertSupplierQuotation>): Promise<SupplierQuotation> {
    const [updatedQuotation] = await db
      .update(supplierQuotations)
      .set(quotation)
      .where(eq(supplierQuotations.id, id))
      .returning();
    return updatedQuotation;
  }

  async deleteSupplierQuotation(id: string): Promise<void> {
    await db.delete(supplierQuotations).where(eq(supplierQuotations.id, id));
  }

  // Supplier Quotation Item operations
  async getSupplierQuotationItems(supplierQuotationId: string): Promise<SupplierQuotationItem[]> {
    return await db
      .select()
      .from(supplierQuotationItems)
      .where(eq(supplierQuotationItems.supplierQuotationId, supplierQuotationId));
  }

  async createSupplierQuotationItem(item: InsertSupplierQuotationItem): Promise<SupplierQuotationItem> {
    const [newItem] = await db.insert(supplierQuotationItems).values(item).returning();
    return newItem;
  }

  async updateSupplierQuotationItem(id: string, item: Partial<InsertSupplierQuotationItem>): Promise<SupplierQuotationItem> {
    const [updatedItem] = await db
      .update(supplierQuotationItems)
      .set(item)
      .where(eq(supplierQuotationItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteSupplierQuotationItem(id: string): Promise<void> {
    await db.delete(supplierQuotationItems).where(eq(supplierQuotationItems.id, id));
  }

  // Purchase Order operations
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return await db.select().from(purchaseOrders).orderBy(desc(purchaseOrders.createdAt));
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    const [order] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, id));
    return order;
  }

  async createPurchaseOrder(order: InsertPurchaseOrder): Promise<PurchaseOrder> {
    // Generate order number
    const today = new Date();
    const yearMonth = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0');
    const [lastOrder] = await db
      .select({ orderNumber: purchaseOrders.orderNumber })
      .from(purchaseOrders)
      .where(like(purchaseOrders.orderNumber, `PO-${yearMonth}%`))
      .orderBy(desc(purchaseOrders.orderNumber))
      .limit(1);

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const orderNumber = `PO-${yearMonth}-${sequence.toString().padStart(3, '0')}`;

    const [newOrder] = await db
      .insert(purchaseOrders)
      .values({
        ...order,
        orderNumber,
      })
      .returning();
    return newOrder;
  }

  async updatePurchaseOrder(id: string, order: Partial<InsertPurchaseOrder>): Promise<PurchaseOrder> {
    const [updatedOrder] = await db
      .update(purchaseOrders)
      .set({ ...order, updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updatedOrder;
  }

  // Audit Log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(entityId?: string): Promise<AuditLog[]> {
    const query = db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    
    if (entityId) {
      return await query.where(eq(auditLogs.entityId, entityId));
    }
    
    return await query;
  }

  // AI Analysis operations
  async createAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const [newAnalysis] = await db.insert(aiAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  async getAiAnalyses(entityType?: string, entityId?: string): Promise<AiAnalysis[]> {
    let query = db.select().from(aiAnalyses).orderBy(desc(aiAnalyses.createdAt));
    
    if (entityType && entityId) {
      return await query.where(
        and(
          eq(aiAnalyses.entityType, entityType),
          eq(aiAnalyses.entityId, entityId)
        )
      );
    } else if (entityType) {
      return await query.where(eq(aiAnalyses.entityType, entityType));
    }
    
    return await query;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    monthlySpending: number;
    activeQuotations: number;
    savings: number;
    activeSuppliers: number;
    pendingApprovals: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Monthly spending from approved quotations
    const [monthlySpendingResult] = await db
      .select({
        total: sum(quotationRequests.approvedAmount)
      })
      .from(quotationRequests)
      .where(
        and(
          eq(quotationRequests.status, "aprovado"),
          sql`${quotationRequests.approvedAt} >= ${startOfMonth}`
        )
      );

    // Active quotations (in progress)
    const [activeQuotationsResult] = await db
      .select({
        count: count()
      })
      .from(quotationRequests)
      .where(
        or(
          eq(quotationRequests.status, "em_cotacao"),
          eq(quotationRequests.status, "aguardando_aprovacao")
        )
      );

    // Savings calculation would need more complex logic comparing historical prices
    // For now, we'll use a placeholder
    const savings = 18420;

    // Active suppliers
    const [activeSuppliersResult] = await db
      .select({
        count: count()
      })
      .from(suppliers)
      .where(eq(suppliers.status, "ativo"));

    // Pending approvals
    const [pendingApprovalsResult] = await db
      .select({
        count: count()
      })
      .from(quotationRequests)
      .where(eq(quotationRequests.status, "aguardando_aprovacao"));

    return {
      monthlySpending: Number(monthlySpendingResult.total) || 0,
      activeQuotations: activeQuotationsResult.count,
      savings,
      activeSuppliers: activeSuppliersResult.count,
      pendingApprovals: pendingApprovalsResult.count,
    };
  }

  // Recent activities
  async getRecentQuotations(limit: number = 5): Promise<any[]> {
    return await db
      .select({
        id: quotationRequests.id,
        requestNumber: quotationRequests.requestNumber,
        title: quotationRequests.title,
        status: quotationRequests.status,
        totalBudget: quotationRequests.totalBudget,
        approvedAmount: quotationRequests.approvedAmount,
        createdAt: quotationRequests.createdAt,
        requesterName: users.firstName,
      })
      .from(quotationRequests)
      .leftJoin(users, eq(quotationRequests.requesterId, users.id))
      .orderBy(desc(quotationRequests.createdAt))
      .limit(limit);
  }

  async getPendingApprovals(userId: string, limit: number = 5): Promise<any[]> {
    return await db
      .select({
        id: quotationRequests.id,
        requestNumber: quotationRequests.requestNumber,
        title: quotationRequests.title,
        totalBudget: quotationRequests.totalBudget,
        createdAt: quotationRequests.createdAt,
        urgency: quotationRequests.urgency,
      })
      .from(quotationRequests)
      .where(
        and(
          eq(quotationRequests.status, "aguardando_aprovacao"),
          eq(quotationRequests.approverId, userId)
        )
      )
      .orderBy(quotationRequests.expectedDeliveryDate)
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
