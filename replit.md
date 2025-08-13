# Overview

TrustCota Sys is a comprehensive procurement and quotation management system built for LP Administradora. The application features AI-powered market analysis, supplier management, automated procurement workflows, and advanced analytics. It's designed to streamline the entire procurement process from requisition creation to purchase order generation, with intelligent insights and anomaly detection powered by OpenAI integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack React Query for server state and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Framework**: Express.js with TypeScript, configured as ESM modules
- **Database ORM**: Drizzle ORM with type-safe schema definitions
- **API Design**: RESTful endpoints with role-based access control
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Replit Auth integration with OpenID Connect
- **File Processing**: Support for spreadsheet uploads and data import

## Database Design
- **Database**: PostgreSQL with Neon serverless connection
- **Schema Management**: Drizzle migrations in `/migrations` directory
- **Key Entities**: Users, Suppliers, Products, Categories, Quotation Requests, Supplier Quotations, Purchase Orders, Audit Logs, AI Analyses
- **Authorization**: Role-based permissions (admin, requisitante, cotador, aprovador)
- **Session Storage**: PostgreSQL-backed session store for authentication

## Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect protocol
- **Session Management**: Server-side sessions with PostgreSQL persistence
- **Role System**: Multi-tier user roles with department-based access control
- **Security**: HTTP-only cookies, CSRF protection, secure session configuration

## AI Integration
- **Provider**: OpenAI GPT-4o for market analysis and insights
- **Features**: Market trend analysis, price anomaly detection, procurement recommendations
- **Implementation**: Dedicated service layer with structured prompt engineering
- **Caching**: Market analysis results stored in database with TTL

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling
- **Connection Management**: WebSocket-based connections for serverless compatibility

## AI Services
- **OpenAI API**: GPT-4o model for market analysis, trend detection, and procurement insights
- **Custom Prompts**: Structured analysis for Brazilian market conditions and pricing

## Authentication Services
- **Replit Auth**: OpenID Connect authentication provider
- **Session Store**: PostgreSQL-backed session persistence with connect-pg-simple

## Email Services
- **Nodemailer**: SMTP email delivery for notifications and approvals
- **Templates**: HTML email templates for procurement workflow notifications

## Development Tools
- **Replit Integration**: Development environment integration with Cartographer plugin
- **Vite Plugins**: Runtime error overlay and development tooling
- **TypeScript**: Full type safety across client, server, and shared code

## UI Component Libraries
- **Radix UI**: Accessible component primitives for dialogs, forms, navigation
- **Tailwind CSS**: Utility-first styling with custom design system
- **Material Icons**: Google Material Design icon library
- **Shadcn/ui**: Pre-built component library with consistent design patterns

---

# Migration Status

## ✅ **MIGRATION COMPLETED SUCCESSFULLY**

**Date**: December 2024  
**Status**: COMPLETE - All systems operational

### Security Fixes Applied:
✅ Fixed OpenAI API key vulnerability (removed "default_key" fallback)  
✅ Implemented secure authentication with proper session handling  
✅ Applied RBAC middleware for role-based access control  

### Frontend Enhancements:
✅ Added ThemeProvider with dark/light mode support  
✅ Created missing pages: Settings, Chat, Audit  
✅ Implemented responsive design with proper Material Icons integration  
✅ Applied TypeScript strict typing across all components  

### Backend Security & Compliance:
✅ Database storage layer fully implemented  
✅ Email service configured for notifications  
✅ OpenAI service secured with proper error handling  
✅ All routes protected with appropriate RBAC controls  

### System Validation:
✅ All navigation routes functional  
✅ Dark mode and theme system working  
✅ Database integration verified  
✅ API endpoints tested and secured  

**Project is ready for production deployment.**