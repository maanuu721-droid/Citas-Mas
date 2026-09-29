import React, { useState } from 'react';
import { Affiliate, SubscriptionPlanType } from '../types.ts';
import { PlanCheckoutModal } from './PlanCheckoutModal.tsx';
import {
  Calendar,
  MessageSquare,
  ShieldCheck,
  Zap,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
  Sparkles,
  Calculator,
  Lock,
  Smartphone,
  ChevronRight,
  Check
} from 'lucide-react';

interface Props {
  onGoToDashboard: () => void;
  onGoToExplore: () => void;
  onRegisterAffiliate?: () => void;
  currentAffiliate?: Affiliate | null;
  onPlanPaid?: (plan: SubscriptionPlanType, isTurbo?: boolean) => void;
}

export const PromoBusinessView: React.FC<Props> = ({
  onGoToDashboard,
  onGoToExplore,
  onRegisterAffiliate,
  currentAffiliate,
  onPlanPaid
}) => {
  // Interactive Revenue Calculator
  const [profession, setProfession] = useState('psicologo');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(15);
  const [averagePrice, setAveragePrice] = useState(650);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Selected plan state & checkout modal
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanType | 'turbo'>('pro');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTargetPlan, setCheckoutTargetPlan] = useState<SubscriptionPlanType | 'turbo'>('pro');

  const handleSelectAndOpenPayment = (plan: SubscriptionPlanType | 'turbo') => {
    setSelectedPlan(plan);
    setCheckoutTargetPlan(plan);
    setIsCheckoutOpen(true);
  };

  const handlePaymentSuccess = (plan: SubscriptionPlanType, isTurbo?: boolean) => {
    if (onPlanPaid) {
      onPlanPaid(plan, isTurbo);
    }
    // Also redirect to dashboard after success
    setTimeout(() => {
      onGoToDashboard();
    }, 1500);
  };

  const monthlyGross = sessionsPerWeek * 4 * averagePrice;
  // In typical cash-at-the-door appointments in Mexico, 25%-35% are no-shows.
  // With CitaPro MX, no-shows drop to ~1.2%.
  const estimatedSavedLostMoney = Math.round(monthlyGross * 0.25);

  return (
    <div id="promo-business-view" className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white pt-16 pb-24 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="max-w-6xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-emerald-950/80 border border-emerald-800/60 px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-semibold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>La Plataforma #1 de Citas Profesionales en México</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
            Elimina los <span className="text-emerald-400">no-shows</span> para siempre con{' '}
            <span className="underline decoration-emerald-500 decoration-wavy">pago anticipado</span> y WhatsApp automático
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Tu propia landing page personalizable con logo, fotos, video y calendario sincronizado con mensajería instantánea. El cliente aparta pagando y recibe recordatorios a su WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            {onRegisterAffiliate && (
              <button
                id="promo-cta-register-btn"
                onClick={onRegisterAffiliate}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Registrar Mi Negocio (Crear Cuenta)</span>
              </button>
            )}

            <button
              id="promo-cta-dashboard-btn"
              onClick={onGoToDashboard}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 px-7 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>Abrir Panel de Afiliado (Demo)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToExplore}
              className="w-full sm:w-auto bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 px-6 py-4 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center space-x-2"
            >
              <span>Ver Directorio</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Social proof badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 border-t border-slate-800/80 max-w-3xl mx-auto">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantía de cobro 100% anticipado</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp Business con Envíos Automáticos</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Alta disponibilidad y respaldos automáticos</span>
            </div>
          </div>
        </div>
      </section>

      {/* The 4 Core Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            El Flujo Perfecto
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            ¿Por qué Citas Más multiplica tus citas efectivas?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base">Landing Personalizada</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Agrega tu logo, fotos del consultorio, video explicativo, precios claros y horarios de atención.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base">Pago 100% Anticipado</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              El cliente solo puede apartar la cita pagando por tarjeta bancaria (Stripe México) o transferencia SPEI. Tu tiempo queda garantizado.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base">WhatsApp Automatizado</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirmación inmediata, recordatorios automáticos 24h y 2h antes, y despacho de notas con un clic.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-base">Política Anticaída</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Si cancelan con &gt;24h se reembolsa el 50%. Si cancelan con &lt;24h o no van, el 100% es para compensar tu espacio.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Revenue & Time Saved Calculator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Calculator className="w-4 h-4" />
            <span>Calculadora de Rendimiento & Recuperación de No-Shows</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Controls */}
            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Tu Especialidad:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'psicologo', label: 'Psicólogo' },
                    { id: 'dentista', label: 'Dentista' },
                    { id: 'masajista', label: 'Masajista/Spa' },
                    { id: 'barbero', label: 'Barbero/Estilista' },
                    { id: 'terapeuta', label: 'Terapeuta' },
                    { id: 'nutriologo', label: 'Nutriólogo' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProfession(p.id)}
                      className={`p-2 rounded-xl text-center font-bold transition-all ${
                        profession === p.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Citas promedio por semana:</span>
                  <span className="font-bold text-emerald-400">{sessionsPerWeek} citas</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Precio promedio por sesión (MXN):</span>
                  <span className="font-bold text-emerald-400">${averagePrice} MXN</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={2500}
                  step={50}
                  value={averagePrice}
                  onChange={(e) => setAveragePrice(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Results Display */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-5">
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider block">
                  Ingreso Mensual Cobrado con Citas Más
                </span>
                <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                  ${monthlyGross.toLocaleString('es-MX')}{' '}
                  <span className="text-sm font-normal text-emerald-400">MXN/mes</span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  ({sessionsPerWeek * 4} citas efectivas al mes)
                </span>
              </div>

              <div className="pt-4 border-t border-white/10">
                <span className="text-amber-400 text-xs uppercase tracking-wider font-bold block">
                  Dinero que antes perdías en No-Shows recuperado:
                </span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  +${estimatedSavedLostMoney.toLocaleString('es-MX')} MXN/mes
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Gracias a la regla de pago anticipado y recordatorios de WhatsApp 24h y 2h antes.
                </p>
              </div>

              <button
                onClick={onGoToDashboard}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3 rounded-xl font-black text-xs transition-colors shadow-lg shadow-emerald-500/10"
              >
                Empezar con mi Escritorio Gratis
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Comparison Table (The 4 Plans + Turbo) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Planes Transparentes
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Elige el plan ideal para impulsar tu negocio
          </h2>
          <p className="text-xs text-slate-600">
            Sin contratos forzosos. Cancela en el momento que quieras con 1 clic.
          </p>

          <div className="flex items-center justify-center space-x-2 pt-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                billingCycle === 'monthly' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 ${
                billingCycle === 'annual' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span>Anual</span>
              <span className="bg-emerald-500 text-slate-950 text-[10px] px-1.5 rounded-full font-black">
                2 meses gratis
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Básico */}
          <div
            onClick={() => handleSelectAndOpenPayment('basico')}
            className={`rounded-3xl p-6 transition-all flex flex-col justify-between space-y-4 cursor-pointer relative ${
              selectedPlan === 'basico'
                ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-xl ring-2 ring-emerald-400/30'
                : 'bg-white border border-slate-200 hover:border-emerald-300 shadow-xs'
            }`}
          >
            {selectedPlan === 'basico' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                <Check className="w-3 h-3" />
                <span>Plan Seleccionado</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Básico</h3>
                {selectedPlan === 'basico' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>

              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900">
                  ${billingCycle === 'annual' ? '149' : '179'}
                </span>
                <span className="text-xs text-slate-500"> MXN/m</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">Para profesionales independientes que inician.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>1 Video de 1 minuto</strong> producido con IA</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>1 Imagen oficial 9:16</strong> (Stories/Reels)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Etapa 1 de publicidad</strong> digital</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Descubre tu cliente ideal</strong> (Buyer Personas)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 Profesional • 100 Mensajes WhatsApp/mes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Confirmación de cita automática</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Landing Page básica oficial</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAndOpenPayment('basico');
              }}
              className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer ${
                selectedPlan === 'basico'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              {selectedPlan === 'basico'
                ? `Pagar Plan Básico ($${billingCycle === 'annual' ? '149' : '179'} MXN)`
                : 'Elegir y Pagar Básico'}
            </button>
          </div>

          {/* Pro */}
          <div
            onClick={() => handleSelectAndOpenPayment('pro')}
            className={`rounded-3xl p-6 transition-all flex flex-col justify-between space-y-4 cursor-pointer relative ${
              selectedPlan === 'pro'
                ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-xl ring-2 ring-emerald-400/30'
                : 'bg-white border border-slate-200 hover:border-emerald-300 shadow-xs'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-sm">
              {selectedPlan === 'pro' ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Plan Seleccionado</span>
                </>
              ) : (
                <span>Recomendado</span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Pro</h3>
                {selectedPlan === 'pro' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>

              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900">
                  ${billingCycle === 'annual' ? '299' : '359'}
                </span>
                <span className="text-xs text-slate-500"> MXN/m</span>
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Garantía 0% No-Shows</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Todo lo del Plan Básico</strong> (Video 1m, 9:16, Etapa 1)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>MÁS Exposición prolongada</strong> en redes sociales</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span><strong>Activa Turbo:</strong> Turbo 1 (+$200), Turbo 2 (+$700), Turbo 3 (+$1500)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>WhatsApps Ilimitados</strong></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Recordatorio 24h & 2h antes</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Citas Pagadas Anticipadas</strong></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Reagendamiento inteligente</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAndOpenPayment('pro');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md transition-all cursor-pointer"
            >
              {selectedPlan === 'pro'
                ? `Pagar Plan Pro ($${billingCycle === 'annual' ? '299' : '359'} MXN)`
                : 'Elegir y Pagar Pro'}
            </button>
          </div>

          {/* Equipo */}
          <div
            onClick={() => handleSelectAndOpenPayment('equipo')}
            className={`rounded-3xl p-6 transition-all flex flex-col justify-between space-y-4 cursor-pointer relative ${
              selectedPlan === 'equipo'
                ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-xl ring-2 ring-emerald-400/30'
                : 'bg-white border border-slate-200 hover:border-emerald-300 shadow-xs'
            }`}
          >
            {selectedPlan === 'equipo' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                <Check className="w-3 h-3" />
                <span>Plan Seleccionado</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Equipo</h3>
                {selectedPlan === 'equipo' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>

              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900">
                  ${billingCycle === 'annual' ? '724' : '869'}
                </span>
                <span className="text-xs text-slate-500"> MXN/m</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">Para clínicas, salones o consultorios multi-especialidad.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Hasta 10 profesionales</strong></span>
                </li>
                <li className="flex items-center space-x-2 text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1 Pack Publicidad Nivel 2 SIN COSTO EXTRA ($0)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApps Ilimitados</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Exposición preferencial</strong></span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Anuncios segmentados por zona</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAndOpenPayment('equipo');
              }}
              className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer ${
                selectedPlan === 'equipo'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {selectedPlan === 'equipo'
                ? `Pagar Plan Equipo ($${billingCycle === 'annual' ? '724' : '869'} MXN)`
                : 'Elegir y Pagar Equipo'}
            </button>
          </div>

          {/* Comisión */}
          <div
            onClick={() => handleSelectAndOpenPayment('comision')}
            className={`rounded-3xl p-6 transition-all flex flex-col justify-between space-y-4 cursor-pointer relative ${
              selectedPlan === 'comision'
                ? 'border-2 border-emerald-500 bg-emerald-50/20 shadow-xl ring-2 ring-emerald-400/30'
                : 'bg-white border border-slate-200 hover:border-emerald-300 shadow-xs'
            }`}
          >
            {selectedPlan === 'comision' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1 shadow-sm">
                <Check className="w-3 h-3" />
                <span>Plan Seleccionado</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Por Comisión</h3>
                {selectedPlan === 'comision' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>

              <div className="mt-3">
                <span className="text-3xl font-black text-slate-900">10%</span>
                <span className="text-xs text-slate-500"> por cita</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">Paga únicamente conforme recibes clientes.</p>

              <ul className="mt-6 space-y-2.5 text-xs text-slate-700">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Todo lo de Equipo incluido</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hasta 10 profesionales</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>WhatsApps Ilimitados</span>
                </li>
                <li className="flex items-center space-x-2 text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sin costo inicial ($0 MXN)</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAndOpenPayment('comision');
              }}
              className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-sm cursor-pointer ${
                selectedPlan === 'comision'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
              }`}
            >
              {selectedPlan === 'comision' ? 'Activar Plan por Comisión' : 'Elegir Comisión ($0)'}
            </button>
          </div>
        </div>

        {/* Add-on Turbo callout */}
        <div
          onClick={() => handleSelectAndOpenPayment('turbo')}
          className={`mt-6 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs transition-all cursor-pointer ${
            selectedPlan === 'turbo'
              ? 'bg-amber-500/20 border-2 border-amber-500 ring-2 ring-amber-400/40 shadow-lg text-amber-950'
              : 'bg-amber-500/10 border border-amber-300 hover:border-amber-400 text-amber-950'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-amber-600 fill-current shrink-0" />
            <span>
              <strong>Activa Turbo en Redes Sociales:</strong> Elige Turbo 1 (+$200), Turbo 2 (+$700) o Turbo 3 (+$1,500 MXN). Máxima prioridad en mapa GPS, distintivo dorado y anuncios de alto impacto.
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAndOpenPayment('turbo');
            }}
            className="bg-slate-950 hover:bg-slate-900 text-amber-400 px-5 py-2.5 rounded-xl font-black text-xs whitespace-nowrap shadow-sm cursor-pointer"
          >
            Elegir y Pagar Turbo (desde $200)
          </button>
        </div>

        {/* Plan Checkout & Payment Modal */}
        <PlanCheckoutModal
          isOpen={isCheckoutOpen}
          initialPlan={checkoutTargetPlan}
          initialCycle={billingCycle}
          affiliate={currentAffiliate}
          onClose={() => setIsCheckoutOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </section>
    </div>
  );
};
