# Fashion Store Platform

A modern, youthful, and production-ready fashion retail platform built with React, Vite, NestJS, and PostgreSQL.

## Features Overview

- **Public Storefront**: Fast, responsive, accessible shopping experience.
- **Admin Dashboard**: Comprehensive management for catalog, orders, and CMS.
- **WhatsApp-based Ordering**: Variant selection & direct WhatsApp order creation (no online payment gateway in Phase 1-9).
- **Internationalization**: Full Arabic (RTL) and English (LTR) support.
- **Modern Design**: Premium aesthetics, dark/light theme support, and design tokens.
- **Excel Tools**: Bulk import and export for products and variants with strict validation.
- **Dynamic CMS & Branding**: Configurable homepage sections, store branding, and social links.

---

## Technology Stack

### Frontend (`apps/web`)

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui design tokens
- **State & Data Fetching**: TanStack Query
- **Forms & Validation**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Localization**: i18next

### Backend (`apps/api`)

- **Framework**: NestJS 11 + TypeScript
- **ORM & Database**: Prisma ORM + PostgreSQL (Phase 2)
- **API Architecture**: RESTful with Swagger/OpenAPI documentation
- **Security & Validation**: class-validator, class-transformer, JWT, RBAC

### Monorepo Packages

- **`packages/shared`**: Shared TypeScript contracts (enums, types, constants).
- **`packages/config`**: Shared build and tooling configurations.

---

## Monorepo Layout

```text
fashion-store/
├── apps/
│   ├── web/                # React + Vite frontend application
│   └── api/                # NestJS backend REST API
├── packages/
│   ├── shared/             # Shared contracts (types, enums, constants)
│   └── config/             # Shared tooling presets
├── docs/
│   ├── architecture.md     # Architectural specifications and boundaries
│   └── development-roadmap.md # 18-phase implementation roadmap
├── .agents/skills/         # Project architecture and design rules
├── package.json            # Root workspace configuration
├── tsconfig.base.json      # Base strict TypeScript config
├── eslint.config.mjs       # Unified root ESLint flat config
├── .prettierrc             # Root Prettier config
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

Install all dependencies across workspaces:

```bash
npm install
```

### Environment Setup

Copy example environment files to their respective applications:

1. **Frontend**:
   ```bash
   cp apps/web/.env.example apps/web/.env
   ```
2. **Backend**:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

---

## Development Scripts

Run commands from the root or target specific workspaces:

| Command                | Description                                            |
| :--------------------- | :----------------------------------------------------- |
| `npm run dev`          | Starts both web and api in development mode            |
| `npm run build`        | Builds all packages and applications                   |
| `npm run typecheck`    | Runs strict TypeScript typecheck across all workspaces |
| `npm run lint`         | Runs ESLint across all workspaces                      |
| `npm run format`       | Formats all files using Prettier                       |
| `npm run format:check` | Checks formatting without writing changes              |

### Individual Workspace Commands

- **Run Web Frontend**:
  ```bash
  npm run dev --workspace=apps/web
  ```
- **Run Backend API**:
  ```bash
  npm run dev --workspace=apps/api
  ```
- **Build Web Frontend**:
  ```bash
  npm run build --workspace=apps/web
  ```
- **Build Backend API**:
  ```bash
  npm run build --workspace=apps/api
  ```

---

## Documentation

- [Architecture & Boundaries](docs/architecture.md)
- [Database Architecture Specification](docs/database-architecture.md)
- [Development Roadmap](docs/development-roadmap.md)
