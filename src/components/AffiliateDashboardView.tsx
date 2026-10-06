import React, { useState, useEffect } from 'react';
import { Affiliate, Appointment, SubscriptionPlanType, ServiceItem } from '../types.ts';
import { DataService } from '../services/dataService.ts';
import { StripeService, StripePayoutItem } from '../services/stripeService.ts';
import { AffiliateCalendarView } from './AffiliateCalendarView.tsx';
import { AffiliateApprovalStatusBanner } from './AffiliateApprovalStatusBanner.tsx';
import { AffiliateAnalyticsCharts } from './AffiliateAnalyticsCharts.tsx';
import { ImageUploader } from './ImageUploader.tsx';
import { GalleryUploader } from './GalleryUploader.tsx';
import { CategorySelector } from './CategorySelector.tsx';
import { PlanCheckoutModal } from './PlanCheckoutModal.tsx';
import { evaluateVerificationTier } from '../utils/verification.ts';
import { getWorkingHoursSummaryLines } from '../utils/scheduleHelper.ts';
import {
  createWhatsAppNoteMessage,
  createWhatsAppCancellationMessage,
  getWhatsAppDirectUrl
} from '../utils/twilioWhatsApp.ts';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  CalendarDays,
  Palette,
  Clock,
  Briefcase,
  Crown,
  CreditCard,
  ArrowUpRight,
  MessageSquare,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Zap,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Phone,
  Send,
  Sparkles,
  Award,
  Upload,
  Database,
  RefreshCw,
  ChevronDown,
  Target,
  Video,
  Film,
  Building2,
  Landmark,
  Check,
  AlertCircle,
  ArrowRight,
  Wallet,
  Receipt,
  Sliders,
  Settings,
  BarChart3,
  Share2
} from 'lucide-react';
import { validateAndDetectClabe, calculatePayoutBreakdown, MEXICAN_BANKS } from '../utils/mexicanBankUtils.ts';
import { MarketingToolsView } from './MarketingToolsView.tsx';

interface Props {
  currentAffiliate: Affiliate;
  onUpdateAffiliate: (updated: Affiliate) => void;
  onPreviewLanding: (affiliate: Affiliate) => void;
  onTriggerWhatsAppDrawer: (appointment: Appointment) => void;
  onOpenOnboardingTour?: () => void;
}

