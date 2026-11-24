import React, { useState, useEffect } from 'react';
import {
  Users, Image as ImageIcon, Video, Film, Lock, CheckCircle2,
  ArrowRight, Sparkles, Download, RefreshCw, Plus, Share2,
  Send, AlertCircle, X, Clock, Globe, Megaphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Affiliate,
  BuyerPersona,
  ImagePackage916,
  MonthlyVideoRecord,
  ExposureRequest
} from '../types.ts';
import { usePlanGuard } from '../hooks/usePlanGuard.ts';
import { DataService } from '../services/dataService.ts';

const N8N_BASE = 'https://n8n.bahiago.tech/webhook';

interface Props {
  affiliate: Affiliate;
  initialTab?: string;
  onUpdateAffiliate: (updated: Affiliate) => void;
  onNavigateToLanding?: () => void;
  onUpgradePlan?: () => void;
  onClose?: () => void;
}

type ActiveEtapa = 'etapa1' | 'etapa2' | 'etapa3' | 'etapa4' | null;

const VOICE_TYPES = [
  { value: 'female_warm', label: 'Femenina — Cálida y Empática' },
  { value: 'male_professional', label: 'Masculina — Profesional y Directa' },
  { value: 'cinematic_narrator', label: 'Narrador Cinematográfico — Grave y Profundo' },
];

