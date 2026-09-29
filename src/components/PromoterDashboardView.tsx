import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  PromoterProfile,
  ReferredAffiliateItem,
  PromoterPayoutRecord
} from '../types.ts';
import { DataService } from '../services/dataService.ts';
import confetti from 'canvas-confetti';
import {
  Share2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Building2,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Calculator,
  Download,
  CreditCard,
  Send,
  Zap,
  Award
} from 'lucide-react';

interface Props {
  currentUser?: UserProfile | null;
  onOpenExplore?: () => void;
  onOpenSignup?: () => void;
  onOpenLogin?: () => void;
}

export const PromoterDashboardView: React.FC<Props> = ({
  currentUser,
  onOpenExplore,
  onOpenSignup,
  onOpenLogin
}) => {
  const dataService = DataService.getInstance();

  const [promoter, setPromoter] = useState<PromoterProfile | null>(null);
  const [referrals, setReferrals] = useState<ReferredAffiliateItem[]>([]);
  const [payouts, setPayouts] = useState<PromoterPayoutRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Filter state for referrals table
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'past_due'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Simulator state
  const [simAffiliatesCount, setSimAffiliatesCount] = useState<number>(15);
  const [simAveragePlan, setSimAveragePlan] = useState<number>(599); // 599 Pro or 869 Equipo

  // Payout request modal / state
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState<boolean>(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [clabeInput, setClabeInput] = useState<string>('');
  const [bankInput, setBankInput] = useState<string>('BBVA México');
  const [holderInput, setHolderInput] = useState<string>('');
  const [payoutMessage, setPayoutMessage] = useState<string>('');
  const [isProcessingPayout, setIsProcessingPayout] = useState<boolean>(false);

  // Live simulation of renewal
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string>('');

  // Load promoter data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const codeOrId = currentUser?.promoterCode || currentUser?.uid || 'user-promoter-mario';
      const profile = await dataService.getPromoterProfile(codeOrId);
      if (profile) {
        setPromoter(profile);
        setClabeInput(profile.payoutClabe || '');
        setBankInput(profile.payoutBank || 'BBVA México');
        setHolderInput(profile.payoutHolderName || currentUser?.displayName || 'Mario Valenzuela López');
      }

      const refs = await dataService.getReferredAffiliates(codeOrId);
      setReferrals(refs);

      const pastPayouts = await dataService.getPromoterPayouts(currentUser?.uid || 'user-promoter-mario');
      setPayouts(pastPayouts);
    } catch (e) {
      console.warn('Error loading promoter dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Derived calculations
  const effectiveCode = promoter?.referralCode || currentUser?.promoterCode || 'MARIO40';
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${effectiveCode}`
    : `https://citapro.mx/?ref=${effectiveCode}`;

  const activeReferrals = referrals.filter((r) => r.isSubscriptionActive);
  const currentMrr40 = activeReferrals.reduce((sum, r) => sum + r.monthlyCommissionMxn, 0);

  // Filtered referrals list
  const filteredReferrals = referrals.filter((item) => {
    const matchesFilter =
      filterStatus === 'all'
        ? true
        : filterStatus === 'active'
        ? item.isSubscriptionActive
        : !item.isSubscriptionActive;

    const matchesSearch =
      item.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.affiliateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.affiliateEmail.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Copy helpers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(effectiveCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // WhatsApp Share helper
  const handleShareWhatsApp = () => {
    const text = `¡Hola! Te recomiendo CitaPro MX para tu consultorio o clínica. Es la plataforma en México que elimina las faltas a citas con cobro 100% anticipado con tarjeta o SPEI y recordatorios automáticos por WhatsApp. Regístrate con mi enlace de embajador para activar tu cuenta:\n${referralUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Live Renewal Simulation (demonstrates the 40% passive income trigger)
  const handleSimulatePayment = async (referralId: string, affiliateName: string, commission: number) => {
    setSimulatingId(referralId);
    try {
      const res = await dataService.simulateMonthlySubscriptionPayment(referralId);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      setSuccessToast(
        `⭐ ¡Cobro recurrente simulado con éxito! Se sumaron $${commission.toFixed(2)} MXN (40%) a tu saldo disponible por la renovación de ${affiliateName}.`
      );
      setTimeout(() => setSuccessToast(''), 6000);

      // Refresh data
      await loadData();
    } catch (e) {
      console.warn('Error simulating payment:', e);
    } finally {
      setSimulatingId(null);
    }
  };

  // Payout request handler
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoter || promoter.availableBalanceMxn <= 0) {
      setPayoutMessage('No tienes saldo disponible suficiente para retirar.');
      return;
    }

    if (!clabeInput || clabeInput.trim().length !== 18) {
      setPayoutMessage('Por favor ingresa una CLABE interbancaria válida de 18 dígitos.');
      return;
    }

    setIsProcessingPayout(true);
    setPayoutMessage('');

    try {
      const targetUid = currentUser?.uid || promoter?.userId || 'user-promoter-mario';
      const amountToWithdraw = payoutAmount > 0 ? payoutAmount : promoter.availableBalanceMxn;
      const payoutRecord: PromoterPayoutRecord = {
        id: `payout-${Date.now()}`,
        promoterUserId: targetUid,
        amountMxn: amountToWithdraw,
        clabe: clabeInput.trim(),
        bank: bankInput.trim() || 'BBVA México',
        holderName: holderInput.trim() || promoter.name,
        status: 'completed',
        requestedAt: new Date().toISOString(),
        reference: `SPEI-${Date.now().toString(36).toUpperCase()}`
      };

      await dataService.requestPromoterPayout(payoutRecord);
      await dataService.updatePromoterBankDetails(
        targetUid,
        clabeInput.trim(),
        bankInput.trim(),
        holderInput.trim()
      );

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch (e) {}

      setIsPayoutModalOpen(false);
      setSuccessToast(`💸 ¡Transferencia SPEI por $${amountToWithdraw.toLocaleString('es-MX')} MXN procesada exitosamente a tu cuenta ${bankInput}!`);
      setTimeout(() => setSuccessToast(''), 7000);
      await loadData();
    } catch (err: any) {
      setPayoutMessage(err?.message || 'Error al procesar la solicitud de retiro.');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Success Feedback Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-950 text-emerald-200 border-2 border-emerald-500/80 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xl animate-in slide-in-from-top-4">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-400 hover:text-white text-xs underline font-bold ml-4 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Guest / Non-Promoter CTA Banner */}
      {(!currentUser || currentUser.role !== 'promoter') && (
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-slate-950 p-4 sm:p-5 rounded-3xl flex flex-col lg:flex-row items-center justify-between gap-4 shadow-xl border border-amber-500 animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 font-black text-sm shadow-md">
              40%
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full">
                  Nuevo Tipo de Afiliado
                </span>
                <span className="text-xs font-bold text-amber-950">Ingresos Recurrentes</span>
              </div>
              <h3 className="font-black text-sm sm:text-base text-slate-950 mt-0.5">
                ¡Conviértete en Afiliado Promotor y cobra el 40% mensual de cada negocio que afilies!
              </h3>
              <p className="text-xs font-medium text-amber-950/90 leading-snug">
                Estás viendo la vista previa en vivo. Regístrate gratis en 1 clic para obtener tu propio código de usuario y empezar a recibir transferencias SPEI.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0 justify-end">
            <button
              onClick={onOpenSignup}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Registrarme como Promotor (40%)</span>
            </button>
            <button
              onClick={onOpenLogin}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-white/80 hover:bg-white text-slate-950 font-bold text-xs rounded-xl border border-amber-600/30 transition-all cursor-pointer text-center"
            >
              <span>Ya tengo cuenta</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-emerald-900/60 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold text-emerald-300">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Programa Oficial de Afiliados Promotores</span>
              <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full uppercase">
                40% Mensual
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Panel de Embajador & Promoción
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Hola <strong>{promoter?.name || currentUser?.displayName || 'Promotor Embajador'}</strong>. Ganas el{' '}
              <strong className="text-emerald-400">40% de la suscripción mensual</strong> de cada profesional o clínica que se registre con tu código de usuario, <strong>mes tras mes de forma recurrente mientras el afiliado mantenga su suscripción activa</strong>.
            </p>
          </div>

          {/* Quick Action Payout Button */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => {
                setPayoutAmount(promoter?.availableBalanceMxn || 0);
                setIsPayoutModalOpen(true);
              }}
              disabled={!promoter || promoter.availableBalanceMxn <= 0}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Retirar Comisiones por SPEI</span>
            </button>
          </div>
        </div>

        {/* Prominent Referral Code & Link Box */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tu Código Único de Promotor:
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400 tracking-wider">
                {effectiveCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                title="Copiar código"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="text-[11px]">{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tu Enlace Personalizado de Invitación (Con 40% de Atribución Automática):
            </span>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
              />
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleCopyLink}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                </button>

                <button
                  onClick={handleShareWhatsApp}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compartir por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: MRR 40% */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ingreso Mensual Recurrente (MRR)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ${currentMrr40.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-500"> MXN/mes</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>40% recurrente de {activeReferrals.length} afiliados activos</span>
          </p>
        </div>

        {/* KPI 2: Available Balance */}
        <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-sm space-y-2 bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Saldo Disponible para Retiro
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900">
            ${(promoter?.availableBalanceMxn || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-500"> MXN</span>
          </div>
          <button
            onClick={() => {
              setPayoutAmount(promoter?.availableBalanceMxn || 0);
              setIsPayoutModalOpen(true);
            }}
            disabled={!promoter || promoter.availableBalanceMxn <= 0}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1 cursor-pointer disabled:text-slate-400 disabled:no-underline"
          >
            <span>Transferir a mi banco por SPEI</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* KPI 3: Total Earnings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ganancias Totales Acumuladas
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ${(promoter?.totalEarningsMxn || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-normal text-slate-500"> MXN</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Ya transferido a tu banco: ${(promoter?.totalPaidOutMxn || 0).toLocaleString('es-MX')} MXN
          </p>
        </div>

        {/* KPI 4: Affiliates Count */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Afiliados Referidos
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {activeReferrals.length}
            <span className="text-sm font-semibold text-slate-400"> / {referrals.length}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {referrals.length > 0
              ? `${Math.round((activeReferrals.length / referrals.length) * 100)}% mantienen suscripción activa`
              : 'Sin afiliados registrados aún'}
          </p>
        </div>
      </div>

      {/* Simulator of 40% Monthly Earnings */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Simulador de Ingresos Pasivos Recurrentes (40%)
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calcula cuánto ganarás al mes con tu código según la cantidad de profesionales y clínicas que recomiendes.
            </p>
          </div>

          <div className="inline-flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSimAveragePlan(599)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                simAveragePlan === 599 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Plan Pro ($599/m)
            </button>
            <button
              onClick={() => setSimAveragePlan(869)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                simAveragePlan === 869 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Plan Equipo ($869/m)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700">Cantidad de afiliados referidos con suscripción activa:</span>
                <span className="text-base text-emerald-600 font-black">{simAffiliatesCount} profesionales</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={simAffiliatesCount}
                onChange={(e) => setSimAffiliatesCount(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                <span>1 afiliado</span>
                <span>25</span>
                <span>50</span>
                <span>75</span>
                <span>100 afiliados</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Suscripción</span>
                <span className="font-black text-slate-900 text-sm">${simAveragePlan} MXN/m</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">Tu 40% x Afiliado</span>
                <span className="font-black text-emerald-700 text-sm">
                  ${(simAveragePlan * 0.4).toFixed(2)} MXN/m
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Frecuencia</span>
                <span className="font-black text-slate-900 text-sm">Cada Mes</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-3xl p-6 text-center space-y-3 shadow-lg border border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              Tu Ganancia Mensual Estimada
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white">
              ${(simAffiliatesCount * simAveragePlan * 0.4).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              <span className="text-sm font-normal text-slate-400"> MXN / mes</span>
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Al año recibirías aproximadamente{' '}
              <strong className="text-emerald-400">
                ${(simAffiliatesCount * simAveragePlan * 0.4 * 12).toLocaleString('es-MX')} MXN
              </strong>{' '}
              de comisiones recurrentes mientras sigan activos.
            </div>
            <p className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2.5">
              Sin deducciones ni comisiones ocultas. Retiros directos a tu cuenta CLABE en cualquier banco mexicano.
            </p>
          </div>
        </div>
      </div>

      {/* Referred Affiliates Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-slate-900">
                Tus Afiliados Referidos & Suscripciones ({referrals.length})
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              Cada afiliado registrado con tu código <strong>{effectiveCode}</strong> genera tu 40% mensual de comisión.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <input
              type="text"
              placeholder="Buscar por negocio o doctor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-60 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-slate-900"
            />

            {/* Status Filter */}
            <div className="inline-flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Todos ({referrals.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Activos ({activeReferrals.length})
              </button>
              <button
                onClick={() => setFilterStatus('past_due')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  filterStatus === 'past_due' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Inactivos ({referrals.length - activeReferrals.length})
              </button>
            </div>
          </div>
        </div>

        {/* Table Body */}
        {filteredReferrals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Afiliado / Negocio</th>
                  <th className="py-3 px-4">Plan y Mensualidad</th>
                  <th className="py-3 px-4">Tu Comisión (40%)</th>
                  <th className="py-3 px-4">Estado Suscripción</th>
                  <th className="py-3 px-4">Total Ganado</th>
                  <th className="py-3 px-4 text-right">Acción de Prueba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReferrals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.businessName}</div>
                      <div className="text-[11px] text-slate-500">{item.affiliateName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Registrado el {item.registeredAt} • {item.categoryLabel || 'Servicios'}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 uppercase text-[11px]">
                        Plan {item.plan}
                      </span>
                      <div className="text-slate-500 font-semibold">${item.monthlyPriceMxn} MXN / mes</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-black text-emerald-600 text-sm">
                        +${item.monthlyCommissionMxn.toFixed(2)} MXN
                      </div>
                      <span className="text-[10px] text-slate-500">40% cada mes</span>
                    </td>

                    <td className="py-4 px-4">
                      {item.isSubscriptionActive ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Activa y Pagada</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Pago Pendiente</span>
                        </span>
                      )}
                      <div className="text-[10px] text-slate-400 mt-1">
                        Próx. cobro: {item.nextBillingDate}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-900">
                      ${item.totalCommissionsGeneratedMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleSimulatePayment(item.id, item.businessName, item.monthlyCommissionMxn)}
                        disabled={simulatingId === item.id}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs inline-flex items-center space-x-1.5 cursor-pointer"
                        title="Simular que el afiliado paga su renovación mensual y se acredita el 40% a tu saldo"
                      >
                        {simulatingId === item.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 text-amber-300" />
                        )}
                        <span>Simular Renovación (+40%)</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">No se encontraron afiliados</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Comparte tu enlace o código con médicos, dentistas, psicólogos y profesionales de la salud y bienestar para comenzar a recibir el 40% mensual de sus planes.
            </p>
            <button
              onClick={handleShareWhatsApp}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center space-x-2 cursor-pointer mt-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar mi enlace por WhatsApp</span>
            </button>
          </div>
        )}
      </div>

      {/* Promotional Toolkit / Pitch Scripts for Promoters */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
              Kit de Marketing del Embajador
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Herramientas y Mensajes Listos para Compartir
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <MessageSquare className="w-4 h-4" />
              <span>1. Mensaje para WhatsApp Directo</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed italic">
              "Hola Dr./Lic., te comparto CitaPro MX: la plataforma que elimina las faltas a citas con cobro 100% anticipado por tarjeta o SPEI y confirmaciones por WhatsApp. Te ahorra hasta el 30% de dinero perdido por inasistencias. Regístrate aquí con mi código {effectiveCode}: {referralUrl}"
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Hola Dr./Lic., te comparto CitaPro MX: la plataforma que elimina las faltas a citas con cobro 100% anticipado por tarjeta o SPEI y confirmaciones por WhatsApp. Te ahorra hasta el 30% de dinero perdido por inasistencias. Regístrate aquí con mi código ${effectiveCode}: ${referralUrl}`
                );
                alert('¡Mensaje copiado al portapapeles!');
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
            >
              Copiar Mensaje
            </button>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <Building2 className="w-4 h-4" />
              <span>2. Mensaje para Clínicas y Consultorios</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed italic">
              "Estimada clínica, CitaPro MX les entrega una landing page personalizada con agenda, catálogo de servicios y cobro garantizado de anticipo para proteger los horarios de sus especialistas. Conoce los planes y pruébalo aquí: {referralUrl}"
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `Estimada clínica, CitaPro MX les entrega una landing page personalizada con agenda, catálogo de servicios y cobro garantizado de anticipo para proteger los horarios de sus especialistas. Conoce los planes y pruébalo aquí: ${referralUrl}`
                );
                alert('¡Mensaje copiado al portapapeles!');
              }}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer"
            >
              Copiar Mensaje
            </button>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <Zap className="w-4 h-4" />
              <span>3. Los 3 Argumentos de Venta Clave</span>
            </div>
            <ul className="text-slate-300 text-[11px] space-y-1.5">
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Cero faltas:</strong> Cobro de anticipo con tarjeta o SPEI antes de reservar.</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>WhatsApp Automático:</strong> Confirmaciones y recordatorios a pacientes.</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Tu 40% mensual:</strong> Mientras el profesional use CitaPro, recibes tu comisión mes con mes.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payout History */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>Historial de Retiros SPEI ({payouts.length})</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Folio</th>
                  <th className="py-2.5 px-3">Monto Retirado</th>
                  <th className="py-2.5 px-3">Cuenta Destino</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((pay) => (
                  <tr key={pay.id}>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{pay.reference}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(pay.requestedAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-black text-emerald-700">
                      ${pay.amountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {pay.bank} •••• {pay.clabe.slice(-4)} ({pay.holderName})
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Transferido por SPEI
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-slate-900 font-black text-base">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <span>Retirar Comisiones por SPEI</span>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {payoutMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs">
                {payoutMessage}
              </div>
            )}

            <form onSubmit={handleRequestPayout} className="space-y-3.5 text-xs">
              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Saldo Disponible</span>
                <span className="text-2xl font-black text-emerald-900">
                  ${(promoter?.availableBalanceMxn || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Monto a Retirar ($ MXN):</label>
                <input
                  type="number"
                  min="100"
                  max={promoter?.availableBalanceMxn || 0}
                  value={payoutAmount || promoter?.availableBalanceMxn || 0}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">CLABE Interbancaria (18 dígitos) *:</label>
                <input
                  type="text"
                  maxLength={18}
                  placeholder="012180004567891234"
                  value={clabeInput}
                  onChange={(e) => setClabeInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Banco Destino:</label>
                  <select
                    value={bankInput}
                    onChange={(e) => setBankInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                  >
                    <option value="BBVA México">BBVA México</option>
                    <option value="Santander">Santander</option>
                    <option value="Banorte">Banorte</option>
                    <option value="Citibanamex">Citibanamex</option>
                    <option value="Nu México">Nu México</option>
                    <option value="HSBC">HSBC</option>
                    <option value="Scotiabank">Scotiabank</option>
                    <option value="Banco Azteca">Banco Azteca</option>
                    <option value="Mercado Pago Bank">Mercado Pago Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nombre del Titular:</label>
                  <input
                    type="text"
                    value={holderInput}
                    onChange={(e) => setHolderInput(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 leading-snug">
                El retiro se procesa de forma directa por la red del Sistema de Pagos Electrónicos Interbancarios (SPEI) de Banco de México, acreditándose de inmediato en tu cuenta.
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayout || !promoter || promoter.availableBalanceMxn <= 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayout ? 'Procesando SPEI...' : 'Confirmar Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
