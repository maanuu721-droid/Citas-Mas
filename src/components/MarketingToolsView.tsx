import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Users, Image as ImageIcon, Video, Film,
  MessageSquare, ArrowLeft, Zap, Download, Globe,
  CheckCircle2, Clock, RefreshCw, Plus, Play,
  Star, Upload, X, AlertCircle, ChevronRight
} from 'lucide-react';
import { Affiliate, MarketingAsset, MarketingLevelType, KieAiModel } from '../types';
import { DataService } from '../services/dataService';
import confetti from 'canvas-confetti';

// ─────────────────────────────────────────
// N8N WEBHOOK — sends requests to n8n which
// calls DeepSeek + Kie.ai and returns to Firestore
// ─────────────────────────────────────────
const N8N_WEBHOOK_URL = 'https://n8n.bahiago.tech/webhook/marketing-citas-mas';

interface Props {
  affiliate: Affiliate;
  onUpdateAffiliate: (updated: Affiliate) => void;
  onClose?: () => void;
}

// ─── LEVEL DEFINITIONS ─────────────────────────────────────────────────────
interface LevelDefinition {
  level: MarketingLevelType;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  kieModel?: KieAiModel;
  isFree: boolean;
  hasReferencePhoto: boolean;
}

const MARKETING_LEVELS: LevelDefinition[] = [
  {
    level: 1,
    title: 'Público Objetivo',
    subtitle: 'Clientes Potenciales de tu Zona',
    description: 'La IA analiza tu negocio, servicios y ubicación para identificar y entregarte los 3 perfiles de clientes ideales en tu zona. Incluido en todos los planes.',
    badge: 'Incluido',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    icon: <Users className="w-7 h-7" />,
    gradient: 'from-blue-500 to-cyan-400',
    borderColor: 'border-blue-200',
    isFree: true,
    hasReferencePhoto: false,
  },
  {
    level: 2,
    title: 'Flyer Publicitario de Marca',
    subtitle: 'Imagen tipo flyer con identidad visual',
    description: 'DeepSeek analiza tu negocio y redacta el copy perfecto. Kie.ai genera con Grok Image 2 un flyer profesional con la identidad de tu marca. Puedes usar fotos de referencia de tu negocio.',
    badge: 'IA Visual',
    badgeColor: 'bg-purple-100 text-purple-700',
    icon: <ImageIcon className="w-7 h-7" />,
    gradient: 'from-purple-500 to-pink-400',
    borderColor: 'border-purple-200',
    kieModel: 'grok-image-2',
    isFree: true,
    hasReferencePhoto: true,
  },
  {
    level: 3,
    title: 'Spot de Audio y Video Animado',
    subtitle: 'Video con locución IA y música',
    description: 'Usa el flyer del Nivel 2 como base. DeepSeek escribe el guión del spot (".Agenda en CitasMás"). Kie.ai anima la imagen con Grok Video 1.5 y agrega locución de IA y música masterizada.',
    badge: 'Video Animado',
    badgeColor: 'bg-orange-100 text-orange-700',
    icon: <Video className="w-7 h-7" />,
    gradient: 'from-orange-500 to-amber-400',
    borderColor: 'border-orange-200',
    kieModel: 'grok-video-1.5',
    isFree: true,
    hasReferencePhoto: true,
  },
  {
    level: 4,
    title: 'Video Cinematográfico — 1 Minuto',
    subtitle: 'Producción cinemática de alto impacto',
    description: 'Video cinematográfico de 1 minuto con estructura de alta conversión: Detección del dolor (0-15s) → Tu solución (15-35s) → Cómo funciona CitasMás (35-50s) → Llamado a la acción (50-60s). Incluye 1 video GRATIS cada 2 meses.',
    badge: '1 GRATIS c/2 meses',
    badgeColor: 'bg-rose-100 text-rose-700',
    icon: <Film className="w-7 h-7" />,
    gradient: 'from-rose-600 to-pink-500',
    borderColor: 'border-rose-200',
    kieModel: 'grok-image-to-video',
    isFree: true,
    hasReferencePhoto: true,
  },
  {
    level: 5,
    title: 'Agente Personal Post-Cita',
    subtitle: 'Seguimiento por WhatsApp con IA',
    description: 'Un agente especializado de DeepSeek da seguimiento post-cita a tus clientes por WhatsApp. Envía recordatorios automáticos, reagendamientos y mensajes personalizados según las instrucciones que le des.',
    badge: 'WhatsApp IA',
    badgeColor: 'bg-green-100 text-green-700',
    icon: <MessageSquare className="w-7 h-7" />,
    gradient: 'from-green-500 to-emerald-400',
    borderColor: 'border-green-200',
    isFree: true,
    hasReferencePhoto: false,
  },
];

