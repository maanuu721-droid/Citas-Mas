import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Users,
  Image as ImageIcon,
  Video,
  Film,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Share2,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Target,
  Zap,
  Volume2,
  Play,
  Pause,
  Upload,
  Layers,
  Send,
  Sliders,
  DollarSign,
  BarChart3,
  Gift,
  Clock,
  Calendar,
  Copy,
  Check,
  MessageSquare,
  TrendingUp,
  Award,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Affiliate,
  BuyerPersona,
  MarketingCampaignItem,
  MarketingCampaignRequest,
  PostAppointmentFollowupSettings,
  ReferralGamificationSettings,
  ReEngagementSettings,
  MarketingAnalyticsSummary,
  WeeklyWhatsAppReportSettings,
  N8nAutomationHub
} from '../types.ts';
import { MarketingService } from '../services/marketingService.ts';
import { DataService } from '../services/dataService.ts';

interface Props {
  affiliate: Affiliate;
  onUpdateAffiliate: (updated: Affiliate) => void;
  onClose?: () => void;
  initialTab?: 'audience' | 'campaign_2d' | 'campaign_pro' | 'campaign_premium' | 'n8n_retention' | 'analytics_bi';
  onNavigateToLanding?: () => void;
}

export const MarketingToolsView: React.FC<Props> = ({
  affiliate,
  onUpdateAffiliate,
  onClose,
  initialTab = 'audience',
  onNavigateToLanding
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'audience' | 'campaign_2d' | 'campaign_pro' | 'campaign_premium' | 'n8n_retention' | 'analytics_bi'
  >(initialTab);

  // --- STATE FOR TOOL 1: AUDIENCE ---
  const [personas, setPersonas] = useState<BuyerPersona[]>(
    affiliate.buyerPersonas && affiliate.buyerPersonas.length > 0
      ? affiliate.buyerPersonas
      : []
  );
  const [isAnalyzingAudience, setIsAnalyzingAudience] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(
    personas[0]?.id || 'persona_1'
  );

  // --- STATE FOR TOOL 2: 2D CAMPAIGN ---
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    affiliate.banner || affiliate.gallery?.[0] || affiliate.logo || ''
  );
  const [campaignCopy, setCampaignCopy] = useState({
    headline: `¿Buscas ${affiliate.categoryLabel || 'Atención Especializada'} en ${affiliate.city || 'tu ciudad'}?`,
    subheadline: 'Atención puntual y garantizada, sin filas y con respaldo oficial de CitaPro MX.',
    bodyCopy: `En ${affiliate.businessName || affiliate.name} cuentas con expediente verificado y confirmación directa por WhatsApp.`,
    badge: 'Cédula Oficial & Garantía CitaPro MX',
    callToAction: 'Agendar Cita en Línea',
    priceOffer: `Servicios desde $${affiliate.services?.[0]?.price || 500} MXN`
  });
  const [isGenerating2DCopy, setIsGenerating2DCopy] = useState(false);
  const [generated2DImageUrl, setGenerated2DImageUrl] = useState<string>(
    affiliate.publishedMarketingCampaign?.imageUrl || ''
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessMessage, setPublishSuccessMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- STATE FOR TOOL 3: PRO CAMPAIGN ---
  const [voiceType, setVoiceType] = useState('female_warm');
  const [isGeneratingProScript, setIsGeneratingProScript] = useState(false);
  const [proScript, setProScript] = useState({
    title: `Spot Radial / Redes para ${affiliate.businessName || affiliate.name}`,
    hook: `¿Cansado de esperar horas para una consulta de ${affiliate.categoryLabel || 'calidad'}?`,
    body: `Descubre ${affiliate.businessName || affiliate.name} en ${affiliate.city}. Agenda tu cita en 30 segundos, recibe confirmación inmediata a tu WhatsApp y disfruta de atención puntual garantizada.`,
    cta: 'Haz clic en el enlace y aparta tu horario hoy mismo en CitaPro MX.',
    audioSampleTime: '0:22 seg'
  });
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(
    'https://n8n.webhook.citapro.mx/webhook/marketing-video-pro'
  );
  const [n8nStatusPro, setN8nStatusPro] = useState<string>('');
  const [isDispatchingPro, setIsDispatchingPro] = useState(false);

  // --- STATE FOR TOOL 4: PREMIUM CAMPAIGN ---
  const [isDispatchingPremium, setIsDispatchingPremium] = useState(false);
  const [n8nStatusPremium, setN8nStatusPremium] = useState<string>('');

  // --- STATE FOR TOOL 5: MARKETING Y FIDELIZACIÓN (VÍA n8n + WHATSAPP) ---
  const [postAppointmentSettings, setPostAppointmentSettings] = useState<PostAppointmentFollowupSettings>(
    affiliate.postAppointmentSettings || {
      followup24hEnabled: true,
      followup24hDelayHours: 24,
      followup24hMessage: `Hola {{cliente}}, gracias por visitarnos en ${affiliate.businessName || affiliate.name}. ¿Cómo te fue con tu sesión? Recuerda seguir las recomendaciones y cualquier duda estamos a tu disposición por este WhatsApp.`,
      followupMaintenanceEnabled: true,
      followupMaintenanceDays: 30,
      followupMaintenanceMessage: `Hola {{cliente}}, hace 30 días realizaste tu cita de ${affiliate.services?.[0]?.name || 'servicio profesional'}. Para mantener tus resultados al día, te sugerimos agendar tu sesión de mantenimiento aquí: {{enlace_reagendar}}`,
      autoRescheduleLinkEnabled: true
    }
  );

  const cleanAffiliateCode = (affiliate.id || 'dr-pro').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 10);
  const [referralSettings, setReferralSettings] = useState<ReferralGamificationSettings>(
    affiliate.referralSettings || {
      affiliateReferralCode: cleanAffiliateCode,
      referralLink: `https://citapro.mx/ref/${cleanAffiliateCode}`,
      clientRewardDiscountPercent: 15,
      affiliateBonusDaysPreferred: 7,
      totalReferralsTracked: 8,
      gamificationPoints: 1400,
      tierBadge: 'Oro',
      recentReferrals: [
        {
          id: 'ref-101',
          referredName: 'Mariana Gómez',
          referredPhone: '+52 55 4123 9988',
          status: 'booked_paid',
          date: 'Hace 2 días',
          pointsEarned: 500
        },
        {
          id: 'ref-102',
          referredName: 'Dr. Roberto Vargas',
          referredPhone: '+52 33 8765 4321',
          status: 'booked_paid',
          date: 'Hace 5 días',
          pointsEarned: 500
        },
        {
          id: 'ref-103',
          referredName: 'Claudia Morales',
          referredPhone: '+52 81 2345 6789',
          status: 'invited',
          date: 'Hace 1 semana',
          pointsEarned: 100
        },
        {
          id: 'ref-104',
          referredName: 'Carlos M. Ortiz',
          referredPhone: '+52 55 9876 5432',
          status: 'booked_paid',
          date: 'Hace 2 semanas',
          pointsEarned: 300
        }
      ]
    }
  );

  const [reEngagementSettings, setReEngagementSettings] = useState<ReEngagementSettings>(
    affiliate.reEngagementSettings || {
      inactiveDaysThreshold: 60,
      aiFlashOfferDiscountPercent: 20,
      aiFlashOfferMessage: `¡Te extrañamos en ${affiliate.businessName || affiliate.name}! 🌟 Hemos notado que han pasado más de 60 días desde tu última visita. Diseñamos para ti una OFERTA FLASH del 20% de descuento en tu próxima cita, válida durante las próximas 48 horas: https://citapro.mx/promo/flash-${cleanAffiliateCode}`,
      validHoursOffer: 48,
      isActiveAutoDispatch: true,
      totalReEngagedClients: 14
    }
  );

  const [n8nRetentionWebhookStatus, setN8nRetentionWebhookStatus] = useState<string>('');
  const [isSyncingN8nRetention, setIsSyncingN8nRetention] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);

  // --- STATE FOR TOOL 6: ANALÍTICA Y BUSINESS INTELLIGENCE ---
  const [marketingAnalytics, setMarketingAnalytics] = useState<MarketingAnalyticsSummary>(
    affiliate.marketingAnalytics || {
      promoVideoClicks: 342,
      verticalAdViews916: 1280,
      whatsappInquiries: 89,
      confirmedAppointmentsFromMkt: 24,
      realConversionRatePercent: 27.0, // 24 de 89
      estimatedRevenueGeneratedMxn: 19200,
      weeklyGrowthPercent: 34.5,
      channelBreakdown: {
        whatsapp: 45,
        videoPromo: 30,
        instagramStories916: 15,
        directDirectory: 10
      }
    }
  );

  const [weeklyReportSettings, setWeeklyReportSettings] = useState<WeeklyWhatsAppReportSettings>(
    affiliate.weeklyReportSettings || {
      deliveryDay: 'Lunes',
      deliveryTime: '09:00',
      targetWhatsAppPhone: affiliate.phone || '+52 55 1234 5678',
      includeInfographic: true,
      autoSendActive: true,
      sampleExecutiveSummary: `📊 *Reporte Ejecutivo Semanal CitaPro MX (Lunes)*\n\n¡Hola ${affiliate.businessName || affiliate.name}! Aquí tienes tu balance de marketing:\n\n✅ *14 Citas concretadas*\n👥 *2 Nuevos clientes recurrentes*\n🎬 *Tus videos promocionales alcanzaron 1.2k vistas*\n💬 *18 Conversaciones iniciadas por WhatsApp*\n📈 *Tasa de conversión real: 27.0%*\n💰 *Ingresos estimados generados: $19,200 MXN*\n\n¡Excelente semana y a seguir creciendo!`
    }
  );

  const [isSendingWeeklyReportNow, setIsSendingWeeklyReportNow] = useState(false);
  const [weeklyReportSentToast, setWeeklyReportSentToast] = useState<string>('');

  // --- TIER LEVEL & FREE LEVEL 2 PACK BENEFIT STATE ---
  // Afiliados de más alto nivel (Plan Equipo / Nivel 3) tienen derecho a 1 pack nivel 2 sin costo extra
  // Usuarios nivel 1 (Plan Básico) tienen que pagar por usar herramientas publicitarias
  const initialTier: 1 | 2 | 3 =
    affiliate.affiliateTierLevel || (affiliate.plan === 'equipo' ? 3 : affiliate.plan === 'pro' ? 2 : 1);
  const [tierLevel, setTierLevel] = useState<1 | 2 | 3>(initialTier);
  const [freePacksAvailable, setFreePacksAvailable] = useState<number>(
    affiliate.freeLevel2PacksAvailable !== undefined
      ? affiliate.freeLevel2PacksAvailable
      : initialTier === 3
      ? 1
      : 0
  );
  const [applyFreeBenefit, setApplyFreeBenefit] = useState<boolean>(
    (affiliate.freeLevel2PacksAvailable !== undefined
      ? affiliate.freeLevel2PacksAvailable
      : initialTier === 3
      ? 1
      : 0) > 0 && initialTier === 3
  );
  const [proPaymentMethod, setProPaymentMethod] = useState<'tarjeta' | 'spei'>('tarjeta');

  // Helper to switch simulated tier for interactive verification in UI
  const handleSwitchSimulatedTier = (newTier: 1 | 2 | 3) => {
    setTierLevel(newTier);
    if (newTier === 3) {
      setFreePacksAvailable(1);
      setApplyFreeBenefit(true);
    } else {
      setFreePacksAvailable(0);
      setApplyFreeBenefit(false);
    }
  };

  // Selected persona object
  const currentPersona =
    personas.find((p) => p.id === selectedPersonaId) || personas[0];

  // Helper to re-render Canvas when photo, copy or active tab changes
  useEffect(() => {
    if (activeSubTab === 'campaign_2d' && canvasRef.current) {
      MarketingService.getInstance()
        .render2DAdGraphic(canvasRef.current, affiliate, campaignCopy, selectedPhoto)
        .then((dataUrl) => {
          setGenerated2DImageUrl(dataUrl);
        })
        .catch((err) => console.error('Canvas render error:', err));
    }
  }, [activeSubTab, campaignCopy, selectedPhoto, affiliate]);

  // Handler: Analyze Audience (Tool 1)
  const handleAnalyzeAudience = async () => {
    try {
      setIsAnalyzingAudience(true);
      const result = await MarketingService.getInstance().discoverBuyerPersonas(affiliate);
      setPersonas(result);
      if (result.length > 0) {
        setSelectedPersonaId(result[0].id);
      }
      // Save buyer personas to affiliate profile
      const updatedAffiliate = {
        ...affiliate,
        buyerPersonas: result
      };
      onUpdateAffiliate(updatedAffiliate);
    } catch (err) {
      console.error(err);
      alert('Hubo un inconveniente al analizar la audiencia. Reintentando con generador contextual.');
    } finally {
      setIsAnalyzingAudience(false);
    }
  };

  // Handler: Generate 2D Campaign Copy from selected persona (Tool 2)
  const handleGenerate2DCopy = async (personaToUse?: BuyerPersona) => {
    const persona = personaToUse || currentPersona;
    try {
      setIsGenerating2DCopy(true);
      const copyResult = await MarketingService.getInstance().generateCampaignCopy(
        affiliate,
        persona
      );
      setCampaignCopy(copyResult);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating2DCopy(false);
    }
  };

  // Handler: Transition from Persona to 2D Campaign
  const handleSelectPersonaAndCreateCampaign = (persona: BuyerPersona) => {
    setSelectedPersonaId(persona.id);
    setActiveSubTab('campaign_2d');
    handleGenerate2DCopy(persona);
  };

  // Handler: Download 2D Graphic
  const handleDownload2DAd = () => {
    if (!generated2DImageUrl) return;
    const a = document.createElement('a');
    a.href = generated2DImageUrl;
    a.download = `anuncio-2d-${affiliate.businessName || 'citapro'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handler: Publish Campaign directly to Affiliate's Landing Page!
  const handlePublishToLanding = async (
    level: '2d_standard' | 'pro_animated' | 'premium_cinema',
    videoUrlFallback?: string
  ) => {
    try {
      setIsPublishing(true);
      setPublishSuccessMessage('');

      const campaignItem: MarketingCampaignItem = {
        id: `camp-${Date.now()}`,
        level,
        title: campaignCopy.headline,
        targetPersonaId: currentPersona?.id,
        targetPersonaName: currentPersona?.name,
        headline: campaignCopy.headline,
        subheadline: campaignCopy.subheadline,
        bodyCopy: campaignCopy.bodyCopy,
        callToAction: campaignCopy.callToAction,
        badge: campaignCopy.badge,
        priceOffer: campaignCopy.priceOffer,
        imageUrl: generated2DImageUrl || affiliate.banner || affiliate.logo,
        videoUrl: videoUrlFallback || affiliate.videoUrl,
        voiceType,
        costExtraMxn: level === '2d_standard' ? 0 : level === 'pro_animated' ? 450 : 1200,
        n8nWebhookUrl,
        isPublishedOnLanding: true,
        createdAt: new Date().toISOString()
      };

      const updated = await MarketingService.getInstance().publishToLandingPage(
        affiliate,
        campaignItem
      );

      onUpdateAffiliate(updated);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setPublishSuccessMessage(
        `¡Excelente! Tu campaña publicitaria se ha publicado exitosamente en tu Landing Page Oficial.`
      );

      setTimeout(() => {
        setPublishSuccessMessage('');
      }, 7000);
    } catch (err) {
      console.error(err);
      alert('Error publicando en la landing page.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Handler: Dispatch Pro Video Campaign to Admin Authorization and n8n ($550 MXN o $0 Gratis por Alto Nivel)
  const handleDispatchProToN8N = async () => {
    try {
      setIsDispatchingPro(true);
      const isFreeApplied = tierLevel === 3 && freePacksAvailable > 0 && applyFreeBenefit;
      const finalCost = isFreeApplied ? 0 : 550;

      setN8nStatusPro(
        isFreeApplied
          ? 'Registrando solicitud de Campaña Pro (Pack Nivel 2 GRATIS por Membresía de Más Alto Nivel)...'
          : `Registrando solicitud de Campaña Pro ($550 MXN) para el Administrador General...`
      );

      const reqId = `mkt-req-${Date.now()}`;
      const campaignReq: MarketingCampaignRequest = {
        id: reqId,
        affiliateId: affiliate.id,
        affiliateName: affiliate.businessName || affiliate.name,
        affiliatePhone: affiliate.phone,
        affiliateEmail: affiliate.email,
        affiliateCity: affiliate.city,
        campaignId: `camp-pro-${Date.now()}`,
        level: 'pro_animated',
        levelLabel: isFreeApplied
          ? 'Campaña Nivel Pro (Flyer Animado + Voz IA) • Cortesía Más Alto Nivel'
          : 'Campaña Nivel Pro (Flyer Animado + Voz IA)',
        headline: proScript.hook,
        scriptHook: `${proScript.hook} ${proScript.body} ${proScript.cta}`,
        voiceType,
        costExtraMxn: finalCost,
        isFreeBenefitApplied: isFreeApplied,
        benefitReason: isFreeApplied
          ? '1 Pack de Publicidad Nivel 2 incluido SIN COSTO EXTRA por Membresía de Más Alto Nivel (Plan Equipo)'
          : undefined,
        affiliateTierLevel: tierLevel,
        paymentStatus: isFreeApplied ? 'paid_verified' : 'pending_payment',
        paymentMethod: isFreeApplied ? 'tarjeta' : proPaymentMethod,
        paymentReference: isFreeApplied
          ? 'BENEFICIO-ALTO-NIVEL-CORTESIA-100%'
          : `${proPaymentMethod.toUpperCase()}-AUT-${Date.now().toString().slice(-6)}`,
        adminApprovalStatus: 'pending_approval',
        n8nWebhookUrl,
        notes: isFreeApplied
          ? `Afiliado de más alto nivel (Plan Equipo). 1 Pack Nivel 2 sin costo extra aplicado ($0 MXN). Listo para autorizar y activar campaña sin requerir pago.`
          : tierLevel === 1
          ? `Usuario Nivel 1 (Plan Básico). Obligatorio pago de $550 MXN para habilitar herramientas publicitarias.`
          : `Solicitud de spot publicitario con locución (${voiceType}) y animación ($550 MXN).`,
        requestedAt: new Date().toISOString()
      };

      await DataService.getInstance().createMarketingRequest(campaignReq);

      // If free benefit applied, update affiliate's available packs in profile
      if (isFreeApplied) {
        setFreePacksAvailable(0);
        setApplyFreeBenefit(false);
        const updatedAffiliate: Affiliate = {
          ...affiliate,
          freeLevel2PacksAvailable: 0,
          freeLevel2PacksUsed: (affiliate.freeLevel2PacksUsed || 0) + 1,
          updatedAt: new Date().toISOString()
        };
        await DataService.getInstance().saveAffiliate(updatedAffiliate);
        onUpdateAffiliate(updatedAffiliate);
      }

      setN8nStatusPro(
        isFreeApplied
          ? '🎉 ¡Solicitud enviada al Administrador General! Beneficio de 1 Pack Nivel 2 SIN COSTO EXTRA ($0 MXN) aplicado con éxito. En espera de aprobación del Administrador.'
          : tierLevel === 1
          ? '¡Solicitud enviada al Administrador General! Costo: $550 MXN (Usuario Nivel 1). El Administrador verificará tu pago de $550 MXN para activar tu campaña.'
          : '¡Solicitud enviada al Administrador General! Costo: $550 MXN (Pago verificado). En espera de activación por el Administrador.'
      );
      confetti({ particleCount: isFreeApplied ? 60 : 40, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      setN8nStatusPro(`Error al registrar la solicitud: ${err.message || 'Verifica tu conexión'}`);
    } finally {
      setIsDispatchingPro(false);
    }
  };

  // Handler: Dispatch Premium Cinema Campaign to Admin Authorization ($1,250 MXN)
  const handleDispatchPremiumToN8N = async () => {
    try {
      setIsDispatchingPremium(true);
      setN8nStatusPremium('Registrando solicitud de Producción Cinematográfica ($1,250 MXN)...');

      const reqId = `mkt-req-${Date.now()}`;
      const campaignReq: MarketingCampaignRequest = {
        id: reqId,
        affiliateId: affiliate.id,
        affiliateName: affiliate.businessName || affiliate.name,
        affiliatePhone: affiliate.phone,
        affiliateEmail: affiliate.email,
        affiliateCity: affiliate.city,
        campaignId: `camp-prem-${Date.now()}`,
        level: 'premium_cinema',
        levelLabel: 'Campaña Premium (Video Cinematográfico 4K)',
        headline: currentPersona ? `Transformación para ${currentPersona.name}` : `Producción Cinematográfica 4K`,
        scriptHook: `Historia de transformación cinematográfica para ${affiliate.businessName || affiliate.name} en ${affiliate.city}.`,
        voiceType: 'cinematic_narrator',
        costExtraMxn: 1250,
        isFreeBenefitApplied: false,
        affiliateTierLevel: tierLevel,
        paymentStatus: 'paid_verified',
        paymentMethod: 'tarjeta',
        paymentReference: `VISA-AUT-${Date.now().toString().slice(-6)}`,
        adminApprovalStatus: 'pending_approval',
        n8nWebhookUrl,
        notes: tierLevel === 1
          ? `Usuario Nivel 1 (Plan Básico). Pago de $1,250 MXN para herramientas publicitarias cinematográficas.`
          : `Producción de alta gama 4K con estética de cine y musicalización profesional ($1,250 MXN).`,
        requestedAt: new Date().toISOString()
      };

      await DataService.getInstance().createMarketingRequest(campaignReq);
      setN8nStatusPremium(
        '¡Solicitud Cinematográfica enviada al Administrador General! Costo: $1,250 MXN (Pago verificado). En espera de activación por el Administrador.'
      );
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    } catch (err: any) {
      setN8nStatusPremium(`Error al enviar al Administrador: ${err.message}`);
    } finally {
      setIsDispatchingPremium(false);
    }
  };

  // --- HANDLERS FOR TOOL 5: MARKETING Y FIDELIZACIÓN (VÍA n8n + WHATSAPP) ---
  const handleSyncN8nRetentionWorkflows = async () => {
    try {
      setIsSyncingN8nRetention(true);
      setN8nRetentionWebhookStatus('Sincronizando flujos de fidelización con n8n y WhatsApp Business API...');

      const updatedAffiliate: Affiliate = {
        ...affiliate,
        postAppointmentSettings,
        referralSettings,
        reEngagementSettings,
        updatedAt: new Date().toISOString()
      };

      await DataService.getInstance().saveAffiliate(updatedAffiliate);
      onUpdateAffiliate(updatedAffiliate);

      setN8nRetentionWebhookStatus('✅ ¡Flujos de fidelización activos en n8n! Secuencias post-cita 24h, recompra y referidos sincronizados.');
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setTimeout(() => setN8nRetentionWebhookStatus(''), 7000);
    } catch (err: any) {
      setN8nRetentionWebhookStatus(`Error sincronizando con n8n: ${err.message || 'Verifica tu conexión'}`);
    } finally {
      setIsSyncingN8nRetention(false);
    }
  };

  const handleCopyReferralLink = () => {
    navigator.clipboard.writeText(referralSettings.referralLink);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2500);
  };

  const handleShareReferralWhatsApp = () => {
    const text = encodeURIComponent(
      `¡Hola! Te recomiendo atenderte con ${affiliate.businessName || affiliate.name} en CitaPro MX. Usa mi enlace de referido para obtener un ${referralSettings.clientRewardDiscountPercent}% de descuento directo en tu primera cita: ${referralSettings.referralLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleTriggerReEngagementCampaign = async () => {
    try {
      setIsSyncingN8nRetention(true);
      setN8nRetentionWebhookStatus(`Disparando campaña de re-engagement con IA a clientes inactivos (> ${reEngagementSettings.inactiveDaysThreshold} días)...`);

      // Increment re-engaged count simulated
      const updatedReEngage: ReEngagementSettings = {
        ...reEngagementSettings,
        totalReEngagedClients: (reEngagementSettings.totalReEngagedClients || 0) + 3,
        lastCampaignDispatchedAt: new Date().toISOString()
      };
      setReEngagementSettings(updatedReEngage);

      const updatedAffiliate: Affiliate = {
        ...affiliate,
        reEngagementSettings: updatedReEngage,
        updatedAt: new Date().toISOString()
      };
      await DataService.getInstance().saveAffiliate(updatedAffiliate);
      onUpdateAffiliate(updatedAffiliate);

      setN8nRetentionWebhookStatus('🚀 ¡Campaña de Oferta Flash activada vía n8n! Se enviaron 3 mensajes de re-engagement con oferta de 48h.');
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      setTimeout(() => setN8nRetentionWebhookStatus(''), 8000);
    } catch (err: any) {
      setN8nRetentionWebhookStatus(`Error al disparar re-engagement: ${err.message}`);
    } finally {
      setIsSyncingN8nRetention(false);
    }
  };

  const handleSendWeeklyReportNow = async () => {
    try {
      setIsSendingWeeklyReportNow(true);
      setWeeklyReportSentToast('Generando infografía y reporte ejecutivo vía n8n...');

      const targetPhoneClean = (weeklyReportSettings.targetWhatsAppPhone || affiliate.phone || '').replace(/\D/g, '');
      const reportText = encodeURIComponent(weeklyReportSettings.sampleExecutiveSummary || '');

      const updatedWeekly: WeeklyWhatsAppReportSettings = {
        ...weeklyReportSettings,
        lastReportDispatchedAt: new Date().toISOString()
      };
      setWeeklyReportSettings(updatedWeekly);

      const updatedAffiliate: Affiliate = {
        ...affiliate,
        weeklyReportSettings: updatedWeekly,
        updatedAt: new Date().toISOString()
      };
      await DataService.getInstance().saveAffiliate(updatedAffiliate);
      onUpdateAffiliate(updatedAffiliate);

      confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
      setWeeklyReportSentToast('📲 ¡Reporte ejecutivo semanal enviado con éxito a tu WhatsApp vía n8n!');

      if (targetPhoneClean) {
        window.open(`https://wa.me/${targetPhoneClean}?text=${reportText}`, '_blank');
      }

      setTimeout(() => setWeeklyReportSentToast(''), 7000);
    } catch (err: any) {
      setWeeklyReportSentToast(`Error al enviar reporte: ${err.message}`);
    } finally {
      setIsSendingWeeklyReportNow(false);
    }
  };

  const handleSaveWeeklySettings = async () => {
    try {
      const updatedAffiliate: Affiliate = {
        ...affiliate,
        weeklyReportSettings,
        updatedAt: new Date().toISOString()
      };
      await DataService.getInstance().saveAffiliate(updatedAffiliate);
      onUpdateAffiliate(updatedAffiliate);
      setWeeklyReportSentToast('Preferencias de reporte semanal guardadas.');
      setTimeout(() => setWeeklyReportSentToast(''), 4000);
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-bold shadow-lg shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-400">
                Suite de Crecimiento & Publicidad
              </span>
              <span className="bg-emerald-900/60 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-700/50">
                IA Automatizada
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              Herramientas de Marketing
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Analiza tus servicios, genera anuncios de alta conversión y publícalos directamente en tu Landing Page.
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-3">
          {affiliate.publishedMarketingCampaign?.isPublishedOnLanding && (
            <div className="flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-xs px-3 py-1.5 rounded-xl font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Campaña Activa en tu Landing</span>
            </div>
          )}
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="text-xs text-slate-300 hover:text-white flex items-center space-x-1 bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
            >
              <span>Ver Landing</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 text-sm"
              title="Cerrar herramientas"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tier Level & Marketing Benefit Rules Bar */}
      <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          {tierLevel === 3 ? (
            <div className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>MÁS ALTO NIVEL (PLAN EQUIPO)</span>
              </span>
              <span className="text-emerald-300 font-bold">
                🎁 1 Pack Nivel 2 SIN COSTO EXTRA ($0 MXN)
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                • {freePacksAvailable > 0 ? '1 pack disponible para reclamar' : 'Pack de cortesía ya utilizado'}
              </span>
            </div>
          ) : tierLevel === 2 ? (
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                NIVEL 2 (PLAN PRO)
              </span>
              <span className="text-slate-300">
                Herramientas publicitarias con tarifa estándar ($550 Pro / $1,250 Premium)
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="bg-amber-950 text-amber-300 border border-amber-700 font-bold px-2 py-0.5 rounded-full text-[10px] uppercase">
                USUARIO NIVEL 1 (PLAN BÁSICO)
              </span>
              <span className="text-amber-200/90 font-medium">
                ⚠️ Usuarios nivel 1 deben abonar por herramientas publicitarias ($550 Pro / $1,250 Premium)
              </span>
            </div>
          )}
        </div>

        {/* Tier Simulator Switcher for interactive verification */}
        <div className="flex items-center space-x-2 text-[11px] self-end md:self-auto">
          <span className="text-slate-400">Ver como:</span>
          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => handleSwitchSimulatedTier(1)}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                tierLevel === 1
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Simular usuario nivel 1 (debe pagar por herramientas publicitarias)"
            >
              Nivel 1
            </button>
            <button
              type="button"
              onClick={() => handleSwitchSimulatedTier(2)}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                tierLevel === 2
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nivel 2
            </button>
            <button
              type="button"
              onClick={() => handleSwitchSimulatedTier(3)}
              className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                tierLevel === 3
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Simular afiliado de más alto nivel (derecho a 1 pack nivel 2 sin costo)"
            >
              🌟 Más Alto Nivel
            </button>
          </div>
        </div>
      </div>

      {/* Global Success Notification when Published */}
      {publishSuccessMessage && (
        <div className="bg-emerald-600 text-white p-4 flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{publishSuccessMessage}</span>
          </div>
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="underline hover:text-emerald-100 font-bold ml-4 shrink-0"
            >
              Ver en Landing Page ➔
            </button>
          )}
        </div>
      )}

      {/* Navigation Tabs (3 + 1 Core Levels requested by user) */}
      <div className="bg-slate-950/60 p-2 border-b border-slate-800/80 flex overflow-x-auto gap-2">
        <button
          id="btn-marketing-tool-1"
          onClick={() => setActiveSubTab('audience')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'audience'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>1. Descubre tu Público Objetivo</span>
          {personas.length > 0 && (
            <span className="bg-slate-900/30 text-xs px-1.5 py-0.2 rounded-full font-mono">
              3
            </span>
          )}
        </button>

        <button
          id="btn-marketing-tool-2"
          onClick={() => setActiveSubTab('campaign_2d')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'campaign_2d'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>2. Crear Campaña (Anuncio 2D)</span>
        </button>

        <button
          id="btn-marketing-tool-3"
          onClick={() => setActiveSubTab('campaign_pro')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'campaign_pro'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>3. Campaña Nivel Pro</span>
          <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
            +Voz & Audio
          </span>
        </button>

        <button
          id="btn-marketing-tool-4"
          onClick={() => setActiveSubTab('campaign_premium')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'campaign_premium'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>4. Campaña Premium</span>
          <span className="bg-purple-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
            Cine 4K
          </span>
        </button>

        <button
          id="btn-marketing-tool-5"
          onClick={() => setActiveSubTab('n8n_retention')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'n8n_retention'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>5. Fidelización (n8n + WhatsApp)</span>
          <span className="bg-emerald-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
            n8n Hub
          </span>
        </button>

        <button
          id="btn-marketing-tool-6"
          onClick={() => setActiveSubTab('analytics_bi')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
            activeSubTab === 'analytics_bi'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-102'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>6. Analítica & Business Intelligence</span>
          <span className="bg-indigo-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
            BI
          </span>
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-6">
        {/* ========================================================
            TAB 1: DESCUBRE TU PÚBLICO OBJETIVO
           ======================================================== */}
        {activeSubTab === 'audience' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
              <div>
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <span>Análisis de Clientes Ideales (Buyer Personas)</span>
                  <span className="bg-emerald-900/60 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-mono border border-emerald-700/50">
                    {affiliate.services?.length || 0} servicios analizados
                  </span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  El sistema analiza la oferta de tu negocio (<strong className="text-white">{affiliate.businessName || affiliate.name}</strong> en <strong className="text-emerald-400">{affiliate.city}</strong>), tus fotos ({affiliate.gallery?.length || 0} fotos) y tarifas para entregarte los 3 públicos objetivos que más rápido compran tus servicios.
                </p>
              </div>

              <button
                id="btn-start-audience-analysis"
                onClick={handleAnalyzeAudience}
                disabled={isAnalyzingAudience}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-70 text-slate-950 px-6 py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer shrink-0"
              >
                {isAnalyzingAudience ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analizando Servicios con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>{personas.length > 0 ? 'Re-analizar Audiencia' : 'Descubrir mis 3 Clientes Ideales'}</span>
                  </>
                )}
              </button>
            </div>

            {/* List of 3 Buyer Personas */}
            {personas.length === 0 ? (
              <div className="text-center py-14 bg-slate-950/40 rounded-2xl border border-dashed border-slate-700 p-8 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-950 text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
                  <Target className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-base font-bold text-white">Descubre a quién venderle primero</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Haz clic en el botón superior para que la IA examine tus servicios, precios y ubicación y construya tus 3 perfiles de clientes ideales con miedos, deseos y detonadores de compra.
                  </p>
                </div>
                <button
                  onClick={handleAnalyzeAudience}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Comenzar Análisis Ahora</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {personas.map((persona, index) => {
                  const isSelected = persona.id === selectedPersonaId;
                  return (
                    <div
                      key={persona.id || index}
                      className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800/90 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500'
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Header badge */}
                        <div className="flex items-center justify-between">
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                            Cliente Ideal #{index + 1}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {persona.ageRange}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-white leading-snug">
                            {persona.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                            <span className="bg-slate-800 px-2 py-0.5 rounded">
                              {persona.gender}
                            </span>
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300">
                              📍 {persona.specificZone}
                            </span>
                          </div>
                        </div>

                        {/* Miedos & Frustraciones */}
                        <div className="bg-rose-950/30 border border-rose-900/40 p-3 rounded-xl space-y-1.5">
                          <span className="text-[11px] font-extrabold text-rose-300 flex items-center space-x-1 uppercase">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Miedos & Frustraciones:</span>
                          </span>
                          <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc marker:text-rose-400">
                            {persona.fears.map((fear, fIdx) => (
                              <li key={fIdx} className="leading-tight">{fear}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Deseos & Metas */}
                        <div className="bg-blue-950/30 border border-blue-900/40 p-3 rounded-xl space-y-1.5">
                          <span className="text-[11px] font-extrabold text-blue-300 flex items-center space-x-1 uppercase">
                            <Target className="w-3.5 h-3.5 text-blue-400" />
                            <span>Deseos & Objetivos:</span>
                          </span>
                          <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc marker:text-blue-400">
                            {persona.desires.map((desire, dIdx) => (
                              <li key={dIdx} className="leading-tight">{desire}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Impulsos y detonadores de compra */}
                        <div className="bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-xl space-y-1.5">
                          <span className="text-[11px] font-extrabold text-emerald-300 flex items-center space-x-1 uppercase">
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Detonadores de Compra:</span>
                          </span>
                          <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc marker:text-emerald-400">
                            {persona.buyingTriggers.map((trig, tIdx) => (
                              <li key={tIdx} className="leading-tight">{trig}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Summary Hook */}
                        <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-700/70">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">
                            Frase Gancho Recomendada:
                          </span>
                          <p className="text-xs italic text-emerald-200 mt-0.5">
                            "{persona.summaryHook}"
                          </p>
                        </div>
                      </div>

                      {/* Action button: Direct create campaign */}
                      <div className="pt-4 border-t border-slate-800/80 mt-4">
                        <button
                          type="button"
                          id={`btn-target-persona-${index}`}
                          onClick={() => handleSelectPersonaAndCreateCampaign(persona)}
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <span>Crear Anuncio para este Público</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: CREAR CAMPAÑA (ANUNCIO 2D)
           ======================================================== */}
        {activeSubTab === 'campaign_2d' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column: Form & Targeting */}
              <div className="lg:w-1/2 space-y-5 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white">Configuración del Anuncio 2D</h2>
                    <p className="text-xs text-slate-400">
                      Adaptado para redes sociales y tu Landing Page de CitaPro MX.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerate2DCopy()}
                    disabled={isGenerating2DCopy}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-70 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating2DCopy ? 'animate-spin' : ''}`} />
                    <span>Regenerar Copy IA</span>
                  </button>
                </div>

                {/* Target persona selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Público Objetivo Seleccionado:
                  </label>
                  {personas.length > 0 ? (
                    <select
                      value={selectedPersonaId}
                      onChange={(e) => {
                        setSelectedPersonaId(e.target.value);
                        const p = personas.find((x) => x.id === e.target.value);
                        if (p) handleGenerate2DCopy(p);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2.5 rounded-xl font-medium focus:border-emerald-500"
                    >
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.specificZone})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-xs text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-900/50 flex items-center justify-between">
                      <span>Aún no has generado tus públicos en la pestaña 1.</span>
                      <button
                        onClick={() => setActiveSubTab('audience')}
                        className="underline font-bold ml-2 text-white"
                      >
                        Generar Públicos ➔
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo selection from affiliate gallery/banner */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Selecciona la Foto del Negocio para el Anuncio:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[affiliate.banner, ...(affiliate.gallery || []), affiliate.logo]
                      .filter(Boolean)
                      .slice(0, 8)
                      .map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPhoto(imgUrl)}
                          className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            selectedPhoto === imgUrl
                              ? 'border-emerald-500 ring-2 ring-emerald-500/50 scale-102'
                              : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Opción ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {selectedPhoto === imgUrl && (
                            <div className="absolute top-1 right-1 bg-emerald-500 text-slate-950 rounded-full p-0.5">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Editable Copy fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Titular Principal (Gancho):
                    </label>
                    <input
                      type="text"
                      value={campaignCopy.headline}
                      onChange={(e) =>
                        setCampaignCopy({ ...campaignCopy, headline: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2.5 rounded-xl font-bold focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Subtítulo (Solución al Miedo Principal):
                    </label>
                    <input
                      type="text"
                      value={campaignCopy.subheadline}
                      onChange={(e) =>
                        setCampaignCopy({ ...campaignCopy, subheadline: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2.5 rounded-xl focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Insignia de Confianza:
                      </label>
                      <input
                        type="text"
                        value={campaignCopy.badge}
                        onChange={(e) =>
                          setCampaignCopy({ ...campaignCopy, badge: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Oferta / Precio Inicial:
                      </label>
                      <input
                        type="text"
                        value={campaignCopy.priceOffer}
                        onChange={(e) =>
                          setCampaignCopy({ ...campaignCopy, priceOffer: e.target.value })
                        }
                        className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Llamada a la Acción (Botón CTA):
                    </label>
                    <input
                      type="text"
                      value={campaignCopy.callToAction}
                      onChange={(e) =>
                        setCampaignCopy({ ...campaignCopy, callToAction: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2.5 rounded-xl focus:border-emerald-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Live 2D Canvas Graphic & Action Bar */}
              <div className="lg:w-1/2 space-y-4 flex flex-col items-center">
                <div className="w-full flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold text-slate-200">
                    Vista Previa del Anuncio 2D (1080 x 1080 px)
                  </span>
                  <span className="font-mono text-emerald-400">HD Ready</span>
                </div>

                {/* Canvas hidden or responsive container */}
                <div className="w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 flex items-center justify-center relative group">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                  />
                  {/* Subtle hover overlay with quick actions */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownload2DAd}
                      className="bg-slate-900/90 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg border border-slate-700"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Descargar JPG</span>
                    </button>
                  </div>
                </div>

                {/* Direct Action Buttons requested by user: PUBLISH ON LANDING PAGE! */}
                <div className="w-full max-w-md space-y-3 pt-2">
                  <button
                    id="btn-publish-2d-to-landing"
                    type="button"
                    disabled={isPublishing}
                    onClick={() => handlePublishToLanding('2d_standard')}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-75 text-slate-950 py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-emerald-950/50 cursor-pointer transition-all transform active:scale-98"
                  >
                    {isPublishing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Publicando en tu Landing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 fill-slate-950" />
                        <span>Publicar este Anuncio en mi Landing Page</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleDownload2DAd}
                      className="bg-slate-800 hover:bg-slate-700 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Descargar Gráfico</span>
                    </button>

                    {onNavigateToLanding && (
                      <button
                        type="button"
                        onClick={onNavigateToLanding}
                        className="bg-slate-800 hover:bg-slate-700 text-emerald-300 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Ver mi Landing Page</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                    Al hacer clic en publicar, el anuncio gráfico se incorporará como banner destacado y en la galería de tu landing pública para todos tus clientes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: CAMPAÑA NIVEL PRO (FLYER ANIMADO + VOZ IA)
           ======================================================== */}
        {activeSubTab === 'campaign_pro' && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
              tierLevel === 3 && freePacksAvailable > 0
                ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                : 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-800/40'
            }`}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {tierLevel === 3 ? (
                    <>
                      <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Más Alto Nivel (Plan Equipo)</span>
                      </span>
                      <span className="text-emerald-300 text-xs font-mono font-bold bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-700">
                        🎁 1 PACK NIVEL 2 SIN COSTO EXTRA ($0 MXN)
                      </span>
                    </>
                  ) : tierLevel === 1 ? (
                    <>
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Usuario Nivel 1 (Plan Básico)
                      </span>
                      <span className="text-amber-300 text-xs font-mono font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                        +$550 MXN (Pago requerido)
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                        Nivel Pro • Costo Adicional
                      </span>
                      <span className="text-amber-300 text-xs font-mono font-bold">
                        +$550 MXN por campaña producida
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-lg font-black text-white mt-1.5">
                  Video Comercial con Flyer Animado, Voz IA & Audio
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                  {tierLevel === 3
                    ? 'Los afiliados de más alto nivel tienen derecho a 1 pack de publicidad nivel 2 sin costo extra. Genera tu video vertical publicitario con locución con acento mexicano natural, música y animación de tus fotos.'
                    : tierLevel === 1
                    ? 'Los usuarios nivel 1 tienen que pagar por usar herramientas publicitarias ($550 MXN). Genera tu video vertical publicitario con locución IA, música y animación de tus fotos una vez verificado tu pago.'
                    : 'Genera un video vertical publicitario (Reels / TikTok / WhatsApp Status) con locución con acento mexicano natural, música de fondo comercial y animación de tus fotos.'}
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-amber-900/50 text-right shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">
                  Producción Audiovisual
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-end space-x-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Automatización Activa</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Script & Voice Controls */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Configuración del Spot Publicitario</span>
                </h3>

                {/* Voice Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Tipo de Locución / Voz IA:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'female_warm', label: 'Mujer Cálida', sub: 'Empática y cercana' },
                      { id: 'male_prof', label: 'Hombre Ejecutivo', sub: 'Firme e institucional' },
                      { id: 'young_dynamic', label: 'Joven Dinámico', sub: 'Moderno y enérgico' }
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVoiceType(v.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          voiceType === v.id
                            ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold block">{v.label}</span>
                        <span className="text-[10px] text-slate-400 block">{v.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Script details */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Gancho Auditivo (Primeros 3 segundos):
                    </label>
                    <input
                      type="text"
                      value={proScript.hook}
                      onChange={(e) => setProScript({ ...proScript, hook: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2.5 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Cuerpo del Mensaje (Solución de Valor):
                    </label>
                    <textarea
                      rows={3}
                      value={proScript.body}
                      onChange={(e) => setProScript({ ...proScript, body: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2.5 rounded-xl leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Llamado a la Acción (CTA de Cierre):
                    </label>
                    <input
                      type="text"
                      value={proScript.cta}
                      onChange={(e) => setProScript({ ...proScript, cta: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-xs p-2.5 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Video/Flyer Simulator & Dispatch */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center justify-between mb-3">
                    <span className="flex items-center space-x-2">
                      <Play className="w-4 h-4 text-emerald-400" />
                      <span>Simulador de Flyer Animado (9:16 Vertical)</span>
                    </span>
                    <span className="text-[11px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-800">
                      Voz & Música
                    </span>
                  </h3>

                  {/* Vertical video container simulator */}
                  <div className="w-full max-w-xs mx-auto aspect-[9/16] max-h-80 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 rounded-2xl border border-slate-700 overflow-hidden relative shadow-2xl flex flex-col justify-between p-4 group">
                    {/* Background photo with subtle zoom */}
                    {selectedPhoto && (
                      <img
                        src={selectedPhoto}
                        alt="Fondo"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700"
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                      <span className="bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                        {affiliate.businessName || affiliate.name}
                      </span>
                      <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                        EN VIVO
                      </span>
                    </div>

                    <div className="relative z-10 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/90 text-slate-950 mx-auto flex items-center justify-center shadow-lg">
                        <Volume2 className="w-6 h-6 animate-bounce" />
                      </div>
                      <p className="text-xs font-black text-white px-2 drop-shadow-md">
                        "{proScript.hook}"
                      </p>
                    </div>

                    <div className="relative z-10 bg-slate-950/90 backdrop-blur-xs p-2.5 rounded-xl border border-slate-700/60 text-center">
                      <span className="text-[10px] text-emerald-300 font-bold block">
                        {proScript.cta}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Agendamiento 24/7 en CitaPro MX
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- TIER BASED BENEFIT / PAYMENT CARD --- */}
                {tierLevel === 3 ? (
                  freePacksAvailable > 0 ? (
                    <div className="p-4 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 border-2 border-emerald-500 rounded-2xl space-y-2 shadow-lg shadow-emerald-950/40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-300 flex items-center space-x-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>DERECHO EXCLUSIVO DE MÁS ALTO NIVEL</span>
                        </span>
                        <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                          1 Pack Gratis
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        Los afiliados de más alto nivel tienen derecho a <strong>1 pack de publicidad nivel 2 sin costo extra</strong> ($0 MXN en lugar de $550 MXN).
                      </p>
                      <label className="flex items-center space-x-2.5 pt-1.5 cursor-pointer bg-slate-900/80 p-2.5 rounded-xl border border-emerald-600/50">
                        <input
                          type="checkbox"
                          checked={applyFreeBenefit}
                          onChange={(e) => setApplyFreeBenefit(e.target.checked)}
                          className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-400 cursor-pointer"
                        />
                        <span className="text-xs text-white font-bold">
                          Aplicar beneficio de 1 Pack Nivel 2 GRATIS ($0 MXN - Ahorro de $550)
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                      <span className="text-emerald-400 font-bold">✓ Membresía de Más Alto Nivel: </span>
                      <span>Ya utilizaste tu 1 pack gratuito de cortesía. Las campañas Pro adicionales aplican tarifa regular de $550 MXN.</span>
                    </div>
                  )
                ) : tierLevel === 1 ? (
                  <div className="p-4 bg-amber-950/70 border border-amber-600/80 rounded-2xl space-y-2.5 shadow-lg shadow-amber-950/40">
                    <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Usuario Nivel 1 • Pago Requerido</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      Los usuarios nivel 1 tienen que pagar por usar herramientas publicitarias (<strong>$550 MXN</strong>). <em>Solo los afiliados de más alto nivel cuentan con 1 pack nivel 2 sin costo extra.</em>
                    </p>
                    <div className="pt-1">
                      <label className="block text-[10px] text-slate-300 uppercase font-mono mb-1.5 font-bold">
                        Abonar los $550 MXN mediante:
                      </label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {(['tarjeta', 'spei'] as const).map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setProPaymentMethod(method)}
                            className={`py-2 px-2 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                              proPaymentMethod === method
                                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md'
                                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            {method === 'tarjeta' ? '💳 Tarjeta (Stripe México)' : '🏦 SPEI Directo'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* n8n Status message */}
                {n8nStatusPro && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs rounded-xl flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{n8nStatusPro}</span>
                  </div>
                )}

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  {applyFreeBenefit && tierLevel === 3 && freePacksAvailable > 0 ? (
                    <button
                      id="btn-dispatch-pro-n8n"
                      type="button"
                      disabled={isDispatchingPro}
                      onClick={handleDispatchProToN8N}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-75 text-slate-950 py-3.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-xl shadow-emerald-500/20 cursor-pointer transition-all"
                    >
                      {isDispatchingPro ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando solicitud...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Solicitar mi Pack Nivel 2 GRATIS ($0 MXN)</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      id="btn-dispatch-pro-n8n"
                      type="button"
                      disabled={isDispatchingPro}
                      onClick={handleDispatchProToN8N}
                      className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-75 text-slate-950 py-3.5 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer transition-all"
                    >
                      {isDispatchingPro ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Enviando solicitud...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>
                            {tierLevel === 1
                              ? 'Solicitar Campaña Pro ($550 MXN) • Requiere Pago & Autorización'
                              : 'Solicitar Campaña Pro ($550 MXN)'}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isPublishing}
                    onClick={() => handlePublishToLanding('pro_animated')}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-emerald-300 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Publicar Formato Pro en mi Landing Page</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: CAMPAÑA PREMIUM (VIDEO CINEMATOGRÁFICO)
           ======================================================== */}
        {activeSubTab === 'campaign_premium' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 p-6 rounded-2xl border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-purple-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Nivel Premium Cinematográfico
                  </span>
                  <span className="text-purple-300 text-xs font-mono font-bold">
                    +$1,250 MXN por producción completa
                  </span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  Video Comercial Cinematográfico 4K
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                  Producción de alta gama con estética de cine, tomas de tu consultorio/instalaciones, música orquestada y narrativa emocional de alto impacto para atraer a los clientes más exigentes.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-purple-900/50 text-right shrink-0">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">
                  Producción Cinematográfica
                </span>
                <span className="text-xs font-bold text-purple-400 flex items-center justify-end space-x-1">
                  <Film className="w-3.5 h-3.5" />
                  <span>Motor de Render 4K</span>
                </span>
              </div>
            </div>

            {/* Storyboard grid */}
            <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Film className="w-4 h-4 text-purple-400" />
                <span>Storyboard & Guion Cinematográfico (4 Escenas)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  {
                    num: '01',
                    title: 'Plano Detalle / El Problema',
                    desc: `El paciente en su día a día buscando una solución de ${affiliate.categoryLabel || 'calidad'} en ${affiliate.city}.`,
                    tone: 'Tono reflexivo, música de piano suave'
                  },
                  {
                    num: '02',
                    title: 'Entrada a Instalaciones',
                    desc: `Tomas elegantes de las instalaciones de ${affiliate.businessName || affiliate.name}, equipo y bienvenida.`,
                    tone: 'Luz natural, sensación de alivio y calidez'
                  },
                  {
                    num: '03',
                    title: 'La Transformación',
                    desc: 'El profesional atendiendo con empatía y precisión. Cédula profesional y expediente verificado.',
                    tone: 'Música in crescendo, certeza y autoridad'
                  },
                  {
                    num: '04',
                    title: 'Cierre & Llamado CitaPro MX',
                    desc: 'Cita reservada en 30 seg con confirmación por WhatsApp y garantía oficial de puntualidad.',
                    tone: 'Logotipo en pantalla, llamado a la acción claro'
                  }
                ].map((scene, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-purple-400 text-xs font-bold">
                        ESCENA {scene.num}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">15 seg</span>
                    </div>
                    <h4 className="text-xs font-bold text-white">{scene.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-tight">{scene.desc}</p>
                    <span className="text-[10px] text-purple-300/80 italic block pt-1">
                      {scene.tone}
                    </span>
                  </div>
                ))}
              </div>

              {/* Status and dispatch button */}
              {n8nStatusPremium && (
                <div className="p-3 bg-purple-950/60 border border-purple-700 text-purple-300 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>{n8nStatusPremium}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  <span className="text-white font-bold">Entrega estimada:</span> 48 horas tras aprobación del guion.
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    id="btn-dispatch-premium-n8n"
                    type="button"
                    disabled={isDispatchingPremium}
                    onClick={handleDispatchPremiumToN8N}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:opacity-70 text-white font-black text-xs px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                  >
                    {isDispatchingPremium ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Enviando solicitud...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Solicitar Producción Premium ($1,250 MXN)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: MARKETING Y FIDELIZACIÓN AVANZADA (VÍA n8n + WHATSAPP)
           ======================================================== */}
        {activeSubTab === 'n8n_retention' && (
          <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 rounded-3xl border border-emerald-800/40 shadow-xl">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    <span>ESPACIO n8n + WHATSAPP BUSINESS</span>
                  </span>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-700/60 px-2 py-0.5 rounded-md">
                    Fidelización 24/7
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                  Marketing y Fidelización Avanzada
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Automatiza tus secuencias post-cita, reactiva a tus pacientes periódicamente, activa tu sistema de referidos con recompensas y reactiva a clientes inactivos de más de 60 días con ofertas flash generadas por IA.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSyncN8nRetentionWorkflows}
                  disabled={isSyncingN8nRetention}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-70 text-slate-950 px-5 py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
                >
                  {isSyncingN8nRetention ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Sincronizando con n8n...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-slate-950" />
                      <span>Guardar y Sincronizar en n8n</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {n8nRetentionWebhookStatus && (
              <div className="p-4 bg-emerald-950/70 border border-emerald-600/70 text-emerald-300 text-xs rounded-2xl flex items-center space-x-2.5 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{n8nRetentionWebhookStatus}</span>
              </div>
            )}

            {/* --- SECCIÓN 1: SECUENCIAS DE NUTRICIÓN POST-CITA --- */}
            <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/60 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>1. Secuencias de Nutrición Post-Cita</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Automatiza mensajes de seguimiento 24 horas después y programa recordatorios de recompra o mantenimiento basados en el tipo de servicio.
                  </p>
                </div>
                <span className="text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-full font-bold self-start md:self-auto">
                  ✓ Personalizable por Afiliado
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1A: SEGUIMIENTO 24 HORAS DESPUÉS */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center">
                          A
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Seguimiento 24 Horas Después
                        </h4>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={postAppointmentSettings.followup24hEnabled}
                          onChange={(e) =>
                            setPostAppointmentSettings({
                              ...postAppointmentSettings,
                              followup24hEnabled: e.target.checked
                            })
                          }
                          className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 accent-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300 font-semibold">
                          {postAppointmentSettings.followup24hEnabled ? 'Activo' : 'Pausado'}
                        </span>
                      </label>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Envía un mensaje cálido preguntando cómo le fue al paciente con su sesión y recordándole los cuidados posteriores para maximizar su satisfacción.
                    </p>

                    <div>
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                        Tiempo de espera tras finalizar la cita:
                      </label>
                      <div className="flex items-center space-x-2">
                        {[12, 24, 48].map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() =>
                              setPostAppointmentSettings({
                                ...postAppointmentSettings,
                                followup24hDelayHours: h
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              postAppointmentSettings.followup24hDelayHours === h
                                ? 'bg-emerald-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {h} horas
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                        Plantilla de Mensaje WhatsApp:
                      </label>
                      <textarea
                        rows={4}
                        value={postAppointmentSettings.followup24hMessage}
                        onChange={(e) =>
                          setPostAppointmentSettings({
                            ...postAppointmentSettings,
                            followup24hMessage: e.target.value
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                        <span className="text-slate-500">Variables soportadas:</span>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">{'{{cliente}}'}</code>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">{'{{servicio}}'}</code>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-300 font-mono">{'{{profesional}}'}</code>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Canal: WhatsApp Business Bot</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleMsg = postAppointmentSettings.followup24hMessage
                          .replace('{{cliente}}', 'Carlos')
                          .replace('{{servicio}}', affiliate.services?.[0]?.name || 'Consulta')
                          .replace('{{profesional}}', affiliate.businessName || affiliate.name);
                        window.open(`https://wa.me/?text=${encodeURIComponent(sampleMsg)}`, '_blank');
                      }}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Probar en mi WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* 1B: RECORDATORIO DE RECOMPRA O MANTENIMIENTO */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-700/80 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 font-black text-xs flex items-center justify-center">
                          B
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Recordatorio de Recompra o Mantenimiento
                        </h4>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={postAppointmentSettings.followupMaintenanceEnabled}
                          onChange={(e) =>
                            setPostAppointmentSettings({
                              ...postAppointmentSettings,
                              followupMaintenanceEnabled: e.target.checked
                            })
                          }
                          className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 accent-teal-500 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300 font-semibold">
                          {postAppointmentSettings.followupMaintenanceEnabled ? 'Activo' : 'Pausado'}
                        </span>
                      </label>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Programa recordatorios recurrentes según el tipo de servicio (ej. cada 30 días para estética, 60 días para chequeos o 90 días para limpiezas dentales).
                    </p>

                    <div>
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                        Intervalo de mantenimiento para tu especialidad:
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {[15, 30, 60, 90].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() =>
                              setPostAppointmentSettings({
                                ...postAppointmentSettings,
                                followupMaintenanceDays: d
                              })
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              postAppointmentSettings.followupMaintenanceDays === d
                                ? 'bg-teal-500 text-slate-950 font-black'
                                : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            Cada {d} días
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                        Plantilla de Mensaje de Recompra:
                      </label>
                      <textarea
                        rows={4}
                        value={postAppointmentSettings.followupMaintenanceMessage}
                        onChange={(e) =>
                          setPostAppointmentSettings({
                            ...postAppointmentSettings,
                            followupMaintenanceMessage: e.target.value
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px]">
                        <span className="text-slate-500">Variables soportadas:</span>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-teal-300 font-mono">{'{{cliente}}'}</code>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-teal-300 font-mono">{'{{enlace_reagendar}}'}</code>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Automatizado con cron n8n</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sampleMsg = postAppointmentSettings.followupMaintenanceMessage
                          .replace('{{cliente}}', 'María')
                          .replace('{{enlace_reagendar}}', `https://citapro.mx/p/${affiliate.id}`);
                        window.open(`https://wa.me/?text=${encodeURIComponent(sampleMsg)}`, '_blank');
                      }}
                      className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Probar en mi WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECCIÓN 2: SISTEMA DE REFERIDOS GAMIFICADO --- */}
            <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/60 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>2. Sistema de Referidos Gamificado</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Crea un enlace único por afiliado que n8n rastrea. Si un usuario trae a un colega o conocido, el sistema les regala a ambos un descuento o visibilidad preferente en la plataforma.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-400/20 text-amber-300 border border-amber-500/40 text-xs px-3 py-1 rounded-full font-black">
                    Insignia: {referralSettings.tierBadge}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-mono font-bold">
                    {referralSettings.gamificationPoints} pts
                  </span>
                </div>
              </div>

              {/* Referral Link & Share Box */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-900 border border-amber-400/30 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-extrabold block">
                      Tu Enlace Exclusivo de Afiliado (Rastreado por n8n)
                    </span>
                    <span className="text-sm font-mono font-bold text-white break-all">
                      {referralSettings.referralLink}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyReferralLink}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border border-slate-700"
                    >
                      {copiedReferral ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Enlace</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleShareReferralWhatsApp}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Compartir en WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Gamification rules summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-amber-400/20 text-xs">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-amber-300 font-bold block">🎁 Recompensa para tu invitado:</span>
                    <p className="text-slate-300">
                      <strong>{referralSettings.clientRewardDiscountPercent}% de descuento</strong> directo en su primera cita agendada.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-emerald-300 font-bold block">🌟 Recompensa para ti (Afiliado):</span>
                    <p className="text-slate-300">
                      <strong>{referralSettings.affiliateBonusDaysPreferred} días de visibilidad preferente</strong> destacada en el directorio CitaPro MX.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-purple-300 font-bold block">🎯 Gamificación n8n:</span>
                    <p className="text-slate-300">
                      +100 pts por clic/invitación y <strong>+500 pts por cada cita concretada</strong> con cobro verificado.
                    </p>
                  </div>
                </div>
              </div>

              {/* Table: Referrals Tracked by n8n */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Historial de Referidos Rastreados por el Webhook de n8n ({referralSettings.recentReferrals.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">Actualizado en tiempo real</span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/80">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-mono">
                        <th className="py-3 px-4">Referido / Colega</th>
                        <th className="py-3 px-4">Teléfono WhatsApp</th>
                        <th className="py-3 px-4">Estado n8n</th>
                        <th className="py-3 px-4">Fecha</th>
                        <th className="py-3 px-4 text-right">Puntos Gamificados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-slate-300">
                      {referralSettings.recentReferrals.map((ref) => (
                        <tr key={ref.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-white">{ref.referredName}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{ref.referredPhone}</td>
                          <td className="py-3 px-4">
                            {ref.status === 'booked_paid' ? (
                              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                ✓ Cita Pagada & Concretada
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Invitación Enviada
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{ref.date}</td>
                          <td className="py-3 px-4 text-right font-black text-amber-400">
                            +{ref.pointsEarned} pts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* --- SECCIÓN 3: CAMPAÑAS DE RE-ENGAGEMENT AUTOMATIZADAS --- */}
            <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/60 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    <span>3. Campañas de Re-engagement Automatizadas</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Si un usuario no ha agendado en 60 días, n8n puede activar una campaña de WhatsApp con una oferta flash diseñada por IA para reactivarlo.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-purple-950 text-purple-300 border border-purple-700 text-xs px-3 py-1 rounded-full font-bold">
                    {reEngagementSettings.totalReEngagedClients} clientes recuperados
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Configuration Column */}
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                      Umbral de inactividad para activar el webhook:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[30, 45, 60, 90].map((days) => (
                        <button
                          key={days}
                          type="button"
                          onClick={() =>
                            setReEngagementSettings({
                              ...reEngagementSettings,
                              inactiveDaysThreshold: days
                            })
                          }
                          className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            reEngagementSettings.inactiveDaysThreshold === days
                              ? 'border-purple-500 bg-purple-500/20 text-white font-black ring-1 ring-purple-400'
                              : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {days} días sin cita
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                      Descuento de la Oferta Flash:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[15, 20, 25].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() =>
                            setReEngagementSettings({
                              ...reEngagementSettings,
                              aiFlashOfferDiscountPercent: pct
                            })
                          }
                          className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            reEngagementSettings.aiFlashOfferDiscountPercent === pct
                              ? 'border-purple-500 bg-purple-500/20 text-white font-black'
                              : 'border-slate-700 bg-slate-900 text-slate-400'
                          }`}
                        >
                          {pct}% OFF
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-2xl text-xs space-y-1">
                    <span className="text-purple-300 font-bold block">Urgencia Psicológica:</span>
                    <p className="text-slate-300 text-[11px]">
                      La oferta flash tiene validez estricta de <strong>48 horas</strong>, lo que dispara un +40% de conversiones inmediatas.
                    </p>
                  </div>
                </div>

                {/* AI Offer Flash Message Box */}
                <div className="lg:col-span-2 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                        Mensaje de Oferta Flash con IA:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newMsg = `¡Hola! Hace más de ${reEngagementSettings.inactiveDaysThreshold} días no te vemos en ${affiliate.businessName || affiliate.name}. ⚡ Preparamos para ti una OFERTA FLASH del ${reEngagementSettings.aiFlashOfferDiscountPercent}% de descuento en tu servicio preferido, válida únicamente por las próximas 48 horas. Aparta tu cita con descuento aquí: https://citapro.mx/flash-${cleanAffiliateCode}`;
                          setReEngagementSettings({
                            ...reEngagementSettings,
                            aiFlashOfferMessage: newMsg
                          });
                        }}
                        className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Regenerar con IA</span>
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={reEngagementSettings.aiFlashOfferMessage}
                      onChange={(e) =>
                        setReEngagementSettings({
                          ...reEngagementSettings,
                          aiFlashOfferMessage: e.target.value
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400">
                      Disparador inteligente n8n: se ejecuta diariamente escaneando citas &gt; 60 días
                    </span>

                    <button
                      type="button"
                      onClick={handleTriggerReEngagementCampaign}
                      disabled={isSyncingN8nRetention}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-md cursor-pointer shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Disparar Campaña n8n Ahora</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: ANALÍTICA Y "BUSINESS INTELLIGENCE" PARA EL AFILIADO
           ======================================================== */}
        {activeSubTab === 'analytics_bi' && (
          <div className="space-y-6">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-3xl border border-indigo-800/40 shadow-xl">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-indigo-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                    <BarChart3 className="w-3 h-3 fill-slate-950" />
                    <span>BUSINESS INTELLIGENCE & STATS</span>
                  </span>
                  <span className="text-xs text-indigo-300 font-bold bg-indigo-950/70 border border-indigo-700/60 px-2 py-0.5 rounded-md">
                    Datos en Tiempo Real
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                  Analítica y Business Intelligence para el Afiliado
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Monitorea el rendimiento de tus videos promocionales, cuántas citas se concretaron desde WhatsApp y configura reportes semanales automáticos para que n8n te envíe un resumen ejecutivo cada lunes.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSendWeeklyReportNow}
                  disabled={isSendingWeeklyReportNow}
                  className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-70 text-slate-950 px-5 py-3 rounded-xl font-black text-xs flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-slate-950" />
                  <span>Enviar Reporte de Lunes Ahora</span>
                </button>
              </div>
            </div>

            {weeklyReportSentToast && (
              <div className="p-4 bg-indigo-950/70 border border-indigo-600/70 text-indigo-300 text-xs rounded-2xl flex items-center space-x-2.5 shadow-md">
                <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <span className="font-semibold">{weeklyReportSentToast}</span>
              </div>
            )}

            {/* --- DASHBOARD DE RENDIMIENTO DE MARKETING --- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span>Dashboard de Rendimiento de Marketing</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Métricas transparentes de clics generados, citas cerradas y tasa de conversión real de tu negocio.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
                  +{marketingAnalytics.weeklyGrowthPercent}% esta semana
                </span>
              </div>

              {/* 5 Core Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Clics en Videos Promocionales */}
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Clics Videos 1 min</span>
                    <Video className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{marketingAnalytics.promoVideoClicks}</div>
                  <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                    <span>↑ +28%</span>
                    <span className="text-slate-400">desde Reels/Stories</span>
                  </div>
                </div>

                {/* 2. Vistas Imagen 9:16 */}
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Vistas 9:16 Oficial</span>
                    <ImageIcon className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-white">{marketingAnalytics.verticalAdViews916}</div>
                  <div className="flex items-center space-x-1 text-[10px] text-teal-400">
                    <span>↑ +42%</span>
                    <span className="text-slate-400">alcance orgánico</span>
                  </div>
                </div>

                {/* 3. Citas Concretadas vía WhatsApp */}
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Citas por WhatsApp</span>
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-black text-emerald-400">{marketingAnalytics.confirmedAppointmentsFromMkt}</div>
                  <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                    <span>↑ +18%</span>
                    <span className="text-slate-400">citas pagadas</span>
                  </div>
                </div>

                {/* 4. Tasa de Conversión Real */}
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Tasa de Conversión</span>
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-indigo-300">{marketingAnalytics.realConversionRatePercent}%</div>
                  <div className="text-[10px] text-slate-400">
                    Promedio sector: 12%
                  </div>
                </div>

                {/* 5. Ingresos Generados por Marketing */}
                <div className="p-4 bg-gradient-to-br from-emerald-950 to-slate-900 rounded-2xl border border-emerald-600/50 space-y-2">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos Marketing</span>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-emerald-300">
                    ${marketingAnalytics.estimatedRevenueGeneratedMxn.toLocaleString('es-MX')} MXN
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold">
                    ROI 34.3x estimado
                  </div>
                </div>
              </div>

              {/* Canal breakdown visual bars */}
              <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/60 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Desglose de Tráfico y Conversiones por Canal
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="font-semibold">WhatsApp Directo & Enlaces Rápidos</span>
                      <span className="font-mono text-emerald-400">{marketingAnalytics.channelBreakdown.whatsapp}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2.5 rounded-full"
                        style={{ width: `${marketingAnalytics.channelBreakdown.whatsapp}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="font-semibold">Videos Promocionales 1 Minuto (Reels & Spots)</span>
                      <span className="font-mono text-teal-400">{marketingAnalytics.channelBreakdown.videoPromo}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-teal-500 h-2.5 rounded-full"
                        style={{ width: `${marketingAnalytics.channelBreakdown.videoPromo}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="font-semibold">Creatividades Verticales 9:16 (Stories)</span>
                      <span className="font-mono text-indigo-400">{marketingAnalytics.channelBreakdown.instagramStories916}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-2.5 rounded-full"
                        style={{ width: `${marketingAnalytics.channelBreakdown.instagramStories916}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span className="font-semibold">Búsqueda Directa en Directorio CitaPro MX</span>
                      <span className="font-mono text-amber-400">{marketingAnalytics.channelBreakdown.directDirectory}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-amber-400 h-2.5 rounded-full"
                        style={{ width: `${marketingAnalytics.channelBreakdown.directDirectory}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- REPORTES SEMANALES POR WHATSAPP (LUNES) --- */}
            <div className="bg-slate-800/60 rounded-3xl p-6 border border-slate-700/60 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-base font-black text-white flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Reportes Semanales por WhatsApp (Vía n8n cada Lunes)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    En lugar de obligarte a entrar a la web app, n8n te envía cada lunes un resumen ejecutivo en texto o infografía interactiva. Cada afiliado puede personalizar sus métricas y horarios.
                  </p>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer self-start md:self-auto bg-slate-900 px-3 py-1.5 rounded-full border border-slate-700">
                  <input
                    type="checkbox"
                    checked={weeklyReportSettings.autoSendActive}
                    onChange={(e) =>
                      setWeeklyReportSettings({
                        ...weeklyReportSettings,
                        autoSendActive: e.target.checked
                      })
                    }
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs text-white font-bold">
                    {weeklyReportSettings.autoSendActive ? 'Reporte Automático Activo' : 'Pausado'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Config Controls */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                        Día de Envío:
                      </label>
                      <select
                        value={weeklyReportSettings.deliveryDay}
                        onChange={(e) =>
                          setWeeklyReportSettings({
                            ...weeklyReportSettings,
                            deliveryDay: e.target.value
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Lunes">Cada Lunes (Recomendado)</option>
                        <option value="Domingo">Cada Domingo (Cierre de semana)</option>
                        <option value="Viernes">Cada Viernes</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                        Hora de Envío (WhatsApp):
                      </label>
                      <select
                        value={weeklyReportSettings.deliveryTime}
                        onChange={(e) =>
                          setWeeklyReportSettings({
                            ...weeklyReportSettings,
                            deliveryTime: e.target.value
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="08:00">08:00 AM (Inicio jornada)</option>
                        <option value="09:00">09:00 AM (Recomendado)</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="14:00">02:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block mb-1">
                      Teléfono WhatsApp de Destino:
                    </label>
                    <input
                      type="text"
                      value={weeklyReportSettings.targetWhatsAppPhone}
                      onChange={(e) =>
                        setWeeklyReportSettings({
                          ...weeklyReportSettings,
                          targetWhatsAppPhone: e.target.value
                        })
                      }
                      placeholder="+52 55 1234 5678"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2">
                    <label className="flex items-center space-x-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={weeklyReportSettings.includeInfographic}
                        onChange={(e) =>
                          setWeeklyReportSettings({
                            ...weeklyReportSettings,
                            includeInfographic: e.target.checked
                          })
                        }
                        className="w-4 h-4 rounded text-indigo-500 focus:ring-indigo-400 accent-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs text-white font-bold">
                        Incluir tarjeta infográfica visual junto con el texto
                      </span>
                    </label>
                    <p className="text-[11px] text-slate-400 pl-6 leading-relaxed">
                      n8n genera una imagen de alta resolución con tus gráficos y medallas semanales para compartir en tus historias o guardarla en tu archivo.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveWeeklySettings}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 cursor-pointer"
                    >
                      Guardar Preferencias
                    </button>
                    <button
                      type="button"
                      onClick={handleSendWeeklyReportNow}
                      disabled={isSendingWeeklyReportNow}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Probar Envío de Reporte Ahora</span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp Chat Interactive Preview */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        CP
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          CitaPro MX Bot (n8n)
                        </span>
                        <span className="text-[10px] text-emerald-400">Cuenta Comercial Oficial</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">Lunes, 09:00 AM</span>
                  </div>

                  {/* Simulated WhatsApp Bubble */}
                  <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-2xl p-4 text-xs text-slate-200 space-y-3 font-sans shadow-inner">
                    <div className="whitespace-pre-line leading-relaxed">
                      {weeklyReportSettings.sampleExecutiveSummary}
                    </div>

                    {weeklyReportSettings.includeInfographic && (
                      <div className="bg-slate-900 rounded-xl p-3 border border-emerald-600/40 text-[11px] space-y-1.5 text-center">
                        <span className="font-black text-emerald-300 block">
                          🖼️ INFOGRAFÍA RESUMEN SEMANAL (ADJUNTO)
                        </span>
                        <div className="grid grid-cols-3 gap-1 pt-1 text-[10px]">
                          <div className="bg-slate-950 p-1.5 rounded">
                            <span className="text-white font-bold block">14 Citas</span>
                            <span className="text-slate-400">concretadas</span>
                          </div>
                          <div className="bg-slate-950 p-1.5 rounded">
                            <span className="text-emerald-400 font-bold block">+2 Clientes</span>
                            <span className="text-slate-400">recurrentes</span>
                          </div>
                          <div className="bg-slate-950 p-1.5 rounded">
                            <span className="text-amber-400 font-bold block">1.2k Vistas</span>
                            <span className="text-slate-400">alcanzadas</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 text-right">09:01 AM ✓✓</div>
                  </div>

                  <p className="text-[10px] text-slate-500 text-center">
                    Vista previa de cómo recibirás cada lunes el reporte ejecutivo en tu WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
