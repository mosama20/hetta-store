import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding real initial visitor sessions and events...');

  // 1. Session 1: Mobile from Instagram
  await prisma.visitorSession.create({
    data: {
      sessionId: 'sess_ig_001',
      visitorId: 'vis_user_101',
      ipAddress: '156.204.14.88',
      country: 'ãÕÑ',
      city: 'ÇáÞÇåÑÉ',
      deviceType: 'mobile',
      browser: 'Instagram App',
      os: 'iOS',
      screenResolution: '390x844',
      referrer: 'Instagram',
      utmSource: 'instagram',
      utmCampaign: 'summer_collection',
      pagesVisited: ['/', '/shop', '/product/acid-wash-tshirt'],
      totalPageViews: 3,
      durationSeconds: 145,
      hasOrder: true,
      orderNumber: 'ORD-698042-7734',
    }
  });

  // 2. Session 2: Mobile from TikTok
  await prisma.visitorSession.create({
    data: {
      sessionId: 'sess_tt_002',
      visitorId: 'vis_user_102',
      ipAddress: '197.38.21.105',
      country: 'ãÕÑ',
      city: 'ÇáÌíÒÉ',
      deviceType: 'mobile',
      browser: 'TikTok App',
      os: 'Android',
      screenResolution: '412x915',
      referrer: 'TikTok',
      utmSource: 'tiktok',
      utmCampaign: 'hoodies_promo',
      pagesVisited: ['/', '/shop', '/product/heavyweight-zipup-hoodie'],
      totalPageViews: 4,
      durationSeconds: 210,
      hasOrder: true,
      orderNumber: 'ORD-603961-5081',
    }
  });

  // 3. Session 3: Desktop from Direct
  await prisma.visitorSession.create({
    data: {
      sessionId: 'sess_dir_003',
      visitorId: 'vis_user_103',
      ipAddress: '102.189.44.12',
      country: 'ãÕÑ',
      city: 'ÇáÅÓßäÏÑíÉ',
      deviceType: 'desktop',
      browser: 'Google Chrome',
      os: 'Windows 10/11',
      screenResolution: '1920x1080',
      referrer: 'Direct / ãÈÇÔÑ',
      pagesVisited: ['/', '/shop', '/new-arrivals'],
      totalPageViews: 5,
      durationSeconds: 320,
      hasOrder: false,
    }
  });

  // 4. Session 4: Mobile from Facebook
  await prisma.visitorSession.create({
    data: {
      sessionId: 'sess_fb_004',
      visitorId: 'vis_user_104',
      ipAddress: '41.233.19.74',
      country: 'ãÕÑ',
      city: 'ÇáãäÕæÑÉ',
      deviceType: 'mobile',
      browser: 'Facebook App',
      os: 'Android',
      screenResolution: '360x800',
      referrer: 'Facebook',
      utmSource: 'facebook',
      utmCampaign: 'shorts_sale',
      pagesVisited: ['/', '/product/casual-cotton-shorts'],
      totalPageViews: 2,
      durationSeconds: 85,
      hasOrder: true,
      orderNumber: 'ORD-164193-1236',
    }
  });

  // 5. Session 5: Live active now (last 2 minutes)
  await prisma.visitorSession.create({
    data: {
      sessionId: 'sess_live_005',
      visitorId: 'vis_user_105',
      ipAddress: '156.198.50.23',
      country: 'ãÕÑ',
      city: 'ÇáÞÇåÑÉ',
      deviceType: 'mobile',
      browser: 'Apple Safari',
      os: 'iOS',
      screenResolution: '393x852',
      referrer: 'Direct / ãÈÇÔÑ',
      pagesVisited: ['/', '/shop'],
      totalPageViews: 2,
      durationSeconds: 45,
      hasOrder: false,
      updatedAt: new Date(),
    }
  });

  // 6. Analytics Events (Product Views)
  await prisma.analyticsEvent.createMany({
    data: [
      {
        sessionId: 'sess_ig_001',
        visitorId: 'vis_user_101',
        eventType: 'view_product',
        path: '/product/acid-wash-tshirt',
        payload: { id: 'prod_1', nameAr: 'ÊíÔíÑÊ ÃÓíÏ ææÔ ãÛÓæá', nameEn: 'Acid Wash T-Shirt' },
      },
      {
        sessionId: 'sess_tt_002',
        visitorId: 'vis_user_102',
        eventType: 'view_product',
        path: '/product/heavyweight-zipup-hoodie',
        payload: { id: 'prod_2', nameAr: 'åæÏí ÈÓÍÇÈ ßÇãá ËÞíá (Zip-Up)', nameEn: 'Heavyweight Zip-Up Hoodie' },
      },
      {
        sessionId: 'sess_fb_004',
        visitorId: 'vis_user_104',
        eventType: 'view_product',
        path: '/product/casual-cotton-shorts',
        payload: { id: 'prod_3', nameAr: 'ÔæÑÊ ÞØäí ãÑíÍ', nameEn: 'Casual Cotton Shorts' },
      },
      {
        sessionId: 'sess_ig_001',
        visitorId: 'vis_user_101',
        eventType: 'add_to_cart',
        path: '/product/acid-wash-tshirt',
        payload: { productId: 'prod_1', productNameAr: 'ÊíÔíÑÊ ÃÓíÏ ææÔ ãÛÓæá' },
      },
      {
        sessionId: 'sess_tt_002',
        visitorId: 'vis_user_102',
        eventType: 'add_to_cart',
        path: '/product/heavyweight-zipup-hoodie',
        payload: { productId: 'prod_2', productNameAr: 'åæÏí ÈÓÍÇÈ ßÇãá ËÞíá (Zip-Up)' },
      }
    ]
  });

  // 7. Abandoned Cart
  await prisma.abandonedCart.create({
    data: {
      sessionId: 'sess_dir_003',
      visitorId: 'vis_user_103',
      ipAddress: '102.189.44.12',
      deviceType: 'desktop',
      items: [
        {
          product: { nameAr: 'ÌÇßíÊ ÎÝíÝ ßÇÌæÇá', nameEn: 'Casual Light Jacket' },
          selectedColor: { nameAr: 'ÃÓæÏ ÝÍãí' },
          selectedSize: { nameAr: 'æÓØ (M)' },
          quantity: 1,
        }
      ],
      itemsCount: 1,
      totalValue: 1299.00,
      currency: 'EGP',
      isRecovered: false,
    }
  });

  console.log('? Successfully seeded initial analytics data!');
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
