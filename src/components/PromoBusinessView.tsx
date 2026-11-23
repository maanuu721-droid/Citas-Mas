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

          {/* Membresía Única highlight badge */}
          <div
            className="inline-flex items-center space-x-3 bg-emerald-500/10 border border-emerald-500/40 px-5 py-3 rounded-2xl cursor-pointer hover:bg-emerald-500/20 transition-colors"
            onClick={() => handleSelectAndOpenPayment('pro')}
          >
            <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-xl">MEMBRESÍA INTEGRAL</span>
            <span className="text-white font-bold text-sm">Plan Único Todo Incluido por</span>
            <span className="text-emerald-400 font-black text-xl">$1,200 MXN/mes</span>
            <span className="text-emerald-300 text-xs font-semibold">(IVA incluido)</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
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

      {/* Pricing Section — Plan Único $1,200 MXN (IVA Incluido) */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Tarifa Transparente y Sin Letras Chiquitas
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Un solo plan con todo el poder de CitasMás
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Sin paquetes confusos ni cobros ocultos. Cancela cuando quieras con 1 clic.
          </p>
        </div>

        {/* Card Plan Único */}
        <div className="rounded-3xl p-8 sm:p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl border-2 border-emerald-500/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 font-black text-xs uppercase px-6 py-1.5 rounded-bl-2xl shadow-md">
            Membresía Completa • IVA Incluido
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Acceso Total Para Profesionales y Clínicas</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Plan Integral CitasMás
              </h3>
              <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
                Agenda digital inteligente, cobro 100% anticipado para eliminar citas perdidas, recordatorios automatizados por WhatsApp y suite de marketing con Inteligencia Artificial.
              </p>
            </div>

            <div className="text-left md:text-right shrink-0 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
              <div className="text-4xl sm:text-5xl font-black text-emerald-400">
                $1,200
              </div>
              <div className="text-xs font-bold text-slate-300 mt-1">
                Pesos Mexicanos (MXN) / mes
              </div>
              <div className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-2.5 py-1 rounded-md inline-block mt-2">
                ✓ IVA ya incluido
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-200">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Landing Page Oficial:</strong> Tu sitio web profesional personalizado con fotos, catálogo y enlace propio.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>0% No-Shows (Garantía):</strong> Cobro de citas 100% anticipado con tarjeta bancaria vía Stripe México.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>WhatsApp Automatizado:</strong> Confirmaciones automáticas y recordatorios preventivos a clientes 24h y 2h antes.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Videos y Creativos IA:</strong> Generación de videos de 1 min para redes sociales y piezas 9:16 para Reels/Stories.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Descubrimiento de Buyer Personas:</strong> Inteligencia Artificial que identifica el perfil exacto de tu cliente ideal.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Dispersión Directa a tu Banco:</strong> Envío de tus ganancias a cualquier cuenta CLABE (18 dígitos) en México.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Citas y Clientes Ilimitados:</strong> Sin comisiones por consulta ni límites ocultos de uso.</span>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Flexibilidad Total:</strong> Sin contratos forzosos. Cancela en el momento que decidas.</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantía de activación inmediata • Transacción 100% segura con Stripe</span>
            </div>

            <button
              type="button"
              onClick={() => handleSelectAndOpenPayment('pro')}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Contratar Plan CitasMás ($1,200 MXN / mes)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Plan Checkout & Payment Modal */}
        <PlanCheckoutModal
          isOpen={isCheckoutOpen}
          initialPlan={checkoutTargetPlan}
          initialCycle="monthly"
          affiliate={currentAffiliate}
          onClose={() => setIsCheckoutOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </section>
    </div>
  );
};
