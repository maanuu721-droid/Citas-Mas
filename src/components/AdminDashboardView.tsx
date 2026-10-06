import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  Bell,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Sliders,
  ChevronRight,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  Building2,
  ArrowUpRight,
  TrendingUp,
  Award,
  LogOut,
  Lock,
  Package,
  Trash2,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Affiliate,
  UserProfile,
  Appointment,
  MarketingCampaignRequest,
  SubscriptionPlanType,
  AffiliateApprovalStatus,
  VerificationTier,
  PromotionOrder
} from '../types.ts';
import { DataService } from '../services/dataService.ts';

interface Props {
  onBackToApp: () => void;
  onSelectAffiliateView?: (affiliateId: string) => void;
  adminEmail?: string;
  onLogoutAdmin?: () => void;
}

type AdminTab = 'marketing_requests' | 'subscriptions' | 'affiliates' | 'users' | 'appointments' | 'promotion_orders' | 'settings';

export const AdminDashboardView: React.FC<Props> = ({
  onBackToApp,
  onSelectAffiliateView,
  adminEmail = 'maanuu721@gmail.com',
  onLogoutAdmin
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('marketing_requests');
  const [loading, setLoading] = useState<boolean>(true);

  // Core data states
  const [marketingRequests, setMarketingRequests] = useState<MarketingCampaignRequest[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pendingAffiliates, setPendingAffiliates] = useState<Affiliate[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<any[]>([]);
  const [promotionOrders, setPromotionOrders] = useState<PromotionOrder[]>([]);
  const [newPurchaseAlert, setNewPurchaseAlert] = useState<PromotionOrder | null>(null);
  const [metrics, setMetrics] = useState({
    totalAffiliates: 0,
    pendingApprovals: 0,
    totalAppointments: 0,
    totalRevenueMxn: 0,
    pendingMarketingRequests: 0,
    expiringPlansCount: 0
  });

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<MarketingCampaignRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMarketingStatus, setFilterMarketingStatus] = useState<string>('all');
  const [customWebhookPro, setCustomWebhookPro] = useState<string>(
    'https://n8n.bahiago.tech/webhook/marketing-citas-mas'
  );
  const [customWebhookPremium, setCustomWebhookPremium] = useState<string>(
    'https://n8n.bahiago.tech/webhook/marketing-citas-mas'
  );

  // Load all system data (one-time for full lists)
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dataService = DataService.getInstance();
      const [mkt, affs, apts, exp, met, usrList] = await Promise.all([
        dataService.getMarketingRequests(),
        dataService.getAffiliates(),
        dataService.getAppointments(),
        dataService.getExpiringSubscriptions(7),
        dataService.getAdminMetrics(),
        dataService.getAllUsers()
      ]);

      setMarketingRequests(mkt);
      setAffiliates(affs);
      setUsers(usrList);
      setAppointments(apts);
      setExpiringSubscriptions(exp);
      setMetrics(met);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
      showToast('Error al cargar datos del panel de administración', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Real-time listeners for admin-critical events
  useEffect(() => {
    loadDashboardData();

    const dataService = DataService.getInstance();

    // 1. Real-time: Pending affiliates awaiting approval
    const unsubPending = dataService.subscribeToAdminPendingAffiliates((pending) => {
      setPendingAffiliates(pending);
      setMetrics(prev => ({ ...prev, pendingApprovals: pending.length }));
      // Show notification if new affiliates appear
      if (pending.length > 0) {
        showToast(`🔔 ${pending.length} afiliado(s) esperando aprobación`, 'info');
      }
    });

    // 2. Real-time: Promotion package purchases
    const unsubOrders = dataService.subscribeToPromotionOrders((orders) => {
      const prevCount = promotionOrders.length;
      setPromotionOrders(orders);
      // Alert for new purchases
      if (orders.length > prevCount && prevCount > 0) {
        const newest = orders[0];
        setNewPurchaseAlert(newest);
        setTimeout(() => setNewPurchaseAlert(null), 8000);
        showToast(`💳 Nueva compra: ${newest.packageName} — $${newest.priceMxn} MXN`, 'success');
        try { confetti({ particleCount: 60, spread: 45, origin: { y: 0.3 } }); } catch(_) {}
      }
    });

    return () => {
      unsubPending();
      unsubOrders();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1. Authorize & Validate Payment
  const handleValidatePayment = async (request: MarketingCampaignRequest) => {
    try {
      setActionLoadingId(request.id);
      const res = await DataService.getInstance().verifyMarketingPayment(
        request.id,
        `ADMIN-VALIDADO-${Date.now().toString().slice(-6)}`
      );
      if (res.success) {
        showToast(
          `Pago de $${request.costExtraMxn} MXN validado con éxito para ${request.affiliateName}. Ahora puedes Activar la campaña.`,
          'success'
        );
        await loadDashboardData();
      }
    } catch (err) {
      showToast('No se pudo validar el pago.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Activate Campaign & Trigger webhook
  const handleActivateAndTriggerN8N = async (request: MarketingCampaignRequest) => {
    try {
      setActionLoadingId(request.id);
      const webhookUrl = request.level === 'premium_cinema' ? customWebhookPremium : customWebhookPro;

      const res = await DataService.getInstance().authorizeAndDispatchMarketingToN8N(request.id, webhookUrl);

      if (res.success) {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        showToast(res.message, 'success');
        await loadDashboardData();
        if (selectedRequestDetails?.id === request.id && res.request) {
          setSelectedRequestDetails(res.request);
        }
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Error al activar la campaña: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Send automated WhatsApp for expiring subscription
  const handleSendRenewalNotice = async (affiliateId: string, businessName: string) => {
    try {
      setActionLoadingId(affiliateId);
      const res = await DataService.getInstance().sendSubscriptionRenewalNotice(affiliateId);
      if (res.success) {
        showToast(res.message, 'success');
        await loadDashboardData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(`Error al enviar WhatsApp: ${err.message}`, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Batch send all pending renewal notices
  const handleBatchSendRenewals = async () => {
    try {
      setLoading(true);
      const res = await DataService.getInstance().sendAllPendingRenewalNotices();
      if (res.count > 0) {
        confetti({ particleCount: 50, spread: 60 });
        showToast(
          `¡Avisos automáticos enviados por WhatsApp a ${res.count} afiliados sin tarjeta domiciliada!`,
          'success'
        );
      } else {
        showToast('No hay afiliados que requieran aviso de renovación urgente en este momento.', 'info');
      }
      await loadDashboardData();
    } catch (err) {
      showToast('Error en el envío masivo de avisos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 5. Toggle Destacado Seguro / Verification status for affiliate
  const handleToggleDestacadoSeguro = async (affiliate: Affiliate) => {
    try {
      setActionLoadingId(affiliate.id);
      const newStatus = !affiliate.isDestacadoSeguro;
      const updatedAffiliate: Affiliate = {
        ...affiliate,
        isDestacadoSeguro: newStatus,
        verificationTier: newStatus ? 'destacado_seguro' : 'active',
        approvalStatus: newStatus ? 'approved' : affiliate.approvalStatus,
        updatedAt: new Date().toISOString()
      };
      await DataService.getInstance().saveAffiliate(updatedAffiliate);
      showToast(
        `Insignia Destacado Seguro ${newStatus ? 'otorgada' : 'retirada'} a ${affiliate.businessName || affiliate.name}.`,
        'success'
      );
      await loadDashboardData();
    } catch (err) {
      showToast('Error al actualizar verificación', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 6. Delete affiliate account permanently
  const handleDeleteAffiliate = async (affiliateId: string, name: string) => {
    if (!window.confirm(`¿Estás completamente seguro de ELIMINAR permanentemente la cuenta del afiliado "${name}"?\nEsta acción no se puede deshacer y borrará su perfil del sistema.`)) {
      return;
    }
    setActionLoadingId(affiliateId);
    try {
      const ok = await DataService.getInstance().deleteAffiliate(affiliateId);
      if (ok) {
        setAffiliates(prev => prev.filter(a => a.id !== affiliateId));
        setMetrics(prev => ({ ...prev, totalAffiliates: Math.max(0, prev.totalAffiliates - 1) }));
        showToast(`Afiliado "${name}" eliminado permanentemente`, 'success');
      } else {
        showToast('Error al eliminar afiliado', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar afiliado', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 7. Delete user/client account permanently
  const handleDeleteUser = async (userId: string, emailOrName: string) => {
    if (!window.confirm(`¿Estás seguro de ELIMINAR permanentemente la cuenta de usuario "${emailOrName}"?\nSe borrarán sus accesos del sistema.`)) {
      return;
    }
    setActionLoadingId(userId);
    try {
      const ok = await DataService.getInstance().deleteUser(userId);
      if (ok) {
        setUsers(prev => prev.filter(u => u.uid !== userId));
        showToast(`Usuario "${emailOrName}" eliminado con éxito`, 'success');
      } else {
        showToast('Error al eliminar usuario', 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error al eliminar usuario', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter marketing requests
  const filteredMarketingRequests = marketingRequests.filter((req) => {
    const matchesSearch =
      req.affiliateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterMarketingStatus === 'pending') {
      return matchesSearch && req.adminApprovalStatus === 'pending_approval';
    }
    if (filterMarketingStatus === 'authorized') {
      return matchesSearch && req.adminApprovalStatus === 'authorized_dispatched';
    }
    if (filterMarketingStatus === 'paid') {
      return matchesSearch && req.paymentStatus === 'paid_verified';
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Toast alert notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 text-xs md:text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-300 max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 border-emerald-600 text-emerald-100'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 border-rose-600 text-rose-100'
              : 'bg-indigo-950 border-indigo-600 text-indigo-100'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Bell className="w-5 h-5 text-indigo-400 shrink-0" />}
          <p className="leading-snug">{toastMessage.text}</p>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/40">
                Panel Maestro Oficial
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Citas Más v2.5</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center space-x-2">
              <span>Administración General</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Admin Email Chip */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
              M
            </div>
            <div className="text-left">
              <span className="block text-[11px] font-bold text-white leading-none">
                {adminEmail}
              </span>
              <span className="block text-[9px] text-emerald-400 font-semibold">
                Admin General Autorizado
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onBackToApp}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {onLogoutAdmin && (
            <button
              type="button"
              onClick={onLogoutAdmin}
              className="bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl border border-rose-800/60 transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Cerrar Sesión de Administrador General"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {/* Notification Banner for Pending Approvals */}
      {metrics.pendingMarketingRequests > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-700/50 px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3 text-amber-200 text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            <span className="font-bold">
              ¡Tienes {metrics.pendingMarketingRequests} solicitud(es) de Marketing Pro / Premium esperando tu autorización!
            </span>
          </div>
          <button
            onClick={() => {
              setActiveTab('marketing_requests');
              setFilterMarketingStatus('pending');
            }}
            className="text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-3 py-1 rounded-lg transition-all shadow shrink-0"
          >
            Revisar y Autorizar Ahora ➔
          </button>
        </div>
      )}

      {/* Expiring Subscriptions Notification Banner */}
      {metrics.expiringPlansCount > 0 && (
        <div className="bg-gradient-to-r from-rose-950/70 via-slate-900 to-rose-950/70 border-b border-rose-800/40 px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5 text-rose-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>{metrics.expiringPlansCount} afiliado(s)</strong> con plan por vencer en menos de 7 días <strong>SIN tarjeta automática registrada</strong>.
            </span>
          </div>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className="text-[11px] bg-rose-600 hover:bg-rose-500 text-white font-bold px-2.5 py-0.5 rounded-md transition-all shrink-0 flex items-center space-x-1"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Ver y Enviar WhatsApps Automáticos</span>
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Metric Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Campañas Pro / Premium</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-black text-white">{marketingRequests.length}</span>
                {metrics.pendingMarketingRequests > 0 && (
                  <span className="text-[10px] bg-amber-950 text-amber-400 font-bold px-1.5 py-0.5 rounded border border-amber-800">
                    {metrics.pendingMarketingRequests} pendientes
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Planes por Caducar (7d)</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-black text-white">{metrics.expiringPlansCount}</span>
                <span className="text-[10px] text-rose-400 font-medium">Sin tarjeta</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Afiliados Totales</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-black text-white">{metrics.totalAffiliates}</span>
                {pendingAffiliates.length > 0 && (
                  <span className="text-[10px] bg-rose-950 text-rose-400 font-bold px-1.5 py-0.5 rounded border border-rose-800 animate-pulse">
                    {pendingAffiliates.length} aprobación
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Citas & Anticipos</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-black text-white">${metrics.totalRevenueMxn.toLocaleString()}</span>
                <span className="text-[10px] text-indigo-400 font-mono">MXN</span>
              </div>
            </div>
          </div>
        </section>

        {/* 🆕 New purchase real-time alert banner */}
        {newPurchaseAlert && (
          <div className="bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-700/60 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-black text-sm">💳 ¡Nueva Compra de Paquete de Exposición!</p>
                <p className="text-emerald-300 text-xs">{newPurchaseAlert.packageName} — <strong>${newPurchaseAlert.priceMxn.toLocaleString()} MXN</strong> · {newPurchaseAlert.affiliateName}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('promotion_orders')}
              className="shrink-0 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-xl transition-all"
            >
              Ver ›
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-none gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('marketing_requests')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'marketing_requests'
                ? 'border-amber-400 text-amber-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Campañas Pro & Premium</span>
            {metrics.pendingMarketingRequests > 0 && (
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {metrics.pendingMarketingRequests}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'border-rose-400 text-rose-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Vencimiento de Planes & WhatsApp</span>
            {metrics.expiringPlansCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {metrics.expiringPlansCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('affiliates')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'affiliates'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Afiliados & Verificación</span>
            {pendingAffiliates.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingAffiliates.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Usuarios & Clientes</span>
            {users.length > 0 && (
              <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {users.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('promotion_orders')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'promotion_orders'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Paquetes de Exposición</span>
            {promotionOrders.filter(o => o.status === 'paid').length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {promotionOrders.filter(o => o.status === 'paid').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'appointments'
                ? 'border-indigo-400 text-indigo-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Auditoría de Citas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center space-x-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'settings'
                ? 'border-slate-300 text-white bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Automatizaciones</span>
          </button>
        </div>

        {/* ====================================================================
            TAB: PAQUETES DE EXPOSICIÓN EN REDES SOCIALES
            ==================================================================== */}
        {activeTab === 'promotion_orders' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white">Paquetes de Exposición Vendidos</h2>
                <p className="text-sm text-slate-400">Historial en tiempo real de todas las compras de paquetes de exposición en redes sociales.</p>
              </div>
              <div className="flex gap-3 text-center">
                {[1, 2, 3].map(level => {
                  const levelNames = { 1: 'Impulso $300', 2: 'Expansión $600', 3: 'Dominación $1,500' };
                  const count = promotionOrders.filter(o => o.packageLevel === level).length;
                  return (
                    <div key={level} className="bg-slate-800 rounded-xl p-3 min-w-[90px]">
                      <p className="text-2xl font-black text-white">{count}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{levelNames[level as 1|2|3]}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {promotionOrders.length === 0 ? (
              <div className="bg-slate-900/40 p-12 text-center rounded-3xl border border-slate-800">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Aún no hay compras de paquetes</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Cuando un afiliado compre un paquete de exposición ($300, $600 o $1,500 MXN), aparecerá aquí en tiempo real con una notificación.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {promotionOrders.map(order => {
                  const levelColors = {
                    1: 'from-blue-900/60 border-blue-700/40 text-blue-300',
                    2: 'from-purple-900/60 border-purple-700/40 text-purple-300',
                    3: 'from-amber-900/60 border-amber-700/40 text-amber-300',
                  };
                  const statusColors = {
                    pending_payment: 'bg-slate-700 text-slate-300',
                    paid: 'bg-emerald-900/60 text-emerald-400 border border-emerald-700',
                    active: 'bg-blue-900/60 text-blue-400 border border-blue-700',
                    completed: 'bg-slate-700 text-slate-300',
                    refunded: 'bg-red-900/60 text-red-400 border border-red-700',
                  };
                  return (
                    <div key={order.id} className={`bg-gradient-to-r ${levelColors[order.packageLevel] || 'from-slate-900/60 border-slate-700/40 text-slate-300'} bg-slate-900/80 rounded-2xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-black text-white text-sm">{order.packageName}</p>
                          <p className="text-xs text-slate-400">{order.affiliateName} · {order.affiliatePhone}</p>
                          <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-black text-white">${order.priceMxn.toLocaleString()} MXN</p>
                          {order.totalViews !== undefined && (
                            <p className="text-xs text-slate-400">{order.totalViews?.toLocaleString()} vistas · {order.totalClicks} clics</p>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusColors[order.status] || 'bg-slate-700 text-slate-300'}`}>
                          {order.status === 'paid' ? '✅ Pagado' : order.status === 'active' ? '🟢 Activo' : order.status === 'pending_payment' ? '⏳ Pendiente' : order.status === 'refunded' ? '↩️ Reembolso' : order.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 1: MARKETING CAMPAIGNS (PRO $550 & PREMIUM $1250)
            ==================================================================== */}
        {activeTab === 'marketing_requests' && (
          <div className="space-y-6">
            {/* Filter and control bar */}
            <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por negocio o titular..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs pl-9 pr-3 py-2 rounded-xl focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <select
                  value={filterMarketingStatus}
                  onChange={(e) => setFilterMarketingStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-white text-xs py-2 px-3 rounded-xl focus:border-amber-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Solo Pendientes de Autorización</option>
                  <option value="paid">Solo Pagados</option>
                  <option value="authorized">Solo Activados</option>
                </select>
              </div>

              <div className="text-xs text-slate-400 text-right">
                <span>Mostrando <strong>{filteredMarketingRequests.length}</strong> solicitudes</span>
              </div>
            </div>

            {/* List of Marketing Requests */}
            {filteredMarketingRequests.length === 0 ? (
              <div className="bg-slate-900/40 p-12 text-center rounded-3xl border border-slate-800">
                <Zap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No hay solicitudes que coincidan</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Las solicitudes creadas desde las herramientas de marketing de los afiliados aparecerán aquí para tu validación y activación.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredMarketingRequests.map((req) => {
                  const isPendingApproval = req.adminApprovalStatus === 'pending_approval';
                  const isAuthorized = req.adminApprovalStatus === 'authorized_dispatched';
                  const isPaid = req.paymentStatus === 'paid_verified';
                  const isPro = req.level === 'pro_animated';

                  return (
                    <div
                      key={req.id}
                      className={`bg-slate-900/90 rounded-2xl border transition-all p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                        isPendingApproval
                          ? 'border-amber-700/60 shadow-lg shadow-amber-950/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Level badge */}
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                              isPro
                                ? 'bg-amber-950 text-amber-300 border-amber-700/60'
                                : 'bg-purple-950 text-purple-300 border-purple-700/60'
                            }`}
                          >
                            {req.levelLabel}
                          </span>

                          {/* Extra Cost or Free Benefit tag */}
                          {req.isFreeBenefitApplied || req.costExtraMxn === 0 ? (
                            <span className="text-xs font-mono font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-emerald-400 px-2 py-0.5 rounded-md flex items-center space-x-1 shadow-sm">
                              <Sparkles className="w-3 h-3" />
                              <span>GRATIS ($0 MXN • Alto Nivel)</span>
                            </span>
                          ) : (
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60">
                              +${req.costExtraMxn} MXN
                            </span>
                          )}

                          {/* Affiliate Tier indicator */}
                          {req.affiliateTierLevel === 3 ? (
                            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/60">
                              🌟 Más Alto Nivel
                            </span>
                          ) : req.affiliateTierLevel === 1 ? (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-700/60">
                              👤 Usuario Nivel 1
                            </span>
                          ) : null}

                          {/* Payment status badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center space-x-1 ${
                              req.isFreeBenefitApplied || req.costExtraMxn === 0
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                                : isPaid
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                            }`}
                          >
                            {req.isFreeBenefitApplied || req.costExtraMxn === 0 ? (
                              <>
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                <span>Beneficio de Membresía Aplicado ($0 MXN)</span>
                              </>
                            ) : isPaid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Pago Verificado ({req.paymentMethod?.toUpperCase() || 'PAGADO'})</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 text-rose-400" />
                                <span>Pendiente de Pago (${req.costExtraMxn} MXN)</span>
                              </>
                            )}
                          </span>

                          {/* Admin approval badge */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isAuthorized
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-700/60'
                                : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            }`}
                          >
                            {isAuthorized ? '✓ Autorizado & Activo' : '⏳ Pendiente de Autorización'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-white flex items-center space-x-2">
                            <span>{req.affiliateName}</span>
                            {req.affiliateCity && (
                              <span className="text-xs text-slate-400 font-normal">({req.affiliateCity})</span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-300 font-medium mt-0.5 line-clamp-1">
                            "{req.headline}"
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                          <span>Folio: <strong className="text-slate-300 font-mono">#{req.id}</strong></span>
                          <span>Solicitado: {new Date(req.requestedAt).toLocaleString('es-MX')}</span>
                          {req.paymentReference && (
                            <span>Ref: <strong className="text-slate-300 font-mono">{req.paymentReference}</strong></span>
                          )}
                          {req.n8nDispatchedAt && (
                            <span className="text-emerald-400 font-mono">
                              Activado: {new Date(req.n8nDispatchedAt).toLocaleTimeString('es-MX')}
                            </span>
                          )}
                        </div>

                        {req.benefitReason && (
                          <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/80 flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span><strong>Regla de beneficio:</strong> {req.benefitReason}</span>
                          </div>
                        )}

                        {req.notes && (
                          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <strong>Nota técnica:</strong> {req.notes}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center">
                        {/* Step 1: Validate Payment if not paid and not free */}
                        {!isPaid && !req.isFreeBenefitApplied && req.costExtraMxn > 0 && (
                          <button
                            type="button"
                            disabled={actionLoadingId === req.id}
                            onClick={() => handleValidatePayment(req)}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow cursor-pointer"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Validar Pago (${req.costExtraMxn} MXN)</span>
                          </button>
                        )}

                        {/* Step 2: Authorize & Activate n8n trigger */}
                        {!isAuthorized ? (
                          <button
                            type="button"
                            disabled={(!isPaid && !req.isFreeBenefitApplied && req.costExtraMxn > 0) || actionLoadingId === req.id}
                            onClick={() => handleActivateAndTriggerN8N(req)}
                            className={`text-xs font-black px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all shadow cursor-pointer ${
                              isPaid || req.isFreeBenefitApplied || req.costExtraMxn === 0
                                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            }`}
                            title={
                              !isPaid && !req.isFreeBenefitApplied
                                ? 'Primero debes validar el pago de la campaña'
                                : 'Activar Campaña'
                            }
                          >
                            {actionLoadingId === req.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Activando...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                <span>Autorizar & Activar Campaña</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-emerald-950 text-emerald-300 font-bold px-3 py-2 rounded-xl border border-emerald-700/60 flex items-center space-x-1.5">
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Campaña Activa</span>
                            </span>

                            <button
                              type="button"
                              onClick={() => handleActivateAndTriggerN8N(req)}
                              className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-2 rounded-xl border border-slate-700 flex items-center space-x-1"
                              title="Re-activar Campaña"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Reenviar</span>
                            </button>
                          </div>
                        )}

                        {/* View payload/details */}
                        <button
                          type="button"
                          onClick={() => setSelectedRequestDetails(req)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-700 flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Payload & Requisitos</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====================================================================
            TAB 2: SUBSCRIPTION EXPIRY & AUTOMATIC WHATSAPP NOTICES
            ==================================================================== */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            {/* Header explanation & Batch Trigger */}
            <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 p-6 rounded-3xl border border-rose-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                    Automatización de WhatsApp
                  </span>
                  <span className="text-rose-300 text-xs font-bold">
                    Aviso Previo de Caducidad (7 Días)
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  Control de Suscripciones & Cobro Automático
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  El sistema detecta automáticamente los planes que están por vencer. Si el afiliado <strong>NO tiene registrada una tarjeta de cobro automático</strong>, se le envía un mensaje oficial de WhatsApp con recordatorio para renovar y no perder la visibilidad en el portal ni la confirmación de citas.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleBatchSendRenewals}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-4 py-3 rounded-2xl flex items-center space-x-2 shadow-lg shadow-rose-950/40 cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Disparar WhatsApps a Planes por Vencer Sin Tarjeta</span>
                </button>
              </div>
            </div>

            {/* List of Subscriptions */}
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  <span>Estado de Suscripciones de Afiliados ({expiringSubscriptions.length})</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {expiringSubscriptions.filter((s) => s.needsManualCardNotice).length} requieren recordatorio urgente
                </span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {expiringSubscriptions.map((item) => {
                  const { affiliate, daysUntilExpiry, isExpiringSoon, needsManualCardNotice, expiryDateFormatted } = item;

                  return (
                    <div
                      key={affiliate.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        needsManualCardNotice ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <h4 className="text-sm font-bold text-white">{affiliate.businessName || affiliate.name}</h4>
                          <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            Plan {affiliate.plan.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                          <span>Vence el: <strong className="text-slate-200">{expiryDateFormatted}</strong></span>
                          <span>(En <strong>{daysUntilExpiry} días</strong>)</span>

                          {/* Card presence status */}
                          {affiliate.hasAutoPaymentCard ? (
                            <span className="text-emerald-400 font-medium flex items-center space-x-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Tarjeta Domiciliada Automática (•••• {affiliate.cardLast4 || '4242'})</span>
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center space-x-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>SIN Tarjeta Registrada Automática</span>
                            </span>
                          )}
                        </div>

                        {affiliate.lastRenewalNoticeSentAt && (
                          <div className="text-[11px] text-slate-400">
                            Último aviso WhatsApp enviado: {new Date(affiliate.lastRenewalNoticeSentAt).toLocaleString('es-MX')}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="shrink-0 flex items-center space-x-2">
                        {needsManualCardNotice ? (
                          <button
                            type="button"
                            disabled={actionLoadingId === affiliate.id}
                            onClick={() => handleSendRenewalNotice(affiliate.id, affiliate.businessName || affiliate.name)}
                            className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition-all shadow"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Enviar Aviso por WhatsApp</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoadingId === affiliate.id}
                            onClick={() => handleSendRenewalNotice(affiliate.id, affiliate.businessName || affiliate.name)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-700 flex items-center space-x-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Enviar Recordatorio</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: AFFILIATES MANAGEMENT & SEP VERIFICATION
            ==================================================================== */}
        {activeTab === 'affiliates' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Listado Maestro de Afiliados ({affiliates.length})</span>
                </h3>
              </div>

              <div className="divide-y divide-slate-800/70">
                {affiliates.map((aff) => (
                  <div key={aff.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <img
                        src={aff.logo}
                        alt={aff.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">{aff.businessName || aff.name}</h4>
                          {aff.isDestacadoSeguro && (
                            <span className="bg-emerald-950 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-700/60 flex items-center space-x-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              <span>Destacado Seguro</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400">
                          {aff.categoryLabel} · {aff.city}, {aff.state} · Calificación: ⭐ {aff.rating} ({aff.reviewCount} reseñas)
                        </p>

                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-2 pt-0.5">
                          <span>Documentos: {aff.documents?.length || 0} registrados</span>
                          <span>Citas completadas: {aff.completedAppointments}</span>
                          <span>WhatsApp acumulados: {aff.monthlyMessagesSent || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDestacadoSeguro(aff)}
                        className={`text-xs font-bold px-3.5 py-2 rounded-xl border flex items-center space-x-1.5 transition-all ${
                          aff.isDestacadoSeguro
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        <span>{aff.isDestacadoSeguro ? 'Destacado Seguro Activo' : 'Otorgar Destacado Seguro'}</span>
                      </button>

                      {onSelectAffiliateView && (
                        <button
                          type="button"
                          onClick={() => onSelectAffiliateView(aff.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium px-3 py-2 rounded-xl border border-slate-700"
                        >
                          Ver Perfil
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={actionLoadingId === aff.id}
                        onClick={() => handleDeleteAffiliate(aff.id, aff.businessName || aff.name)}
                        className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1 transition-all cursor-pointer"
                        title="Eliminar permanentemente este afiliado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3.5: USERS & CLIENTS MANAGEMENT
            ==================================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Listado Maestro de Usuarios & Clientes ({users.length})</span>
                </h3>
              </div>

              {users.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  No hay cuentas de usuario registradas o sincronizadas en el sistema.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/70">
                  {users.map((usr) => (
                    <div key={usr.uid} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">{usr.displayName || 'Usuario'}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              usr.role === 'admin'
                                ? 'bg-purple-950 text-purple-300 border border-purple-700'
                                : usr.role === 'promoter'
                                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                                : usr.role === 'affiliate'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                : 'bg-blue-950 text-blue-300 border border-blue-700'
                            }`}
                          >
                            {usr.role === 'client' ? 'Cliente / Usuario Final' : usr.role}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                          <span>Email: <strong className="text-slate-200">{usr.email}</strong></span>
                          {usr.phone && <span>Tel: {usr.phone}</span>}
                          {usr.createdAt && <span>Registrado: {new Date(usr.createdAt).toLocaleDateString('es-MX')}</span>}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          disabled={actionLoadingId === usr.uid}
                          onClick={() => handleDeleteUser(usr.uid, usr.email || usr.displayName)}
                          className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 hover:text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1 transition-all cursor-pointer"
                          title="Eliminar permanentemente este usuario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar Cuenta</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: APPOINTMENTS GLOBAL AUDIT
            ==================================================================== */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 rounded-3xl border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Auditoría de Citas & Anticipos en la Red Citas Más ({appointments.length})</span>
                </h3>
              </div>

              <div className="divide-y divide-slate-800/70">
                {appointments.map((apt) => (
                  <div key={apt.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs text-slate-400">#{apt.id}</span>
                        <h4 className="text-sm font-bold text-white">{apt.serviceName}</h4>
                        <span className="text-xs text-slate-400">con {apt.affiliateName}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-400">
                        <span>Cliente: <strong className="text-slate-200">{apt.clientName}</strong></span>
                        <span>Fecha: {apt.date} a las {apt.time} hrs</span>
                        <span>Anticipo: <strong className="text-emerald-400">${apt.paidAmount || apt.servicePrice} MXN</strong></span>
                        <span className="capitalize text-indigo-300">({apt.paymentMethod || 'tarjeta'})</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : apt.status === 'completed'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 5: N8N WEBHOOKS CONFIGURATION
            ==================================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-5 max-w-3xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>Configuración de Automatizaciones para Campañas</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Define los endpoints de conexión que se ejecutan al dar clic en "Activar" tras autorizar y verificar el pago de las campañas Pro y Premium.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Endpoint para Campaña Pro ($550 MXN - Flyer Animado & Voz IA):
                  </label>
                  <input
                    type="text"
                    value={customWebhookPro}
                    onChange={(e) => setCustomWebhookPro(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-xs p-3 rounded-xl focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Endpoint para Campaña Premium ($1,250 MXN - Video Cinematográfico 4K):
                  </label>
                  <input
                    type="text"
                    value={customWebhookPremium}
                    onChange={(e) => setCustomWebhookPremium(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-purple-300 font-mono text-xs p-3 rounded-xl focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => showToast('Configuración de automatizaciones guardada con éxito', 'success')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow cursor-pointer"
                >
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal: Request details & n8n payload review */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase">
                  Detalle de Solicitud #{selectedRequestDetails.id}
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedRequestDetails.levelLabel} - {selectedRequestDetails.affiliateName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequestDetails(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block">Costo de Campaña:</span>
                  <strong className="text-emerald-400 text-sm font-mono font-bold">
                    {selectedRequestDetails.isFreeBenefitApplied || selectedRequestDetails.costExtraMxn === 0
                      ? '$0 MXN (Gratis)'
                      : `$${selectedRequestDetails.costExtraMxn} MXN`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Nivel de Afiliado:</span>
                  <strong className="text-white">
                    {selectedRequestDetails.affiliateTierLevel === 3
                      ? '🌟 Nivel 3 (Más Alto Nivel)'
                      : selectedRequestDetails.affiliateTierLevel === 1
                      ? '👤 Usuario Nivel 1'
                      : 'Nivel 2 (Pro)'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Estado de Pago:</span>
                  <strong className={selectedRequestDetails.isFreeBenefitApplied || selectedRequestDetails.paymentStatus === 'paid_verified' ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedRequestDetails.isFreeBenefitApplied
                      ? '🎁 Cortesía Alto Nivel ($0)'
                      : selectedRequestDetails.paymentStatus === 'paid_verified'
                      ? 'Pagado & Verificado'
                      : 'Pendiente de Pago'}
                  </strong>
                </div>
              </div>

              {selectedRequestDetails.benefitReason && (
                <div className="bg-emerald-950/40 border border-emerald-700/60 p-3 rounded-xl text-emerald-300">
                  <span className="font-bold block flex items-center space-x-1 mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Beneficio de Publicidad Aplicado:</span>
                  </span>
                  <p>{selectedRequestDetails.benefitReason}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400 block font-bold mb-1">Titular / Gancho Creativo:</span>
                <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200">
                  {selectedRequestDetails.headline}
                </p>
              </div>

              {selectedRequestDetails.scriptHook && (
                <div>
                  <span className="text-slate-400 block font-bold mb-1">Guion / Mensaje:</span>
                  <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-slate-200 leading-relaxed">
                    {selectedRequestDetails.scriptHook}
                  </p>
                </div>
              )}

              {selectedRequestDetails.n8nResultSummary && (
                <div>
                  <span className="text-slate-400 block font-bold mb-1">Resultado de Ejecución:</span>
                  <pre className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                    {selectedRequestDetails.n8nResultSummary}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRequestDetails(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
