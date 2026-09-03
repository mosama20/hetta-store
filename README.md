# 🛍️ Fashion Store Platform (Hetta / CRAFT)

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue.svg?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue.svg?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/NestJS-11-red.svg?logo=nestjs" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/Prisma-6-darkblue.svg?logo=prisma" alt="Prisma ORM" />
  <img src="https://img.shields.io/badge/Vite-6-purple.svg?logo=vite" alt="Vite 6" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-38bdf8.svg?logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Database-Supabase_PostgreSQL-emerald.svg?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Deployment-Vercel_Serverless-black.svg?logo=vercel" alt="Vercel" />
</p>

> **منصة تجارة إلكترونية متكاملة وعصرية للأزياء** تجمع بين:
> - متجر إلكتروني فائق السرعة والأناقة بتجربة تسوق شبابية واستثنائية.
> - خدمة وسيط الشراء المباشر من **SHEIN** مع المعالجة الذكية للروابط والطلب عبر واتساب.
> - لوحة تحكم إدارية شاملة ومتقدمة لإدارة المنتجات، الطلبات، الخصومات، الهوية، والتحليلات.
> - بنية سحابية كاملة مهيأة للعمل كـ **Serverless Fullstack Application** على **Vercel** مدعومة بقاعدة بيانات **Supabase PostgreSQL**.

---