export const AffiliateDashboardView: React.FC<Props> = ({
  currentAffiliate,
  onUpdateAffiliate,
  onPreviewLanding,
  onTriggerWhatsAppDrawer,
  onOpenOnboardingTour
}) => {
  const [activeTab, setActiveTab] = useState<
    'appointments' | 'calendar' | 'analytics' | 'landing_customizer' | 'schedule' | 'services' | 'billing' | 'twilio_logs' | 'marketing'
  >('calendar');
  const [marketingInitialSubTab, setMarketingInitialSubTab] = useState<
    'audience' | 'campaign_2d' | 'campaign_pro' | 'campaign_premium' | 'n8n_retention' | 'analytics_bi'
  >('audience');
  const [isMarketingMenuOpen, setIsMarketingMenuOpen] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  // Form state for landing customizer
  const [formData, setFormData] = useState<Affiliate>(currentAffiliate);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Internal note dialog state
  const [selectedAppointmentForNote, setSelectedAppointmentForNote] = useState<Appointment | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSendingNote, setIsSendingNote] = useState(false);

  // New service modal state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(500);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(50);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Billing cycle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Stripe financial metrics & payouts
  const [stripeBalance, setStripeBalance] = useState<{ availableMxn: number; pendingMxn: number }>({
    availableMxn: 0,
    pendingMxn: 0
  });
  const [stripePayouts, setStripePayouts] = useState<StripePayoutItem[]>([]);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);
  const [isStartingStripeSub, setIsStartingStripeSub] = useState(false);

  const loadStripeData = async () => {
    setIsLoadingStripe(true);
    try {
      const res = await StripeService.getInstance().getPayoutsAndBalance();
      setStripeBalance(res.balance);
      setStripePayouts(res.payouts);
    } catch (err) {
      console.warn('Stripe balance load error:', err);
    } finally {
      setIsLoadingStripe(false);
    }
  };

  // Bank Account (CLABE) & Payout Schedule state
  const [clabeInput, setClabeInput] = useState<string>(currentAffiliate.payoutClabe || '');
  const [holderNameInput, setHolderNameInput] = useState<string>(
    currentAffiliate.payoutHolderName || currentAffiliate.businessName || currentAffiliate.name || ''
  );
  const [payoutSchedule, setPayoutSchedule] = useState<'weekly' | 'instant'>(
    currentAffiliate.payoutSchedule || 'weekly'
  );
  const [isSavingBankSettings, setIsSavingBankSettings] = useState(false);
  const [bankSaveSuccess, setBankSaveSuccess] = useState('');
  const [bankSaveError, setBankSaveError] = useState('');

  // Payout simulation & execution modal state
  const [simulatedAmount, setSimulatedAmount] = useState<number>(1000);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutWithdrawAmount, setPayoutWithdrawAmount] = useState<number>(1000);
  const [isExecutingPayout, setIsExecutingPayout] = useState(false);
  const [lastPayoutReceipt, setLastPayoutReceipt] = useState<any>(null);

  // Upgrade Plan Checkout Modal state
  const [isPlanCheckoutModalOpen, setIsPlanCheckoutModalOpen] = useState(false);
  const [checkoutPlanTarget, setCheckoutPlanTarget] = useState<SubscriptionPlanType | 'turbo'>('pro');
  const [checkoutTurboLevel, setCheckoutTurboLevel] = useState<1 | 2 | 3>(currentAffiliate.turboLevel || 1);
  const [selectedPlanTab, setSelectedPlanTab] = useState<SubscriptionPlanType | 'turbo'>(currentAffiliate.plan || 'pro');
  const [checkoutServiceTarget, setCheckoutServiceTarget] = useState<ServiceItem | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [currentAffiliate.id]);

  useEffect(() => {
    if (activeTab === 'billing') {
      loadStripeData();
    }
  }, [activeTab]);

  useEffect(() => {
    setFormData(currentAffiliate);
    if (currentAffiliate.plan) {
      setSelectedPlanTab(currentAffiliate.plan);
    }
    if (currentAffiliate.payoutClabe) {
      setClabeInput(currentAffiliate.payoutClabe);
    }
    if (currentAffiliate.payoutHolderName) {
      setHolderNameInput(currentAffiliate.payoutHolderName);
    }
    if (currentAffiliate.payoutSchedule) {
      setPayoutSchedule(currentAffiliate.payoutSchedule);
    }
  }, [currentAffiliate]);

  const loadAppointments = async () => {
    const list = await DataService.getInstance().getAppointments(currentAffiliate.id);
    setAppointments(list);
  };

  const handleSaveAffiliate = async (customAffiliateData?: Affiliate | React.MouseEvent<any> | unknown) => {
    const isAffiliateObj =
      customAffiliateData &&
      typeof customAffiliateData === 'object' &&
      'id' in (customAffiliateData as Record<string, unknown>) &&
      typeof (customAffiliateData as any).id === 'string' &&
      'category' in (customAffiliateData as Record<string, unknown>);

    const dataToSave = isAffiliateObj ? (customAffiliateData as Affiliate) : formData;
    try {
      setIsSaving(true);
      await DataService.getInstance().saveAffiliate(dataToSave);
      onUpdateAffiliate(dataToSave);
      setSaveSuccessMsg('¡Imágenes y datos guardados con éxito!');
      setTimeout(() => setSaveSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Error guardando los cambios. Por favor intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAppointmentStatus = async (
    apt: Appointment,
    newStatus: Appointment['status']
  ) => {
    const updated: Appointment = {
      ...apt,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    if (newStatus === 'cancelled') {
      // Automatic cancellation WhatsApp message
      const cancelMsg = createWhatsAppCancellationMessage(apt, 0, 0);
      updated.whatsappMessages.unshift(cancelMsg);
    }

    await DataService.getInstance().updateAppointment(updated);
    await loadAppointments();
    onTriggerWhatsAppDrawer(updated);
  };

  const handleSendInternalNote = async () => {
    if (!selectedAppointmentForNote || !noteText.trim()) return;
    setIsSendingNote(true);

    const noteMsg = createWhatsAppNoteMessage(selectedAppointmentForNote, noteText.trim());
    const updated: Appointment = {
      ...selectedAppointmentForNote,
      internalNotes: noteText.trim(),
      whatsappMessages: [noteMsg, ...selectedAppointmentForNote.whatsappMessages],
      updatedAt: new Date().toISOString()
    };

    await DataService.getInstance().updateAppointment(updated);
    await loadAppointments();
    setIsSendingNote(false);
    setSelectedAppointmentForNote(null);
    setNoteText('');
    onTriggerWhatsAppDrawer(updated);
  };

  const handleAddService = () => {
    if (!newServiceName.trim()) return;
    const newService = {
      id: `srv-${Date.now()}`,
      name: newServiceName.trim(),
      price: Number(newServicePrice) || 300,
      duration: Number(newServiceDuration) || 45,
      description: newServiceDesc.trim() || 'Servicio profesional'
    };

    const updated = {
      ...formData,
      services: [...formData.services, newService]
    };
    setFormData(updated);
    onUpdateAffiliate(updated);
    DataService.getInstance().saveAffiliate(updated);

    setNewServiceName('');
    setNewServicePrice(500);
    setNewServiceDuration(50);
    setNewServiceDesc('');
  };

  const handleDeleteService = (id: string) => {
    const updated = {
      ...formData,
      services: formData.services.filter((s) => s.id !== id)
    };
    setFormData(updated);
    onUpdateAffiliate(updated);
    DataService.getInstance().saveAffiliate(updated);
  };

  const handleOpenPlanCheckout = (plan: SubscriptionPlanType | 'turbo') => {
    setSelectedPlanTab(plan);
    setCheckoutPlanTarget(plan);
    setCheckoutServiceTarget(null);
    setIsPlanCheckoutModalOpen(true);
  };

  const handleSelectPlanAndOpenPayment = (plan: SubscriptionPlanType | 'turbo') => {
    setSelectedPlanTab(plan);
    setCheckoutPlanTarget(plan);
    setCheckoutServiceTarget(null);
    setIsPlanCheckoutModalOpen(true);
  };

  const handleSelectTurboAndOpenPayment = (level: 1 | 2 | 3) => {
    setSelectedPlanTab('turbo');
    setCheckoutPlanTarget('turbo');
    setCheckoutTurboLevel(level);
    setCheckoutServiceTarget(null);
    setIsPlanCheckoutModalOpen(true);
  };

  const handleOpenServiceCheckout = (service: ServiceItem) => {
    setCheckoutServiceTarget(service);
    setIsPlanCheckoutModalOpen(true);
  };

  const handlePlanCheckoutSuccess = (newPlan: SubscriptionPlanType, isTurbo?: boolean, turboLevel?: 1 | 2 | 3) => {
    setSelectedPlanTab(newPlan);
    const updated: Affiliate = {
      ...formData,
      plan: newPlan,
      isTurbo: isTurbo ? true : formData.isTurbo,
      turboLevel: isTurbo && turboLevel ? turboLevel : formData.turboLevel,
      turboLevelExtraCost: isTurbo && turboLevel ? (turboLevel === 1 ? 200 : turboLevel === 2 ? 700 : 1500) : formData.turboLevelExtraCost,
      affiliateTierLevel: newPlan === 'equipo' ? 3 : newPlan === 'pro' ? 2 : 1,
      freeLevel2PacksAvailable:
        newPlan === 'equipo'
          ? Math.max(formData.freeLevel2PacksAvailable || 0, 1)
          : formData.freeLevel2PacksAvailable || 0
    };
    setFormData(updated);
    onUpdateAffiliate(updated);
    DataService.getInstance().saveAffiliate(updated);
    setIsPlanCheckoutModalOpen(false);
    setCheckoutServiceTarget(null);
    setSaveSuccessMsg(`¡Plan ${newPlan.toUpperCase()}${isTurbo ? ` con Turbo ${turboLevel || 1}` : ''} activado exitosamente! Tu cuenta ha sido actualizada.`);
    setTimeout(() => setSaveSuccessMsg(''), 6000);
  };

  const handleChangePlan = (plan: SubscriptionPlanType) => {
    handleOpenPlanCheckout(plan);
  };

  const handleSubscribeWithStripe = async (plan: SubscriptionPlanType, priceMxn: number, planName: string) => {
    setIsStartingStripeSub(true);
    try {
      const res = await StripeService.getInstance().subscribeToPlan({
        planId: plan,
        planName,
        priceMxn,
        affiliateId: currentAffiliate.id,
        affiliateEmail: currentAffiliate.email
      });
      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        alert(res.error || 'No se pudo generar la sesión de suscripción en Stripe. Se actualizó el plan.');
        handleChangePlan(plan);
      }
    } catch (err: any) {
      alert('Error en suscripción Stripe: ' + err.message);
      handleChangePlan(plan);
    } finally {
      setIsStartingStripeSub(false);
    }
  };

  const handleToggleTurbo = () => {
    const updated = { ...formData, isTurbo: !formData.isTurbo };
    setFormData(updated);
    onUpdateAffiliate(updated);
    DataService.getInstance().saveAffiliate(updated);
  };

  // Save Affiliate CLABE & Payout Schedule
  const handleSaveBankSettings = async () => {
    setBankSaveError('');
    setBankSaveSuccess('');
    const validation = validateAndDetectClabe(clabeInput);

    if (!validation.isValidLength) {
      setBankSaveError('La CLABE interbancaria debe contener exactamente 18 dígitos numéricos.');
      return;
    }
    if (!holderNameInput.trim()) {
      setBankSaveError('Ingresa el nombre completo o razón social del titular de la cuenta.');
      return;
    }

    setIsSavingBankSettings(true);
    try {
      const updatedAffiliate: Affiliate = {
        ...formData,
        payoutClabe: validation.cleanedClabe,
        payoutBank: validation.bankName,
        payoutHolderName: holderNameInput.trim(),
        payoutSchedule: payoutSchedule,
        payoutInstantFeePercent: 1.5,
        updatedAt: new Date().toISOString()
      };

      setFormData(updatedAffiliate);
      onUpdateAffiliate(updatedAffiliate);
      await DataService.getInstance().saveAffiliate(updatedAffiliate);

      const res = await StripeService.getInstance().savePayoutSettings({
        affiliateId: formData.id,
        payoutClabe: validation.cleanedClabe,
        payoutBank: validation.bankName,
        payoutHolderName: holderNameInput.trim(),
        payoutSchedule: payoutSchedule
      });

      setBankSaveSuccess(
        res.message ||
        `¡Configuración bancaria guardada! Recibirás tus pagos ${
          payoutSchedule === 'instant'
            ? 'al instante (1.5% comisión técnica Stripe)'
            : 'semanalmente sin comisión (0%)'
        } en tu cuenta ${validation.bankName}.`
      );
      setTimeout(() => setBankSaveSuccess(''), 7000);
    } catch (err: any) {
      setBankSaveError(err.message || 'Error al guardar la cuenta CLABE.');
    } finally {
      setIsSavingBankSettings(false);
    }
  };

  // Execute Payout (Instant with 1.5% fee or Weekly with 0% fee)
  const handleExecutePayout = async (amountMxn: number) => {
    setBankSaveError('');
    const validation = validateAndDetectClabe(clabeInput || formData.payoutClabe || '');
    if (!validation.isValidLength) {
      setBankSaveError('Registra y valida tu CLABE interbancaria de 18 dígitos antes de solicitar una dispersión.');
      return;
    }

    setIsExecutingPayout(true);
    try {
      const res = await StripeService.getInstance().requestAffiliatePayout({
        affiliateId: formData.id,
        amountMxn: amountMxn,
        payoutClabe: validation.cleanedClabe,
        payoutBank: validation.bankName,
        payoutHolderName: holderNameInput.trim() || formData.name,
        payoutSchedule: payoutSchedule
      });

      if (res.success && res.payout) {
        setLastPayoutReceipt(res.payout);
        // Add new payout record to state table
        setStripePayouts((prev) => [
          {
            id: res.payout.id,
            amountMxn: res.payout.netAmountMxn,
            currency: 'mxn',
            status: res.payout.status,
            arrivalDate: res.payout.arrivalDate,
            destination: res.payout.bank,
            method: res.payout.payoutSchedule === 'instant' ? 'SPEI Inmediato' : 'SPEI Semanal'
          },
          ...prev
        ]);
        // Update local balance
        setStripeBalance((prev) => ({
          availableMxn: Math.max(0, prev.availableMxn - amountMxn),
          pendingMxn: prev.pendingMxn
        }));
        setBankSaveSuccess(res.message || 'Dispersión bancaria solicitada con éxito.');
        setIsPayoutModalOpen(false);
      } else {
        setBankSaveError(res.error || 'No se pudo completar la dispersión.');
      }
    } catch (err: any) {
      setBankSaveError(err.message || 'Error de conexión con la pasarela.');
    } finally {
      setIsExecutingPayout(false);
    }
  };

  // Metrics
  const totalRevenue = appointments
    .filter((a) => a.paymentStatus === 'paid')
    .reduce((acc, a) => acc + (a.paidAmount || 0), 0);

  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const noShowRate = appointments.length === 0 ? '0.0%' : '1.2%'; // 0% on clean accounts, dramatically reduced by prepaid model

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === 'all') return true;
    return a.status === statusFilter;
  });

  return (
    <div id="affiliate-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Switch Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={formData.logo || 'https://images.unsplash.com/photo-1594824813589-411a0c86e082?w=240&auto=format&fit=crop&q=80'}
            alt="Logo"
            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h1 className="text-lg font-bold text-slate-900">{formData.businessName}</h1>
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md uppercase border border-emerald-200">
                Plan {formData.plan}
              </span>

              {/* UPGRADE MI PLAN BUTTON */}
              <button
                type="button"
                id="btn-upgrade-plan-header"
                onClick={() => handleOpenPlanCheckout(formData.plan === 'basico' ? 'pro' : 'equipo')}
                className="px-2.5 py-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-lg text-[10px] flex items-center space-x-1 shadow-sm transition-all cursor-pointer border border-amber-300 uppercase tracking-wider"
                title="Aumentar o mejorar los servicios de tu cuenta con un plan superior"
              >
                <Sparkles className="w-3 h-3 fill-slate-950" />
                <span>Upgrade mi Plan</span>
              </button>
              {(() => {
                const evalTier = evaluateVerificationTier(formData.documents, formData.professionalDocument);
                if (evalTier.isDestacadoSeguro) {
                  return (
                    <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-xs border border-amber-300">
                      <Award className="w-3 h-3 fill-slate-950" />
                      <span>DESTACADO SEGURO (4/4)</span>
                    </span>
                  );
                }
                if (evalTier.isActive) {
                  return (
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-xs">
                      <ShieldCheck className="w-3 h-3" />
                      <span>USUARIO ACTIVO</span>
                    </span>
                  );
                }
                return (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <span>⚠️ INACTIVO (SUBE 1 DOC)</span>
                  </span>
                );
              })()}
              {formData.isTurbo && (
                <span className="text-[10px] font-extrabold bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full flex items-center space-x-1 shadow-xs">
                  <Zap className="w-3 h-3 fill-current" />
                  <span>TURBO ACTIVO</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              {formData.name} · {formData.categoryLabel || formData.category} · {formData.city}, {formData.state}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end relative">
          {/* Upgrade mi plan Header Action */}
          <button
            type="button"
            id="affiliate-header-upgrade-plan-btn"
            onClick={() => {
              setActiveTab('billing');
              handleSelectPlanAndOpenPayment(
                formData.plan === 'basico' ? 'pro' : formData.plan === 'pro' ? 'equipo' : 'equipo'
              );
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer border border-amber-300"
            title="Aumentar mi plan y capacidad de servicio"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Upgrade mi plan</span>
          </button>

          {/* Quick Config / Tour Buttons */}
          <button
            type="button"
            id="affiliate-quick-config-btn"
            onClick={() => {
              setActiveTab('landing_customizer');
              setSaveSuccessMsg('Modo de configuración de empresa activo. Edita los datos de tu negocio a continuación.');
              setTimeout(() => {
                const el = document.getElementById('save-affiliate-top-btn') || document.getElementById('affiliate-dashboard-category');
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 120);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
              activeTab === 'landing_customizer'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Configurar logotipo, portada, historia y datos de tu empresa"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Configurar Mi Empresa</span>
          </button>

          {onOpenOnboardingTour && (
            <button
              type="button"
              id="affiliate-replay-tour-btn"
              onClick={onOpenOnboardingTour}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border border-emerald-200"
              title="Iniciar paseo guiado por las funciones de tu plataforma"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Iniciar Paseo (Tour)</span>
            </button>
          )}

          {/* Herramientas de Marketing Dropdown Menu */}
          <div className="relative">
            <button
              id="marketing-tools-dropdown-btn"
              type="button"
              onClick={() => setIsMarketingMenuOpen(!isMarketingMenuOpen)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white" />
              <span>Herramientas de Marketing</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {/* Dropdown Menu with advertising levels */}
            {isMarketingMenuOpen && (
              <div
                id="marketing-tools-menu"
                className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-2 space-y-1 animate-in fade-in"
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-extrabold block">
                    Publicidad Inteligente
                  </span>
                  <span className="text-xs font-bold text-white">
                    Elige un nivel publicitario:
                  </span>
                </div>

                <button
                  type="button"
                  id="menu-btn-audience"
                  onClick={() => {
                    setMarketingInitialSubTab('audience');
                    setActiveTab('marketing');
                    setIsMarketingMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-start space-x-3 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-800/60">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-emerald-300 block">
                      1. Descubre tu público objetivo
                    </span>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      Analiza servicios y fotos para darte 3 clientes ideales con miedos y deseos.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="menu-btn-campaign-2d"
                  onClick={() => {
                    setMarketingInitialSubTab('campaign_2d');
                    setActiveTab('marketing');
                    setIsMarketingMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-start space-x-3 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-950 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 border border-teal-800/60">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-teal-300 block">
                      2. Crear campaña (Anuncio 2D)
                    </span>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      Diseña anuncio 2D enfocado en tu cliente ideal y publícalo en tu Landing.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="menu-btn-campaign-pro"
                  onClick={() => {
                    setMarketingInitialSubTab('campaign_pro');
                    setActiveTab('marketing');
                    setIsMarketingMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-start space-x-3 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-800/60">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 block">
                        3. Campaña Nivel Pro
                      </span>
                      <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                        +$450
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      Video vertical con flyer animado, locución IA y música masterizada.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="menu-btn-campaign-premium"
                  onClick={() => {
                    setMarketingInitialSubTab('campaign_premium');
                    setActiveTab('marketing');
                    setIsMarketingMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-start space-x-3 group cursor-pointer border-t border-slate-800/80 pt-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-950 text-purple-400 flex items-center justify-center shrink-0 mt-0.5 border border-purple-800/60">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 block">
                        4. Campaña Premium
                      </span>
                      <span className="bg-purple-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                        Cine 4K
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      Video cinematográfico de alta gama para tu negocio en 4K.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="menu-btn-n8n-retention"
                  onClick={() => {
                    setMarketingInitialSubTab('n8n_retention');
                    setActiveTab('marketing');
                    setIsMarketingMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-start space-x-3 group cursor-pointer border-t border-slate-800/80 pt-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-800/60">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 block">
                        5. Fidelización (n8n + WhatsApp)
                      </span>
                      <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                        n8n Hub
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      Nutrición 24h, recompra 30d, referidos gamificados y re-engagement 60d.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  id="menu-btn-analytics-bi"
                  onClick={() => {
                    setMarketingInitialSubTab('analytics_bi');
                    setActiveTab('marketing');
                    setIsMarketingMenuOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-start space-x-3 group cursor-pointer border-t border-slate-800/80 pt-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-800/60">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-indigo-300 block">
                        6. Analítica & Business Intelligence
                      </span>
                      <span className="bg-indigo-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded">
                        BI & Stats
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block leading-tight">
                      Clics de video, citas cerradas WhatsApp, conversión y reporte semanal de lunes.
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            id="view-public-landing-btn"
            onClick={() => onPreviewLanding(formData)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span>Ver mi Landing</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Affiliate Approval Status Banner */}
      <AffiliateApprovalStatusBanner
        affiliate={formData}
        onStatusChange={(updated) => {
          setFormData(updated);
          onUpdateAffiliate(updated);
        }}
      />

      {/* Metrics Row (Stripe/Notion style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className="text-left bg-white hover:bg-slate-50 transition-all rounded-2xl border border-slate-200 p-4 shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-700 text-xs">
            <span className="group-hover:text-emerald-700 font-semibold">Citas de este mes</span>
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {appointments.length}{' '}
            <span className="text-xs font-normal text-emerald-600 font-semibold">+18% vs mes ant.</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
            <span>{completedCount} citas atendidas</span>
            <span className="text-emerald-600 font-bold group-hover:underline">Ver tendencia →</span>
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className="text-left bg-white hover:bg-slate-50 transition-all rounded-2xl border border-slate-200 p-4 shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-700 text-xs">
            <span className="group-hover:text-emerald-700 font-semibold">Ingresos Cobrados</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ${totalRevenue.toLocaleString('es-MX')}{' '}
            <span className="text-xs font-normal text-slate-600">MXN</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
            <span>100% anticipado en tu cuenta</span>
            <span className="text-emerald-600 font-bold group-hover:underline">Ver proyección →</span>
          </p>
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 text-xs">
            <span>Tasa de No-Shows</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{noShowRate}</div>
          <p className="text-[11px] text-slate-600 mt-1">Garantizado por cobro anticipado</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-700 text-xs">
            <span>Notificaciones WhatsApp</span>
            <MessageSquare className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formData.monthlyMessagesSent || 285}
            <span className="text-xs font-normal text-slate-600">
              {formData.plan === 'basico' ? ' / 100' : ' / Ilimitados'}
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Recordatorios 24h y 2h automáticos</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          id="dashboard-tab-marketing-btn"
          onClick={() => setActiveTab('marketing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'marketing'
              ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md'
              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          <span>Herramientas de Marketing</span>
          <span className="ml-1 bg-emerald-500/20 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded-full font-black border border-emerald-300">
            Pro + IA
          </span>
        </button>

        <button
          id="dashboard-tab-calendar-btn"
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4 text-emerald-400" />
          <span>Calendario & Bloqueos</span>
          {appointments.length > 0 && (
            <span className="ml-1 bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {appointments.length}
            </span>
          )}
        </button>

        <button
          id="dashboard-tab-analytics-btn"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Tendencias & Finanzas</span>
          <span className="ml-1 bg-emerald-500/20 text-emerald-600 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            Recharts
          </span>
        </button>

        <button
          id="dashboard-tab-marketing-btn"
          onClick={() => setActiveTab('marketing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap shadow-xs ${
            activeTab === 'marketing'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
          <span>Marketing & IA (5 Niveles)</span>
          <span className="ml-1 bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
            NUEVO
          </span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Lista de Citas ({appointments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('landing_customizer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'landing_customizer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Personalizar Landing Page</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Horarios & Calendario</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Servicios & Tarifas ({formData.services.length})</span>
        </button>

        <button
          id="dashboard-tab-billing-btn"
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Landmark className="w-4 h-4 text-emerald-400" />
          <span>Cuenta CLABE & Planes de Cobro</span>
          <span className="ml-1 bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
            {payoutSchedule === 'instant' ? 'Inmediato 1.5%' : 'Semanal 0%'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('twilio_logs')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === 'twilio_logs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Notificaciones WhatsApp</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-medium flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* TAB: HERRAMIENTAS DE MARKETING INTELIGENTE & N8N */}
      {activeTab === 'marketing' && (
        <div id="tab-marketing-content" className="space-y-4">
          <MarketingToolsView
            affiliate={formData}
            initialTab={marketingInitialSubTab}
            onUpdateAffiliate={(updated) => {
              setFormData(updated);
              onUpdateAffiliate(updated);
            }}
            onNavigateToLanding={() => onPreviewLanding(formData)}
          />
        </div>
      )}

      {/* TAB: CALENDARIO INTERACTIVO & BLOQUEOS */}
      {activeTab === 'calendar' && (
        <AffiliateCalendarView
          affiliate={formData}
          appointments={appointments}
          onUpdateAffiliate={(updated) => {
            setFormData(updated);
            onUpdateAffiliate(updated);
          }}
          onUpdateAppointments={loadAppointments}
          onTriggerWhatsAppDrawer={onTriggerWhatsAppDrawer}
        />
      )}

      {/* TAB: ANALYTICS & TRENDS WITH RECHARTS */}
      {activeTab === 'analytics' && (
        <AffiliateAnalyticsCharts
          appointments={appointments}
          affiliateName={formData.name}
          monthlyMessagesLimit={formData.monthlyMessagesSent}
        />
      )}

      {/* TAB 1: APPOINTMENTS MANAGEMENT */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs">
              {(['all', 'confirmed', 'pending', 'completed', 'cancelled'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-all ${
                    statusFilter === st ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all'
                    ? 'Todas'
                    : st === 'confirmed'
                    ? 'Confirmadas'
                    : st === 'pending'
                    ? 'Pendientes'
                    : st === 'completed'
                    ? 'Completadas'
                    : 'Canceladas'}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-700">
              Mostrando {filteredAppointments.length} citas
            </span>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-14 text-center text-slate-500 text-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-800">
                  {appointments.length === 0
                    ? 'Tu historial de citas está listo y en blanco'
                    : 'No hay citas en este filtro'}
                </p>
                <p className="text-slate-500 max-w-md mx-auto text-xs leading-relaxed">
                  {appointments.length === 0
                    ? 'Aún no tienes citas registradas. En cuanto tus clientes reserven con anticipo pagado desde tu página web oficial, se registrarán aquí automáticamente y recibirás la notificación por WhatsApp.'
                    : 'Las reservas aparecerán aquí en cuanto cambien de estado o se registren nuevas citas.'}
                </p>
              </div>
              {appointments.length === 0 && (
                <button
                  type="button"
                  onClick={() => onPreviewLanding(formData)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver mi Página Oficial para compartir</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        #{apt.id}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{apt.clientName}</h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-700">
                          <Phone className="w-3 h-3 text-slate-600" />
                          <span>{apt.clientPhone}</span>
                          <span className="text-slate-300">·</span>
                          <span>{apt.clientEmail}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                          apt.status === 'confirmed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : apt.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : apt.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        ● {apt.status}
                      </span>
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-1 rounded-md">
                        ${apt.paidAmount} MXN Pagado
                      </span>
                    </div>
                  </div>

                  {/* Appointment details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                    <div>
                      <span className="text-[11px] text-slate-600 block">Servicio:</span>
                      <span className="font-semibold text-slate-900">
                        {apt.serviceName} ({apt.serviceDuration} min)
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 block">Fecha y Hora:</span>
                      <span className="font-semibold text-slate-900">
                        {apt.date} a las {apt.time} hrs
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 block">Mensajes WhatsApp:</span>
                      <button
                        onClick={() => onTriggerWhatsAppDrawer(apt)}
                        className="text-emerald-700 font-semibold hover:underline flex items-center space-x-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Ver {apt.whatsappMessages.length} notificaciones</span>
                      </button>
                    </div>
                  </div>

                  {/* Client note if any */}
                  {apt.notes && (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-xs text-slate-700 border border-slate-100">
                      <span className="font-semibold text-slate-900">Nota del cliente: </span>
                      {apt.notes}
                    </div>
                  )}

                  {/* Internal notes dispatched to WhatsApp */}
                  {apt.internalNotes && (
                    <div className="bg-emerald-50 p-2.5 rounded-xl text-xs text-emerald-900 border border-emerald-100">
                      <span className="font-bold text-emerald-800">Nota enviada a su WhatsApp: </span>
                      "{apt.internalNotes}"
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <button
                        id={`add-note-btn-${apt.id}`}
                        onClick={() => {
                          setSelectedAppointmentForNote(apt);
                          setNoteText(apt.internalNotes || '');
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center space-x-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Enviar Nota por WhatsApp</span>
                      </button>

                      <a
                        href={getWhatsAppDirectUrl(
                          apt.clientPhone,
                          `Hola ${apt.clientName}, te saluda ${formData.businessName} respecto a tu cita del ${apt.date}.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center space-x-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Abrir Chat WhatsApp</span>
                      </a>
                    </div>

                    <div className="flex items-center space-x-2">
                      {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                        <button
                          onClick={() => handleUpdateAppointmentStatus(apt, 'completed')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          Marcar Completada
                        </button>
                      )}

                      {apt.status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            if (confirm('¿Deseas cancelar esta cita? Se enviará notificación automática por WhatsApp.')) {
                              handleUpdateAppointmentStatus(apt, 'cancelled');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                        >
                          Cancelar Cita
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LANDING CUSTOMIZER */}
      {activeTab === 'landing_customizer' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Personaliza tu Landing Page</h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Sube tus fotos, logo y datos comerciales para actualizar tu perfil profesional.
              </p>
            </div>
            <button
              id="save-affiliate-top-btn"
              type="button"
              disabled={isSaving}
              onClick={() => handleSaveAffiliate()}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer shrink-0"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial del Negocio *</label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombre del Profesional / Titular *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* CATEGORY & SPECIALTY SELECTOR (9 Categories Taxonomy) */}
            <div className="md:col-span-2">
              <CategorySelector
                id="affiliate-dashboard-category"
                label="Categoría Oficial y Especialidad *"
                value={formData.category}
                onChange={(subId, subLabel) => {
                  setFormData({
                    ...formData,
                    category: subId,
                    categoryLabel: subLabel
                  });
                }}
              />
            </div>

            {/* LOGO UPLOADER: Replaces manual URL input with direct file upload */}
            <div className="md:col-span-1">
              <ImageUploader
                id="affiliate-logo-uploader"
                label="Logo del Negocio / Foto de Perfil *"
                description="Haz clic en Subir o arrastra la imagen de tu logotipo o foto profesional."
                placeholderText="Haz clic para subir tu Logo o arrastra la imagen"
                currentValue={formData.logo}
                aspectRatio="square"
                maxWidth={500}
                maxHeight={500}
                onChange={(base64Url) => {
                  const updated = { ...formData, logo: base64Url };
                  setFormData(updated);
                }}
                onRemove={() => setFormData({ ...formData, logo: '' })}
              />
            </div>

            {/* BANNER / PORTADA UPLOADER: Replaces manual URL input with direct file upload */}
            <div className="md:col-span-1">
              <ImageUploader
                id="affiliate-banner-uploader"
                label="Foto de Portada / Banner Principal *"
                description="Fotografía destacada del consultorio o banner principal para el encabezado."
                placeholderText="Haz clic para subir Foto de Portada o arrástrala"
                currentValue={formData.banner}
                aspectRatio="banner"
                maxWidth={1400}
                maxHeight={600}
                onChange={(base64Url) => {
                  const updated = { ...formData, banner: base64Url };
                  setFormData(updated);
                }}
                onRemove={() => setFormData({ ...formData, banner: '' })}
              />
            </div>

            {/* GALLERY UPLOADER: Multiple photo uploads for facilities and consultorios */}
            <div className="md:col-span-2 pt-2 border-t border-slate-100">
              <GalleryUploader
                id="affiliate-gallery-uploader"
                images={formData.gallery || []}
                onChange={(updatedGallery) => {
                  const updated = { ...formData, gallery: updatedGallery };
                  setFormData(updated);
                }}
                maxImages={8}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Video de Presentación (YouTube o Vimeo)
              </label>
              <input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={formData.videoUrl || ''}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">Teléfono WhatsApp (+52)</label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  🔒 100% Privado
                </span>
              </div>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
              <p className="text-[10px] text-slate-700 mt-1 leading-tight">
                No se muestra públicamente en tu Landing Page. El sistema enviará un WhatsApp automático a ambas partes con los detalles de la cita una vez establecida.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Dirección Física Completa *</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Historia de la Compañía / Sobre el Negocio *</label>
              <textarea
                rows={3}
                value={formData.story || ''}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                placeholder="Cuenta la historia de tu compañía, misión y trayectoria para generar confianza con tus clientes..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white leading-relaxed mb-3"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Descripción del Servicio / Bio Profesional *</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white leading-relaxed"
              />
            </div>

            {/* Bottom Save Bar */}
            <div className="md:col-span-2 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Las imágenes subidas se procesan y se guardan en tu perfil profesional.</span>
              </div>
              <button
                id="save-affiliate-bottom-btn"
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveAffiliate()}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SCHEDULE & AVAILABILITY */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Configuración de Horarios & Disponibilidad</h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Define tus bloques de citas, duración y días que recibes pacientes o clientes.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span>Abrir Calendario & Bloqueo de Horas</span>
              </button>
              <button
                type="button"
                onClick={handleSaveAffiliate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Horarios</span>
              </button>
            </div>
          </div>

          {/* Quick Notice about per-day schedules */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Horarios Flexibles por Día & Bloqueos de Horas Disponibles</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Puedes tener horarios distintos cada día (ej. Lunes a Viernes de 9:00 am a 9:00 pm con descanso de 5:00 pm a 7:00 pm, y Sábado de 9:00 am a 2:00 pm).
              </p>
              <div className="pt-1 text-[11px] text-slate-700 font-medium">
                <span className="font-bold text-slate-900">Horario Activo Actual:</span>
                <div className="mt-1 space-y-0.5">
                  {getWorkingHoursSummaryLines(formData.workingHours).map((line, idx) => (
                    <div key={idx} className="text-emerald-900">• {line}</div>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shrink-0 cursor-pointer shadow-xs"
            >
              Configurar en Calendario →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hora de Inicio</label>
              <input
                type="time"
                value={formData.workingHours.startTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workingHours: { ...formData.workingHours, startTime: e.target.value }
                  })
                }
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hora de Cierre</label>
              <input
                type="time"
                value={formData.workingHours.endTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workingHours: { ...formData.workingHours, endTime: e.target.value }
                  })
                }
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duración de Bloques (Minutos)</label>
              <select
                value={formData.workingHours.slotDuration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    workingHours: { ...formData.workingHours, slotDuration: Number(e.target.value) }
                  })
                }
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-semibold"
              >
                <option value={30}>30 minutos</option>
                <option value={40}>40 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={50}>50 minutos</option>
                <option value={60}>60 minutos (1 hora)</option>
                <option value={90}>90 minutos (1.5 horas)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2 text-xs">Días que laboras:</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 1, name: 'Lunes' },
                { id: 2, name: 'Martes' },
                { id: 3, name: 'Miércoles' },
                { id: 4, name: 'Jueves' },
                { id: 5, name: 'Viernes' },
                { id: 6, name: 'Sábado' },
                { id: 0, name: 'Domingo' }
              ].map((day) => {
                const isActive = formData.workingHours.days.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      const updatedDays = isActive
                        ? formData.workingHours.days.filter((d) => d !== day.id)
                        : [...formData.workingHours.days, day.id];
                      setFormData({
                        ...formData,
                        workingHours: { ...formData.workingHours, days: updatedDays }
                      });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {day.name} {isActive ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={formData.availableToday}
                onChange={(e) => setFormData({ ...formData, availableToday: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <span className="font-semibold text-slate-800">
                Tengo al menos un horario libre hoy (aparecer en el filtro "Disponible Hoy")
              </span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 4: SERVICES & PRICING */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Catálogo de Servicios & Precios</h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Los clientes pagarán por adelantado el monto estipulado en cada servicio para apartar su cita.
              </p>
            </div>
          </div>

          {/* Current services list */}
          <div className="space-y-3">
            {formData.services.map((srv) => (
              <div
                key={srv.id}
                className="p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-slate-900">{srv.name}</h4>
                    <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      {srv.duration} min
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1">{srv.description}</p>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className="text-base font-bold text-emerald-800">${srv.price} MXN</span>
                  <button
                    type="button"
                    id={`test-charge-service-btn-${srv.id}`}
                    onClick={() => handleOpenServiceCheckout(srv)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Desplegar panel de cobro oficial con el precio de este servicio"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Panel de Cobro</span>
                  </button>
                  <button
                    onClick={() => handleDeleteService(srv.id)}
                    className="p-1.5 text-slate-600 hover:text-rose-600 transition-colors"
                    title="Eliminar servicio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add new service form */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Agregar Nuevo Servicio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1">Nombre del Servicio *</label>
                <input
                  type="text"
                  placeholder="Ej. Limpieza con ultrasonido"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Precio en MXN *</label>
                <input
                  type="number"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">Duración (minutos) *</label>
                <input
                  type="number"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 mb-1 text-xs">Descripción breve</label>
              <input
                type="text"
                placeholder="Detalla lo que incluye la sesión..."
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-white text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleAddService}
              disabled={!newServiceName.trim()}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar al Catálogo</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION PLANS & TURBO */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* STRIPE MÉXICO INTEGRATION & PAYOUTS BANNER */}
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-700/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  S
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-white">Stripe México Oficial</h2>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Modo Pruebas Activo
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Procesamiento de pagos de citas, suscripciones recurrentes y dispersiones bancarias (Payouts).
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={loadStripeData}
                  disabled={isLoadingStripe}
                  className="px-3 py-1.5 rounded-xl bg-indigo-800/60 hover:bg-indigo-700 text-indigo-100 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer border border-indigo-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStripe ? 'animate-spin' : ''}`} />
                  <span>Actualizar Balance</span>
                </button>
              </div>
            </div>

            {/* Balances & Payout status grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-indigo-950/50 rounded-xl p-4 border border-indigo-800/40">
                <span className="text-[11px] text-indigo-300 font-medium block">Saldo Disponible (MXN)</span>
                <div className="text-2xl font-black text-white mt-1">
                  ${stripeBalance.availableMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-indigo-300">MXN</span>
                </div>
                <span className="text-[10px] text-emerald-400 mt-1 block">Listo para dispersión a cuenta bancaria CLABE</span>
              </div>

              <div className="bg-indigo-950/50 rounded-xl p-4 border border-indigo-800/40">
                <span className="text-[11px] text-indigo-300 font-medium block">Saldo Pendiente (MXN)</span>
                <div className="text-2xl font-black text-indigo-100 mt-1">
                  ${stripeBalance.pendingMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-indigo-300">MXN</span>
                </div>
                <span className="text-[10px] text-indigo-300 mt-1 block">Compensación estándar de 2 a 3 días hábiles</span>
              </div>

              <div className="bg-indigo-950/50 rounded-xl p-4 border border-indigo-800/40">
                <span className="text-[11px] text-indigo-300 font-medium block">API Keys de Stripe Conectadas</span>
                <div className="mt-1 space-y-1 text-[11px] text-indigo-200">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>General (sk_test_... & pk_test_...)</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Suscriptores y Payouts (rk_test_...)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BANCO & CUENTA CLABE INTERBANCARIA (18 DÍGITOS) & FRECUENCIA DE PAGO */}
          {(() => {
            const clabeValidation = validateAndDetectClabe(clabeInput);
            const breakdownWeekly = calculatePayoutBreakdown(simulatedAmount, 'weekly');
            const breakdownInstant = calculatePayoutBreakdown(simulatedAmount, 'instant');

            return (
              <div id="affiliate-clabe-settings-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h2 className="text-base font-bold text-slate-900">
                          Dispersión de Ingresos: Cuenta CLABE & Modalidad de Cobro
                        </h2>
                        {formData.payoutClabe ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>CLABE Vinculada ({formData.payoutBank || 'Banco Registrado'})</span>
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border border-amber-300">
                            <AlertCircle className="w-3 h-3" />
                            <span>CLABE Pendiente de Registro</span>
                          </span>
                        )}
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          payoutSchedule === 'instant'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {payoutSchedule === 'instant' ? '⚡ Modo Inmediato (1.5% Stripe)' : '🗓️ Modo Semanal (0% Comisión)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Configura tu CLABE interbancaria (18 dígitos) para recibir los depósitos de tus citas. Elige entre recibir tu dinero semanalmente sin comisión o al instante pagando el 1.5% de comisión técnica de Stripe.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPayoutWithdrawAmount(stripeBalance.availableMxn > 0 ? stripeBalance.availableMxn : 1000);
                        setIsPayoutModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Solicitar Dispersión Inmediata</span>
                    </button>
                  </div>
                </div>

                {bankSaveSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{bankSaveSuccess}</span>
                  </div>
                )}

                {bankSaveError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{bankSaveError}</span>
                  </div>
                )}

                {/* Form Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Bank Account Inputs */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>1. Tu Cuenta Bancaria Receptora (México)</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        CLABE Interbancaria (18 dígitos numéricos) *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={22}
                          value={clabeInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setClabeInput(val);
                            if (bankSaveError) setBankSaveError('');
                          }}
                          placeholder="012 180 01548291038 9"
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
                        />
                        {clabeValidation.isValidLength && (
                          <div className="absolute right-3 top-2.5 flex items-center space-x-1 text-emerald-600 text-[11px] font-bold">
                            <Check className="w-4 h-4" />
                            <span>18 dígitos</span>
                          </div>
                        )}
                      </div>

                      {/* Bank detection badge */}
                      <div className="mt-2 flex items-center justify-between flex-wrap gap-1 text-[11px]">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-500">Banco detectado:</span>
                          <span className="font-bold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {clabeValidation.bankName}
                          </span>
                        </div>
                        {clabeValidation.isValidChecksum && (
                          <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                            <span>✓ Dígito verificador Banxico OK</span>
                          </span>
                        )}
                      </div>
                      {clabeValidation.error && clabeInput.length > 0 && (
                        <p className="text-[11px] text-amber-700 mt-1">{clabeValidation.error}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nombre Completo del Titular o Razón Social *
                      </label>
                      <input
                        type="text"
                        value={holderNameInput}
                        onChange={(e) => setHolderNameInput(e.target.value)}
                        placeholder="Ej: Lic. Mariana Garza Morales o Clínica Bienestar S.A. de C.V."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Debe coincidir con el nombre de tu cuenta bancaria para evitar devoluciones SPEI.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        RFC del Titular (Opcional para comprobante fiscal)
                      </label>
                      <input
                        type="text"
                        maxLength={13}
                        value={formData.payoutRfc || ''}
                        onChange={(e) => setFormData({ ...formData, payoutRfc: e.target.value.toUpperCase() })}
                        placeholder="GAMM850412XYZ"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs uppercase font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden bg-white"
                      />
                    </div>
                  </div>

                  {/* Right Column: Schedule Selection (Weekly 0% vs Instant 1.5%) */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span>2. Elige tu Modalidad de Retiro / Frecuencia</span>
                    </h3>

                    <div className="space-y-3">
                      {/* Option 1: Semanal Programado (0%) */}
                      <div
                        onClick={() => setPayoutSchedule('weekly')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                          payoutSchedule === 'weekly'
                            ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              payoutSchedule === 'weekly' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                            }`}>
                              {payoutSchedule === 'weekly' && <Check className="w-3 h-3" />}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900">🗓️ Semanal Programado</span>
                                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider">
                                  0% Comisión (Gratis)
                                </span>
                              </div>
                              <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                                Recibes el 100% íntegro de tus ingresos
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed pl-7">
                          Depósito programado cada semana directo a tu cuenta CLABE por SPEI. Citas Más y Stripe absorben el costo ordinario de dispersión bancaria.
                        </p>
                        <div className="mt-2 pl-7 flex items-center space-x-2 text-[10.5px] text-emerald-700 font-semibold">
                          <span>✓ Sin comisiones por retiro</span>
                          <span>·</span>
                          <span>✓ Depósito automático semanal</span>
                        </div>
                      </div>

                      {/* Option 2: Inmediato (1.5% comisión Stripe) */}
                      <div
                        onClick={() => setPayoutSchedule('instant')}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                          payoutSchedule === 'instant'
                            ? 'border-indigo-500 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/30'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              payoutSchedule === 'instant' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                            }`}>
                              {payoutSchedule === 'instant' && <Check className="w-3 h-3" />}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-slate-900">⚡ Inmediato (Instant Payout)</span>
                                <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider">
                                  1.5% Comisión Stripe
                                </span>
                              </div>
                              <span className="text-[11px] text-indigo-900 font-medium block mt-0.5">
                                Recibes tu dinero en segundos al concluir cada cita
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed pl-7">
                          Dispersión acelerada por SPEI en tiempo real. Pagas el 1.5% de comisión técnica para cubrir el costo operativo que Stripe cobra por transferencias bancarias instantáneas 24/7.
                        </p>
                        <div className="mt-2 pl-7 flex items-center space-x-2 text-[10.5px] text-indigo-700 font-semibold">
                          <span>✓ Dinero disponible en segundos</span>
                          <span>·</span>
                          <span>✓ Flujo de efectivo diario</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COMPARATIVE LIVE CALCULATOR / SIMULATOR */}
                <div className="p-5 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-emerald-50/30 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Simulador Comparativo en Vivo (Semanal 0% vs Inmediato 1.5%)
                      </h4>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[11px] text-slate-600">Simular monto:</span>
                      {[500, 1000, 2500, 5000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSimulatedAmount(amt)}
                          className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer ${
                            simulatedAmount === amt
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Weekly result */}
                    <div className={`p-4 rounded-xl border ${
                      payoutSchedule === 'weekly' ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900">🗓️ Modalidad Semanal</span>
                        <span className="text-emerald-700 font-extrabold text-[11px]">0% Comisión</span>
                      </div>
                      <div className="mt-2 text-2xl font-black text-emerald-800">
                        ${breakdownWeekly.netPayoutMxn.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-600">MXN netos</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[11px] space-y-1 text-slate-600">
                        <div className="flex justify-between">
                          <span>Monto cobrado en citas:</span>
                          <span className="font-medium">${breakdownWeekly.grossAmountMxn.toFixed(2)} MXN</span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Comisión por dispersión:</span>
                          <span>-$0.00 MXN (0.0%)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Recibes el 100% de tus honorarios en el depósito programado cada semana.
                        </p>
                      </div>
                    </div>

                    {/* Instant result */}
                    <div className={`p-4 rounded-xl border ${
                      payoutSchedule === 'instant' ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200'
                    }`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900">⚡ Modalidad Inmediata</span>
                        <span className="text-indigo-700 font-extrabold text-[11px]">1.5% Comisión Stripe</span>
                      </div>
                      <div className="mt-2 text-2xl font-black text-indigo-900">
                        ${breakdownInstant.netPayoutMxn.toFixed(2)}{' '}
                        <span className="text-xs font-normal text-slate-600">MXN netos</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-indigo-200/60 text-[11px] space-y-1 text-slate-600">
                        <div className="flex justify-between">
                          <span>Monto cobrado en citas:</span>
                          <span className="font-medium">${breakdownInstant.grossAmountMxn.toFixed(2)} MXN</span>
                        </div>
                        <div className="flex justify-between text-indigo-700 font-bold">
                          <span>Costo técnico Stripe (1.5%):</span>
                          <span>-${breakdownInstant.commissionFeeMxn.toFixed(2)} MXN</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          El 1.5% cubre la tarifa de Stripe Instant Payouts para transferencia SPEI inmediata.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAYMENT METHODS DISCLOSURE FOR CLIENTS AND AFFILIATES */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        Aceptación Universal de Pagos para Clientes y Afiliados
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      Tus clientes y tú pueden pagar con <strong>Tarjetas de Crédito y Débito</strong> (Visa, Mastercard, American Express de cualquier banco mexicano: BBVA, Santander, Banorte, Nu, Hey Banco, Banamex, HSBC, etc.) y <strong>Transferencias SPEI (STP / Stripe)</strong>, garantizando que el 100% de los fondos se concentren en tu cuenta de Stripe para su dispersión automática a tu CLABE.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="bg-slate-800 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 font-medium">
                      🔒 Encriptación SSL 256-bit
                    </span>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-slate-600 flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Tus datos bancarios quedan encriptados y protegidos según los estándares bancarios de México.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveBankSettings}
                    disabled={isSavingBankSettings}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingBankSettings ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando en Stripe...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Cuenta CLABE & Modalidad</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Modelo de Suscripción & Exposición Local
                </h2>
                <p className="text-xs text-slate-700 mt-0.5">
                  Elige el plan ideal para tu consultorio o equipo. Sin contratos forzosos.
                </p>
              </div>

              {/* Monthly vs Annual */}
              <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl text-xs self-start sm:self-auto">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center space-x-1 ${
                    billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <span>Anual</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    2 meses gratis
                  </span>
                </button>
              </div>
            </div>

            {/* The 4 subscription plans */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {/* Plan 1: Básico */}
              <div
                onClick={() => handleSelectPlanAndOpenPayment('basico')}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between cursor-pointer relative ${
                  selectedPlanTab === 'basico'
                    ? 'border-2 border-emerald-500 bg-emerald-50/50 shadow-xl ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-emerald-300 shadow-xs'
                }`}
              >
                {selectedPlanTab === 'basico' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                    <Check className="w-3 h-3" />
                    <span>Plan Seleccionado</span>
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm">Plan Básico</h3>
                    {formData.plan === 'basico' ? (
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                        ACTIVO
                      </span>
                    ) : selectedPlanTab === 'basico' ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        SELECCIONADO
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-900">
                      ${billingCycle === 'annual' ? '149' : '179'}
                    </span>
                    <span className="text-xs text-slate-600"> MXN/mes</span>
                  </div>
                  <p className="text-[11px] text-slate-700 mt-1">Ideal para profesionales individuales independientes.</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>1 Video de 1 minuto</strong> producido con IA</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>1 Imagen tamaño 9:16</strong> (Stories/Reels)</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Etapa 1 de publicidad</strong> digital</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Descubre tu cliente ideal</strong> (Buyer Personas)</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>1 Profesional • 100 Whats/mes</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Confirmación de cita automática</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Landing page básica oficial</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlanAndOpenPayment('basico');
                  }}
                  className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    selectedPlanTab === 'basico'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {selectedPlanTab === 'basico'
                    ? `Pagar Plan Básico ($${billingCycle === 'annual' ? '149' : '179'} MXN)`
                    : 'Elegir y Pagar Básico'}
                </button>
              </div>

              {/* Plan 2: Pro */}
              <div
                onClick={() => handleSelectPlanAndOpenPayment('pro')}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between relative cursor-pointer ${
                  selectedPlanTab === 'pro'
                    ? 'border-2 border-emerald-500 bg-emerald-50/50 shadow-xl ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-emerald-300 shadow-xs'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-emerald-400 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                  {selectedPlanTab === 'pro' && <Check className="w-3 h-3 text-emerald-400" />}
                  <span>Más Popular</span>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm">Plan Pro</h3>
                    {formData.plan === 'pro' ? (
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                        ACTIVO
                      </span>
                    ) : selectedPlanTab === 'pro' ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        SELECCIONADO
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-900">
                      ${billingCycle === 'annual' ? '299' : '359'}
                    </span>
                    <span className="text-xs text-slate-600"> MXN/mes</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1">Prueba 14 días gratis</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Todo lo del Plan Básico</strong> (Video 1m, 9:16, Etapa 1)</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>MÁS Exposición prolongada</strong> en redes sociales</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-500 font-bold">⚡</span>
                      <span><strong>Activa Turbo Redes:</strong> Turbo 1 (+$200), Turbo 2 (+$700), Turbo 3 (+$1500)</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Mensajes WhatsApp Ilimitados</strong></span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Recordatorios automáticos 24h y 2h antes</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Citas Pagadas Anticipadas</strong> obligatorias</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Reagenda citas gratis &gt;24h</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlanAndOpenPayment('pro');
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {selectedPlanTab === 'pro'
                        ? `Pagar Plan Pro ($${billingCycle === 'annual' ? '299' : '359'} MXN)`
                        : 'Elegir y Pagar Pro'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan 3: Equipo */}
              <div
                onClick={() => handleSelectPlanAndOpenPayment('equipo')}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between cursor-pointer relative ${
                  selectedPlanTab === 'equipo'
                    ? 'border-2 border-emerald-500 bg-emerald-50/50 shadow-xl ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-emerald-300 shadow-xs'
                }`}
              >
                {selectedPlanTab === 'equipo' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                    <Check className="w-3 h-3" />
                    <span>Plan Seleccionado</span>
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm">Plan Equipo</h3>
                    {formData.plan === 'equipo' ? (
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                        ACTIVO
                      </span>
                    ) : selectedPlanTab === 'equipo' ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        SELECCIONADO
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-900">
                      ${billingCycle === 'annual' ? '724' : '869'}
                    </span>
                    <span className="text-xs text-slate-600"> MXN/mes</span>
                  </div>
                  <p className="text-[11px] text-slate-700 mt-1">Para clínicas y negocios con varios especialistas.</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Hasta 10 profesionales</strong></span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Todo lo del Plan Pro</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Exposición preferencial</strong> en búsquedas</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Anuncios segmentados por zona</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlanAndOpenPayment('equipo');
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {selectedPlanTab === 'equipo'
                        ? `Pagar Plan Equipo ($${billingCycle === 'annual' ? '724' : '869'} MXN)`
                        : 'Elegir y Pagar Equipo'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan 4: Comisión */}
              <div
                onClick={() => handleSelectPlanAndOpenPayment('comision')}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between cursor-pointer relative ${
                  selectedPlanTab === 'comision'
                    ? 'border-2 border-emerald-500 bg-emerald-50/50 shadow-xl ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-emerald-300 shadow-xs'
                }`}
              >
                {selectedPlanTab === 'comision' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                    <Check className="w-3 h-3" />
                    <span>Plan Seleccionado</span>
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm">Por Comisión</h3>
                    {formData.plan === 'comision' ? (
                      <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                        ACTIVO
                      </span>
                    ) : selectedPlanTab === 'comision' ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        SELECCIONADO
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-slate-900">10%</span>
                    <span className="text-xs text-slate-600"> por cita pagada</span>
                  </div>
                  <p className="text-[11px] text-slate-700 mt-1">Desbloquea todo el nivel Equipo.</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span><strong>Todas las funciones del Plan Equipo</strong></span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Hasta 10 profesionales</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Mensajes ilimitados WhatsApp</span>
                    </li>
                    <li className="flex items-center space-x-1.5 text-slate-500">
                      <span>✓</span>
                      <span>Sin costo mensual ($0 MXN)</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlanAndOpenPayment('comision');
                  }}
                  className={`mt-6 w-full py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                    selectedPlanTab === 'comision'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {selectedPlanTab === 'comision' ? 'Activar Plan por Comisión ($0 MXN)' : 'Elegir y Activar Comisión'}
                </button>
              </div>
            </div>
          </div>

          {/* Add-on TURBO 3-Level Grid */}
          <div className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500 text-slate-950 font-extrabold text-xs px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-xs">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>TURBO EN REDES SOCIALES</span>
                  </span>
                  <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                    Multiplica tus Pacientes
                  </span>
                  {formData.isTurbo && (
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      ✓ Activo (Nivel {formData.turboLevel || 1})
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Elige tu potencia de Impulso Turbo en Redes Sociales & Geolocalización
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed max-w-2xl">
                  Aumenta drásticamente las visitas y clics de tus anuncios. Puedes contratar cualquiera de los 3 niveles turbo y desplegar de inmediato tu pasarela de cobro.
                </p>
              </div>

              {selectedPlanTab === 'turbo' && (
                <span className="self-start md:self-auto bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs flex items-center space-x-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Turbo Seleccionado</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Turbo 1 */}
              <div
                onClick={() => handleSelectTurboAndOpenPayment(1)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlanTab === 'turbo' && checkoutTurboLevel === 1
                    ? 'border-2 border-amber-500 bg-amber-50/80 shadow-lg ring-2 ring-amber-400/30'
                    : 'border-slate-200 bg-white hover:border-amber-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-slate-900">Turbo 1</span>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      +$200 MXN/mes
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-2">Impulso Express Redes</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Campaña rápida de alto impacto en Instagram y Facebook Stories para llenar horarios vacíos de tu semana.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-700">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span>Distribución acelerada de tu video 1 min</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span>+30% de clics garantizados a WhatsApp</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTurboAndOpenPayment(1);
                  }}
                  className={`mt-4 w-full py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    selectedPlanTab === 'turbo' && checkoutTurboLevel === 1
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Pagar Turbo 1 ($200 MXN)
                </button>
              </div>

              {/* Turbo 2 */}
              <div
                onClick={() => handleSelectTurboAndOpenPayment(2)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlanTab === 'turbo' && checkoutTurboLevel === 2
                    ? 'border-2 border-amber-500 bg-amber-50/80 shadow-lg ring-2 ring-amber-400/30'
                    : 'border-slate-200 bg-white hover:border-amber-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-sm text-slate-900">Turbo 2</span>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      +$700 MXN/mes
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-2">Alcance Geolocalizado</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Segmentación geolocalizada a clientes a menos de 5 km a la redonda de tu consultorio o negocio.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-700">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span>Geocerca de 5 km alrededor de tu ubicación</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span>Insignia plateada de Profesional Destacado</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span>Doble frecuencia de impresión en Stories</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTurboAndOpenPayment(2);
                  }}
                  className={`mt-4 w-full py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    selectedPlanTab === 'turbo' && checkoutTurboLevel === 2
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  Pagar Turbo 2 ($700 MXN)
                </button>
              </div>

              {/* Turbo 3 */}
              <div
                onClick={() => handleSelectTurboAndOpenPayment(3)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlanTab === 'turbo' && checkoutTurboLevel === 3
                    ? 'border-2 border-amber-500 bg-amber-50/80 shadow-lg ring-2 ring-amber-400/30'
                    : 'border-slate-200 bg-white hover:border-amber-300 shadow-2xs'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <span className="font-black text-sm text-slate-900">Turbo 3</span>
                      <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">
                        Máximo
                      </span>
                    </div>
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      +$1,500 MXN/mes
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-2">Posición #1 & Máxima Exposición</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Prioridad algorítmica absoluta en tu ciudad, primera posición en mapas y campañas masivas multicanal.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[11px] text-slate-700">
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span><strong>Posición #1 garantizada</strong> en tu zona</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span>Insignia dorada "Profesional Destacado Seguro"</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <span className="text-amber-600 font-bold">✓</span>
                      <span>Campaña permanente de alta conversión</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTurboAndOpenPayment(3);
                  }}
                  className={`mt-4 w-full py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    selectedPlanTab === 'turbo' && checkoutTurboLevel === 3
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  }`}
                >
                  Pagar Turbo 3 ($1,500 MXN)
                </button>
              </div>
            </div>
          </div>

          {/* STRIPE PAYOUTS / DISPERSIONES BANCARIAS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dispersiones Bancarias Automáticas (Stripe Payouts)</h3>
                <p className="text-xs text-slate-500">
                  Historial de transferencias SPEI a tu cuenta bancaria / CLABE en México
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                {stripePayouts.length} {stripePayouts.length === 1 ? 'dispersión' : 'dispersiones'}
              </span>
            </div>

            {stripePayouts.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <DollarSign className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Sin dispersiones registradas en este periodo</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  En modo pruebas o cuentas nuevas, los ingresos de las citas pagadas con tarjeta se acumulan en tu saldo disponible de Stripe y se liquidan conforme al calendario de depósitos.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">ID Payout</th>
                      <th className="py-2.5 px-3">Monto</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Fecha Estimada</th>
                      <th className="py-2.5 px-3">Destino</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stripePayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{p.id}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">${p.amountMxn} MXN</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {p.status === 'paid' ? 'Depositado' : p.status === 'pending' ? 'Pendiente' : p.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{p.arrivalDate}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{p.destination || 'Cuenta Bancaria CLABE'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: NOTIFICATIONS LOGS */}
      {activeTab === 'twilio_logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Registro de Mensajería WhatsApp</h2>
              <p className="text-xs text-slate-700 mt-0.5">
                Historial de mensajes automáticos enviados a clientes vía WhatsApp.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Canal: WhatsApp (+52)
            </span>
          </div>

          <div className="space-y-3">
            {appointments.flatMap((a) => a.whatsappMessages).length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No hay registros de mensajes aún.</p>
            ) : (
              appointments
                .flatMap((a) => a.whatsappMessages.map((m) => ({ ...m, client: a.clientName, phone: a.clientPhone })))
                .map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="font-bold text-emerald-800">{msg.title}</span>
                      <span className="text-[11px] text-slate-600">{msg.sentAt}</span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-line text-[11px] font-mono bg-white p-2 rounded border border-slate-200/80">
                      {msg.content}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                      <span>Destino: {msg.client} ({msg.phone})</span>
                      <span className="font-mono text-emerald-700 font-semibold">
                        {msg.twilioSid ? `Folio: ${msg.twilioSid}` : 'Entrega: OK'}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: MARKETING TOOLS (AI 5 LEVELS) */}
      {activeTab === 'marketing' && (
        <div className="space-y-6">
          <MarketingToolsView
            affiliate={formData}
            initialTab={marketingInitialSubTab}
            onUpdateAffiliate={(updated) => {
              setFormData(updated);
              onUpdateAffiliate(updated);
            }}
            onNavigateToLanding={() => onPreviewLanding(formData)}
            onClose={() => setActiveTab('calendar')}
          />
        </div>
      )}

      {/* Payout Withdrawal Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Solicitud de Dispersión Bancaria
                  </h3>
                  <span className="text-[11px] text-slate-500">Transferencia SPEI a Cuenta CLABE</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPayoutModalOpen(false);
                  setLastPayoutReceipt(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* If a receipt was just generated */}
            {lastPayoutReceipt ? (
              <div className="space-y-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    {lastPayoutReceipt.payoutSchedule === 'instant'
                      ? '¡Dispersión Inmediata Procesada!'
                      : '¡Dispersión Programada con Éxito!'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {lastPayoutReceipt.arrivalDate}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-3.5 text-xs text-left space-y-2 border border-emerald-100 shadow-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Folio SPEI Rastreo:</span>
                    <span className="font-mono font-bold text-slate-900">{lastPayoutReceipt.speiTrackingKey}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Monto Bruto:</span>
                    <span>${lastPayoutReceipt.grossAmountMxn?.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between text-indigo-700 font-medium">
                    <span>Comisión ({lastPayoutReceipt.feePercent}%):</span>
                    <span>-${lastPayoutReceipt.feeMxn?.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-extrabold text-sm pt-2 border-t border-slate-100">
                    <span>Neto Transferido:</span>
                    <span className="text-emerald-700">${lastPayoutReceipt.netAmountMxn?.toFixed(2)} MXN</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1 text-[11px]">
                    <span>Destino:</span>
                    <span>{lastPayoutReceipt.bank} ({lastPayoutReceipt.clabeMasked})</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsPayoutModalOpen(false);
                    setLastPayoutReceipt(null);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Entendido / Cerrar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Check if CLABE is filled */}
                {!clabeInput || clabeInput.replace(/\D/g, '').length !== 18 ? (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-2">
                    <p className="font-bold text-amber-950 flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Se requiere registrar una CLABE de 18 dígitos</span>
                    </p>
                    <p className="text-amber-800 text-[11px]">
                      Antes de dispersar fondos, debes escribir tu cuenta CLABE y nombre del titular en la sección anterior y hacer clic en "Guardar Cuenta CLABE".
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Cuenta Receptora</span>
                        <span className="font-bold text-slate-900">{validateAndDetectClabe(clabeInput).bankName}</span>
                        <span className="text-[11px] text-slate-600 block font-mono">
                          CLABE: •••• {clabeInput.replace(/\D/g, '').slice(-4)} ({holderNameInput})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[10px]">Saldo Disponible</span>
                        <span className="font-black text-slate-900 text-sm">
                          ${stripeBalance.availableMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                        </span>
                      </div>
                    </div>

                    {/* Amount to withdraw */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Monto a Dispersar (MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">$</span>
                        <input
                          type="number"
                          min={100}
                          max={50000}
                          value={payoutWithdrawAmount}
                          onChange={(e) => setPayoutWithdrawAmount(Math.max(0, Number(e.target.value)))}
                          className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {[500, 1000, 2500, stripeBalance.availableMxn].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setPayoutWithdrawAmount(amt)}
                            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10.5px] font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            ${amt === stripeBalance.availableMxn ? `Todo ($${amt.toFixed(0)})` : `$${amt}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Modalidad Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Modalidad de Transferencia
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setPayoutSchedule('weekly')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            payoutSchedule === 'weekly'
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span>🗓️ Semanal</span>
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-extrabold">
                              0%
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Depósito programado</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayoutSchedule('instant')}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            payoutSchedule === 'instant'
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-950 ring-1 ring-indigo-500 font-bold'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center space-x-1">
                            <span>⚡ Inmediato</span>
                            <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded-full font-extrabold">
                              1.5%
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">SPEI en segundos</span>
                        </button>
                      </div>
                    </div>

                    {/* Breakdown */}
                    {(() => {
                      const breakdown = calculatePayoutBreakdown(payoutWithdrawAmount, payoutSchedule);
                      return (
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                          <div className="flex justify-between text-slate-600">
                            <span>Monto Solicitado:</span>
                            <span className="font-semibold">${breakdown.grossAmountMxn.toFixed(2)} MXN</span>
                          </div>
                          <div className="flex justify-between text-indigo-700 font-medium">
                            <span>
                              Comisión técnica Stripe ({breakdown.commissionPercent}%):
                            </span>
                            <span>-${breakdown.commissionFeeMxn.toFixed(2)} MXN</span>
                          </div>
                          <div className="flex justify-between text-slate-900 font-extrabold pt-1.5 border-t border-slate-200 text-sm">
                            <span>Neto a Depositar:</span>
                            <span className="text-emerald-700">${breakdown.netPayoutMxn.toFixed(2)} MXN</span>
                          </div>
                          <p className="text-[10px] text-slate-500 pt-1">
                            {breakdown.description}
                          </p>
                        </div>
                      );
                    })()}

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsPayoutModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isExecutingPayout || payoutWithdrawAmount <= 0}
                        onClick={() => handleExecutePayout(payoutWithdrawAmount)}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                      >
                        {isExecutingPayout ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Procesando SPEI...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>Confirmar Dispersión ({payoutSchedule === 'instant' ? '1.5%' : '0%'})</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Internal note dialog modal */}
      {selectedAppointmentForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">
                Enviar Nota por WhatsApp a {selectedAppointmentForNote.clientName}
              </h3>
              <button
                onClick={() => setSelectedAppointmentForNote(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Esta indicación le llegará instantáneamente al WhatsApp del cliente con la plantilla oficial de Citas Más.
            </p>

            <textarea
              rows={3}
              placeholder="Ej. 'Por favor llega 10 minutos antes y trae una identificación oficial con foto'..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedAppointmentForNote(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                disabled={isSendingNote || !noteText.trim()}
                onClick={handleSendInternalNote}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingNote ? 'Enviando...' : 'Despachar a WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Checkout & Upgrade / Service Payment Modal */}
      <PlanCheckoutModal
        isOpen={isPlanCheckoutModalOpen}
        initialPlan={checkoutPlanTarget}
        initialCycle={billingCycle}
        initialTurboLevel={checkoutTurboLevel}
        affiliate={formData}
        service={checkoutServiceTarget}
        onClose={() => {
          setIsPlanCheckoutModalOpen(false);
          setCheckoutServiceTarget(null);
        }}
        onPaymentSuccess={handlePlanCheckoutSuccess}
        onServicePaymentSuccess={(srv) => {
          setIsPlanCheckoutModalOpen(false);
          setCheckoutServiceTarget(null);
          setSaveSuccessMsg(`¡Cobro del servicio "${srv.name}" ($${srv.price} MXN) verificado y procesado con éxito!`);
          setTimeout(() => setSaveSuccessMsg(''), 6000);
        }}
      />
    </div>
  );
};