export const MarketingToolsView: React.FC<Props> = ({
  affiliate,
  onUpdateAffiliate,
  onNavigateToLanding,
  onUpgradePlan,
  onClose,
}) => {
  const guard = usePlanGuard(affiliate);

  const [activeEtapa, setActiveEtapa] = useState<ActiveEtapa>(null);
  const [personas, setPersonas] = useState<BuyerPersona[]>(affiliate.buyerPersonas || []);
  const [packages, setPackages] = useState<ImagePackage916[]>(affiliate.imagePackages || []);
  const [monthlyVideos, setMonthlyVideos] = useState<MonthlyVideoRecord[]>(affiliate.monthlyVideos || []);
  const [activeTab, setActiveTab] = useState<'stages' | 'resources'>('stages');

  // Loading / feedback states
  const [isGeneratingE1, setIsGeneratingE1] = useState(false);
  const [isGeneratingE2, setIsGeneratingE2] = useState(false);
  const [isGeneratingE3, setIsGeneratingE3] = useState(false);
  const [isGeneratingE4, setIsGeneratingE4] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [exposureSuccessIds, setExposureSuccessIds] = useState<Record<string, boolean>>({});

  // Etapa 1 manual form
  const [newPersonaName, setNewPersonaName] = useState('');
  const [newPersonaAge, setNewPersonaAge] = useState('25-45 años');
  const [newPersonaGender, setNewPersonaGender] = useState('Mujeres y Hombres');
  const [newPersonaZone, setNewPersonaZone] = useState(affiliate.city || '');
  const [newPersonaFear, setNewPersonaFear] = useState('');
  const [newPersonaDesire, setNewPersonaDesire] = useState('');
  const [newPersonaTrigger, setNewPersonaTrigger] = useState('');
  const [newPersonaHook, setNewPersonaHook] = useState('');

  // Etapa 2 form
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(personas[0]?.id || '');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(affiliate.services[0]?.id || 'global');
  const [isGlobalAd, setIsGlobalAd] = useState<boolean>(affiliate.services.length === 0);
  const [packageActiveImageTab, setPackageActiveImageTab] = useState<Record<string, 'publicitaria' | 'educativa' | 'promocion'>>({});

  // Etapa 3 & 4 form
  const readyPackages = packages.filter(p => p.status === 'ready');
  const [selectedPackageId, setSelectedPackageId] = useState<string>(readyPackages[0]?.id || '');
  const [voiceType, setVoiceType] = useState<string>('female_warm');
  const [promotionText, setPromotionText] = useState<string>('');
  const [cinematicMessage, setCinematicMessage] = useState<string>('');

  useEffect(() => {
    setPersonas(affiliate.buyerPersonas || []);
    setPackages(affiliate.imagePackages || []);
    setMonthlyVideos(affiliate.monthlyVideos || []);
  }, [affiliate]);

  useEffect(() => {
    if (!selectedPersonaId && personas.length > 0) {
      setSelectedPersonaId(personas[0].id);
    }
  }, [personas, selectedPersonaId]);

  useEffect(() => {
    if (!selectedPackageId && readyPackages.length > 0) {
      setSelectedPackageId(readyPackages[0].id);
    }
  }, [readyPackages, selectedPackageId]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setStatusBanner({ type, msg });
    setTimeout(() => setStatusBanner(null), 5000);
  };

  // ─── ETAPA 1: GENERATE BUYER PERSONAS WITH AI ────────────────────────────
  const handleGeneratePersonasAI = async () => {
    if (!guard.canUseEtapa1) return;
    setIsGeneratingE1(true);
    try {
      const res = await fetch(`${N8N_BASE}/marketing-etapa1-personas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          businessName: affiliate.businessName,
          category: affiliate.categoryLabel || affiliate.category,
          city: affiliate.city,
          description: affiliate.description,
          services: affiliate.services.map(s => `${s.name} ($${s.price} MXN)`).join(', '),
        }),
      });
      const data = await res.json();
      const generated: BuyerPersona[] = Array.isArray(data?.personas) && data.personas.length > 0
        ? data.personas
        : [
            {
              id: `bp-${Date.now()}-1`,
              name: `Cliente Ideal Local (${affiliate.city})`,
              ageRange: '28-45 años',
              gender: 'Todos',
              specificZone: affiliate.city || 'Zona Metropolitana',
              fears: ['Falta de tiempo', 'Malas experiencias previas', 'Precios ocultos'],
              desires: ['Atención rápida', 'Resultados visibles', 'Confianza profesional'],
              buyingTriggers: ['Agendamiento en 1 clic', 'Reseñas verificadas', 'Promoción de bienvenida'],
              summaryHook: `Transforma tu experiencia en ${affiliate.businessName} con cita garantizada.`,
            }
          ];

      const merged = [...personas, ...generated];
      const updated: Affiliate = {
        ...affiliate,
        buyerPersonas: merged,
        etapa1Completed: true,
        updatedAt: new Date().toISOString(),
      };
      await DataService.getInstance().saveAffiliate(updated);
      setPersonas(merged);
      onUpdateAffiliate(updated);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      showToast('success', `✅ Se crearon ${generated.length} Clientes Ideales. ¡Ya puedes pasar a la Etapa 2!`);
    } catch (err) {
      showToast('error', 'No se pudo conectar con n8n para generar personas. Puedes agregar un perfil manualmente.');
    } finally {
      setIsGeneratingE1(false);
    }
  };

  const handleAddManualPersona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonaName.trim()) return;
    const persona: BuyerPersona = {
      id: `bp-${Date.now()}`,
      name: newPersonaName.trim(),
      ageRange: newPersonaAge.trim() || '25-45 años',
      gender: newPersonaGender.trim() || 'Todos',
      specificZone: newPersonaZone.trim() || affiliate.city,
      fears: newPersonaFear ? newPersonaFear.split(',').map(s => s.trim()) : ['Falta de confianza'],
      desires: newPersonaDesire ? newPersonaDesire.split(',').map(s => s.trim()) : ['Servicio de calidad'],
      buyingTriggers: newPersonaTrigger ? newPersonaTrigger.split(',').map(s => s.trim()) : ['Cita inmediata'],
      summaryHook: newPersonaHook.trim() || `Soluciones en ${affiliate.businessName}`,
    };
    const merged = [...personas, persona];
    const updated: Affiliate = {
      ...affiliate,
      buyerPersonas: merged,
      etapa1Completed: true,
      updatedAt: new Date().toISOString(),
    };
    await DataService.getInstance().saveAffiliate(updated);
    setPersonas(merged);
    onUpdateAffiliate(updated);
    setNewPersonaName('');
    setNewPersonaFear('');
    setNewPersonaDesire('');
    setNewPersonaTrigger('');
    setNewPersonaHook('');
    showToast('success', '✅ Cliente Ideal guardado. Etapa 2 desbloqueada.');
  };

  // ─── ETAPA 2: GENERATE 3 IMAGES 9:16 PACKAGE ─────────────────────────────
  const handleGenerateImagePackage = async () => {
    if (!guard.canUseEtapa2) return;
    const persona = personas.find(p => p.id === selectedPersonaId) || personas[0];
    if (!persona) {
      showToast('error', 'Selecciona un Cliente Ideal primero.');
      return;
    }
    const service = !isGlobalAd ? affiliate.services.find(s => s.id === selectedServiceId) : undefined;
    const pkgId = `pkg-${Date.now()}`;

    setIsGeneratingE2(true);
    try {
      const res = await fetch(`${N8N_BASE}/marketing-etapa2-imagenes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          packageId: pkgId,
          businessName: affiliate.businessName,
          buyerPersonaId: persona.id,
          buyerPersonaName: persona.name,
          buyerPersona: persona,
          serviceId: service?.id || null,
          serviceName: service?.name || 'Anuncio Global',
          isGlobalAd: isGlobalAd || !service,
        }),
      });
      const data = await res.json();
      const newPkg: ImagePackage916 = {
        id: data?.packageId || pkgId,
        affiliateId: affiliate.id,
        buyerPersonaId: persona.id,
        buyerPersonaName: persona.name,
        serviceId: service?.id,
        serviceName: service?.name || 'Anuncio Global',
        isGlobalAd: isGlobalAd || !service,
        images: {
          publicitaria: data?.images?.publicitaria || affiliate.banner || affiliate.logo,
          educativa: data?.images?.educativa || affiliate.gallery?.[0] || affiliate.banner,
          promocion: data?.images?.promocion || affiliate.gallery?.[1] || affiliate.logo,
        },
        copyTexts: {
          publicitaria: data?.prompts?.copy_publicitaria,
          educativa: data?.prompts?.copy_educativa,
          promocion: data?.prompts?.copy_promocion,
        },
        publicationText: data?.publicationText || `✨ ${affiliate.businessName}: ${service?.name || 'Agenda tu cita hoy en CitasMás'}`,
        status: 'ready',
        createdAt: new Date().toISOString(),
        readyAt: new Date().toISOString(),
        addedToLanding: false,
      };
      await DataService.getInstance().saveImagePackage(affiliate.id, newPkg);
      const updatedPackages = [newPkg, ...packages];
      setPackages(updatedPackages);
      onUpdateAffiliate({ ...affiliate, imagePackages: updatedPackages, etapa2Completed: true });
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      showToast('success', '✅ Paquete de 3 imágenes 9:16 generado y guardado en tus recursos.');
    } catch (err) {
      showToast('error', 'Error al conectar con n8n para generar el paquete de imágenes.');
    } finally {
      setIsGeneratingE2(false);
    }
  };

  // ─── ETAPA 3 & 4: GENERATE MONTHLY VIDEO (SPOT OR CINEMATIC) ──────────────
  const handleGenerateVideo = async (videoType: 'spot' | 'cinematic') => {
    if (guard.hasVideoThisMonth) {
      showToast('error', `Ya usaste tu video del mes (${guard.videoTypeUsed}). Disponible en ${guard.daysUntilNextMonth} días.`);
      return;
    }
    const pkg = readyPackages.find(p => p.id === selectedPackageId) || readyPackages[0];
    if (!pkg) {
      showToast('error', 'Primero genera un paquete de imágenes en la Etapa 2.');
      return;
    }

    if (videoType === 'spot') setIsGeneratingE3(true);
    else setIsGeneratingE4(true);

    const endpoint = videoType === 'spot' ? 'marketing-etapa3-video-spot' : 'marketing-etapa4-cine';
    const refImg = pkg.images.publicitaria || pkg.images.promocion || pkg.images.educativa || '';

    try {
      const res = await fetch(`${N8N_BASE}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          businessName: affiliate.businessName,
          imagePackageId: pkg.id,
          imageUrls: pkg.images,
          referenceImageUrl: refImg,
          serviceName: pkg.serviceName || 'Anuncio Global',
          voiceType,
          promotionText: videoType === 'spot' ? promotionText : cinematicMessage,
        }),
      });
      const data = await res.json();
      const newVideo: MonthlyVideoRecord = {
        id: data?.videoId || `vid-${Date.now()}`,
        affiliateId: affiliate.id,
        month: guard.currentMonth,
        videoType,
        imagePackageId: pkg.id,
        videoUrl: data?.videoUrl || '',
        thumbnailUrl: refImg,
        publicationText: data?.publicationText || pkg.publicationText || `🎬 ${affiliate.businessName} en CitasMás`,
        status: 'ready',
        createdAt: new Date().toISOString(),
        readyAt: new Date().toISOString(),
        addedToLanding: false,
      };
      await DataService.getInstance().saveMonthlyVideo(affiliate.id, newVideo);
      const updatedVideos = [newVideo, ...monthlyVideos];
      setMonthlyVideos(updatedVideos);
      onUpdateAffiliate({ ...affiliate, monthlyVideos: updatedVideos });
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      showToast('success', `🎬 ¡Video ${videoType === 'spot' ? 'Spot' : 'Cinematográfico'} generado y guardado!`);
    } catch (err) {
      showToast('error', 'Error al generar el video en n8n.');
    } finally {
      setIsGeneratingE3(false);
      setIsGeneratingE4(false);
    }
  };

  // ─── ADD TO LANDING ────────────────────────────────────────────────────────
  const handleAddPackageToLanding = async (pkg: ImagePackage916) => {
    const imgs = [pkg.images.publicitaria, pkg.images.educativa, pkg.images.promocion].filter(Boolean) as string[];
    const updatedGallery = Array.from(new Set([...(affiliate.gallery || []), ...imgs]));
    const updatedPackages = packages.map(p => p.id === pkg.id ? { ...p, addedToLanding: true } : p);
    const updatedAff: Affiliate = { ...affiliate, gallery: updatedGallery, imagePackages: updatedPackages };
    await DataService.getInstance().saveAffiliate(updatedAff);
    setPackages(updatedPackages);
    onUpdateAffiliate(updatedAff);
    showToast('success', '✅ Imágenes agregadas a tu página pública.');
  };

  // ─── REQUEST EXPOSURE ──────────────────────────────────────────────────────
  const handleSolicitarExposicion = async (
    assetType: 'image_package' | 'video',
    assetId: string,
    assetUrl: string,
    publicationText: string
  ) => {
    const exposureRequest: ExposureRequest = {
      id: `exp-${Date.now()}`,
      affiliateId: affiliate.id,
      affiliateName: affiliate.businessName,
      affiliatePhone: affiliate.phone,
      assetType,
      assetId,
      assetUrl,
      publicationText: publicationText || `¡Conoce ${affiliate.businessName}! Agenda tu cita en CitasMás.`,
      status: 'pending_review',
      requestedAt: new Date().toISOString(),
    };
    try {
      await DataService.getInstance().createExposureRequest(exposureRequest);
      fetch(`${N8N_BASE}/exposicion-solicitud`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exposureRequest),
      }).catch(() => {});
      setExposureSuccessIds(prev => ({ ...prev, [assetId]: true }));
      showToast('success', '📢 Solicitud de exposición enviada al Administrador General.');
    } catch (err) {
      showToast('error', 'No se pudo enviar la solicitud de exposición.');
    }
  };

  // ─── STAGE METADATA ────────────────────────────────────────────────────────
  const stages = [
    {
      id: 'etapa1' as const,
      num: 1,
      title: 'Cliente Ideal + Servicios',
      subtitle: 'Base obligatoria de tu marketing',
      desc: 'Define tus Buyer Personas y selecciona los productos/servicios o Anuncio Global.',
      icon: <Users className="w-6 h-6 text-white" />,
      gradient: 'from-blue-600 to-cyan-500',
      unlocked: guard.canUseEtapa1,
      completed: personas.length > 0,
      lockReason: 'Requiere Plan Mensual',
    },
    {
      id: 'etapa2' as const,
      num: 2,
      title: 'Paquete de 3 Imágenes 9:16',
      subtitle: 'Publicitaria • Educativa • Promoción',
      desc: 'Elige 1 Cliente Ideal + 1 Servicio (o Anuncio Global) y genera 3 piezas verticales.',
      icon: <ImageIcon className="w-6 h-6 text-white" />,
      gradient: 'from-purple-600 to-pink-500',
      unlocked: guard.canUseEtapa2,
      completed: readyPackages.length > 0,
      lockReason: 'Completa primero la Etapa 1 (crea al menos 1 Cliente Ideal)',
    },
    {
      id: 'etapa3' as const,
      num: 3,
      title: 'Video Spot (Audio Español)',
      subtitle: 'Usa tus imágenes 9:16 como referencia',
      desc: 'Spot con narración en español, música y enfoque en tu promoción. (1 video/mes: Etapa 3 ó 4)',
      icon: <Video className="w-6 h-6 text-white" />,
      gradient: 'from-orange-500 to-amber-500',
      unlocked: guard.canUseEtapa3 && !guard.hasVideoThisMonth,
      completed: monthlyVideos.some(v => v.videoType === 'spot' && v.month === guard.currentMonth),
      lockReason: !guard.canUseEtapa3
        ? 'Completa primero la Etapa 2 (genera un paquete de imágenes)'
        : `Ya usaste tu video del mes (${guard.videoTypeUsed}). Disponible en ${guard.daysUntilNextMonth} días.`,
    },
    {
      id: 'etapa4' as const,
      num: 4,
      title: 'Video Cinematográfico',
      subtitle: 'Producción de alta calidad',
      desc: 'Video cinematográfico de alto impacto con tus imágenes. (1 video/mes: Etapa 3 ó 4)',
      icon: <Film className="w-6 h-6 text-white" />,
      gradient: 'from-rose-600 to-red-500',
      unlocked: guard.canUseEtapa4 && !guard.hasVideoThisMonth,
      completed: monthlyVideos.some(v => v.videoType === 'cinematic' && v.month === guard.currentMonth),
      lockReason: !guard.canUseEtapa4
        ? 'Completa primero la Etapa 2 (genera un paquete de imágenes)'
        : `Ya usaste tu video del mes (${guard.videoTypeUsed}). Disponible en ${guard.daysUntilNextMonth} días.`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900">Marketing con IA por Etapas</h2>
            <p className="text-xs text-gray-500">
              Flujo secuencial obligatorio • Plan actual:{' '}
              <span className="font-bold uppercase text-indigo-600">
                {guard.isPaid ? 'Plan Mensual ($1,200/mes)' : 'Plan Gratuito'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('stages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stages' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            4 Etapas
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'resources' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mis Recursos ({readyPackages.length + monthlyVideos.length})
          </button>
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" /> Mi Página
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Free Plan Lock Banner */}
      {!guard.isPaid && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Las herramientas de Marketing están disponibles en el Plan Mensual ($1,200 MXN/mes)</h3>
              <p className="text-xs text-gray-600">
                En el Plan Gratuito solo recibes notificaciones de citas por Gmail. Actualiza para desbloquear IA, paquetes 9:16, videos y exposición.
              </p>
            </div>
          </div>
          {onUpgradePlan && (
            <button
              onClick={onUpgradePlan}
              className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
            >
              Actualizar Plan
            </button>
          )}
        </div>
      )}

      {/* Status Toast */}
      {statusBanner && (
        <div className={`rounded-xl p-4 flex items-center gap-3 text-sm font-medium ${
          statusBanner.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {statusBanner.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span>{statusBanner.msg}</span>
        </div>
      )}

      {activeTab === 'stages' && (
        <>
          {/* Monthly Video Rule Banner */}
          {guard.isPaid && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>
                  <strong>Regla Mensual de Video ({guard.currentMonth}):</strong> Puedes generar <strong>1 video al mes</strong> (elige Etapa 3 Video Spot ó Etapa 4 Cinematográfico).
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                guard.hasVideoThisMonth ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {guard.hasVideoThisMonth
                  ? `Usado: ${guard.videoTypeUsed === 'spot' ? 'Spot' : 'Cinematográfico'} (próximo en ${guard.daysUntilNextMonth}d)`
                  : '1 Video disponible este mes'}
              </span>
            </div>
          )}

          {/* 4 Stage Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stages.map(stage => {
              const isOpen = activeEtapa === stage.id;
              return (
                <div
                  key={stage.id}
                  className={`rounded-2xl border p-5 transition-all bg-white ${
                    !stage.unlocked
                      ? 'border-gray-200 opacity-60'
                      : isOpen
                      ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md'
                      : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center shadow-sm`}>
                        {stage.unlocked ? stage.icon : <Lock className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Etapa {stage.num}
                          </span>
                          {stage.completed && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" /> Completada
                            </span>
                          )}
                          {!stage.unlocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                              <Lock className="w-3 h-3" /> Bloqueada
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base">{stage.title}</h3>
                        <p className="text-xs text-gray-500">{stage.subtitle}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-4">{stage.desc}</p>

                  {!stage.unlocked ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{stage.lockReason}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveEtapa(isOpen ? null : stage.id)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      {isOpen ? 'Cerrar Etapa' : `Abrir Etapa ${stage.num}`}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ─── ACTIVE ETAPA WORKSPACE ────────────────────────────────────── */}
          {activeEtapa === 'etapa1' && guard.canUseEtapa1 && (
            <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Etapa 1: Clientes Ideales + Productos/Servicios</h3>
                  <p className="text-xs text-gray-500">Genera buyer personas automáticamente con DeepSeek o agrégalos manualmente.</p>
                </div>
                <button
                  onClick={handleGeneratePersonasAI}
                  disabled={isGeneratingE1}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
                >
                  {isGeneratingE1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGeneratingE1 ? 'Generando...' : 'Generar 3 Clientes Ideales con IA'}
                </button>
              </div>

              {/* Existing Personas */}
              {personas.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {personas.map(p => (
                    <div key={p.id} className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-1.5">
                      <h4 className="font-bold text-sm text-gray-900">{p.name}</h4>
                      <p className="text-xs text-gray-600">{p.ageRange} • {p.gender} • {p.specificZone}</p>
                      <p className="text-xs italic text-blue-700">"{p.summaryHook}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Persona Form */}
              <form onSubmit={handleAddManualPersona} className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
                <h4 className="text-xs font-bold uppercase text-gray-600">Agregar Cliente Ideal Manualmente</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    value={newPersonaName}
                    onChange={e => setNewPersonaName(e.target.value)}
                    placeholder="Nombre del perfil (ej. Mamá activa)"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                    required
                  />
                  <input
                    value={newPersonaAge}
                    onChange={e => setNewPersonaAge(e.target.value)}
                    placeholder="Edad (ej. 30-45)"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                  />
                  <input
                    value={newPersonaGender}
                    onChange={e => setNewPersonaGender(e.target.value)}
                    placeholder="Género"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                  />
                  <input
                    value={newPersonaZone}
                    onChange={e => setNewPersonaZone(e.target.value)}
                    placeholder="Zona / Ciudad"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    value={newPersonaFear}
                    onChange={e => setNewPersonaFear(e.target.value)}
                    placeholder="Miedos (separados por coma)"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                  />
                  <input
                    value={newPersonaDesire}
                    onChange={e => setNewPersonaDesire(e.target.value)}
                    placeholder="Deseos (separados por coma)"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                  />
                  <input
                    value={newPersonaHook}
                    onChange={e => setNewPersonaHook(e.target.value)}
                    placeholder="Gancho publicitario (1 línea)"
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                  />
                </div>
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Guardar Cliente Ideal
                </button>
              </form>
            </div>
          )}

          {activeEtapa === 'etapa2' && guard.canUseEtapa2 && (
            <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Etapa 2: Paquete de 3 Imágenes 9:16</h3>
                <p className="text-xs text-gray-500">Genera automáticamente: 1) Publicitaria, 2) Educativa, 3) Promoción.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">1. Selecciona Cliente Ideal</label>
                  <select
                    value={selectedPersonaId}
                    onChange={e => setSelectedPersonaId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.ageRange})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">2. Producto o Servicio</label>
                  <select
                    value={selectedServiceId}
                    onChange={e => setSelectedServiceId(e.target.value)}
                    disabled={isGlobalAd}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white disabled:opacity-50"
                  >
                    {affiliate.services.map(s => (
                      <option key={s.id} value={s.id}>{s.name} — ${s.price} MXN</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2.5 w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGlobalAd}
                      onChange={e => setIsGlobalAd(e.target.checked)}
                      className="rounded"
                    />
                    Crear Anuncio Global (todo el negocio)
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerateImagePackage}
                disabled={isGeneratingE2}
                className="px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {isGeneratingE2 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                {isGeneratingE2 ? 'Generando 3 imágenes 9:16...' : 'Generar Paquete de 3 Imágenes 9:16'}
              </button>
            </div>
          )}

          {activeEtapa === 'etapa3' && guard.canUseEtapa3 && !guard.hasVideoThisMonth && (
            <div className="bg-white rounded-2xl border border-orange-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Etapa 3: Video Spot con Audio en Español</h3>
                <p className="text-xs text-gray-500">Usa tus 3 imágenes de la Etapa 2 como referencia, incluye locución y música.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Paquete de Imágenes Base</label>
                  <select
                    value={selectedPackageId}
                    onChange={e => setSelectedPackageId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    {readyPackages.map(p => (
                      <option key={p.id} value={p.id}>{p.serviceName || 'Anuncio Global'} — {p.buyerPersonaName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tipo de Voz (Español)</label>
                  <select
                    value={voiceType}
                    onChange={e => setVoiceType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                  >
                    {VOICE_TYPES.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Detalles de la Promoción y Producto</label>
                <textarea
                  value={promotionText}
                  onChange={e => setPromotionText(e.target.value)}
                  rows={3}
                  placeholder="Ej. 20% de descuento en tu primera sesión esta semana..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <button
                onClick={() => handleGenerateVideo('spot')}
                disabled={isGeneratingE3}
                className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {isGeneratingE3 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                {isGeneratingE3 ? 'Produciendo Video Spot...' : 'Generar Video Spot (Usa tu video mensual)'}
              </button>
            </div>
          )}

          {activeEtapa === 'etapa4' && guard.canUseEtapa4 && !guard.hasVideoThisMonth && (
            <div className="bg-white rounded-2xl border border-rose-200 p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Etapa 4: Video Cinematográfico</h3>
                <p className="text-xs text-gray-500">Producción cinematográfica de alto impacto basada en tu paquete de Etapa 2.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Paquete de Imágenes Base</label>
                <select
                  value={selectedPackageId}
                  onChange={e => setSelectedPackageId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                >
                  {readyPackages.map(p => (
                    <option key={p.id} value={p.id}>{p.serviceName || 'Anuncio Global'} — {p.buyerPersonaName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mensaje Principal (Opcional)</label>
                <textarea
                  value={cinematicMessage}
                  onChange={e => setCinematicMessage(e.target.value)}
                  rows={2}
                  placeholder="Ej. Recupera tu bienestar con atención profesional..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <button
                onClick={() => handleGenerateVideo('cinematic')}
                disabled={isGeneratingE4}
                className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60"
              >
                {isGeneratingE4 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
                {isGeneratingE4 ? 'Produciendo Video Cinematográfico...' : 'Generar Video Cinematográfico (Usa tu video mensual)'}
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── MIS RECURSOS SECTION ──────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-gray-900">📁 Mis Recursos Generados</h3>

        {readyPackages.length === 0 && monthlyVideos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Aún no has generado paquetes de imágenes o videos. Completa la Etapa 1 para comenzar.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Image Packages */}
            {packages.map(pkg => {
              const currentImgKey = packageActiveImageTab[pkg.id] || 'publicitaria';
              const currentImgUrl = pkg.images[currentImgKey] || pkg.images.publicitaria || '';
              return (
                <div key={pkg.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                  <div className="bg-gray-900 aspect-[9/12] max-h-72 relative flex items-center justify-center">
                    {currentImgUrl ? (
                      <img src={currentImgUrl} alt={currentImgKey} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-white/30" />
                    )}
                    <div className="absolute top-2 left-2 flex gap-1">
                      {(['publicitaria', 'educativa', 'promocion'] as const).map(k => (
                        <button
                          key={k}
                          onClick={() => setPackageActiveImageTab(prev => ({ ...prev, [pkg.id]: k }))}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            currentImgKey === k ? 'bg-white text-gray-900' : 'bg-black/60 text-white'
                          }`}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    <h4 className="font-bold text-sm text-gray-900">{pkg.serviceName || 'Anuncio Global'}</h4>
                    <p className="text-xs text-gray-500">Público: {pkg.buyerPersonaName}</p>
                    {pkg.publicationText && (
                      <p className="text-xs text-gray-600 italic line-clamp-2">"{pkg.publicationText}"</p>
                    )}
                    <div className="mt-auto pt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAddPackageToLanding(pkg)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold ${
                          pkg.addedToLanding ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-900 text-white'
                        }`}
                      >
                        {pkg.addedToLanding ? '✅ En mi página' : '+ Agregar a página'}
                      </button>
                      {currentImgUrl && (
                        <a
                          href={currentImgUrl}
                          download={`citasmas-${pkg.id}-${currentImgKey}.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleSolicitarExposicion('image_package', pkg.id, currentImgUrl, pkg.publicationText || '')}
                        disabled={exposureSuccessIds[pkg.id]}
                        className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        {exposureSuccessIds[pkg.id] ? '✅ Exposición Solicitada' : 'Solicitar Exposición en CitasMás'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Monthly Videos */}
            {monthlyVideos.map(vid => (
              <div key={vid.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                <div className="bg-gray-900 aspect-[9/12] max-h-72 relative flex items-center justify-center">
                  {vid.videoUrl ? (
                    <video src={vid.videoUrl} poster={vid.thumbnailUrl} controls className="w-full h-full object-cover" />
                  ) : (
                    <Film className="w-10 h-10 text-white/30" />
                  )}
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                    {vid.videoType === 'spot' ? 'Video Spot' : 'Cinematográfico'} • {vid.month}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <h4 className="font-bold text-sm text-gray-900">
                    {vid.videoType === 'spot' ? 'Video Spot Audio ES' : 'Video Cinematográfico'}
                  </h4>
                  {vid.publicationText && (
                    <p className="text-xs text-gray-600 italic line-clamp-2">"{vid.publicationText}"</p>
                  )}
                  <div className="mt-auto pt-2 flex flex-wrap gap-2">
                    {vid.videoUrl && (
                      <a
                        href={vid.videoUrl}
                        download={`citasmas-video-${vid.id}.mp4`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar Video
                      </a>
                    )}
                    <button
                      onClick={() => handleSolicitarExposicion('video', vid.id, vid.videoUrl || vid.thumbnailUrl || '', vid.publicationText || '')}
                      disabled={exposureSuccessIds[vid.id]}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      {exposureSuccessIds[vid.id] ? '✅ Exposición Solicitada' : 'Solicitar Exposición en CitasMás'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
