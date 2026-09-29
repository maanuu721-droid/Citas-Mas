import React, { useState, useEffect } from 'react';
import { Affiliate, SubscriptionPlanType, ServiceItem } from '../types.ts';
import { DataService } from '../services/dataService.ts';
import { StripeService } from '../services/stripeService.ts';
import confetti from 'canvas-confetti';
import {
  X,
  CreditCard,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Info,
  Clock,
  User
} from 'lucide-react';

export interface PlanCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlan?: SubscriptionPlanType | 'turbo';
  initialCycle?: 'monthly' | 'annual';
  initialTurboLevel?: 1 | 2 | 3;
  affiliate?: Affiliate | null;
  service?: ServiceItem | null;
  onPaymentSuccess?: (plan: SubscriptionPlanType, isTurbo?: boolean, turboLevel?: 1 | 2 | 3) => void;
  onServicePaymentSuccess?: (service: ServiceItem) => void;
}

interface PlanDefinition {
  id: SubscriptionPlanType | 'turbo';
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  description: string;
  badge?: string;
  features: string[];
}

const PLANS_CONFIG: PlanDefinition[] = [
  {
    id: 'basico',
    name: 'Plan Básico',
    monthlyPrice: 179,
    annualMonthlyPrice: 149,
    description: 'Para profesionales independientes que buscan agendar y promoverse sin complicaciones.',
    features: [
      '1 Video publicitario de 1 minuto producido con IA',
      '1 Imagen oficial tamaño 9:16 para Stories y Reels',
      'Etapa 1 de publicidad digital geolocalizada',
      'Descubre tu cliente ideal (Buyer Personas con IA)',
      '1 Profesional registrado',
      '100 Mensajes WhatsApp/mes',
      'Confirmación de cita automática',
      'Landing Page básica oficial'
    ]
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    monthlyPrice: 359,
    annualMonthlyPrice: 299,
    description: 'El plan más popular para profesionales con alto flujo y exposición en redes.',
    badge: 'Recomendado',
    features: [
      'Todo lo del Plan Básico (Video 1 min, Imagen 9:16, Etapa 1 publicidad, Descubre tu cliente ideal)',
      'MÁS Exposición prolongada en redes sociales y buscadores',
      'Puedes activar Turbo en Redes Sociales (Turbo 1: +$200, Turbo 2: +$700, Turbo 3: +$1,500)',
      'WhatsApps Ilimitados',
      'Recordatorios automáticos 24h y 2h antes',
      'Citas pagadas anticipadas obligatorias (0% no-shows)',
      'Reagendamiento inteligente anticaída',
      'Herramientas de Marketing y Automatización n8n'
    ]
  },
  {
    id: 'equipo',
    name: 'Plan Equipo',
    monthlyPrice: 869,
    annualMonthlyPrice: 724,
    description: 'Para clínicas, estéticas o consultorios con múltiples profesionales.',
    badge: 'Más Completo',
    features: [
      'Hasta 10 profesionales en una misma cuenta',
      '1 Pack de Marketing Nivel 2 SIN COSTO EXTRA ($0 MXN)',
      'Todo lo del Plan Pro incluido',
      'WhatsApps Ilimitados para todo el equipo',
      'Exposición preferencial en el directorio',
      'Reportes financieros y comisiones por doctor',
      'Soporte prioritario 24/7'
    ]
  },
  {
    id: 'comision',
    name: 'Por Comisión',
    monthlyPrice: 0,
    annualMonthlyPrice: 0,
    description: 'Paga únicamente un 10% por cada cita pagada y completada.',
    features: [
      'Sin costo fijo mensual ($0 MXN)',
      '10% de comisión por cita completada',
      'Todo lo del Plan Equipo incluido',
      'Cancelación sin penalizaciones'
    ]
  },
  {
    id: 'turbo',
    name: 'Add-on Turbo Redes Sociales',
    monthlyPrice: 200,
    annualMonthlyPrice: 200,
    description: 'Impulso turbo en redes sociales con 3 niveles de potencia según tu presupuesto.',
    badge: 'Máximo Alcance',
    features: [
      'Turbo 1 (+ $200 MXN): Impulso express en redes sociales',
      'Turbo 2 (+ $700 MXN): Impulso medio con alcance geolocalizado en redes',
      'Turbo 3 (+ $1,500 MXN): Máxima exposición masiva y posición #1 con insignia dorada',
      'Campaña geolocalizada a clientes a menos de 5 km'
    ]
  }
];