## 📑 جدول المحتويات / Table of Contents
1. [نظرة عامة على المشروع (Overview)](#-نظرة-عامة-overview)
2. [المميزات الرئيسية للمنصة (Key Features)](#-المميزات-الرئيسية-key-features)
   - [واجهة متجر العملاء (Storefront)](#1-واجهة-المتجر-للعملاء-storefront)
   - [خدمة وسيط الشراء من شي إن (SHEIN Concierge)](#2-خدمة-وسيط-الشراء-من-شي-إن-shein-concierge-service)
   - [لوحة التحكم الإدارية (Admin Dashboard)](#3-لوحة-التحكم-الإدارية-admin-dashboard)
3. [خريطة المسارات والصفحات (Routes & Pages)](#-خريطة-المسارات-والصفحات-routes--pages)
4. [البنية التقنية (Tech Stack)](#-التقنيات-المستخدمة-tech-stack)
5. [هيكلية المشروع (Project Structure)](#-هيكلية-المشروع-project-structure)
6. [التشغيل والتطوير المحلي (Local Development)](#-خطوات-التثبيت-والتشغيل-المحلي-local-development)
7. [المتغيرات البيئية (Environment Variables)](#-إعداد-المتغيرات-البيئية-environment-variables)
8. [قاعدة البيانات والإنشاء الذاتي (Database & Self-Healing)](#-قاعدة-البيانات-والإنشاء-الذاتي-database--self-healing)
9. [بيانات تسجيل الدخول للإدارة (Admin Credentials)](#-بيانات-تسجيل-الدخول-admin-credentials)
10. [دليل الرفع والنشر على Vercel و Supabase](#-دليل-النشر-السحابي-الشامل-vercel--supabase-deployment)
11. [توثيق الـ API عبر Swagger](#-توثيق-الـ-api-swagger)
12. [أوامر الصيانة والبناء (Scripts)](#-أوامر-الصيانة-والبناء-scripts)

---

## 🌟 نظرة عامة (Overview)

تم بناء المنصة وفق معمارية **Monorepo** موحدة وقوية، مصممة خصيصاً لتوفير تجربة مستخدم سريعة وعصرية لقطاع الأزياء في مصر والشرق الأوسط:
- **دعم كامل للغتين:** التبديل السلس بين **العربية (RTL)** و **الإنجليزية (LTR)**.
- **ثيمات مريحة للعين:** التبديل الفوري بين **الوضع الليلي (Dark Mode)** و **الوضع الفاتح (Light Mode)**.
- **تطبيق ويب تقدمي (PWA):** ويدجت ذكية لتثبيت المتجر كأيقونة تطبيق على الهواتف الذكية.
- **وسيط طلبات شي إن:** حل متكامل يتيح للمشترين لصق روابط منتجات SHEIN وإتمام الطلب محلياً بالجنيه المصري أو الريال.
- **معمارية Serverless مرنة:** الباك إند مدمج بالكامل كـ ExpressAdapter ليعمل على Vercel Serverless Functions بسلاسة ودون سيرفرات مخصصة.

---

## ✨ المميزات الرئيسية (Key Features)

### 1. واجهة المتجر للعملاء (Storefront)
- **واجهة تفاعلية نابضة بالحياة**: سلايدر رئيسي (Hero Slider) جذاب، بانرات ترويجية، عداد فلاش سيل تنازلي، وشريط إعلاني متحرك (Marquee).
- **فلترة وتصفح ذكي**: بحث فوري وفلاتر متعددة حسب التصنيف، السعر، اللون، المقاس، وحالة الخصومات.
- **صفحة تفاصيل المنتج (Product Details)**: معرض صور تفاعلي متعدد الزوايا، اختيار الألوان والمقاسات، دليل المقاسات الذكي (Size Guide)، وتنبيهات المخزون المتبقي.
- **سلة مشتريات سلسة (Quick Drawer Cart)**: شريط سلة منزلق مع إمكانية تعديل الكميات وحساب الإجمالي فورياً.
- **إتمام الطلب السريع (Quick Checkout & WhatsApp)**: دعم الدفع عند الاستلام مع إرسال تفاصيل الفاتورة مباشرة عبر رسالة واتساب منسقة ومفصلة.
- **سياسات متكاملة**: صفحات مخصصة لسياسة الشحن، الاستبدال والاسترجاع، الأسئلة الشائعة (FAQ)، ومن نحن.

---

### 2. خدمة وسيط الشراء من شي إن (SHEIN Concierge Service)
- **معالج الروابط الذكي (Smart Link Parser)**:
  - يقبل كافة أشكال روابط SHEIN: روابط الموقع الكاملة، الروابط المختصرة (`shein.top`)، أو نصوص المشاركة المنسوخة من التطبيق باللغة العربية أو الإنجليزية.
  - ينقي الرابط ويفك التوجيه تلقائياً دون إظهار أخطاء للمستخدم.
  - يستخرج اسم الموديل ومعرف القطعة (`Goods ID`) من بنية الرابط مباشرة للتغلب على حماية الكابتشا وحظر الروبوتات من موقع شي إن.
- **تخصيص الطلب الكامل للمشتري**:
  - إمكانية تعديل وكتابة اسم أو وصف القطعة بحرية باللغة العربية أو الإنجليزية (مثلاً: "فستان سهرة أسود").
  - أزرار سريعة للمقاسات (XS إلى 3XL و Free Size) والألوان الشائعة (`حسب الرابط`، `أسود`، `أبيض`، `بيج`، `أحمر`، `كحلي`) مع إمكانية كتابة أي لون مخصص.
  - تسعير فوري ومرن: يدخل العميل سعر القطعة المعروض على شي إن بالريال السعودي 🇸🇦 أو بالجنيه المصري 🇪🇬 مع التحويل التلقائي وفق سعر الصرف.
  - دعم إضافة عدة منتجات من شي إن في سلة واحدة قبل تأكيد الشحن.
  - زر مباشر لمعاينة وفتح الرابط على موقع شي إن للتأكد من توفر القطعة ومواصفاتها.
- **تأكيد الطلب وتوليد رسالة الواتساب المتكاملة**:
  - حفظ فوري للطلب وعناصره في قاعدة البيانات برقم كودي مميز (`SHN-xxxx-xxxx`).
  - توليد رسالة واتساب احترافية تشمل:
    - رابط مباشر قابل للفتح لكل قطعة من شي إن.
    - المقاس، اللون، الكمية، والسعر.
    - بيانات المستلم (الاسم، الهاتف، المحافظة، العنوان، وملاحظات التوصيل).
    - تفصيل الحساب الكامل (سعر المنتجات + الشحن الدولي + رسوم الخدمة والتخليص + التوصيل المحلي = الإجمالي النهائي).
- **إدارة طلبات شي إن في لوحة التحكم (`/darsh50/shein-orders`)**:
  - بطاقات وجداول شاملة لجميع طلبات الاستيراد.
  - زر مباشر لفتح رابط المنتج على شي إن للشراء الفوري.
  - زر محادثة العميل على واتساب بضغطة زر.
  - دورة حياة كاملة للطلب: `قيد الانتظار` ➔ `تم التأكيد مع العميل` ➔ `تم الشراء من SHEIN` ➔ `قيد الشحن والتوصيل` ➔ `تم التسليم`.
  - تحكم كامل بأسعار الشحن والخدمة وصرف العملة من صفحة الإعدادات.

---

### 3. لوحة التحكم الإدارية (Admin Dashboard)
- **مركز الإحصائيات (Overview & KPIs)**: إجمالي المبيعات، عدد الطلبات، نواقص المخزون، والمنتجات الأكثر طلباً.
- **إدارة المنتجات والأشكال المتعددة (Variants)**: صور متعددة، أكواد SKU، خيارات الألوان والمقاسات، والسعر قبل وبعد الخصم.
- **أدوات إكسيل المتقدمة (Excel Bulk Tools)**: استيراد وتصدير المنتجات والأصناف بالجملة عبر ملفات Excel مع فحص البيانات.
- **إدارة الطلبات (Orders Lifecycle)**: متابعة الطلبات بمراحلها (قيد الانتظار، مؤكد، جاري التجهيز، قيد التوصيل، تم التوصيل، ملغي) مع طباعة الفواتير.
- **محرك الخصومات والكوبونات (Discounts Engine)**: إنشاء كوبونات بنسب مئوية أو مبالغ ثابتة مع تحديد صلاحيات الاستخدام وتواريخ البداية والنهاية.
- **إدارة الهوية والمحتوى (CMS & Brand Settings)**: تعديل اسم المتجر، اللوجو، الفافيكون، رقم الواتساب، العملة، نصوص الإعلانات، وروابط السوشيال ميديا مع حفظ فوري ومزامنة تلقائية.
- **لوحة التحليلات المتقدمة (Analytics & Tracking)**:
  - تتبع الزوار المباشر وعدد الجلسات الإجمالية.
  - مصادر الزيارات والحملات الإعلانية (UTM Parameters).
  - توزيع الأجهزة والمتصفحات ومعدل الارتداد (Bounce Rate).
  - رصد السلات المتروكة (Abandoned Carts) بقيمتها المالية وتفاصيل منتجاتها.
- **سجل الأمان والرقابة (Audit Logs)**: توثيق دقيق لكل عملية تعديل أو حذف أو إضافة في لوحة الإدارة مع عنوان الـ IP والوقت.

---

## 🗺️ خريطة المسارات والصفحات (Routes & Pages)

### مسارات المتجر (Storefront Routes)
| المسار (Route) | الوصف (Description) |
| :--- | :--- |
| `/` | الصفحة الرئيسية للمتجر |
| `/shop` | صفحة المنتجات والكتالوج العام مع الفلاتر |
| `/shein-order` | صفحة طلب وسيط الشراء من شي إن (SHEIN Concierge) |
| `/product/:slug` | صفحة تفاصيل المنتج |
| `/cart` | صفحة سلة المشتريات |
| `/checkout` | صفحة إتمام الطلب وبيانات الشحن |
| `/order-success` | صفحة نجاح الطلب مع زر إرسال واتساب |
| `/about` | صفحة من نحن |
| `/faq` | صفحة الأسئلة الشائعة |
| `/shipping-policy` | صفحة سياسة الشحن والتوصيل |
| `/returns-policy` | صفحة سياسة الاستبدال والاسترجاع |

### مسارات لوحة الإدارة (Admin Routes - البادئة الافتراضية `/darsh50` أو `/admin`)
| المسار (Route) | الوصف (Description) |
| :--- | :--- |
| `/darsh50/login` | تسجيل الدخول للوحة التحكم |
| `/darsh50` | الصفحة الرئيسية للوحة التحكم والإحصائيات |
| `/darsh50/products` | إدارة المنتجات والأصناف |
| `/darsh50/shein-orders` | إدارة طلبات شي إن والاستيراد |
| `/darsh50/orders` | إدارة طلبات المتجر وتحديث الحالات |
| `/darsh50/categories` | إدارة التصنيفات والأقسام |
| `/darsh50/discounts` | إدارة الكوبونات والعروض الترويجية |
| `/darsh50/cms` | إدارة محتوى المتجر، السلايدر، والبانرات |
| `/darsh50/analytics` | لوحة تحليلات الزوار والسلات المتروكة |
| `/darsh50/settings` | إعدادات المتجر العامة، الواتساب، وأسعار شي إن |
| `/darsh50/media` | مكتبة الوسائط وإدارة الصور |
| `/darsh50/audit-logs` | سجلات الرقابة وتتبع العمليات الإدارية |

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### 💻 الواجهة الأمامية (Frontend - `apps/web`)
- **Core**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS + Class Variance Authority + Custom Design System
- **Routing**: React Router DOM v7
- **State & Sync**: Custom Reactive Stores + LocalStorage Persistence
- **Animations & Icons**: Framer Motion + Lucide React
- **Data Fetching**: TanStack React Query + Fetch API Client
- **Forms & Validation**: React Hook Form + Zod
- **Excel Processing**: SheetJS (XLSX)

### ⚙️ الواجهة الخلفية (Backend - `apps/api` & `api/index.js`)
- **Core**: NestJS 11 + Express + TypeScript
- **Serverless Adapter**: ExpressAdapter مهيأ للعمل كـ Vercel Serverless Function
- **Database & ORM**: PostgreSQL + Prisma ORM 6 (مع دعم Connection Pooling عبر `directUrl`)
- **Authentication**: JWT + Bcrypt Password Hashing + Role-Based Access Control (RBAC)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger / OpenAPI

### 📦 حزم المونوريبو المشتركة (Shared Packages)
- **`packages/shared`**: الأنواع، الواجهات البرمجية، الثوابت، والـ DTOs المشتركة.
- **`packages/config`**: الإعدادات المركزية لـ TypeScript و ESLint و Prettier.

---

## 📁 هيكلية المشروع (Project Structure)

```text
fashion-store/
├── api/
│   └── index.js                      # نقطة تشغيل Vercel Serverless Functions
├── apps/
│   ├── web/                          # تطبيق الفرونت إند (React 19 + Vite 6)
│   │   ├── public/                   # الأصول الثابتة (manifest.json, icons, favicon)
│   │   ├── src/
│   │   │   ├── api/                  # عملاء الاتصال بالـ API
│   │   │   ├── components/           # المكونات المشتركة ومكونات المتجر والإدارة
│   │   │   ├── pages/                # صفحات المتجر ولوحة التحكم
│   │   │   ├── store/                # إدارة الحالة العامة (Theme, Settings, Cart)
│   │   │   └── routes/               # حماية وتوجيه المسارات
│   │   ├── index.html
│   │   ├── tailwind.config.js
│   │   └── vite.config.ts
│   │
│   └── api/                          # تطبيق الباك إند (NestJS 11 + Prisma 6)
│       ├── prisma/                   # مخطط قاعدة البيانات، التهجير، والـ Seed
│       │   ├── schema.prisma
│       │   ├── migrations/
│       │   └── seed.ts
│       └── src/
│           ├── shein/                # وحدة طلبات واستيراد شي إن
│           ├── products/             # وحدة المنتجات والمخزون
│           ├── orders/               # وحدة الطلبات العادية
│           ├── analytics/            # وحدة تتبع الزوار والسلات المتروكة
│           ├── settings/             # وحدة إعدادات المتجر والـ CMS
│           ├── auth/                 # وحدة المصادقة والصلاحيات
│           ├── common/               # الحراس، الفلاتر، والـ Interceptors
│           └── main.ts               # نقطة الانطلاق المحلية وتفعيل Swagger
│
├── packages/
│   ├── shared/                       # الأنماط والعقود المشتركة بين السيرفر والويب
│   └── config/                       # إعدادات الـ Tooling المشتركة
│
├── vercel.json                       # إعدادات البناء والتوجيه لـ Vercel
├── package.json                      # إعدادات الـ Workspace الرئيسية
└── README.md                         # دليل المشروع الشامل
```

---

## 🚀 خطوات التثبيت والتشغيل المحلي (Local Development)

### 1. تثبيت الاعتماديات
```bash
npm install
```

### 2. توليد عميل Prisma وتجهيز قاعدة البيانات
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. تشغيل بيئة التطوير (السيرفرين معاً)
```bash
npm run dev
```

- **المتجر (Storefront)**: [http://localhost:5173](http://localhost:5173)
- **لوحة الإدارة**: [http://localhost:5173/darsh50](http://localhost:5173/darsh50)
- **خادم الـ API**: [http://localhost:4000/api](http://localhost:4000/api)
- **توثيق Swagger**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🔐 إعداد المتغيرات البيئية (Environment Variables)

قم بإنشاء ملف `.env` في المجلد الرئيسي أو في إعدادات المنصة السحابية:

```env
# Server
PORT=4000
NODE_ENV=development

# Database (Supabase / PostgreSQL)
# منفذ 6543 مع pgbouncer للاتصالات السريعة
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# منفذ 5432 المباشر لعمليات التهجير والـ DDL
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# Authentication & JWT Security
JWT_ACCESS_SECRET=fashion_store_super_secret_jwt_access_key_2026
JWT_REFRESH_SECRET=fashion_store_super_secret_jwt_refresh_key_2026
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# URLs & CORS
CORS_ORIGINS=http://localhost:5173
APP_URL=http://localhost:5173
API_URL=http://localhost:4000/api

# Storage
STORAGE_PROVIDER=LOCAL
```

---

## 🛡️ قاعدة البيانات والإنشاء الذاتي (Database & Self-Healing)

تتميز المنصة بنظام **حماية وإنشاء ذاتي ذكي (Self-Healing Runtime Guarantee)**:
1. **جداول شي إن (`shein_orders` و `shein_order_items`)**:
   - خدمة `SheinService` تنفذ فحصاً تلقائياً عبر `onModuleInit()`، وإذا لم تكن الجداول أو الـ Enum موجودة في أي قاعدة بيانات سحابية، يتم إنشاؤها فوراً عبر Raw SQL.
   - عند إنشاء أي طلب جديد، إذا واجه السيرفر عدم وجود الجداول، يقوم بإنشائها فوراً وإعادة المحاولة في نفس اللحظة دون إظهار أي أخطاء للمستخدم.
2. **جداول التحليلات (`visitor_sessions`, `analytics_events`, `abandoned_carts`)**:
   - محمية أيضاً بنظام Fail-Safe يضمن استمرار عمل المنصة وتسجيل الزوار دون توقف.
3. **مزامنة المخطط يدوياً في أي وقت**:
   ```bash
   npx prisma db push --schema=apps/api/prisma/schema.prisma
   ```

---

## 🔑 بيانات تسجيل الدخول (Admin Credentials)

بعد تنفيذ أمر الـ Seed، تتوفر الحسابات الإدارية التالية للدخول إلى لوحة التحكم عبر `/darsh50/login` أو `/admin/login`:

- **البريد الإلكتروني الأساسي**: `admin@fashionstore.com` أو `aymanmossad08@gmail.com`
- **كلمة المرور الافتراضية**: `Admin@Fashion2026!`

---

## ☁️ دليل النشر السحابي الشامل (Vercel & Supabase Deployment)

المنصة مهيأة وجاهزة 100% للنشر كـ **Serverless Monorepo** على Vercel مع قاعدة بيانات Supabase:

### 1. إعداد قاعدة بيانات Supabase
1. أنشئ مشروعاً مجانياً على [Supabase](https://supabase.com).
2. من **Project Settings > Database > Connection string > URI**:
   - انسخ رابط **Transaction Pooler (Port 6543)** وضعه في `DATABASE_URL`.
   - انسخ رابط **Session / Direct (Port 5432)** وضعه في `DIRECT_URL`.
3. طبّق الجداول والبيانات المبدئية من جهازك محلياً:
   ```bash
   npx prisma db push --schema=apps/api/prisma/schema.prisma
   npm run prisma:seed
   ```

### 2. الربط والرفع على Vercel
1. اربط مستودع GitHub في [Vercel Dashboard](https://vercel.com/dashboard).
2. الإعدادات المعتمدة في Vercel:
   - **Root Directory:** `./` (المجلد الرئيسي للمشروع)
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build:shared && npm run prisma:generate && npm run build:api && npm run build:web`
   - **Output Directory:** `apps/web/dist`
3. في قسم **Environment Variables** على Vercel، أضف المتغيرات:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `JWT_ACCESS_EXPIRATION` (`15m`)
   - `JWT_REFRESH_EXPIRATION` (`7d`)
   - `NODE_ENV` (`production`)
   - `STORAGE_PROVIDER` (`LOCAL`)
4. اضغط **Deploy** 🚀، وستعمل المنصة بكامل خدماتها.

---

## 📖 توثيق الـ API (Swagger)

الباك إند مجهز بتوثيق تفاعلي كامل لكافة الـ Endpoints (المصادقة، المنتجات، الطلبات، شي إن، والتحليلات):
- **رابط توثيق Swagger محلياً**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🛠️ أوامر الصيانة والبناء (Scripts)

| الأمر (Command) | الوظيفة (Description) |
| :--- | :--- |
| `npm run dev` | تشغيل سيرفر الـ API وتطبيق الـ Web بالتوازي في بيئة التطوير |
| `npm run build` | بناء حزم الإنتاج لكافة تطبيقات ومكتبات المونوريبو |
| `npm run build:web` | بناء حزمة الإنتاج لتطبيق الفرونت إند فقط |
| `npm run build:api` | بناء حزمة الإنتاج لخادم الباك إند فقط |
| `npm run prisma:generate` | توليد عميل Prisma Client للتعامل مع قاعدة البيانات |
| `npx prisma db push --schema=apps/api/prisma/schema.prisma` | مزامنة جداول المخطط مباشرة مع خادم قاعدة البيانات |
| `npm run prisma:migrate` | تطبيق ملفات التهجير (Migrations) على قاعدة البيانات |
| `npm run prisma:seed` | تعبئة البيانات الأولية (المنتجات، الحسابات، الأقسام، والإعدادات) |
| `npm run typecheck` | فحص الأنماط البرمجية الصارمة عبر TypeScript لكافة المشاريع |
| `npm run lint` | فحص الكود البرمجي ومعايير الجودة عبر ESLint |
| `npm run format` | تنسيق وترتيب الأكواد تلقائياً عبر Prettier |

---

<p align="center">
  صُنع بكل إتقان واحترافية بواسطة فريق التطوير 🚀
</p>
