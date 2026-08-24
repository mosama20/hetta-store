import { PrismaClient, SettingGroup, CMSSectionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding with CRAFT aesthetic...');

  // 1. Permissions
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

  // 2. Roles
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

  // 3. Super Admin User
  const hashedPassword = await bcrypt.hash('Admin@Fashion2026!', 12);
  const adminEmails = ['admin@fashionstore.com', 'admin@craftwear.com'];
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

  // 4. Categories
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
      update: { nameAr: c.nameAr, nameEn: c.nameEn, displayOrder: c.displayOrder },
      create: { nameAr: c.nameAr, nameEn: c.nameEn, slug: c.slug, displayOrder: c.displayOrder },
    });
    catMap[c.slug] = cat.id;
  }

  // 5. Colors
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

  // 6. Sizes
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

  // 7. Products
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
    {
      nameAr: 'جاكيت خفيف',
      nameEn: 'Lightweight Jacket',
      slug: 'lightweight-jacket',
      categorySlug: 'jackets',
      basePrice: 1299,
      descriptionAr: 'جاكيت أوفر شيرت خفيف بأزرار أمامية وجيوب مزدوجة، مثالي للارتداء فوق التيشيرتات.',
      descriptionEn: 'Relaxed button-up workwear overshirt crafted from heavyweight crisp cotton weave.',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=85',
      skuPrefix: 'CRF-JCK',
      price: 1299,
      colors: ['Charcoal Black', 'Earthy Brown'],
      sizes: ['M', 'L', 'XL'],
    },
    {
      nameAr: 'شورت قطني مريح',
      nameEn: 'Essential Sweat Shorts',
      slug: 'essential-sweat-shorts',
      categorySlug: 'shorts',
      basePrice: 499,
      descriptionAr: 'شورت قطن ميلتون ناعم بخصر مطاطي برباط وجيوب مريحة للإطلالات الصيفية والرياضية.',
      descriptionEn: 'Soft heavyweight French terry sweat shorts with elasticated drawstring waistband.',
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&q=85',
      skuPrefix: 'CRF-SHT',
      price: 499,
      colors: ['Charcoal Black', 'Sand Beige'],
      sizes: ['S', 'M', 'L'],
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

    await prisma.productImage.deleteMany({ where: { productId: p.id } });
    await prisma.productImage.create({
      data: {
        productId: p.id,
        url: prod.imageUrl,
        isPrimary: true,
        displayOrder: 1,
      },
    });

    await prisma.productVariant.deleteMany({ where: { productId: p.id } });
    for (const colName of prod.colors) {
      for (const szName of prod.sizes) {
        const sku = `${prod.skuPrefix}-${colName.slice(0, 3).toUpperCase()}-${szName.replace(' ', '')}`;
        await prisma.productVariant.create({
          data: {
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

  // 8. Store Settings
  const settingsData = [
    { key: 'store_name_ar', value: 'CRAFT', group: SettingGroup.BRANDING, isPublic: true },
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
  ];

  for (const s of settingsData) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group, isPublic: s.isPublic },
      create: s,
    });
  }

  // 9. CMS Sections
  const cmsData = [
    {
      key: 'home_hero_slider',
      type: CMSSectionType.HERO_SLIDER,
      titleAr: 'بسيط، لكن مختلف.',
      titleEn: 'Simple, Yet Different.',
      subtitleAr: 'تصاميم راقية بجودة عالية لإطلالة تدوم طويلاً.',
      subtitleEn: 'Refined designs with superior fabric quality for a lasting look.',
      payload: {
        badgeAr: 'NEW COLLECTION',
        badgeEn: 'NEW COLLECTION',
        buttonTextAr: 'تسوق الآن',
        buttonTextEn: 'Shop Now',
        buttonUrl: '/shop',
        imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1200&q=90',
      },
      displayOrder: 1,
      isActive: true,
    },
    {
      key: 'home_promo_summer',
      type: CMSSectionType.PROMO_BANNER,
      titleAr: 'مجموعة الصيف متوفرة الآن',
      titleEn: 'Summer Collection Available Now',
      subtitleAr: 'قطع أساسية بتصاميم عصرية تناسب كل يوم وكل مكان.',
      subtitleEn: 'Essential pieces with modern silhouettes tailored for everyday comfort.',
      payload: {
        badgeAr: 'DISCOVER OUR COLLECTION',
        badgeEn: 'DISCOVER OUR COLLECTION',
        buttonTextAr: 'استكشف المجموعة',
        buttonTextEn: 'Explore Collection',
        buttonUrl: '/shop',
      },
      displayOrder: 2,
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
