# Fashion Store — Platform Architecture

This document defines the architectural guidelines, module boundaries, responsibility separation, and security models for the Fashion Store platform.

---

## 1. Monorepo Structure

The platform is structured as an npm workspaces monorepo:

```text
fashion-store/
├── apps/
│   ├── web/                     # Frontend client (React, Vite, Tailwind CSS)
│   └── api/                     # Backend REST API (NestJS, Prisma)
├── packages/
│   ├── shared/                  # Shared types, enums, domain constants
│   └── config/                  # Shared tooling configurations
├── docs/                        # Architectural & roadmap documentation
├── .agents/skills/              # System skills & architecture governance
├── package.json                 # Monorepo workspaces definition
├── tsconfig.base.json           # Monorepo root TypeScript configuration
├── eslint.config.mjs            # Flat ESLint configuration
└── .prettierrc                  # Prettier formatting configuration
```

---

## 2. Frontend Architecture (`apps/web`)

The frontend is a single-page application built with React, Vite, and TypeScript.

### Key Principles:

- **Presentation & Interaction Layer**: Handles UI rendering, user inputs, responsive layouts, theme switching, and localization.
- **Data Fetching & Cache**: Powered by `@tanstack/react-query` to ensure optimized caching, deduplication, and loading/error states without waterfalled queries.
- **Form State**: Powered by `react-hook-form` coupled with `zod` for client-side form schema validation.
- **Design Tokens**: Standardized CSS variables supporting light/dark themes and RTL/LTR text flow.
- **Strict Boundary**: The frontend **never** imports backend code, database entities, Prisma types, or backend services. All interactions go through standard HTTP REST endpoints.

---

## 3. Backend Architecture (`apps/api`)

The backend is built with NestJS following modular, dependency-injected enterprise patterns.

### Key Principles:

- **Modular Domain Architecture**: Organized into distinct modules (Auth, Products, Orders, CMS, Settings).
- **Validation**: Incoming requests pass through global NestJS `ValidationPipe` with whitelist and transform enforcement.
- **Exception Filters**: Centralized error responses adhering to uniform JSON structures without leaking stack traces or internal secrets.
- **Documentation**: OpenAPI/Swagger documentation exposed at `/api/docs`.

---

## 4. Shared Package Responsibilities (`packages/shared`)

`packages/shared` serves as the single source of truth for pure contracts shared across web and api.

### Allowed:

- Domain enums (e.g., `OrderStatus`, `Role`, `Language`, `Currency`, `ThemeMode`).
- Pure interface definitions (e.g., `Money`, `PaginationParams`, `PaginatedResponse<T>`, `ApiResponse<T>`).
- Domain constants (e.g., `SUPPORTED_LANGUAGES`, `DEFAULT_CURRENCY`).

### Strictly Forbidden:

- Prisma entities, schemas, or database models.
- NestJS DTO classes and decorators (`@IsString()`, `@ApiProperty()`).
- React components, hooks, or browser-specific code.
- Backend services, repositories, or runtime business logic.

---

## 5. Config Package Responsibilities (`packages/config`)

`packages/config` houses shared developer tooling and linter presets.

### Allowed:

- Base configuration definitions for linters, formatters, and TypeScript compiler defaults.

### Strictly Forbidden:

- Runtime application configuration.
- Environment variables or secrets.
- Database connection settings.

---

## 6. Database Responsibility & 7. Prisma Responsibility

> For the comprehensive entity breakdown, Mermaid ERD, fields, indexes, constraints, and strategy definitions, see [docs/database-architecture.md](./database-architecture.md).

- **Database Engine**: PostgreSQL.
- **ORM**: Prisma Client.
- **Responsibility**: PostgreSQL is the single source of persistent data. It guarantees data integrity, foreign key constraints, and transactional consistency.
- **Phase 2 Scope**: In Phase 1, Prisma is prepared in dependencies only. Database schemas (`schema.prisma`), migrations, seed data, and model definitions will be established in **Phase 2 (Database Architecture & Prisma)**.

---

## 8. API Responsibility & Standards

- **Protocol**: HTTP/HTTPS REST API with JSON payload contracts.
- **Prefix**: All endpoints are prefixed under `/api` (e.g., `/api/health`, `/api/products`).
- **Response Format**: Predictable envelope responses:
  ```typescript
  {
    "success": true,
    "data": { ... },
    "timestamp": "2026-08-20T19:00:00.000Z"
  }
  ```
- **Error Format**:
  ```typescript
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Validation failed",
      "details": [ ... ]
    },
    "timestamp": "2026-08-20T19:00:00.000Z"
  }
  ```

---

## 9. Authentication & 10. RBAC Strategy

- **Authentication**: Stateless JWT with short-lived Access Tokens and secure HttpOnly Refresh Tokens.
- **Roles**: Defined in `Role` enum (`SUPER_ADMIN`, `ADMIN`, `STORE_MANAGER`, `SALES_AGENT`).
- **Access Control**: Role-Based Access Control (RBAC) enforced via NestJS Guards and Decorators (`@Roles()`, `@UseGuards(JwtAuthGuard, RolesGuard)`).
- **Public vs. Protected**: Public storefront endpoints (products, categories, public CMS) require no authentication; all administrative endpoints require authenticated credentials and appropriate role privileges.

---

## 11. Environment Strategy

- All runtime secrets and configuration values are loaded via environment variables.
- `.env` files are strictly excluded from version control via `.gitignore`.
- Template files (`.env.example`) provide documentation of all required variables without containing live secrets.

---

## 12. Security Boundaries

- **No Secrets in Frontend**: `VITE_*` variables are strictly restricted to public parameters (e.g., API base URL).
- **Input Validation**: All incoming requests are validated against strict class-validator DTOs.
- **CORS**: Explicit whitelist of allowed client origins.
- **Rate Limiting**: Throttling configured for sensitive endpoints.
- **Audit Logging**: Sensitive administrative actions (role updates, catalog edits, settings modifications) will record audit metadata.

---

## 13. Future Module Boundaries

```text
               ┌───────────────────────┐
               │    React Storefront   │
               │   & Admin Dashboard   │
               └──────────┬────────────┘
                          │ HTTP REST
                          ▼
               ┌───────────────────────┐
               │     NestJS API        │
               │  (/api/v1 endpoints)  │
               └──────────┬────────────┘
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
 ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 │ Auth Module  │  │Catalog Module│  │ Orders/CMS   │
 └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
        └─────────────────┼─────────────────┘
                          ▼
               ┌───────────────────────┐
               │     Prisma ORM        │
               └──────────┬────────────┘
                          ▼
               ┌───────────────────────┐
               │  PostgreSQL Database  │
               └───────────────────────┘
```

---

## 14. Dependency Boundaries & Architectural Flow

```text
React (apps/web)
  ↓ HTTP Requests
NestJS (apps/api)
  ↓ Domain Logic & Validation
Prisma ORM
  ↓ SQL Queries
PostgreSQL
```

- `apps/web` ── depends on ──> `packages/shared`
- `apps/api` ── depends on ──> `packages/shared`
- Neither application depends directly on the internal implementation of the other.