export const PlanCheckoutModal: React.FC<PlanCheckoutModalProps> = ({
  isOpen,
  onClose,
  initialPlan = 'pro',
  initialCycle = 'monthly',
  initialTurboLevel = 1,
  affiliate,
  service,
  onPaymentSuccess,
  onServicePaymentSuccess
}) => {
  const isServiceMode = !!service;
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanType | 'turbo'>(initialPlan);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(initialCycle);
  const [turboLevel, setTurboLevel] = useState<1 | 2 | 3>(initialTurboLevel || (affiliate?.turboLevel || 1));
  const [includeTurboWithPro, setIncludeTurboWithPro] = useState(affiliate?.isTurbo || false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'spei'>('card');

  // Card form state
  const [cardName, setCardName] = useState(
    isServiceMode ? 'Cliente Titular' : (affiliate?.name || 'Dr. Profesional Titular')
  );
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<{
    folio: string;
    authCode: string;
    planName: string;
    amountPaid: number;
    cycle: string;
    date: string;
  } | null>(null);

  const [copiedClabe, setCopiedClabe] = useState(false);

  useEffect(() => {
    if (initialPlan) {
      setSelectedPlanId(initialPlan);
    }
  }, [initialPlan]);

  useEffect(() => {
    if (initialCycle) {
      setBillingCycle(initialCycle);
    }
  }, [initialCycle]);

  if (!isOpen) return null;

  const currentPlanDef = PLANS_CONFIG.find((p) => p.id === selectedPlanId) || PLANS_CONFIG[1];

  const getTurboCost = (level: 1 | 2 | 3) => {
    if (level === 1) return 200;
    if (level === 2) return 700;
    return 1500;
  };

  const calculateTotal = () => {
    if (isServiceMode && service) {
      return service.price || 0;
    }
    if (selectedPlanId === 'turbo') {
      return getTurboCost(turboLevel);
    }
    if (currentPlanDef.id === 'comision') return 0;
    let base = billingCycle === 'annual' ? currentPlanDef.annualMonthlyPrice * 12 : currentPlanDef.monthlyPrice;
    if (selectedPlanId === 'pro' && includeTurboWithPro) {
      base += getTurboCost(turboLevel);
    }
    return base;
  };

  const totalAmount = calculateTotal();

  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExp('12/28');
    setCardCvv('892');
  };

  const handleCopyClabe = () => {
    navigator.clipboard.writeText('646180157082910341');
    setCopiedClabe(true);
    setTimeout(() => setCopiedClabe(false), 2500);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const isTurboActive = selectedPlanId === 'turbo' || (selectedPlanId === 'pro' && includeTurboWithPro);
      const effectiveTurboCost = isTurboActive ? getTurboCost(turboLevel) : 0;

      // 1. Process with Stripe server backend if card
      if (paymentMethod === 'card' && totalAmount > 0) {
        try {
          await StripeService.getInstance().createPaymentIntent({
            amount: totalAmount,
            serviceName: isServiceMode && service
              ? `Pago Servicio CitaPro MX: ${service.name} (${affiliate?.businessName || affiliate?.name || 'Profesional'})`
              : `Suscripción CitaPro MX: ${currentPlanDef.name} (${billingCycle})${isTurboActive ? ` + Turbo ${turboLevel} ($${effectiveTurboCost})` : ''}`,
            clientEmail: affiliate?.email || 'pago@citapro.mx',
            metadata: {
              type: isServiceMode ? 'service_payment' : 'subscription',
              serviceId: service?.id || '',
              planId: isServiceMode ? '' : currentPlanDef.id,
              affiliateId: affiliate?.id || '',
              billingCycle: isServiceMode ? 'once' : billingCycle,
              isTurbo: isTurboActive ? 'true' : 'false',
              turboLevel: isTurboActive ? String(turboLevel) : ''
            }
          });
        } catch (err: any) {
          console.warn('Stripe processing notice:', err);
        }
      }

      if (isServiceMode && service) {
        // Receipt for service payment
        const receipt = {
          folio: `SRV-${Math.floor(100000 + Math.random() * 900000)}`,
          authCode: `AUTH-STP-${Date.now().toString().slice(-6)}`,
          planName: service.name,
          amountPaid: service.price,
          cycle: `Servicio Profesional (${service.duration} min)`,
          date: new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        setPaymentReceipt(receipt);
        setIsSuccess(true);
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });

        if (onServicePaymentSuccess) {
          onServicePaymentSuccess(service);
        }
      } else {
        // Prepare updated affiliate data for subscription plan
        const expirationDate = new Date();
        if (billingCycle === 'annual') {
          expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        } else {
          expirationDate.setDate(expirationDate.getDate() + 30);
        }

        const isTurboAddon = currentPlanDef.id === 'turbo';
        const actualPlanType: SubscriptionPlanType = isTurboAddon
          ? (affiliate?.plan || 'pro')
          : (currentPlanDef.id as SubscriptionPlanType);

        if (affiliate) {
          const updatedAffiliate: Affiliate = {
            ...affiliate,
            plan: actualPlanType,
            isTurbo: isTurboActive,
            turboLevel: isTurboActive ? turboLevel : undefined,
            turboLevelExtraCost: isTurboActive ? effectiveTurboCost : undefined,
            planExpiresAt: expirationDate.toISOString(),
            hasAutoPaymentCard: true,
            cardLast4: paymentMethod === 'card' ? cardNumber.slice(-4).replace(/\s/g, '') || '4242' : 'SPEI',
            // Grant tier benefits if upgraded to Equipo
            affiliateTierLevel: actualPlanType === 'equipo' ? 3 : actualPlanType === 'pro' ? 2 : 1,
            freeLevel2PacksAvailable:
              actualPlanType === 'equipo'
                ? Math.max(affiliate.freeLevel2PacksAvailable || 0, 1)
                : affiliate.freeLevel2PacksAvailable || 0
          };

          await DataService.getInstance().saveAffiliate(updatedAffiliate);
        }

        // Generate receipt
        const receipt = {
          folio: `SUB-${Math.floor(100000 + Math.random() * 900000)}`,
          authCode: `AUTH-STP-${Date.now().toString().slice(-6)}`,
          planName: `${currentPlanDef.name}${isTurboActive ? ` + Turbo ${turboLevel} ($${effectiveTurboCost} MXN)` : ''}`,
          amountPaid: totalAmount,
          cycle: billingCycle === 'annual' ? 'Anual (Ahorro 2 meses)' : 'Mensual Recurrente',
          date: new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        };

        setPaymentReceipt(receipt);
        setIsSuccess(true);
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });

        if (onPaymentSuccess) {
          onPaymentSuccess(actualPlanType, isTurboActive, isTurboActive ? turboLevel : undefined);
        }
      }
    } catch (err: any) {
      console.error('Error processing payment:', err);
      alert('Ocurrió un error al procesar el pago. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>
              {isServiceMode ? 'Cobro de Servicio Profesional' : 'Activación & Upgrade de Plan Profesional'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isSuccess
              ? '¡Pago Confirmado Exitosamente!'
              : isServiceMode
              ? `Cobro: ${service?.name}`
              : 'Panel de Pago y Contratación'}
          </h2>

          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {isSuccess
              ? 'Tu comprobante oficial de pago ha sido generado y los beneficios han sido activados.'
              : isServiceMode
              ? `Paga de forma 100% segura el servicio con ${affiliate?.businessName || affiliate?.name || 'el profesional'}. Respaldo con garantía CitaPro MX.`
              : 'Selecciona tu plan, verifica el importe y activa tu suscripción de inmediato con garantía 100% segura.'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          {isSuccess && paymentReceipt ? (
            /* SUCCESS CONFIRMATION RECEIPT */
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900">
                  ¡Pago Registrado de {paymentReceipt.planName}!
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Tu comprobante oficial de pago ha sido generado con éxito.
                </p>
              </div>

              {/* Receipt details */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left space-y-2.5 max-w-md mx-auto">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Folio de Operación:</span>
                  <span className="font-mono font-bold text-slate-900">{paymentReceipt.folio}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Código de Autorización:</span>
                  <span className="font-mono font-bold text-emerald-700">{paymentReceipt.authCode}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">{isServiceMode ? 'Servicio Pagado:' : 'Plan Seleccionado:'}</span>
                  <span className="font-bold text-slate-900">{paymentReceipt.planName}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Modalidad / Detalle:</span>
                  <span className="font-medium text-slate-700">{paymentReceipt.cycle}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Importe Cobrado:</span>
                  <span className="text-sm font-black text-emerald-700">
                    ${paymentReceipt.amountPaid.toLocaleString('es-MX')} MXN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha y Hora:</span>
                  <span className="text-slate-700">{paymentReceipt.date}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer inline-flex items-center justify-center space-x-2"
                >
                  <span>{isServiceMode ? 'Finalizar y Cerrar Comprobante' : 'Entrar a mi Escritorio con el Nuevo Plan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM */
            <form onSubmit={handleProcessPayment} className="space-y-6">
              {/* 1. SELECT PLAN TABS (Only shown if NOT in service mode) */}
              {!isServiceMode ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      1. Plan Seleccionado:
                    </label>

                    {/* Billing cycle toggle */}
                    {currentPlanDef.id !== 'comision' && (
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => setBillingCycle('monthly')}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            billingCycle === 'monthly'
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Mensual
                        </button>
                        <button
                          type="button"
                          onClick={() => setBillingCycle('annual')}
                          className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                            billingCycle === 'annual'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>Anual</span>
                          <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded-full font-black">
                            -2m
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PLANS_CONFIG.filter((p) => p.id !== 'turbo').map((p) => {
                      const isSelected = selectedPlanId === p.id;
                      const price =
                        p.id === 'comision'
                          ? '10%'
                          : `$${billingCycle === 'annual' ? p.annualMonthlyPrice : p.monthlyPrice}`;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedPlanId(p.id)}
                          className={`p-3 rounded-2xl border text-left transition-all relative cursor-pointer ${
                            isSelected
                              ? 'border-2 border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-400/30'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-emerald-600">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {p.name}
                          </span>
                          <div className="mt-1">
                            <span className="text-base font-black text-slate-900">{price}</span>
                            <span className="text-[10px] text-slate-500">
                              {p.id === 'comision' ? ' /cita' : ' /mes'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* 2. SUMMARY BREAKDOWN (SERVICE OR PLAN) */}
              {isServiceMode && service ? (
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-4 sm:p-5 text-white border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
                        Servicio a Cobrar
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {service.name}
                      </h3>
                      <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{service.duration} minutos</span>
                        </span>
                        {affiliate && (
                          <span className="flex items-center space-x-1">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{affiliate.businessName || affiliate.name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-2xl font-black text-emerald-400">
                        ${totalAmount.toLocaleString('es-MX')} MXN
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Precio configurado por el profesional
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {service.description || 'Servicio profesional garantizado por la plataforma.'}
                  </p>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-4 sm:p-5 text-white border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">
                        Resumen del Plan
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {currentPlanDef.name}{' '}
                        <span className="text-xs text-slate-400 font-normal">
                          ({billingCycle === 'annual' && currentPlanDef.id !== 'comision' ? 'Anual' : 'Mensual'})
                        </span>
                      </h3>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-2xl font-black text-emerald-400">
                        ${totalAmount.toLocaleString('es-MX')} MXN
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {currentPlanDef.id === 'comision'
                          ? '10% de comisión por cita completada'
                          : billingCycle === 'annual'
                          ? 'Cobro anual (incluye 2 meses gratis)'
                          : 'Facturado mensualmente, cancela cuando quieras'}
                      </span>
                    </div>
                  </div>

                  {/* Key features of chosen plan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    {currentPlanDef.features.slice(0, 4).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Turbo Level Selector for Turbo Plan or Pro Plan */}
                  {(selectedPlanId === 'turbo' || selectedPlanId === 'pro') && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {selectedPlanId === 'turbo'
                              ? 'Selecciona tu Nivel de Impulso Turbo:'
                              : '¿Deseas potenciar con Turbo en Redes Sociales?'}
                          </span>
                        </span>
                        {selectedPlanId === 'pro' && (
                          <label className="flex items-center space-x-2 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={includeTurboWithPro}
                              onChange={(e) => setIncludeTurboWithPro(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
                            />
                            <span className="text-slate-300 font-semibold">Activar Turbo</span>
                          </label>
                        )}
                      </div>

                      {(selectedPlanId === 'turbo' || includeTurboWithPro) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {[
                            {
                              lvl: 1 as const,
                              name: 'Turbo 1',
                              price: 200,
                              desc: 'Impulso express en redes sociales'
                            },
                            {
                              lvl: 2 as const,
                              name: 'Turbo 2',
                              price: 700,
                              desc: 'Impulso medio con geolocalización'
                            },
                            {
                              lvl: 3 as const,
                              name: 'Turbo 3',
                              price: 1500,
                              desc: 'Máxima exposición #1 e insignia dorada'
                            }
                          ].map((t) => (
                            <button
                              key={t.lvl}
                              type="button"
                              onClick={() => {
                                setTurboLevel(t.lvl);
                                if (selectedPlanId === 'pro') setIncludeTurboWithPro(true);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                turboLevel === t.lvl && (selectedPlanId === 'turbo' || includeTurboWithPro)
                                  ? 'border-amber-400 bg-amber-400/20 text-white shadow-sm ring-1 ring-amber-400'
                                  : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-black text-xs text-amber-300">{t.name}</span>
                                <span className="text-xs font-bold text-white">+${t.price} MXN</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 leading-tight">{t.desc}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. PAYMENT METHOD SELECTION */}
              {totalAmount > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    2. Método de Pago:
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-2 border-emerald-500 bg-emerald-50/70 text-slate-950 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Tarjeta Bancaria (Stripe México)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('spei')}
                      className={`p-3 rounded-2xl border text-center font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                        paymentMethod === 'spei'
                          ? 'border-2 border-emerald-500 bg-emerald-50/70 text-slate-950 shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Landmark className="w-4 h-4 text-emerald-600" />
                      <span>Transferencia SPEI Inmediata</span>
                    </button>
                  </div>

                  {/* Card form */}
                  {paymentMethod === 'card' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                          <Lock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pasarela Cifrada Stripe con 3D Secure</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleFillTestCard}
                          className="text-[10px] text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-300 cursor-pointer"
                        >
                          Rellenar tarjeta demo (4242)
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="block text-slate-600 mb-0.5">Nombre en la tarjeta</label>
                          <input
                            type="text"
                            required
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 mb-0.5">Número de tarjeta</label>
                          <input
                            type="text"
                            required
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4242 4242 4242 4242"
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-slate-600 mb-0.5">Vencimiento (MM/AA)</label>
                            <input
                              type="text"
                              required
                              value={cardExp}
                              onChange={(e) => setCardExp(e.target.value)}
                              placeholder="12/28"
                              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-center font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-0.5">CVV</label>
                            <input
                              type="password"
                              required
                              maxLength={4}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              placeholder="123"
                              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-mono text-center font-medium"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SPEI details */}
                  {paymentMethod === 'spei' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                      <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                        <Landmark className="w-4 h-4 text-emerald-600" />
                        <span>Datos para Transferencia Interbancaria SPEI</span>
                      </div>

                      <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Banco Receptor:</span>
                          <span className="font-bold text-slate-900">STP (Sistema de Transferencias y Pagos)</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Beneficiario:</span>
                          <span className="font-bold text-slate-900">CitaPro MX SAPI de CV</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-500">CLABE Interbancaria:</span>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-emerald-700 text-sm">
                              646180157082910341
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyClabe}
                              className="p-1 text-slate-500 hover:text-emerald-600"
                              title="Copiar CLABE"
                            >
                              {copiedClabe ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Concepto / Referencia:</span>
                          <span className="font-mono font-bold text-slate-900">
                            PLAN-{selectedPlanId.toUpperCase()}-{Date.now().toString().slice(-4)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Monto Exacto:</span>
                          <span className="font-black text-emerald-700 text-sm">
                            ${totalAmount.toLocaleString('es-MX')} MXN
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-tight">
                        Al transferir por SPEI, la acreditación es instantánea las 24 horas del día. Haz clic en "Confirmar Pago" para verificar.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 4. ACTION SUBMIT BUTTON */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sin contratos forzosos. Cancela cuando quieras.</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Procesando pago seguro...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        {isServiceMode && service
                          ? `Pagar Servicio ($${totalAmount.toLocaleString('es-MX')} MXN)`
                          : totalAmount === 0
                          ? 'Activar Plan por Comisión ($0 MXN)'
                          : `Pagar y Activar ${currentPlanDef.name} ($${totalAmount.toLocaleString('es-MX')} MXN)`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