const VOICE_TYPES = [
  { value: 'female_warm', label: '🎙️ Femenina — Cálida y Empática' },
  { value: 'male_professional', label: '🎙️ Masculina — Profesional y Directa' },
  { value: 'cinematic_narrator', label: '🎙️ Narrador Cinematográfico — Grave y Profundo' },
];

export const DISRUPTIVE_LEVELS = [
  {
    value: 'conservative',
    label: '🛡️ Profesional & Seguro',
    badge: 'Apego COFEPRIS / PROFECO',
    description: 'Tono sobrio, médico o corporativo de máxima credibilidad y rigor legal. Sin promesas milagrosas, con total transparencia en precios MXN.'
  },
  {
    value: 'persuasive',
    label: '🎯 Persuasivo Comercial (Venta Directa)',
    badge: 'Alta Conversión',
    description: 'Voz estilo vendedor influyente, activa dolores del cliente, urgencia de agenda y propuesta de valor contundente.'
  },
  {
    value: 'disruptive_viral',
    label: '🔥 Disruptivo Viral Extremo (TikTok / Reels)',
    badge: 'Retención y Viralidad',
    description: 'Gancho agresivo de dolor en 0-3s, ruptura de patrón visual, ritmo acelerado y solución contundente para máxima exposición.'
  },
];

// ─── ASSET STATUS BADGE ─────────────────────────────────────────────────────
const AssetStatusBadge: React.FC<{ status: MarketingAsset['status'] }> = ({ status }) => {
  if (status === 'processing') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
      <RefreshCw className="w-3 h-3 animate-spin" /> Generando...
    </span>
  );
  if (status === 'ready') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
      <CheckCircle2 className="w-3 h-3" /> Listo
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">
      <AlertCircle className="w-3 h-3" /> Error
    </span>
  );
};

