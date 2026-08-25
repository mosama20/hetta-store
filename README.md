# 🛍️ Fashion Store Platform (Hetta / CRAFT)

> منصة تجارة إلكترونية متكاملة وعصرية للأزياء (متجر إلكتروني + لوحة تحكم إدارية متقدمة + تطبيق ويب تقدمي PWA + نظام تحليلات وتتبع الزوار + سلة مشتريات وطلب مباشر عبر واتساب + دعم كامل للرفع السحابي على Vercel و Supabase).

---

## 📑 جدول المحتويات / Table of Contents
1. [نظرة عامة على المشروع (Overview)](#-نظرة-عامة-overview)
2. [المميزات الرئيسية (Key Features)](#-المميزات-الرئيسية-key-features)
3. [التقنيات المستخدمة (Tech Stack)](#-التقنيات-المستخدمة-tech-stack)
4. [هيكلية المشروع (Project Structure)](#-هيكلية-المشروع-project-structure)
5. [خطوات التثبيت والتشغيل المحلي (Local Development)](#-خطوات-التثبيت-والتشغيل-المحلي-local-development)
6. [إعداد المتغيرات البيئية (Environment Variables)](#-إعداد-المتغيرات-البيئية-environment-variables)
7. [إعداد وتجهيز قاعدة البيانات (Database & Prisma)](#-إعداد-وتجهيز-قاعدة-البيانات-database--prisma)
8. [بيانات تسجيل دخول لوحة الإدارة (Admin Credentials)](#-بيانات-تسجيل-الدخول-admin-credentials)
9. [دليل النشر السحابي الشامل (Vercel & Supabase Deployment)](#-دليل-النشر-السحابي-الشامل-vercel--supabase-deployment)
10. [التوثيق البرمجي وواجهة الـ API (Swagger)](#-توثيق-الـ-api-swagger)
11. [أوامر الصيانة والبناء (Build & Scripts)](#-أوامر-الصيانة-والبناء-scripts)

---

## 🌟 نظرة عامة (Overview)

تم بناء المنصة كـ **Monorepo** موحد وعالي الأداء لتوفير تجربة تسوق شبابية وسريعة، تدعم اللغتين **العربية (RTL)** و **الإنجليزية (LTR)** مع التبديل الفوري بين **الثيم الداكن والفاتح (Dark & Light Mode)**، ولوحة تحكم شاملة للمديرين لإدارة المنتجات، الطلبات، الكوبونات، المحتوى الإعلاني، وسجلات التتبع والتحليلات، مع قابلية العمل كـ **Serverless Fullstack Application** بالكامل على **Vercel** مدعوماً بقاعدة بيانات **Supabase PostgreSQL**.

---

## ✨ المميزات الرئيسية (Key Features)

### 🛒 1. واجهة المتجر للعملاء (Storefront)
- **واجهة عصرية تفاعلية**: سلايدر رئيسي (Hero Slider)، بانرات ترويجية، عداد خصومات الفلاش سيل، وشريط إعلاني متحرك (Marquee & Announcement Bar).
- **نظام فلترة وتصفح متقدم**: فلترة فورية حسب التصنيف، المقاس، اللون، ونطاق السعر مع ترتيب حسب الأحدث أو الأكثر مبيعاً أو السعر.
- **تفاصيل المنتج المتقدمة**: معرض صور متعدد الزوايا، اختيار الألوان والمقاسات التفاعلي، دليل المقاسات الذكي (Size Guide Modal)، وحساب الخصومات آلياً.
- **سلة مشتريات تفاعلية**: شريط سلة جانبي سريع (Quick Drawer)، تنبيهات متحركة عند إضافة المنتجات، وحساب إجمالي الطلب فورياً.
- **إتمام الطلب عبر الواتساب & الدفع عند الاستلام**: توليد رسالة واتساب منسقة ومفصلة ببيانات العميل والمنتجات والمقاسات والألوان والأسعار بضغطة زر.
- **تطبيق ويب تقدمي (PWA / Mobile Install Prompt)**: ويدجت ذكية تظهر لمستخدمي الموبايل لإنشاء اختصار وتثبيت التطبيق على الشاشة الرئيسية مباشرة بشعار وهوية المتجر.

### 🛡️ 2. لوحة التحكم الإدارية (Admin Dashboard)
- **إحصائيات وتقارير تفاعلية**: إجمالي المبيعات، الطلبات المعلقة والمكتملة، ونواقص المخزون (Low Stock Alerts).
- **إدارة المنتجات والأشكال المتعددة (Variants)**: صور متعددة، أكواد SKU، إدارة الألوان، المقاسات، والأسعار قبل وبعد الخصم.
- **استيراد وتصدير إكسيل (Excel Tools)**: رفع وتنزيل المنتجات والأصناف بالجملة بملفات Excel مع تدقيق البيانات.
- **إدارة الطلبات (Orders Management)**: تتبع مراحل الطلب (قيد الانتظار، تم التواصل، مؤكد، جاري التجهيز، تم التوصيل، ملغي) مع طباعة الفاتورة وتعديل الحالة.
- **نظام الكوبونات والخصومات (Discounts Engine)**: خصومات نسبية أو مبالغ ثابتة على منتجات أو تصنيفات محددة مع تحديد تواريخ البداية والنهاية.
- **إدارة المحتوى وتخصيص الهوية (CMS & Settings)**: تغيير اسم المتجر، اللوجو، الفافيكون، رقم الواتساب، العملة، نصوص الإعلانات، وحسابات السوشيال ميديا مع مزامنة فورية دون إعادة تشغيل السيرفر.
- **مركز التحليلات المتقدم (Analytics Dashboard)**: تتبع عدد الزوار المباشر، الزيارات، مصادر الزيارات (UTM Source/Campaigns)، تفكك الأجهزة والمتصفحات، ومعدل الارتداد (Bounce Rate).
- **تتبع السلات المتروكة (Abandoned Carts)**: تسجيل تلقائي للزوار الذين أضافوا منتجات للسلة ولم يكملوا الطلب مع قيمتها الإجمالية.
- **سجل الرقابة والأمان (Audit Logs)**: تسجيل وتوثيق كل حركة وتعديل يتم في لوحة الإدارة مع الـ IP والتفاصيل.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### 💻 الواجهة الأمامية (Frontend - `apps/web`)
- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS + Class Variance Authority + Custom Design Tokens
- **Routing**: React Router DOM v7
- **State & Sync**: Custom Reactive Stores + LocalStorage Persistence
- **Animations & Icons**: Framer Motion + Lucide React
- **Data Fetching**: TanStack React Query + Fetch API Client
- **Forms & Validation**: React Hook Form + Zod
- **Excel Processing**: SheetJS (XLSX)

### ⚙️ الواجهة الخلفية (Backend - `apps/api` & `api/index.ts`)
- **Framework**: NestJS 11 + Express + TypeScript
- **Serverless Adapter**: ExpressAdapter مهيأ للتشغيل السحابي كـ Vercel Serverless Function
- **Database & ORM**: PostgreSQL + Prisma ORM (مع دعم الـ Connection Pooling عبر `directUrl`)
- **Authentication**: JWT + Bcrypt Password Hashing + Role-Based Access Control (RBAC)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger / OpenAPI

### 📦 حزم المونوريبو المشتركة (Shared Packages)
- **`packages/shared`**: العقود والأنماط المشتركة (TypeScript Types, Interfaces, Enums, DTOs).
- **`packages/config`**: الإعدادات الموحدة لـ ESLint و TypeScript و Prettier.

---

## 📁 هيكلية المشروع (Project Structure)

```text
fashion-store/
├── api/
│   └── index.ts                      # نقطة انطلاق السيرفرلس لـ Vercel (Serverless Handler)
├── apps/
│   ├── web/                          # تطبيق الفرونت إند (React + Vite)
│   │   ├── public/                   # الأصول الثابتة (manifest.json, sw.js, favicon.svg)
│   │   ├── src/
│   │   │   ├── api/                  # عميل الاتصال بالسيرفر (API Client)
│   │   │   ├── components/
│   │   │   │   ├── admin/            # مكونات لوحة الإدارة
│   │   │   │   ├── storefront/       # مكونات متجر العملاء (Header, Footer, PWA Prompt...)
│   │   │   │   └── common/           # عناصر الـ UI العامة (Buttons, Modals, Uploaders...)
│   │   │   ├── pages/
│   │   │   │   ├── admin/            # صفحات لوحة التحكم
│   │   │   │   └── storefront/       # صفحات المتجر العام
│   │   │   ├── store/                # إدارة الحالة العامة (Theme, Settings, Cart, Auth)
│   │   │   └── routes/               # توجيه المسارات وحمايتها
│   │   ├── index.html
│   │   ├── tailwind.config.js
│   │   └── vite.config.ts
│   │
│   └── api/                          # تطبيق الباك إند (NestJS + Prisma)
│       ├── prisma/                   # مخطط قاعدة البيانات والتهجير (schema.prisma, seed.ts)
│       └── src/
│           ├── modules/              # وحدات التطبيق (Products, Orders, Auth, CMS, Analytics...)
│           ├── common/               # الفلاتر، الحراس، والـ Interceptors
│           └── main.ts               # نقطة انطلاق السيرفر وتفعيل Swagger محلياً
│
├── packages/
│   ├── shared/                       # الأنماط والعقود المشتركة
│   └── config/                       # إعدادات الـ Tooling المشتركة
│
├── vercel.json                       # إعدادات البناء والتوجيه لـ Vercel
├── package.json                      # إعدادات الـ Workspace الرئيسية
└── README.md                         # دليل المشروع
```

---

## 🚀 خطوات التثبيت والتشغيل المحلي (Local Development)

### 1. تثبيت الحزم
```bash
npm install
```

### 2. توليد عميل Prisma وتجهيز قاعدة البيانات
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. تشغيل السيرفرين معاً بأمر واحد:
```bash
npm run dev
```

- **المتجر (Storefront)**: [http://localhost:5173](http://localhost:5173)
- **الـ API والسيرفر**: [http://localhost:4000/api](http://localhost:4000/api)
- **توثيق Swagger**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🔐 إعداد المتغيرات البيئية (Environment Variables)

قم بإنشاء ملف `.env` في المجلد الرئيسي للمشروع أو استخدم نفس القيم في إعدادات المنصة السحابية:

```env
# Server
PORT=4000
NODE_ENV=development

# Database (Supabase / PostgreSQL)
# منفذ 6543 مع pgbouncer للاتصالات السريعة
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# منفذ 5432 المباشر لعمليات الـ Migrations والـ Seed
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Authentication & Security
JWT_ACCESS_SECRET=fashion_store_super_secret_jwt_access_key_2026
JWT_REFRESH_SECRET=fashion_store_super_secret_jwt_refresh_key_2026
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS & Frontend URLs
CORS_ORIGINS=http://localhost:5173
APP_URL=http://localhost:5173
API_URL=http://localhost:4000/api

# Storage
STORAGE_PROVIDER=LOCAL
```

---

## 🔑 بيانات تسجيل الدخول (Admin Credentials)

بعد تنفيذ أمر الـ Seed، تتوفر الحسابات الإدارية التالية للوحة التحكم على المسار `/admin/login`:

- **البريد الإلكتروني الأساسي**: `admin@fashionstore.com` أو `aymanmossad08@gmail.com`
- **كلمة المرور الافتراضية**: `Admin@Fashion2026!`

---

## ☁️ دليل النشر السحابي الشامل (Vercel & Supabase Deployment)

المشروع جاهز 100% للنشر السحابي المتكامل على منصة **Vercel** مع قاعدة بيانات **Supabase**:

### 1. إعداد قاعدة بيانات Supabase
1. أنشئ مشروعاً جديداً على [Supabase](https://supabase.com).
2. من **Project Settings > Database > Connection string > URI**:
   - انسخ رابط **Transaction Pooler (Port 6543)** وضعه في `DATABASE_URL`.
   - انسخ رابط **Session Pooler / Direct (Port 5432)** وضعه في `DIRECT_URL`.
3. طبّق الجداول والبيانات الأولية من جهازك محلياً:
   ```bash
   npx prisma db push --schema=apps/api/prisma/schema.prisma
   npm run prisma:seed
   ```

### 2. الربط والرفع على Vercel
1. اربط مستودع الـ GitHub في [Vercel Dashboard](https://vercel.com/dashboard).
2. اضبط الإعدادات التالية:
   - **Root Directory:** `./` (المجلد الرئيسي للمشروع وليس `apps/api`)
   - **Application Preset:** `Vite`
   - **Build Command:** `npm run prisma:generate && npm run build:web`
   - **Output Directory:** `apps/web/dist`
3. في قسم **Environment Variables**، أضف المتغيرات:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_ACCESS_EXPIRATION` (`15m`)
   - `JWT_REFRESH_EXPIRATION` (`7d`)
   - `NODE_ENV` (`production`)
   - `STORAGE_PROVIDER` (`LOCAL`)
4. اضغط **Deploy** 🚀.

---

## 📖 توثيق الـ API (Swagger)

الباك إند مجهز بتوثيق تفاعلي كامل لكافة الـ Endpoints:
- **رابط توثيق Swagger**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🛠️ أوامر الصيانة والبناء (Scripts)

| الأمر (Command) | الوظيفة (Description) |
| :--- | :--- |
| `npm run dev` | تشغيل سيرفر الـ API وسيرفر الـ Web بالتوازي في بيئة التطوير |
| `npm run build` | بناء حزم الإنتاج لجميع تطبيقات ومكتبات المونوريبو |
| `npm run build:web` | بناء حزمة الإنتاج لتطبيق الفرونت إند فقط |
| `npm run prisma:generate` | توليد عميل Prisma Client للتعامل مع قاعدة البيانات |
| `npm run prisma:migrate` | تطبيق تعديلات الـ Migrations على قاعدة البيانات |
| `npm run prisma:seed` | تعبئة البيانات الأولية (المنتجات، الحسابات، الأقسام، الإعدادات) |
| `npm run typecheck` | فحص الأنماط البرمجية الصارمة عبر TypeScript لكافة التطبيقات |
| `npm run lint` | فحص الكود البرمجي ومعايير الجودة عبر ESLint |
| `npm run format` | تنسيق وترتيب الأكواد تلقائياً عبر Prettier |

---

<p align="center">
  صُنع بكل إتقان واحترافية بواسطة فريق التطوير 🚀
</p>
