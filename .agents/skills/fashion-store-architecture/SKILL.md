---

name: fashion-store-architecture
description: Enforce the production architecture, engineering standards, and technical boundaries for the Fashion Store platform built with React, TypeScript, NestJS, Prisma, and PostgreSQL.
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

# Fashion Store Architecture

This skill defines the mandatory architectural and engineering rules for the Fashion Store platform.

The project is a modern fashion retail website with a dynamic CMS-driven storefront, WhatsApp-based ordering, and a full administrative dashboard.

## When to use

Use this skill whenever:

* Creating or modifying application architecture.
* Adding a new feature or module.
* Creating database models.
* Creating API endpoints.
* Creating frontend pages or components.
* Modifying the admin dashboard.
* Implementing authentication or authorization.
* Adding product, category, variant, discount, or order functionality.
* Implementing Excel import/export.
* Adding localization.
* Refactoring existing code.
* Reviewing or fixing architectural problems.

---

# 1. Technology Stack

The following stack is mandatory unless there is a documented technical reason to change it.

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* TanStack Query
* React Hook Form
* Zod
* Framer Motion
* Lucide Icons

## Backend

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* REST API
* JWT authentication
* Refresh tokens
* RBAC
* class-validator / DTO validation
* Swagger / OpenAPI

## Infrastructure

* PostgreSQL for relational data.
* Object storage for product and media assets.
* Environment variables for configuration.
* Git for version control.

---

# 2. Core Architecture Principles

The application MUST follow these principles:

* Clean Architecture.
* Separation of concerns.
* Feature-based organization.
* Dependency inversion.
* Single responsibility.
* Explicit domain boundaries.
* Strong typing.
* Reusable components.
* Testable business logic.
* Secure API boundaries.
* No unnecessary abstraction.
* No duplicated business logic.

Do not introduce architecture only for the sake of architecture.

Prefer simple, explicit, maintainable solutions.

---

# 3. Frontend Architecture

Organize frontend code by feature rather than by technical type alone.

Preferred structure:

```text
src/
├── app/
│   ├── router/
│   ├── providers/
│   └── layouts/
│
├── features/
│   ├── products/
│   ├── categories/
│   ├── homepage/
│   ├── discounts/
│   ├── orders/
│   ├── settings/
│   ├── authentication/
│   └── media/
│
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
│
├── hooks/
├── lib/
├── services/
├── i18n/
├── types/
└── utils/
```

Do not create a giant `components/` directory containing unrelated business logic.

---

# 4. Backend Architecture

NestJS modules must represent business domains.

Preferred structure:

```text
src/
├── auth/
├── users/
├── roles/
├── products/
├── categories/
├── variants/
├── colors/
├── sizes/
├── discounts/
├── homepage/
├── orders/
├── media/
├── settings/
├── excel/
├── audit/
└── common/
```

Each business module should encapsulate its own:

* Controller
* Application/service layer
* Domain logic where required
* DTOs
* Repository abstraction where appropriate
* Persistence implementation
* Tests

Controllers must remain thin.

Controllers should NOT contain business logic.

---

# 5. Database Rules

Use PostgreSQL with Prisma.

Database design must be relational and normalized where appropriate.

Products must support:

* Arabic name.
* English name.
* Arabic description.
* English description.
* SKU.
* Slug.
* Base price.
* Discount price or discount relationship.
* Active/inactive status.
* Featured status.
* Best-seller status.
* New-arrival status.
* Sale status.
* Category.
* Images.
* Variants.

Variants must support combinations such as:

```text
Color + Size + Availability
```

The architecture must allow future inventory tracking without requiring a destructive redesign.

Use:

* Primary keys.
* Foreign keys.
* Unique constraints.
* Appropriate indexes.
* Created timestamps.
* Updated timestamps.
* Soft deletion where business requirements justify it.

Never expose raw database entities directly as API contracts when a dedicated DTO/response model is more appropriate.

---

# 6. No Hardcoded Business Content

Business-controlled content MUST NOT be hardcoded inside React components or backend source code.

Examples of dynamic content:

* Store name.
* Logo.
* Favicon.
* Hero content.
* Homepage sections.
* Banners.
* Product names.
* Product descriptions.
* Categories.
* Discounts.
* WhatsApp number.
* Social links.
* Contact information.
* Promotional content.

These must be controlled through the database and administrative dashboard.

Static technical UI labels may use the localization system.

---

