import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "requisitante", "cotador", "aprovador"]);
export const quotationStatusEnum = pgEnum("quotation_status", [
  "rascunho",
  "em_cotacao",
  "aguardando_aprovacao",
  "aprovado",
  "rejeitado",
  "cancelado"
]);
export const supplierStatusEnum = pgEnum("supplier_status", ["ativo", "inativo", "pendente", "bloqueado"]);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("requisitante"),
  department: varchar("department"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  cnpj: varchar("cnpj").unique(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  contactPerson: varchar("contact_person"),
  status: supplierStatusEnum("status").default("ativo"),
  score: decimal("score", { precision: 3, scale: 2 }).default("0.00"),
  totalQuotations: integer("total_quotations").default(0),
  averageDeliveryTime: integer("average_delivery_time"), // in days
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  parentId: varchar("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  unit: varchar("unit").notNull(), // un, kg, m, etc.
  categoryId: varchar("category_id").references(() => categories.id),
  specifications: jsonb("specifications"), // technical specs, dimensions, etc.
  lastPrice: decimal("last_price", { precision: 10, scale: 2 }),
  averagePrice: decimal("average_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotation requests
export const quotationRequests = pgTable("quotation_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: varchar("request_number").unique().notNull(),
  requesterId: varchar("requester_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  department: varchar("department"),
  costCenter: varchar("cost_center"),
  urgency: varchar("urgency").default("normal"), // baixa, normal, alta, critica
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  status: quotationStatusEnum("status").default("rascunho"),
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }),
  approvedAmount: decimal("approved_amount", { precision: 12, scale: 2 }),
  approverId: varchar("approver_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Quotation request items
export const quotationRequestItems = pgTable("quotation_request_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationRequestId: varchar("quotation_request_id").references(() => quotationRequests.id).notNull(),
  productId: varchar("product_id").references(() => products.id),
  productName: varchar("product_name").notNull(), // for custom/new products
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit").notNull(),
  specifications: text("specifications"),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Supplier quotations
export const supplierQuotations = pgTable("supplier_quotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quotationRequestId: varchar("quotation_request_id").references(() => quotationRequests.id).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  quotationNumber: varchar("quotation_number"),
  validUntil: timestamp("valid_until"),
  deliveryTime: integer("delivery_time"), // in days
  paymentTerms: varchar("payment_terms"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  observations: text("observations"),
  isSelected: boolean("is_selected").default(false),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Supplier quotation items
export const supplierQuotationItems = pgTable("supplier_quotation_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierQuotationId: varchar("supplier_quotation_id").references(() => supplierQuotations.id).notNull(),
  quotationRequestItemId: varchar("quotation_request_item_id").references(() => quotationRequestItems.id).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  brand: varchar("brand"),
  model: varchar("model"),
  specifications: text("specifications"),
});

// Purchase orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: varchar("order_number").unique().notNull(),
  quotationRequestId: varchar("quotation_request_id").references(() => quotationRequests.id).notNull(),
  supplierId: varchar("supplier_id").references(() => suppliers.id).notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  deliveryAddress: text("delivery_address"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  status: varchar("status").default("pendente"), // pendente, confirmado, entregue, cancelado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: varchar("action").notNull(), // create, update, delete, approve, etc.
  entityType: varchar("entity_type").notNull(), // quotation, supplier, product, etc.
  entityId: varchar("entity_id").notNull(),
  changes: jsonb("changes"), // what changed
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI analysis results
export const aiAnalyses = pgTable("ai_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type").notNull(), // market_analysis, price_prediction, supplier_recommendation
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  analysis: jsonb("analysis").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  quotationRequests: many(quotationRequests),
  approvedQuotations: many(quotationRequests, { relationName: "approver" }),
  auditLogs: many(auditLogs),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  quotations: many(supplierQuotations),
  purchaseOrders: many(purchaseOrders),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories, { relationName: "parent" }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  quotationItems: many(quotationRequestItems),
}));

export const quotationRequestsRelations = relations(quotationRequests, ({ one, many }) => ({
  requester: one(users, {
    fields: [quotationRequests.requesterId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [quotationRequests.approverId],
    references: [users.id],
    relationName: "approver",
  }),
  items: many(quotationRequestItems),
  supplierQuotations: many(supplierQuotations),
  purchaseOrder: many(purchaseOrders),
}));

export const quotationRequestItemsRelations = relations(quotationRequestItems, ({ one, many }) => ({
  quotationRequest: one(quotationRequests, {
    fields: [quotationRequestItems.quotationRequestId],
    references: [quotationRequests.id],
  }),
  product: one(products, {
    fields: [quotationRequestItems.productId],
    references: [products.id],
  }),
  supplierQuotationItems: many(supplierQuotationItems),
}));

export const supplierQuotationsRelations = relations(supplierQuotations, ({ one, many }) => ({
  quotationRequest: one(quotationRequests, {
    fields: [supplierQuotations.quotationRequestId],
    references: [quotationRequests.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierQuotations.supplierId],
    references: [suppliers.id],
  }),
  items: many(supplierQuotationItems),
}));

export const supplierQuotationItemsRelations = relations(supplierQuotationItems, ({ one }) => ({
  supplierQuotation: one(supplierQuotations, {
    fields: [supplierQuotationItems.supplierQuotationId],
    references: [supplierQuotations.id],
  }),
  quotationRequestItem: one(quotationRequestItems, {
    fields: [supplierQuotationItems.quotationRequestItemId],
    references: [quotationRequestItems.id],
  }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one }) => ({
  quotationRequest: one(quotationRequests, {
    fields: [purchaseOrders.quotationRequestId],
    references: [quotationRequests.id],
  }),
  supplier: one(suppliers, {
    fields: [purchaseOrders.supplierId],
    references: [suppliers.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertQuotationRequestSchema = createInsertSchema(quotationRequests).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuotationRequestItemSchema = createInsertSchema(quotationRequestItems).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierQuotationSchema = createInsertSchema(supplierQuotations).omit({
  id: true,
  submittedAt: true,
});

export const insertSupplierQuotationItemSchema = createInsertSchema(supplierQuotationItems).omit({
  id: true,
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalyses).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type QuotationRequest = typeof quotationRequests.$inferSelect;
export type InsertQuotationRequest = z.infer<typeof insertQuotationRequestSchema>;

export type QuotationRequestItem = typeof quotationRequestItems.$inferSelect;
export type InsertQuotationRequestItem = z.infer<typeof insertQuotationRequestItemSchema>;

export type SupplierQuotation = typeof supplierQuotations.$inferSelect;
export type InsertSupplierQuotation = z.infer<typeof insertSupplierQuotationSchema>;

export type SupplierQuotationItem = typeof supplierQuotationItems.$inferSelect;
export type InsertSupplierQuotationItem = z.infer<typeof insertSupplierQuotationItemSchema>;

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type AiAnalysis = typeof aiAnalyses.$inferSelect;
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;
