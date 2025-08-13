import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Role-based access control middleware
export function requireRole(roles: string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "User account is deactivated" });
      }

      if (!user.role || !roles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${user.role}` 
        });
      }

      req.user.role = user.role;
      req.user.department = user.department;
      next();
    } catch (error) {
      console.error("Error checking user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Department-based access control
export function requireDepartment(departments: string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.department) {
        return res.status(403).json({ message: "User department not found" });
      }

      if (!departments.includes(user.department)) {
        return res.status(403).json({ 
          message: `Access denied. Required departments: ${departments.join(', ')}` 
        });
      }

      next();
    } catch (error) {
      console.error("Error checking user department:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Owner or role-based access control
export function requireOwnershipOrRole(roles: string[]) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.claims?.sub;
      const resourceUserId = req.params.userId || req.body.requesterId;

      // If user owns the resource, allow access
      if (userId === resourceUserId) {
        return next();
      }

      // Otherwise, check role
      const user = await storage.getUser(userId);
      if (!user || !user.role || !roles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Access denied. You can only access your own resources or need appropriate role." 
        });
      }

      next();
    } catch (error) {
      console.error("Error checking ownership or role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };
}

// Admin-only access
export const requireAdmin = requireRole(["admin"]);

// Approver-only access
export const requireApprover = requireRole(["admin", "aprovador"]);

// Quotation processor access
export const requireQuotationProcessor = requireRole(["admin", "cotador"]);

// Requester access
export const requireRequester = requireRole(["admin", "requisitante", "cotador", "aprovador"]);