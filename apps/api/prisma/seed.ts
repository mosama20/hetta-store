import { PrismaClient, SettingGroup, CMSSectionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with CRAFT aesthetic...');

  // 1. Permissions
  console.log('1. Seeding permissions...');
  const permissionsData = [
    { name: 'products.read', module: 'products', description: 'View products' },
    { name: 'products.create', module: 'products', description: 'Create products' },
    { name: 'products.update', module: 'products', description: 'Update products' },
    { name: 'products.delete', module: 'products', description: 'Delete products' },
    { name: 'categories.read', module: 'categories', description: 'View categories' },
    { name: 'categories.write', module: 'categories', description: 'Manage categories' },
    { name: 'orders.read', module: 'orders', description: 'View orders' },
    { name: 'orders.update_status', module: 'orders', description: 'Update order status' },
    { name: 'discounts.read', module: 'discounts', description: 'View discounts' },
    { name: 'discounts.write', module: 'discounts', description: 'Manage discounts' },
    { name: 'cms.read', module: 'cms', description: 'View CMS' },
    { name: 'cms.write', module: 'cms', description: 'Manage CMS' },
    { name: 'settings.read', module: 'settings', description: 'View settings' },
    { name: 'settings.write', module: 'settings', description: 'Manage settings' },
    { name: 'users.read', module: 'users', description: 'View users' },
    { name: 'users.write', module: 'users', description: 'Manage users' },
    { name: 'audit.read', module: 'audit', description: 'View audit logs' },
    { name: 'media.read', module: 'media', description: 'View media' },
    { name: 'media.write', module: 'media', description: 'Manage media' },
  ];

  for (const perm of permissionsData) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
  }
  console.log('✔ Permissions seeded');

  // 2. Roles
  console.log('2. Seeding roles...');
  const rolesData = [
    { name: 'SUPER_ADMIN', displayNameAr: 'المدير العام', displayNameEn: 'Super Administrator' },
    { name: 'ADMIN', displayNameAr: 'مشرف النظام', displayNameEn: 'Administrator' },
    { name: 'STORE_MANAGER', displayNameAr: 'مدير المتجر', displayNameEn: 'Store Manager' },
    { name: 'SALES_AGENT', displayNameAr: 'مسؤول المبيعات', displayNameEn: 'Sales Agent' },
  ];

  const createdRoles: Record<string, string> = {};
  for (const role of rolesData) {
    const r = await prisma.role.upsert({
      where: { name: role.name },
      update: { displayNameAr: role.displayNameAr, displayNameEn: role.displayNameEn },
      create: role,
    });
    createdRoles[role.name] = r.id;
  }

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: createdRoles['SUPER_ADMIN'], permissionId: perm.id } },
      update: {},
      create: { roleId: createdRoles['SUPER_ADMIN'], permissionId: perm.id },
    });
  }
  console.log('✔ Roles seeded');

  // 3. Super Admin User
  console.log('3. Seeding admin users...');
  const hashedPassword = await bcrypt.hash('Admin@Fashion2026!', 10);
  const adminEmails = [
    'mohamed.osama5060@gmail.com',
    'aymanmossad08@gmail.com',
    'admin@fashionstore.com',
    'admin@craftwear.com',
  ];
  for (const adminEmail of adminEmails) {
    const superAdmin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { fullName: 'Store Super Admin', passwordHash: hashedPassword, isActive: true },
      create: {
        email: adminEmail,
        passwordHash: hashedPassword,
        fullName: 'Store Super Admin',
        isActive: true,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: superAdmin.id, roleId: createdRoles['SUPER_ADMIN'] } },
      update: {},
      create: { userId: superAdmin.id, roleId: createdRoles['SUPER_ADMIN'] },
    });
  }
  console.log('✔ Admin users seeded');

  // 4. Categories
  console.log('4. Seeding categories...');
  const categoriesData = [
    {
      nameAr: 'تيشيرتات',
      nameEn: 'T-Shirts',
      slug: 't-shirts',
      displayOrder: 1,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&q=80',
    },
    {
      nameAr: 'شورتات',
      nameEn: 'Shorts',
      slug: 'shorts',
      displayOrder: 2,
      imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80',
    },
    {
      nameAr: 'بنطلونات',
      nameEn: 'Pants',
      slug: 'pants',
      displayOrder: 3,
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500&q=80',
    },
    {
      nameAr: 'هوديز',
      nameEn: 'Hoodies',
      slug: 'hoodies',
      displayOrder: 4,
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500&q=80',
    },
    {
      nameAr: 'جاكيتات',
      nameEn: 'Jackets',
      slug: 'jackets',
      displayOrder: 5,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80',
    },
    {
      nameAr: 'اكسسوارات',
      nameEn: 'Accessories',
      slug: 'accessories',
      displayOrder: 6,
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&q=80',
    },
  ];

  const catMap: Record<string, string> = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { nameAr: c.nameAr, nameEn: c.nameEn, displayOrder: c.displayOrder, imageUrl: c.imageUrl },
      create: { nameAr: c.nameAr, nameEn: c.nameEn, slug: c.slug, displayOrder: c.displayOrder, imageUrl: c.imageUrl },
    });
    catMap[c.slug] = cat.id;
  }
  console.log('✔ Categories seeded');

  // 5. Colors
  console.log('5. Seeding colors...');
  const colorsData = [
    { nameAr: 'أوف وايت', nameEn: 'Off-White', hexCode: '#F4F1EA', displayOrder: 1 },
    { nameAr: 'بيج رملي', nameEn: 'Sand Beige', hexCode: '#D8CAB8', displayOrder: 2 },
    { nameAr: 'أسود فحمي', nameEn: 'Charcoal Black', hexCode: '#1A1A1A', displayOrder: 3 },
    { nameAr: 'رمادي حجري', nameEn: 'Stone Grey', hexCode: '#8E8E93', displayOrder: 4 },
    { nameAr: 'بني ترابي', nameEn: 'Earthy Brown', hexCode: '#5A4638', displayOrder: 5 },
  ];

  const colorMap: Record<string, string> = {};
  for (const col of colorsData) {
    let c = await prisma.color.findFirst({ where: { hexCode: col.hexCode } });
    if (!c) {
      c = await prisma.color.create({ data: col });
    } else {
      c = await prisma.color.update({ where: { id: c.id }, data: col });
    }
    colorMap[col.nameEn] = c.id;
  }
  console.log('✔ Colors seeded');

  // 6. Sizes
  console.log('6. Seeding sizes...');
  const sizesData = [
    { nameAr: 'صغير', nameEn: 'S', displayOrder: 1 },
    { nameAr: 'وسط', nameEn: 'M', displayOrder: 2 },
    { nameAr: 'كبير', nameEn: 'L', displayOrder: 3 },
    { nameAr: 'كبير جداً', nameEn: 'XL', displayOrder: 4 },
    { nameAr: 'مقاس موحد', nameEn: 'One Size', displayOrder: 5 },
  ];

  const sizeMap: Record<string, string> = {};
  for (const s of sizesData) {
    let sz = await prisma.size.findFirst({ where: { nameEn: s.nameEn } });
    if (!sz) {
      sz = await prisma.size.create({ data: s });
    } else {
      sz = await prisma.size.update({ where: { id: sz.id }, data: s });
    }
    sizeMap[s.nameEn] = sz.id;
  }
  console.log('✔ Sizes seeded');

  // 7. Products
  console.log('7. Seeding products...');
  const productsData = [
    {
      nameAr: 'تيشيرت أساسي',
      nameEn: 'Essential T-Shirt',
      slug: 'essential-t-shirt',
      categorySlug: 't-shirts',
      basePrice: 599,
      descriptionAr: 'تيشيرت قطن مصري 100% عالي الكثافة بياقة مريحة وقصة أوفرسايز متقنة تناسب الإطلالات اليومية العصرية.',
      descriptionEn: 'Heavyweight 100% Egyptian combed cotton oversized tee. Features drop-shoulder design and refined rib collar.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=85',
      skuPrefix: 'CRF-TEE',
      price: 599,
      colors: ['Charcoal Black', 'Off-White', 'Sand Beige'],
      sizes: ['S', 'M', 'L', 'XL'],
    },
    {
      nameAr: 'هودي سادة',
      nameEn: 'Minimalist Hoodie',
      slug: 'minimalist-hoodie',
      categorySlug: 'hoodies',
      basePrice: 899,
      descriptionAr: 'هودي قطني ثقيل 450 جرام بتصميم مينيمالي وقبعة محكمة وبطانة ناعمة جداً لإطلالة شتوية فخمة.',
      descriptionEn: '450 GSM French terry cotton hoodie. Double-layered hood and clean pocketless silhouette.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=85',
      skuPrefix: 'CRF-HOD',
      price: 899,
      colors: ['Sand Beige', 'Charcoal Black', 'Stone Grey'],
      sizes: ['M', 'L', 'XL'],
    },
    {
      nameAr: 'بنطلون كارغو',
      nameEn: 'Cargo Pants',
      slug: 'cargo-pants',
      categorySlug: 'pants',
      basePrice: 1199,
      descriptionAr: 'بنطلون كارغو بقماش جبردين عالي الجودة مع جيوب جانبية مخفية وأساور سفلية قابلة للتعديل.',
      descriptionEn: 'Premium cotton twill cargo trousers with structured side bellows pockets and adjustable cuffs.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=85',
      skuPrefix: 'CRF-PAN',
      price: 1199,
      colors: ['Charcoal Black', 'Stone Grey'],
      sizes: ['M', 'L', 'XL'],
    },
    {
      nameAr: 'كاب CRAFT',
      nameEn: 'CRAFT Cap',
      slug: 'craft-cap',
      categorySlug: 'accessories',
      basePrice: 399,
      descriptionAr: 'كاب بيسبول كلاسيكي بتطريز شعار CRAFT البارز وخامة قطنية ناعمة مع مشبك معدني خلفي.',
      descriptionEn: 'Structured 6-panel cotton baseball cap with tone-on-tone CRAFT 3D embroidery and custom metal buckle.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=85',
      skuPrefix: 'CRF-CAP',
      price: 399,
      colors: ['Sand Beige', 'Charcoal Black'],
      sizes: ['One Size'],
    },
  ];

  for (const prod of productsData) {
    const p = await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        nameAr: prod.nameAr,
        nameEn: prod.nameEn,
        categoryId: catMap[prod.categorySlug],
        basePrice: prod.basePrice,
        descriptionAr: prod.descriptionAr,
        descriptionEn: prod.descriptionEn,
        isFeatured: prod.isFeatured,
        isActive: true,
      },
      create: {
        nameAr: prod.nameAr,
        nameEn: prod.nameEn,
        slug: prod.slug,
        categoryId: catMap[prod.categorySlug],
        basePrice: prod.basePrice,
        descriptionAr: prod.descriptionAr,
        descriptionEn: prod.descriptionEn,
        isFeatured: prod.isFeatured,
        isActive: true,
      },
    });

    const existingImg = await prisma.productImage.findFirst({ where: { productId: p.id } });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: p.id,
          url: prod.imageUrl,
          isPrimary: true,
          displayOrder: 1,
        },
      });
    }

    for (const colName of prod.colors) {
      for (const szName of prod.sizes) {
        const sku = `${prod.skuPrefix}-${colName.slice(0, 3).toUpperCase()}-${szName.replace(' ', '')}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {
            price: prod.price,
            stockQuantity: 30,
            isActive: true,
          },
          create: {
            productId: p.id,
            colorId: colorMap[colName],
            sizeId: sizeMap[szName],
            sku,
            price: prod.price,
            stockQuantity: 30,
            isActive: true,
          },
        });
      }
    }
  }
  console.log('✔ Products seeded');

  // 8. Store Settings
  console.log('8. Seeding store settings...');
  const settingsData = [
    { key: 'store_name_ar', value: 'كرافت', group: SettingGroup.BRANDING, isPublic: true },
    { key: 'store_name_en', value: 'CRAFT', group: SettingGroup.BRANDING, isPublic: true },
    { key: 'currency', value: 'EGP', group: SettingGroup.GENERAL, isPublic: true },
    { key: 'whatsapp_number', value: '+201234567890', group: SettingGroup.WHATSAPP, isPublic: true },
    {
      key: 'whatsapp_order_template_ar',
      value: 'مرحباً CRAFT! أرغب في تأكيد الطلب التالي:\nرقم الطلب: {orderNumber}\nالمنتجات:\n{items}\nالإجمالي: {total} {currency}\nالاسم: {customerName}\nالعنوان: {customerAddress}',
      group: SettingGroup.WHATSAPP,
      isPublic: true,
    },
    {
      key: 'social_links',
      value: JSON.stringify({
        instagram: 'https://instagram.com/craft.wear',
        facebook: 'https://facebook.com/craftwear',
        tiktok: 'https://tiktok.com/@craftwear',
      }),
      group: SettingGroup.BRANDING,
      isPublic: true,
    },
    { key: 'support_email', value: 'hello@craftwear.com', group: SettingGroup.GENERAL, isPublic: true },
    { key: 'announcement_bar_enabled', value: 'true', group: SettingGroup.GENERAL, isPublic: true },
    { key: 'announcement_text_ar', value: 'خصم 15% على جميع التيشيرتات بكود CRAFT15', group: SettingGroup.GENERAL, isPublic: true },
    { key: 'announcement_text_en', value: '15% OFF on all T-Shirts with code CRAFT15', group: SettingGroup.GENERAL, isPublic: true },
    { key: 'announcement_link', value: '/shop', group: SettingGroup.GENERAL, isPublic: true },
    { key: 'announcement_coupon', value: 'CRAFT15', group: SettingGroup.GENERAL, isPublic: true },
  ];

  for (const s of settingsData) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group, isPublic: s.isPublic },
      create: s,
    });
  }
  console.log('✔ Store settings seeded');

  // 9. CMS Sections
  console.log('9. Seeding CMS sections...');
  const cmsData = [
    {
      key: 'hero_banner',
      type: CMSSectionType.HERO_SLIDER,
      titleAr: 'بسيط، لكن مختلف.',
      titleEn: 'Simple, Yet Different.',
      subtitleAr: 'تصاميم راقية بجودة عالية لإطلالة تدوم طويلاً.',
      subtitleEn: 'Refined designs with superior fabric quality for a lasting look.',
      payload: {
        badgeAr: 'NEW DROP',
        badgeEn: 'NEW DROP',
        buttonTextAr: 'تسوق الآن',
        buttonTextEn: 'Shop Now',
        buttonUrl: '/shop',
        imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1200&q=90',
        layoutStyle: 'split',
      },
      displayOrder: 0,
      isActive: true,
    },
    {
      key: 'marquee_ticker',
      type: CMSSectionType.CUSTOM_HTML,
      titleAr: 'الشريط الإعلاني المتحرك',
      titleEn: 'Marquee Ticker',
      payload: {
        textAr: 'خامات قطنية فاخرة 100% • شحن سريع لجميع المحافظات • دفع عند الاستلام • إرجاع مجاني خلال 14 يوم • خياطة متقونة وتصاميم حصرية',
        speed: 'normal',
      },
      displayOrder: 1,
      isActive: true,
    },
    {
      key: 'new_arrivals',
      type: CMSSectionType.FEATURED_GRID,
      titleAr: 'الأكثر مبيعاً ومختارات الموسم',
      titleEn: 'Best Sellers & Curated Drops',
      subtitleAr: 'تشكيلة مختارة بعناية من أفضل الموديلات والأكثر طلباً لتتألق بإطلالة استثنائية.',
      subtitleEn: 'Curated premium fashion pieces loved by our community.',
      payload: {
        limit: 12,
        sourceMode: 'popular',
      },
      displayOrder: 2,
      isActive: true,
    },
    {
      key: 'trust_bar',
      type: CMSSectionType.CUSTOM_HTML,
      titleAr: 'مميزات المتجر والضمانات',
      titleEn: 'Store Guarantees',
      payload: {},
      displayOrder: 3,
      isActive: true,
    },
    {
      key: 'promo_banner',
      type: CMSSectionType.PROMO_BANNER,
      titleAr: 'مجموعة الموسم متوفرة الآن',
      titleEn: 'Season Collection Available Now',
      subtitleAr: 'قطع أساسية بتصاميم عصرية تناسب كل يوم وكل مكان.',
      subtitleEn: 'Essential pieces with modern silhouettes tailored for everyday comfort.',
      payload: {
        badgeAr: 'عرض خاص',
        badgeEn: 'SPECIAL OFFER',
        ctaTextAr: 'تسوق العرض الآن',
        ctaTextEn: 'Shop Offer Now',
        ctaLink: '/shop',
      },
      displayOrder: 4,
      isActive: true,
    },
    {
      key: 'about_section',
      type: CMSSectionType.CUSTOM_HTML,
      titleAr: 'قصتنا وهويتنا',
      titleEn: 'Our Story & Craft',
      subtitleAr: 'أزياء مصرية بجودة عالمية وتفاصيل متقنة',
      subtitleEn: 'Crafted with premium quality and passion',
      payload: {},
      displayOrder: 5,
      isActive: true,
    },
  ];

  for (const c of cmsData) {
    await prisma.cMSSection.upsert({
      where: { key: c.key },
      update: {
        titleAr: c.titleAr,
        titleEn: c.titleEn,
        subtitleAr: c.subtitleAr,
        subtitleEn: c.subtitleEn,
        payload: c.payload,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
      },
      create: c,
    });
  }
  console.log('✔ CMS sections seeded');

  console.log('✅ CRAFT database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
