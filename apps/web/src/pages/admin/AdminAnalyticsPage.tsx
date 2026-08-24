import React, { useEffect, useState, useCallback } from 'react';
import { analyticsApi } from '../../api/index.js';
import { useTheme } from '../../store/themeStore.js';
import { formatPrice, formatDate } from '../../utils/formatters.js';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader.js';
import { AdminStatCard } from '../../components/admin/AdminStatCard.js';
import { Card } from '../../components/common/Card.js';
import { Badge } from '../../components/common/Badge.js';
import { Button } from '../../components/common/Button.js';
import { Pagination } from '../../components/common/Pagination.js';
import { LoadingState } from '../../components/common/LoadingState.js';
import { EmptyState } from '../../components/common/EmptyState.js';
import { Modal } from '../../components/common/Modal.js';
import {
  Users,
  Eye,
  Activity,
  Smartphone,
  Globe,
  ShoppingCart,
  TrendingUp,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Laptop,
  Compass,
  DollarSign,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  AnalyticsSummary,
  VisitorSession,
  AbandonedCart,
} from '../../types/index.js';

export const AdminAnalyticsPage: React.FC = () => {
  const { isArabic } = useTheme();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'behavior' | 'abandoned'>('overview');

  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [sessionSearch, setSessionSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumRes, sessRes, abnRes] = await Promise.all([
        analyticsApi.getSummary(),
        analyticsApi.getSessions({ page, limit: 15, search: sessionSearch.trim() || undefined }),
        analyticsApi.getAbandonedCarts({ page: 1, limit: 20 }),
      ]);
      setSummary(sumRes);
      setSessions(sessRes.items);
      setTotalPages(sessRes.totalPages);
      setAbandonedCarts(abnRes.items);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [page, sessionSearch]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleClearLogs = async () => {
    try {
      setIsClearing(true);
      await analyticsApi.clearLogs();
      setShowClearModal(false);
      setFeedbackMsg({
        type: 'success',
        text: isArabic ? 'تم مسح وتفريغ سجلات الزوار والتحليلات بنجاح!' : 'Visitor logs cleared successfully!',
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
      fetchAnalytics();
    } catch {
      setFeedbackMsg({
        type: 'error',
        text: isArabic ? 'فشل مسح السجلات' : 'Failed to clear analytics logs',
      });
    } finally {
      setIsClearing(false);
    }
  };

  const getSourceIcon = (source: string) => {
    const s = source.toLowerCase();
    if (s.includes('facebook') || s.includes('fb')) return '🔵 Facebook';
    if (s.includes('instagram')) return '📸 Instagram';
    if (s.includes('tiktok')) return '🎵 TikTok';
    if (s.includes('google')) return '🔍 Google';
    if (s.includes('snapchat')) return '👻 Snapchat';
    if (s.includes('direct')) return '⚡ Direct / مباشر';
    return '🌐 Referral';
  };

  return (
    <div className="space-y-6 text-start pb-16">
      <AdminPageHeader
        title={isArabic ? 'إحصائيات الزوار وسلوك التصفح (Visitor & Marketing Analytics)' : 'Visitor & Marketing Analytics'}
        description={
          isArabic
            ? 'تتبع حي ومباشر لعدد الزوار، عناوين الـ IP، مصادر الحملات الإعلانية، والسلات المتروكة'
            : 'Live monitoring of visitor traffic, IP logs, marketing attribution, and behavioral funnels'
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              isLoading={isLoading}
              title={isArabic ? 'تحديث الإحصائيات' : 'Refresh Metrics'}
            >
              <RefreshCw className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
              <span>{isArabic ? 'تحديث حي' : 'Refresh'}</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowClearModal(true)}
              disabled={!summary || summary.totalVisitors === 0}
            >
              <Trash2 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isArabic ? 'مسح بيانات الزوار' : 'Clear Visitor Logs'}</span>
            </Button>
          </div>
        }
      />

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top 6 High-Impact Stat Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <AdminStatCard
            title={isArabic ? 'إجمالي الزوار' : 'Total Visitors'}
            value={summary.totalVisitors}
            icon={<Users className="w-5 h-5 text-blue-500" />}
            subtitle={isArabic ? `${summary.totalPageViews} مشاهدة صفحة` : `${summary.totalPageViews} page views`}
          />
          <AdminStatCard
            title={isArabic ? 'زوار اليوم' : 'Unique Today'}
            value={summary.uniqueVisitorsToday}
            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
            subtitle={isArabic ? 'زوار فريدون' : 'Unique visitors'}
          />
          <AdminStatCard
            title={isArabic ? 'الزوار الآن' : 'Live Active Now'}
            value={summary.liveVisitorsNow}
            icon={<Activity className="w-5 h-5 text-green-500 animate-pulse" />}
            subtitle={isArabic ? 'متواجدون حالياً 🟢' : 'Active last 5 mins'}
          />
          <AdminStatCard
            title={isArabic ? 'معدل الارتداد' : 'Bounce Rate'}
            value={`${summary.bounceRate}%`}
            icon={<Compass className="w-5 h-5 text-amber-500" />}
            subtitle={isArabic ? 'غادروا بعد صفحة واحدة' : 'Single-page visits'}
          />
          <AdminStatCard
            title={isArabic ? 'متوسط الجلسة' : 'Avg Duration'}
            value={`${summary.avgSessionDurationSeconds} ث`}
            icon={<Clock className="w-5 h-5 text-purple-500" />}
            subtitle={isArabic ? 'مدة التصفح' : 'Browsing time'}
          />
          <AdminStatCard
            title={isArabic ? 'سلات متروكة' : 'Abandoned Carts'}
            value={summary.abandonedCartsCount}
            icon={<ShoppingCart className="w-5 h-5 text-red-500" />}
            subtitle={formatPrice(summary.abandonedCartsValue, 'EGP', isArabic)}
          />
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-2 rtl:space-x-reverse text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>{isArabic ? 'المصادر والحملات الإعلانية (UTM)' : 'Traffic & Campaigns (UTM)'}</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 px-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'sessions'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isArabic ? 'سجل الزوار وعناوين الـ IP المباشر' : 'Live Visitor & IP Logs'}</span>
        </button>

        <button
          onClick={() => setActiveTab('behavior')}
          className={`pb-3 px-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'behavior'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>{isArabic ? 'سلوك التصفح والمنتجات المشاهدة' : 'ViewContent & Funnel'}</span>
        </button>

        <button
          onClick={() => setActiveTab('abandoned')}
          className={`pb-3 px-4 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'abandoned'
              ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
              : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isArabic ? `السلات المتروكة (${abandonedCarts.length})` : `Abandoned Carts (${abandonedCarts.length})`}</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingState message={isArabic ? 'جاري تحليل بيانات الزوار...' : 'Loading visitor analytics...'} />
      ) : (
        <>
          {/* TAB 1: OVERVIEW & TRAFFIC SOURCES / CAMPAIGNS */}
          {activeTab === 'overview' && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic Sources Breakdown */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span>{isArabic ? 'مصادر الزيارات (Traffic Sources)' : 'Traffic Sources Breakdown'}</span>
                    </h3>
                    <Badge variant="secondary">{summary.trafficSources.length} {isArabic ? 'مصادر' : 'Sources'}</Badge>
                  </div>

                  {summary.trafficSources.length === 0 ? (
                    <p className="text-xs text-zinc-400 py-4 text-center">{isArabic ? 'لا توجد بيانات كافية بعد' : 'No traffic source data yet'}</p>
                  ) : (
                    <div className="space-y-3">
                      {summary.trafficSources.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-zinc-800 dark:text-zinc-200">{getSourceIcon(item.source)}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-400 text-[11px]">{item.visitors} {isArabic ? 'زيارة' : 'visits'}</span>
                              {item.ordersCount > 0 && (
                                <Badge variant="success" className="text-[10px]">
                                  {item.ordersCount} {isArabic ? 'طلبات مؤكدة' : 'orders'}
                                </Badge>
                              )}
                              <span className="font-bold font-mono">{item.percentage}%</span>
                            </div>
                          </div>
                          <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(item.percentage, 4)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Marketing Campaigns (UTM Attribution) */}
                <Card className="p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>{isArabic ? 'أداء الحملات الإعلانية (UTM Campaigns)' : 'Ad Campaigns (UTM)'}</span>
                    </h3>
                    <Badge variant="gold">{summary.campaigns.length} {isArabic ? 'حملات' : 'Campaigns'}</Badge>
                  </div>

                  {summary.campaigns.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <p className="text-xs text-zinc-500">
                        {isArabic
                          ? 'لم يتم رصد زيارات بروابط حملات إعلانية (UTM) حتى الآن.'
                          : 'No UTM campaign clicks tracked yet.'}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {isArabic
                          ? '💡 نصيحة: أضف ?utm_source=facebook&utm_campaign=summer_sale لروابط إعلاناتك لقياس المبيعات تلقائياً.'
                          : 'Tip: Add ?utm_source=facebook&utm_campaign=summer_sale to track your ads ROI automatically.'}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                      {summary.campaigns.map((c, idx) => (
                        <div key={idx} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold block text-zinc-900 dark:text-zinc-100">{c.campaign}</span>
                            <span className="text-[11px] text-zinc-400">{c.source}</span>
                          </div>
                          <div className="text-end">
                            <span className="font-mono font-bold text-emerald-600 block">
                              {formatPrice(c.revenue, 'EGP', isArabic)}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {c.visitors} {isArabic ? 'زائر' : 'visitors'} • {c.ordersCount} {isArabic ? 'طلب' : 'orders'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Devices, OS, Browsers Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Device Types */}
                <Card className="p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-purple-500" />
                    <span>{isArabic ? 'نوع الجهاز (Device)' : 'Device Type'}</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {summary.deviceBreakdown.map((d, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="capitalize font-medium">{d.device === 'mobile' ? '📱 Mobile' : d.device === 'desktop' ? '💻 Desktop' : '📟 Tablet'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">{d.count}</span>
                          <Badge variant="secondary" className="font-mono">{d.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Operating Systems */}
                <Card className="p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Laptop className="w-4 h-4 text-blue-500" />
                    <span>{isArabic ? 'نظام التشغيل (OS)' : 'Operating System'}</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {summary.osBreakdown.map((o, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="font-medium">{o.os}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">{o.count}</span>
                          <Badge variant="secondary" className="font-mono">{o.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Browsers */}
                <Card className="p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-500" />
                    <span>{isArabic ? 'المتصفح (Browser)' : 'Browser'}</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {summary.browserBreakdown.map((b, i) => (
                      <div key={i} className="flex justify-between items-center py-1">
                        <span className="font-medium">{b.browser}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">{b.count}</span>
                          <Badge variant="secondary" className="font-mono">{b.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE VISITOR & IP SESSIONS LOGS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <Card className="p-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute top-3 left-3 rtl:right-3 rtl:left-auto text-zinc-400" />
                  <input
                    type="text"
                    value={sessionSearch}
                    onChange={(e) => {
                      setSessionSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder={isArabic ? 'بحث بعنوان IP، المتصفح، النظام، أو مصدر الزيارة...' : 'Search by IP address, browser, OS, or referrer...'}
                    className="w-full pl-9 pr-3.5 rtl:pr-9 rtl:pl-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                </div>
              </Card>

              <Card className="overflow-hidden">
                {sessions.length === 0 ? (
                  <div className="p-8 text-center">
                    <EmptyState
                      title={isArabic ? 'لا توجد زيارات مسجلة' : 'No Visitor Sessions Found'}
                      description={isArabic ? 'لم يتم تسجيل أي جلسات زوار مطابقة للبحث.' : 'No visitor sessions match your current query.'}
                      icon={<Users className="w-12 h-12 text-zinc-400" />}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="p-3.5 text-start">{isArabic ? 'التوقيت' : 'Time'}</th>
                          <th className="p-3.5 text-start">IP Address</th>
                          <th className="p-3.5 text-start">{isArabic ? 'الجهاز والنظام' : 'Device & OS'}</th>
                          <th className="p-3.5 text-start">{isArabic ? 'المصدر والحملة' : 'Referrer / Campaign'}</th>
                          <th className="p-3.5 text-start">{isArabic ? 'الصفحات التي زارها' : 'Pages Visited'}</th>
                          <th className="p-3.5 text-start">{isArabic ? 'المدة' : 'Duration'}</th>
                          <th className="p-3.5 text-center">{isArabic ? 'طلب شراء' : 'Converted'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {sessions.map((s) => (
                          <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                            <td className="p-3.5 text-zinc-500 whitespace-nowrap font-mono text-[11px]">
                              {formatDate(s.lastSeenAt, isArabic)}
                            </td>
                            <td className="p-3.5 font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                              {s.ipAddress}
                              <span className="block text-[10px] font-normal text-zinc-400">{s.country || 'مصر'}</span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-semibold block">{s.os} • {s.browser}</span>
                              <span className="text-[10px] text-zinc-400 capitalize">{s.deviceType}</span>
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold block">{s.referrer}</span>
                              {s.utmCampaign && (
                                <Badge variant="gold" className="text-[9px] mt-0.5 font-mono">
                                  {s.utmCampaign}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3.5 max-w-xs">
                              <div className="flex flex-wrap gap-1">
                                {s.pagesVisited.map((p, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-[10px] text-zinc-600 dark:text-zinc-300"
                                  >
                                    {p}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-3.5 font-mono text-zinc-500 whitespace-nowrap">
                              {s.durationSeconds}s
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              {s.hasOrder ? (
                                <Badge variant="success" className="font-mono text-[10px]">
                                  {s.orderNumber || 'Ordered'}
                                </Badge>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {totalPages > 1 && (
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </div>
          )}

          {/* TAB 3: BEHAVIOR & TOP VIEWED PRODUCTS */}
          {activeTab === 'behavior' && summary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Visited Pages */}
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span>{isArabic ? 'أكثر الصفحات مشاهدة وزيارة' : 'Most Visited Pages'}</span>
                </h3>
                {summary.topVisitedPages.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center">{isArabic ? 'لا توجد بيانات كافية' : 'No page view data'}</p>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {summary.topVisitedPages.map((pg, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between">
                        <span className="font-mono text-zinc-700 dark:text-zinc-300">{pg.path}</span>
                        <Badge variant="secondary" className="font-mono font-bold">
                          {pg.views} {isArabic ? 'مشاهدة' : 'views'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Top Viewed Products & Add-to-Cart Funnel */}
              <Card className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <ShoppingCart className="w-4 h-4 text-purple-500" />
                  <span>{isArabic ? 'أكثر المنتجات مشاهدة وإضافة للسلة (Funnel)' : 'Product Views & Cart Additions'}</span>
                </h3>
                {summary.topViewedProducts.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center">{isArabic ? 'لا توجد مشاهدات منتجات مسجلة' : 'No product views recorded'}</p>
                ) : (
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {summary.topViewedProducts.map((pv, i) => (
                      <div key={i} className="py-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{pv.nameAr}</span>
                          <span className="text-[10px] text-zinc-400 font-mono">ID: {pv.productId}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-zinc-500">{pv.views} {isArabic ? 'مشاهدة' : 'views'}</span>
                          <span className="text-zinc-300">•</span>
                          <Badge variant="success" className="font-mono">
                            {pv.addToCartCount} {isArabic ? 'سلة' : 'carts'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TAB 4: ABANDONED CARTS */}
          {activeTab === 'abandoned' && (
            <div className="space-y-4">
              <Card className="overflow-hidden">
                {abandonedCarts.length === 0 ? (
                  <div className="p-8 text-center">
                    <EmptyState
                      title={isArabic ? 'لا توجد سلات متروكة' : 'No Abandoned Carts'}
                      description={isArabic ? 'رائع! لا توجد سلات تسوق متروكة حالياً دون إتمام الطلب.' : 'No shopping carts have been abandoned yet.'}
                      icon={<CheckCircle2 className="w-12 h-12 text-emerald-500" />}
                    />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/80 text-zinc-500 font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="p-3.5 text-start">{isArabic ? 'التوقيت' : 'Time'}</th>
                          <th className="p-3.5 text-start">IP Address</th>
                          <th className="p-3.5 text-start">{isArabic ? 'الجهاز' : 'Device'}</th>
                          <th className="p-3.5 text-start">{isArabic ? 'المنتجات في السلة' : 'Items Left in Cart'}</th>
                          <th className="p-3.5 text-start">{isArabic ? 'قيمة السلة' : 'Cart Value'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {abandonedCarts.map((c) => (
                          <tr key={c.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition">
                            <td className="p-3.5 text-zinc-500 whitespace-nowrap font-mono text-[11px]">
                              {formatDate(c.lastActiveAt || c.createdAt, isArabic)}
                            </td>
                            <td className="p-3.5 font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                              {c.ipAddress}
                            </td>
                            <td className="p-3.5 capitalize font-medium">
                              {c.deviceType === 'mobile' ? '📱 Mobile' : '💻 Desktop'}
                            </td>
                            <td className="p-3.5">
                              <div className="space-y-1">
                                {c.items?.map((it, idx) => (
                                  <div key={idx} className="text-[11px] text-zinc-700 dark:text-zinc-300">
                                    • {it.product.nameAr} ({it.selectedColor?.nameAr} - {it.selectedSize?.nameAr}) ×{it.quantity}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                              {formatPrice(c.totalValue, c.currency || 'EGP', isArabic)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}
        </>
      )}

      {/* Clear Logs Modal */}
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title={isArabic ? 'تأكيد مسح سجلات وبيانات الزوار' : 'Confirm Clear Visitor Logs'}
      >
        <div className="space-y-4 text-start">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              {isArabic
                ? 'هل أنت متأكد من رغبتك في مسح كافة سجلات الزوار وعناوين الـ IP وأحداث التصفح؟ سيتم تصفير عدادات التحليلات.'
                : 'Are you sure you want to clear all visitor sessions, IP logs, and behavioral analytics?'}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setShowClearModal(false)}>
              {isArabic ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isClearing}
              onClick={handleClearLogs}
            >
              <Trash2 className="w-4 h-4 mr-1.5 rtl:ml-1.5 rtl:mr-0" />
              <span>{isArabic ? 'نعم، مسح السجلات الآن' : 'Yes, Clear All Logs'}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