// ─── ASSET CARD ─────────────────────────────────────────────────────────────
const AssetCard: React.FC<{
  asset: MarketingAsset;
  affiliate: Affiliate;
  onAddToPage: (asset: MarketingAsset) => void;
  onTogglingId: string | null;
}> = ({ asset, affiliate, onAddToPage, onTogglingId }) => {
  const levelDef = MARKETING_LEVELS.find(l => l.level === asset.level);
  const isToggling = onTogglingId === asset.id;

  const isVideo = asset.assetType === 'cinematic_video' || asset.assetType === 'animated_video';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Media Preview */}
      <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
        {asset.status === 'processing' ? (
          <div className="flex flex-col items-center gap-3 text-white/60">
            <RefreshCw className="w-10 h-10 animate-spin text-white/40" />
            <p className="text-sm font-medium">Generando con IA...</p>
            <p className="text-xs text-white/40">Esto puede tomar 1-3 minutos</p>
          </div>
        ) : asset.status === 'error' ? (
          <div className="flex flex-col items-center gap-2 text-red-400 p-4 text-center">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{asset.errorMessage || 'Error al generar'}</p>
          </div>
        ) : asset.mediaUrl ? (
          isVideo ? (
            <video
              src={asset.mediaUrl}
              poster={asset.thumbnailUrl}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={asset.mediaUrl}
              alt={asset.title}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="flex items-center justify-center w-full h-full text-white/30">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}

        {/* Level badge */}
        {levelDef && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-xs font-bold bg-gradient-to-r ${levelDef.gradient}`}>
            Nivel {asset.level}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <AssetStatusBadge status={asset.status} />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h4 className="font-bold text-gray-900 text-sm mb-1">{asset.title}</h4>
        {asset.serviceName && (
          <p className="text-xs text-gray-500 mb-2">Servicio: {asset.serviceName}</p>
        )}
        {asset.copyText && (
          <p className="text-xs text-gray-600 italic line-clamp-2 mb-3">"{asset.copyText}"</p>
        )}
        <p className="text-[11px] text-gray-400 mb-3">{new Date(asset.createdAt).toLocaleDateString('es-MX')}</p>

        {/* Action Buttons */}
        {asset.status === 'ready' && (
          <div className="flex gap-2">
            <button
              onClick={() => onAddToPage(asset)}
              disabled={isToggling}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                asset.addedToLanding
                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                  : 'bg-gray-900 text-white hover:bg-black'
              } disabled:opacity-60`}
            >
              {isToggling ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : asset.addedToLanding ? (
                <><CheckCircle2 className="w-3 h-3" /> En mi página</>
              ) : (
                <><Plus className="w-3 h-3" /> Agregar a mi página</>
              )}
            </button>

            {asset.mediaUrl && (
              <a
                href={asset.mediaUrl}
                download={`citasmas-nivel${asset.level}-${asset.id}.${isVideo ? 'mp4' : 'png'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-3 h-3" /> Descargar
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export const MarketingToolsView: React.FC<Props> = ({
  affiliate,
  onUpdateAffiliate,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'my_assets'>('catalog');
  const [selectedLevel, setSelectedLevel] = useState<LevelDefinition | null>(null);
  const [assets, setAssets] = useState<MarketingAsset[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState('');
  const [togglingAssetId, setTogglingAssetId] = useState<string | null>(null);

  // Form fields per level
  const [selectedServiceId, setSelectedServiceId] = useState(affiliate.services?.[0]?.id || '');
  const [voiceType, setVoiceType] = useState('female_warm');
  const [disruptiveLevel, setDisruptiveLevel] = useState<'conservative' | 'persuasive' | 'disruptive_viral'>('persuasive');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedReferencePhotos, setSelectedReferencePhotos] = useState<string[]>([]);

  // Real-time subscription to marketing assets
  useEffect(() => {
    setIsLoadingAssets(true);
    const unsub = DataService.getInstance().subscribeToMarketingAssets(
      affiliate.id,
      (updatedAssets) => {
        setAssets(updatedAssets);
        setIsLoadingAssets(false);
      }
    );
    return () => unsub();
  }, [affiliate.id]);

  const getSelectedService = () =>
    affiliate.services?.find(s => s.id === selectedServiceId) || affiliate.services?.[0];

  // Toggle reference photo selection from gallery
  const toggleReferencePhoto = (url: string) => {
    setSelectedReferencePhotos(prev =>
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url].slice(0, 3)
    );
  };

  // Dispatch to n8n
  const handleDispatch = async () => {
    if (!selectedLevel) return;
    setIsDispatching(true);
    setDispatchStatus('Conectando con los servidores de IA...');

    const service = getSelectedService();
    const pendingAssetId = `mkt-${affiliate.id}-lvl${selectedLevel.level}-${Date.now()}`;

    // Create a "processing" placeholder in Firestore immediately so the UI shows it
    const placeholderAsset: MarketingAsset = {
      id: pendingAssetId,
      affiliateId: affiliate.id,
      level: selectedLevel.level,
      assetType: selectedLevel.level === 1 ? 'buyer_personas'
        : selectedLevel.level === 2 ? (selectedReferencePhotos.length > 0 ? 'flyer_with_reference' : 'flyer_image')
        : selectedLevel.level === 3 ? 'animated_video'
        : selectedLevel.level === 4 ? 'cinematic_video'
        : 'whatsapp_agent',
      kieModel: selectedLevel.kieModel,
      title: `${selectedLevel.title} — ${service?.name || affiliate.businessName}`,
      serviceName: service?.name,
      serviceId: service?.id,
      voiceType,
      referencePhotoUrls: selectedReferencePhotos,
      status: 'processing',
      addedToLanding: false,
      includedMonthly: selectedLevel.level === 4,
      createdAt: new Date().toISOString(),
    };

    try {
      await DataService.getInstance().saveMarketingAsset(placeholderAsset);
    } catch (_) {
      // non-fatal
    }

    // Build n8n payload
    const payload = {
      toolType: `level_${selectedLevel.level}`,
      level: selectedLevel.level,
      assetId: pendingAssetId,
      affiliateId: affiliate.id,
      businessName: affiliate.businessName || affiliate.name,
      contactPhone: affiliate.phone,
      contactEmail: affiliate.email,
      categoryLabel: affiliate.categoryLabel,
      city: affiliate.city,
      state: affiliate.state,
      country: affiliate.country,
      logo: affiliate.logo,
      gallery: affiliate.gallery,
      description: affiliate.description,
      services: affiliate.services,
      buyerPersonas: affiliate.buyerPersonas,
      selectedService: service,
      voiceType,
      disruptiveLevel,
      disruptiveLabel: DISRUPTIVE_LEVELS.find(d => d.value === disruptiveLevel)?.label || 'Persuasivo Comercial',
      affiliateBookingUrl: `https://citasmas.com?affiliate=${affiliate.id}`,
      customInstructions,
      referencePhotoUrls: selectedReferencePhotos,
      kieModel: selectedLevel.kieModel || 'grok-image-2',
      // Kie.ai model instructions per level
      kieModelInstructions: {
        level2: 'Use Grok Image 2 (grok-image-2) for text-to-image flyer generation. If reference photos provided, use Grok Image-to-Image (grok-image-to-image) with them as style references.',
        level3: 'Use Grok Video 1.5 (grok-video-1.5) for Image-to-Video animation. Animate the level-2 flyer into a 15-30 second spot with AI voiceover.',
        level4: 'Use Grok Image-to-Video (grok-image-to-video) with reference photos if available. Generate a 1-minute cinematic video: 0-15s problem detection, 15-35s solution presentation, 35-50s CitasMás demo, 50-60s call to action.',
      },
      timestamp: new Date().toISOString(),
    };

    try {
      setDispatchStatus('Enviando solicitud a los agentes de IA...');
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setDispatchStatus('');
        setSelectedLevel(null);
        setCustomInstructions('');
        setSelectedReferencePhotos([]);
        setActiveTab('my_assets');
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      } else {
        const errText = await response.text().catch(() => '');
        setDispatchStatus(`Error: ${errText || 'No se pudo conectar con el servidor de IA.'}`);
        // Update placeholder to error
        await DataService.getInstance().saveMarketingAsset({
          ...placeholderAsset,
          status: 'error',
          errorMessage: errText || 'Falló la solicitud al webhook de n8n.',
        });
      }
    } catch (err: any) {
      setDispatchStatus(`Error de conexión: ${err.message}`);
      await DataService.getInstance().saveMarketingAsset({
        ...placeholderAsset,
        status: 'error',
        errorMessage: err.message,
      });
    } finally {
      setIsDispatching(false);
    }
  };

  // Add/remove from affiliate landing page
  const handleToggleOnLanding = async (asset: MarketingAsset) => {
    setTogglingAssetId(asset.id);
    try {
      const updatedAffiliate = await DataService.getInstance().toggleAssetOnLanding(asset, affiliate);
      onUpdateAffiliate(updatedAffiliate);
      // Optimistically update local asset list
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, addedToLanding: !a.addedToLanding } : a));
    } catch (err) {
      console.error('Error toggling asset on landing:', err);
    } finally {
      setTogglingAssetId(null);
    }
  };

  // Count free cinematic videos used this period (every 2 months)
  const now = new Date();
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate()).toISOString();
  const recentCinematicCount = assets.filter(
    a => a.level === 4 && a.includedMonthly && a.createdAt >= twoMonthsAgo
  ).length;
  const hasFreeVideoAvailable = recentCinematicCount === 0;

  // ─── LEVEL DETAIL VIEW ────────────────────────────────────────────────────
  const renderLevelDetail = () => {
    if (!selectedLevel) return null;
    const def = selectedLevel;
    const isLevel4 = def.level === 4;

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <button
          onClick={() => { setSelectedLevel(null); setDispatchStatus(''); }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al catálogo
        </button>

        {/* Header */}
        <div className={`p-6 rounded-2xl bg-gradient-to-br ${def.gradient} text-white`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/20 rounded-xl">{def.icon}</div>
            <div>
              <p className="text-white/70 text-sm font-medium">Nivel {def.level}</p>
              <h2 className="text-xl font-black">{def.title}</h2>
            </div>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">{def.description}</p>
          {isLevel4 && (
            <div className="mt-3 bg-white/20 rounded-xl p-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-300" />
              <p className="text-sm font-bold">
                {hasFreeVideoAvailable
                  ? '✨ Tienes 1 video cinematográfico GRATIS disponible este período (cada 2 meses).'
                  : '⏳ Usaste tu video gratis este período. El siguiente será en menos de 2 meses.'}
              </p>
            </div>
          )}
        </div>

        {/* Config form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h3 className="font-bold text-gray-800">Configuración de tu Campaña</h3>

          {/* Service selector */}
          {affiliate.services && affiliate.services.length > 0 && def.level !== 1 && def.level !== 5 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿Para qué servicio deseas la campaña?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {affiliate.services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedServiceId(svc.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      selectedServiceId === svc.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">{svc.name}</p>
                    <p className="text-xs text-gray-500">${svc.price.toLocaleString()} MXN · {svc.duration} min</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nivel de Disruptividad (Level 2, 3, 4) */}
          {(def.level === 2 || def.level === 3 || def.level === 4) && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Nivel de Persuasión y Disruptividad
                </label>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  COFEPRIS & PROFECO Compliance
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">
                Define el tono comercial y el gancho inicial del video o anuncio publicitario.
              </p>
              <div className="space-y-2">
                {DISRUPTIVE_LEVELS.map((lvl) => (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setDisruptiveLevel(lvl.value as any)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      disruptiveLevel === lvl.value
                        ? 'border-purple-600 bg-purple-50/70 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-900">{lvl.label}</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        {lvl.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug">{lvl.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Voice type (Level 3 & 4) */}
          {(def.level === 3 || def.level === 4) && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Voz IA para la Locución (Estilo Vendedor)
              </label>
              <div className="space-y-2">
                {VOICE_TYPES.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setVoiceType(v.value)}
                    className={`w-full p-3 rounded-xl border-2 text-left text-sm transition-all ${
                      voiceType === v.value
                        ? 'border-gray-900 bg-gray-50 font-bold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reference photos (Level 2, 3, 4) */}
          {def.hasReferencePhoto && affiliate.gallery && affiliate.gallery.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Fotos de Referencia (opcional) — hasta 3
              </label>
              <p className="text-xs text-gray-500 mb-2">
                {def.level === 2 && 'Se usarán con Grok Image-to-Image para adaptar el flyer a tu estilo real.'}
                {def.level === 3 && 'Se usarán con Grok Video 1.5 para animar con fotos de tu negocio.'}
                {def.level === 4 && 'Se usarán con Grok Image-to-Video para el video cinemático.'}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {affiliate.gallery.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => toggleReferencePhoto(url)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-3 transition-all ${
                      selectedReferencePhotos.includes(url) ? 'ring-2 ring-gray-900 ring-offset-1' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {selectedReferencePhotos.includes(url) && (
                      <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {selectedReferencePhotos.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{selectedReferencePhotos.length} foto(s) seleccionada(s)</p>
              )}
            </div>
          )}

          {/* Custom instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instrucciones Personalizadas para la IA (Opcional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
              placeholder={
                def.level === 4
                  ? 'Ej: El video debe tener un tono cálido y empático. Resalta nuestra especialidad en...'
                  : def.level === 5
                  ? 'Ej: Quiero que mi agente recuerde a los clientes reagendar si no vienen y les ofrezca un 10% de descuento...'
                  : 'Ej: Resalta nuestra promoción de verano, que el diseño sea en colores azul y blanco...'
              }
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          {/* Kie.ai model info */}
          {def.kieModel && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800">
              <p className="font-bold mb-1">Modelo IA que se usará:</p>
              {def.level === 2 && !selectedReferencePhotos.length && <p><strong>Grok Image 2</strong> — Texto a Imagen de alta fidelidad</p>}
              {def.level === 2 && selectedReferencePhotos.length > 0 && <p><strong>Grok Image-to-Image</strong> — Genera imagen usando tus fotos como referencia visual</p>}
              {def.level === 3 && <p><strong>Grok Video 1.5</strong> — Anima el flyer en video con locución IA</p>}
              {def.level === 4 && <p><strong>Grok Image-to-Video</strong> — Genera el video cinemático de 1 minuto</p>}
            </div>
          )}

          {/* Dispatch button */}
          <button
            onClick={handleDispatch}
            disabled={isDispatching}
            className={`w-full py-4 rounded-xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all ${
              isDispatching
                ? 'bg-gray-400 cursor-not-allowed'
                : `bg-gradient-to-r ${def.gradient} hover:shadow-lg hover:scale-[1.01]`
            }`}
          >
            {isDispatching ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /> Procesando con IA...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Generar Nivel {def.level} — {def.title}</>
            )}
          </button>

          {dispatchStatus && (
            <div className={`p-4 rounded-xl text-sm ${
              dispatchStatus.includes('Error')
                ? 'bg-red-50 text-red-700 border border-red-100'
                : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              {dispatchStatus}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── MAIN RENDER ──────────────────────────────────────────────────────────
  return (
    <div className="h-full bg-gray-50/50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Herramientas de Marketing Inteligente
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            5 niveles de IA para hacer crecer tu negocio — Powered by DeepSeek + Kie.ai (Grok Image 2)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => { setActiveTab('catalog'); setSelectedLevel(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'catalog' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Catálogo
            </button>
            <button
              onClick={() => { setActiveTab('my_assets'); setSelectedLevel(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'my_assets' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Mis Materiales
              {assets.length > 0 && (
                <span className="bg-gray-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{assets.length}</span>
              )}
            </button>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">

        {/* ── CATALOG TAB ── */}
        {activeTab === 'catalog' && !selectedLevel && (
          <div className="space-y-4">
            {/* Cinematic video free banner */}
            {hasFreeVideoAvailable && (
              <div className="bg-gradient-to-r from-rose-600 to-pink-500 text-white rounded-2xl p-4 flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-300 shrink-0" />
                <div>
                  <p className="font-black">🎬 Tienes 1 Video Cinematográfico GRATIS disponible</p>
                  <p className="text-white/80 text-sm">Cada afiliado recibe 1 video profesional de 1 minuto cada 2 meses. ¡Úsalo ahora!</p>
                </div>
                <button
                  onClick={() => setSelectedLevel(MARKETING_LEVELS.find(l => l.level === 4)!)}
                  className="ml-auto shrink-0 bg-white text-rose-600 font-black text-sm px-4 py-2 rounded-xl hover:bg-rose-50 transition-all"
                >
                  Generar
                </button>
              </div>
            )}

            {/* Level cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {MARKETING_LEVELS.map((def) => (
                <button
                  key={def.level}
                  onClick={() => setSelectedLevel(def)}
                  className={`p-6 rounded-2xl border-2 ${def.borderColor} bg-white text-left hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${def.gradient} text-white`}>
                      {def.icon}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider">Nivel {def.level}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${def.badgeColor}`}>
                        {def.badge}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-1">{def.title}</h3>
                  <p className="text-xs font-semibold text-gray-500 mb-2">{def.subtitle}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{def.description.substring(0, 100)}...</p>

                  <div className="mt-4 flex items-center gap-1 text-gray-400 text-xs font-semibold">
                    <span>Comenzar</span><ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── LEVEL DETAIL ── */}
        {activeTab === 'catalog' && selectedLevel && renderLevelDetail()}

        {/* ── MY ASSETS TAB ── */}
        {activeTab === 'my_assets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">Mis Materiales Generados</h2>
                <p className="text-sm text-gray-500">Los recursos generados por la IA aparecen aquí en tiempo real.</p>
              </div>
              <button
                onClick={() => setActiveTab('catalog')}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all"
              >
                <Plus className="w-4 h-4" /> Generar nuevo
              </button>
            </div>

            {isLoadingAssets ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <ImageIcon className="w-14 h-14 mx-auto mb-4 opacity-30" />
                <p className="font-bold text-gray-600">Aún no tienes materiales generados</p>
                <p className="text-sm mt-1">Ve al catálogo y genera tu primera campaña con IA</p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="mt-4 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all"
                >
                  Ir al Catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    affiliate={affiliate}
                    onAddToPage={handleToggleOnLanding}
                    onTogglingId={togglingAssetId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
