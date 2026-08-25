# 🛍️ Fashion Store Platform (CRAFT)

> منصة تجارة إلكترونية متكاملة وعصرية للأزياء (متجر إلكتروني + لوحة تحكم إدارية متقدمة + تطبيق ويب تقدمي PWA + نظام تحليلات + طلب مباشر عبر واتساب).

---

## 📑 جدول المحتويات / Table of Contents
1. [نظرة عامة على المشروع (Overview)](#-نظرة-عامة-overview)
2. [المميزات الرئيسية (Key Features)](#-المميزات-الرئيسية-key-features)
3. [التقنيات المستخدمة (Tech Stack)](#-التقنيات-المستخدمة-tech-stack)
4. [هيكلية المشروع (Project Structure)](#-هيكلية-المشروع-project-structure)
5. [متطلبات التشغيل (Prerequisites)](#-متطلبات-التشغيل-prerequisites)
6. [خطوات التثبيت والتشغيل السريع (Quick Start)](#-خطوات-التثبيت-والتشغيل-السريع-quick-start)
7. [إعداد المتغيرات البيئية (Environment Variables)](#-إعداد-المتغيرات-البيئية-environment-variables)
8. [إعداد وتجهيز قاعدة البيانات (Database & Prisma)](#-إعداد-وتجهيز-قاعدة-البيانات-database--prisma)
9. [تشغيل السيرفرات (Running the App)](#-تشغيل-السيرفرات-running-the-app)
10. [فتح الموقع وتجربته من الموبايل (Mobile Testing)](#-فتح-الموقع-من-الموبايل-mobile-testing)
11. [بيانات تسجيل دخول لوحة الإدارة (Admin Credentials)](#-بيانات-تسجيل-الدخول-admin-credentials)
12. [التوثيق البرمجي وواجهة الـ API (Swagger)](#-توثيق-الـ-api-swagger)
13. [أوامر الصيانة والبناء (Build & Scripts)](#-أوامر-الصيانة-والبناء-scripts)

---

## 🌟 نظرة عامة (Overview)

تم بناء المنصة كـ **Monorepo** موحد وعالي الأداء لتوفير تجربة تسوق شبابية وسريعة، تدعم اللغتين **العربية (RTL)** و **الإنجليزية (LTR)** مع التبديل الفوري بين **الثيم الداكن والفاتح (Dark & Light Mode)**، ولوحة تحكم شاملة للمديرين لإدارة المنتجات، الطلبات، الكوبونات، المحتوى الإعلاني، وسجلات التتبع والتحليلات.

---

## ✨ المميزات الرئيسية (Key Features)

### 🛒 1. واجهة المتجر للعملاء (Storefront)
- **واجهة عصرية تفاعلية**: سلايدر رئيسي (Hero Slider)، بانرات ترويجية، عداد خصومات الفلاش سيل، وشريط إعلاني متحرك (Marquee & Announcement Bar).
- **نظام فلترة وتصفح متقدم**: فلترة فورية حسب التصنيف، المقاس، اللون، ونطاق السعر مع ترتيب حسب الأحدث أو الأكثر مبيعاً.
- **تفاصيل المنتج المتقدمة**: معرض صور متعدد الزوايا، اختيار الألوان والمقاسات، دليل المقاسات التفاعلي (Size Guide Modal)، وحساب الخصومات آلياً.
- **سلة مشتريات تفاعلية**: تنبيهات متحركة عند إضافة المنتجات، وتطبيق كوبونات الخصم فورياً.
- **إتمام الطلب عبر الواتساب & الدفع عند الاستلام**: توليد رسالة واتساب منسقة ومفصلة ببيانات العميل والمنتجات والمقاسات والأسعار بضغطة زر.
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

### ⚙️ الواجهة الخلفية (Backend - `apps/api`)
- **Framework**: NestJS 11 + Express + TypeScript
- **Database & ORM**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + Argon2 Password Hashing + Role-Based Access Control (RBAC)
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger / OpenAPI

### 📦 حزم المونوريبو المشتركة (Shared Packages)
- **`packages/shared`**: العقود والأنماط المشتركة (TypeScript Types, Interfaces, Enums, DTOs).
- **`packages/config`**: الإعدادات الموحدة لـ ESLint و TypeScript و Prettier.

---

## 📁 هيكلية المشروع (Project Structure)

```text
fashion-store/
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
│           └── main.ts               # نقطة انطلاق السيرفر وتفعيل Swagger
│
├── packages/
│   ├── shared/                       # الأنماط والعقود المشتركة
│   └── config/                       # إعدادات الـ Tooling المشتركة
│
├── package.json                      # إعدادات الـ Workspace الرئيسية
└── README.md                         # دليل المشروع
```

---

## 📋 متطلبات التشغيل (Prerequisites)

- **Node.js**: الإصدار `20.x` أو أعلى.
- **npm**: الإصدار `10.x` أو أعلى.
- **PostgreSQL**: قاعدة بيانات جاهزة محلياً أو سحابية (مثل Supabase, Neon, أو Railway).

---

## 🚀 خطوات التثبيت والتشغيل السريع (Quick Start)

### 1. استنساخ المشروع وتثبيت الحزم
افتح موجه الأوامر (Terminal) في مسار المشروع وقم بتثبيت الحزم لكافة التطبيقات:

```bash
npm install
```

---

## 🔐 إعداد المتغيرات البيئية (Environment Variables)

### 1. إعداد تطبيق الباك إند (`apps/api/.env`)
أنشئ ملف `.env` داخل مجلد `apps/api/` وضع فيه الإعدادات التالية:

```env
# اتصال قاعدة البيانات (PostgreSQL / Supabase)
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/fashion_store?schema=public"

# منفذ السيرفر
PORT=4000

# أسرار التشفير و JWT
JWT_SECRET="your_super_secret_jwt_key_fashion_store_2026"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_SECRET="your_super_secret_refresh_key_2026"
REFRESH_TOKEN_EXPIRES_IN="30d"

# مسار التطبيق الأمامي (CORS)
FRONTEND_URL="http://localhost:5173"
```

### 2. إعداد تطبيق الفرونت إند (`apps/web/.env`)
أنشئ ملف `.env` داخل مجلد `apps/web/` وضع فيه:

```env
# رابط الـ Backend API
VITE_API_URL="http://localhost:4000/api"

# في بيئة التطوير يمكنك استخدام المسار النسبي المباشر عبر Proxy
VITE_API_PROXY_URL="/api"
```

---

## 🗄️ إعداد وتجهيز قاعدة البيانات (Database & Prisma)

لتوليد جداول قاعدة البيانات وتغذيتها بالحساب الإداري والبيانات الافتراضية:

1. **توليد عميل Prisma**:
   ```bash
   npm run prisma:generate --workspace=@fashion-store/api
   ```

2. **تطبيق الـ Migrations على قاعدة البيانات**:
   ```bash
   npm run prisma:migrate --workspace=@fashion-store/api
   ```

3. **تغذية البيانات الأولية (Seeding Data)**:
   ```bash
   npm run prisma:seed --workspace=@fashion-store/api
   ```

---

## ⚡ تشغيل السيرفرات (Running the App)

### التشغيل المزدوج لكامل المشروع بأمر واحد:
من المجلد الرئيسي للمشروع، نفذ الأمر التالي:

```bash
npm run dev
```

سيتم تشغيل:
- **تطبيق الـ API**: على الرابط [http://localhost:4000](http://localhost:4000)
- **تطبيق الـ Web (المتجر)**: على الرابط [http://localhost:5173](http://localhost:5173)

---

## 📱 فتح الموقع من الموبايل (Mobile Testing)

لمعاينة الموقع واختبار تثبيت الـ PWA من هاتفك المحمول عبر نفس شبكة الـ Wi-Fi:

1. تأكد من اتصال هاتفك بنفس شبكة الإنترنت المتصل بها الكمبيوتر.
2. افتح متصفح هاتفك واكتب عنوان الـ IP المحلي لجهازك متبوعاً برقم المنفذ، مثال:
   ```text
   http://192.168.1.4:5173
   ```
3. ستظهر ويدجت تثبيت التطبيق الأنيقة تلقائياً بعد ثانية واحدة مع شعار المتجر.

---

## 🔑 بيانات تسجيل الدخول (Admin Credentials)

للوصول إلى لوحة التحكم الإدارية، توجه إلى الرابط:
`http://localhost:5173/admin/login`

- **البريد الإلكتروني**: `admin@fashionstore.com`
- **كلمة المرور**: `Admin@123456`

---

## 📖 توثيق الـ API (Swagger)

الباك إند مجهز بتوثيق تفاعلي كامل لكافة الـ Endpoints:
- **رابط توثيق Swagger**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 🛠️ أوامر الصيانة والبناء (Scripts)

| الأمر (Command) | الوظيفة (Description) |
| :--- | :--- |
| `npm run dev` | تشغيل سيرفر الـ API وسيرفر الـ Web بالتوازي |
| `npm run build` | بناء نسخة الإنتاج النهائية لجميع التطبيقات |
| `npm run build:web` | بناء حزمة الإنتاج لتطبيق الفرونت إند فقط |
| `npm run typecheck` | فحص الأنماط البرمجية الصارمة عبر TypeScript |
| `npm run lint` | فحص الكود البرمجي عبر ESLint |
| `npm run format` | تنسيق وترتيب الأكواد تلقائياً عبر Prettier |

---

## 🚢 النشر على بيئة الإنتاج (Deployment Guidelines)

- **Frontend (`apps/web`)**: يمكن نشره بسهولة وسرعة فائقة على [Vercel](https://vercel.com) أو [Netlify](https://netlify.com) (ملف `vercel.json` جاهز ومضبوط).
- **Backend (`apps/api`)**: يمكن نشره على [Render](https://render.com), [Railway](https://railway.app), أو [DigitalOcean](https://digitalocean.com).
- **Database**: يُنصح باستخدام [Supabase PostgreSQL](https://supabase.com) أو [Neon Tech](https://neon.tech) لأفضل أداء وتوفر فوري.

---

<p align="center">
  صُنع بكل إتقان واحترافية بواسطة فريق التطوير 🚀
</p>