# 7. Homepage CMS

The homepage must be CMS-driven.

Sections should support:

* Enable/disable.
* Ordering.
* Arabic title.
* English title.
* Arabic description.
* English description.
* Images.
* CTA configuration.
* Product selection.
* Category selection.

The frontend must render sections from configuration rather than assuming a fixed hardcoded order.

Example:

```text
Homepage
├── Hero
├── Categories
├── New Arrivals
├── Best Sellers
├── Sale
└── Promotional Banner
```

The order must be configurable from the dashboard.

---

# 8. Authentication and Authorization

Authentication must use secure JWT-based authentication with refresh tokens.

Implement RBAC.

Example roles:

```text
SUPER_ADMIN
ADMIN
MANAGER
EDITOR
```

Authorization must be enforced on the backend.

Frontend route protection is NOT a replacement for backend authorization.

Never trust:

* User-submitted role IDs.
* User-submitted permissions.
* Client-side authorization.
* Hidden frontend buttons as a security mechanism.

---

# 9. Validation

Validate all external input.

Use DTOs and schema validation.

Validate:

* Request bodies.
* Query parameters.
* Route parameters.
* File uploads.
* Excel imports.
* Authentication input.

Never trust frontend validation alone.

Backend validation is mandatory.

---

# 10. API Standards

Use RESTful API design.

Use consistent:

* HTTP methods.
* HTTP status codes.
* Response structures.
* Error structures.
* Pagination.
* Filtering.
* Sorting.
* Search parameters.

Document APIs using Swagger/OpenAPI.

Avoid exposing internal implementation details through API responses.

---

# 11. Error Handling

Implement centralized error handling.

Errors must:

* Have predictable structures.
* Be useful for frontend consumption.
* Avoid exposing secrets.
* Avoid leaking database internals.
* Be logged appropriately.

Do not silently swallow exceptions.

Do not use generic `try/catch` blocks everywhere without a reason.

---

# 12. Product Management

Products must support:

* CRUD.
* Multiple images.
* Categories.
* Colors.
* Sizes.
* Variants.
* Availability.
* SKU.
* Pricing.
* Discounts.
* Featured products.
* Best sellers.
* New arrivals.
* Sale status.

Product deletion must consider references and historical orders.

Prefer archiving/deactivation over destructive deletion when historical integrity matters.

---

# 13. WhatsApp Ordering

There is NO online payment gateway in the initial version.

The ordering flow is:

```text
Customer
    ↓
Product
    ↓
Select Color
    ↓
Select Size
    ↓
Validate Availability
    ↓
Create Order
    ↓
Generate WhatsApp Message
    ↓
Open WhatsApp
```

The generated message should contain:

* Product name.
* SKU if available.
* Selected color.
* Selected size.
* Quantity.
* Price.
* Product URL.
* Order reference.

The WhatsApp number must be configurable from the dashboard.

---

# 14. Orders

Even though payment is handled through WhatsApp, orders should be persisted.

Recommended statuses:

```text
PENDING
CONTACTED
CONFIRMED
PROCESSING
COMPLETED
CANCELLED
```

Do not store payment information because the platform does not process payments.

Order history must preserve the product information required for historical accuracy.

---

# 15. Discounts

The system must support configurable discounts.

At minimum:

* Percentage discount.
* Fixed discount.
* Start date.
* End date.
* Active/inactive status.

Price calculation must happen in a centralized business rule.

Do not duplicate discount calculations across multiple frontend components.

---

# 16. Excel Import / Export

Excel functionality must use a controlled workflow:

```text
Upload
↓
Parse
↓
Validate
↓
Preview
↓
Show validation errors
↓
Confirm
↓
Import
```

Never directly insert unvalidated Excel rows into production data.

Import validation must detect:

* Missing required fields.
* Invalid prices.
* Invalid categories.
* Invalid sizes.
* Invalid colors.
* Duplicate SKUs.
* Invalid values.

Export functionality must generate a structured product spreadsheet.

---

# 17. Internationalization

The website MUST support:

* Arabic.
* English.

Arabic must use RTL.

English must use LTR.

Never hardcode user-facing text inside components.

Use an i18n system.

Business content must have Arabic and English fields where appropriate.

Example:

```text
nameAr
nameEn

descriptionAr
descriptionEn
```

The system must support switching language without requiring a page rebuild.

---

# 18. Theme System

The website must support:

* Light mode.
* Dark mode.

Use design tokens/CSS variables.

Do not scatter hardcoded colors throughout components.

Theme configuration should be centralized.

Brand colors should be configurable where practical.

---

# 19. Branding

The dashboard must control:

* Store name.
* Logo.
* Favicon.
* Primary color.
* Secondary color.
* Accent color.
* Social links.
* WhatsApp number.
* Contact information.

Do not assume a permanent brand name in source code.

---

# 20. Media Management

Product and homepage images must use centralized media handling.

Support:

* Upload.
* Replace.
* Delete/archive.
* Preview.
* Alt text.
* Ordering.

Images should be optimized appropriately.

Never store large binary images directly inside PostgreSQL.

---

# 21. Performance

Performance is a first-class requirement.

Frontend:

* Lazy load images.
* Optimize image sizes.
* Use responsive images.
* Avoid unnecessary re-renders.
* Use pagination/infinite loading where appropriate.
* Lazy load heavy routes.
* Avoid unnecessarily large client bundles.

Backend:

* Use database indexes.
* Avoid N+1 queries.
* Paginate large datasets.
* Select only required fields.
* Avoid unnecessary database round trips.

---

# 22. Security

Follow secure-by-default principles.

Implement:

* Password hashing.
* JWT security.
* Refresh token rotation where appropriate.
* RBAC.
* Rate limiting.
* Input validation.
* File type validation.
* File size limits.
* Secure CORS configuration.
* Secure HTTP headers.
* Environment variable secrets.
* Audit logging for sensitive admin actions.

Never commit secrets.

Never expose `.env` values to the frontend unless explicitly intended.

---

# 23. Code Quality

Use TypeScript strict mode.

Avoid:

* `any` unless technically justified.
* Duplicate logic.
* Giant components.
* Giant services.
* God classes.
* Magic numbers.
* Magic strings.
* Deeply nested conditional logic.
* Unnecessary abstractions.

Prefer:

* Small focused functions.
* Explicit types.
* Reusable components.
* Clear naming.
* Composition.
* Dependency injection.
* Testable services.

---

# 24. Testing

Important business logic must be testable.

Prioritize tests for:

* Authentication.
* Authorization.
* Product creation.
* Product variants.
* Discount calculations.
* Product availability.
* Order creation.
* Excel validation.
* Excel import.
* Localization behavior.
* Critical admin permissions.

Before considering a major feature complete:

```text
Type Check
↓
Lint
↓
Unit Tests
↓
Integration Tests where appropriate
↓
Production Build
```

---

# 25. Development Workflow

Never build the entire application in one uncontrolled operation.

Implement in phases.

Recommended order:

```text
1. Project Foundation
2. Design System
3. Database
4. Authentication
5. Admin Layout
6. Product Management
7. Categories / Variants
8. Homepage CMS
9. Storefront
10. WhatsApp Orders
11. Excel Import/Export
12. Branding Settings
13. i18n
14. Theme System
15. SEO
16. Performance
17. Security Audit
18. Testing
19. Production Review
```

After every major phase:

* Run type checking.
* Run linting.
* Run tests.
* Review architecture.
* Fix regressions before continuing.

---

# 26. AI Agent Rules

The AI agent MUST:

1. Inspect existing code before modifying it.
2. Reuse existing components when appropriate.
3. Follow existing architecture.
4. Avoid unnecessary dependencies.
5. Avoid rewriting working systems without justification.
6. Explain architectural trade-offs for significant changes.
7. Never introduce hardcoded business content.
8. Never bypass backend authorization.
9. Never expose secrets.
10. Preserve backward compatibility where practical.
11. Test important changes.
12. Keep changes focused and reviewable.

Before implementing a major feature, identify:

* Required domain entities.
* Database changes.
* API changes.
* Frontend changes.
* Security implications.
* Localization requirements.
* Testing requirements.

---

# 27. Definition of Done

A feature is NOT considered complete simply because the UI renders.

A feature is complete only when:

```text
Architecture ✓
Database ✓
API ✓
Validation ✓
Authorization ✓
UI ✓
Loading states ✓
Error states ✓
Empty states ✓
Arabic ✓
English ✓
RTL ✓
LTR ✓
Dark mode ✓
Light mode ✓
Responsive ✓
Tests ✓
Type check ✓
Lint ✓
Production build ✓
```

When a requirement conflicts with this architecture, prefer the simplest solution that preserves security, maintainability, scalability, and user experience.
