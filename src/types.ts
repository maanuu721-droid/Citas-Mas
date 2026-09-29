export type SubscriptionPlanType = 'basico' | 'pro' | 'equipo' | 'comision';

export interface ServiceItem {
  id: string;
  name: string;
  price: number; // in MXN
  duration: number; // in minutes
  description: string;
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  dayName: string; // 'Lunes', 'Martes', etc.
  enabled: boolean;
  startTime: string; // "09:00"
  endTime: string; // "21:00"
  hasBreak?: boolean;
  breakStart?: string; // "17:00"
  breakEnd?: string; // "19:00"
}

export interface WorkingHours {
  days: number[]; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  startTime: string; // "09:00"
  endTime: string; // "19:00"
  breakStart?: string; // "14:00"
  breakEnd?: string; // "15:00"
  slotDuration: number; // in minutes (e.g. 45)
  customDaysEnabled?: boolean; // si está activo el modo de horarios diferenciados por día
  daySchedules?: DaySchedule[]; // horarios y descansos específicos para cada día de la semana
}

export interface BlockedTimeSlot {
  id: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // e.g. "14:00"
  endTime?: string; // e.g. "16:00"
  isAllDay: boolean;
  reason: string;
  createdAt: string;
}

export interface AffiliateAddressDetails {
  street?: string;
  number?: string;
  neighborhood?: string; // Barrio / Colonia / Comuna
  city?: string;
  state?: string; // Estado / Provincia / Departamento / Región
  country?: string; // e.g. "Colombia", "España", "Argentina", "Chile", "México"
  countryCode?: string; // e.g. "CO", "ES", "AR", "CL", "MX"
  postalCode?: string;
  references?: string; // Referencias de llegada o piso/oficina
  googleMapsUrl?: string;
}

export interface Affiliate {
  id: string;
  name: string;
  businessName: string;
  category: string;
  categoryLabel: string;
  description: string;
  country?: string;
  countryCode?: string;
  state: string;
  city: string;
  address: string;
  postalCode?: string;
  addressDetails?: AffiliateAddressDetails;
  lat: number;
  lng: number;
  phone: string;
  email?: string;
  logo: string;
  banner: string;
  gallery: string[];
  videoUrl?: string;
  rating: number;
  reviewCount: number;
  completedAppointments: number;
  plan: SubscriptionPlanType;
  isTurbo: boolean;
  turboLevel?: 1 | 2 | 3; // 1 = +$200 MXN, 2 = +$700 MXN, 3 = +$1,500 MXN
  turboLevelExtraCost?: number; // 200 | 700 | 1500
  isVerified: boolean;
  services: ServiceItem[];
  workingHours: WorkingHours;
  availableToday: boolean;
  availableTomorrow: boolean;
  ownerId?: string;
  ownerEmail?: string;
  monthlyMessagesSent?: number;
  blockedSlots?: BlockedTimeSlot[];
  approvalStatus?: AffiliateApprovalStatus;
  professionalDocument?: ProfessionalDocument;
  documents?: ProfessionalDocument[];
  verificationTier?: VerificationTier;
  isDestacadoSeguro?: boolean;
  buyerPersonas?: BuyerPersona[];
  marketingCampaigns?: MarketingCampaignItem[];
  publishedMarketingCampaign?: MarketingCampaignItem;
  // Advanced Marketing & Automation (n8n + WhatsApp)
  postAppointmentSettings?: PostAppointmentFollowupSettings;
  referralSettings?: ReferralGamificationSettings;
  reEngagementSettings?: ReEngagementSettings;
  marketingAnalytics?: MarketingAnalyticsSummary;
  weeklyReportSettings?: WeeklyWhatsAppReportSettings;
  n8nHub?: N8nAutomationHub;
  story?: string; // Historia de la compañía / sobre el negocio
  hasCompletedOnboarding?: boolean; // Indica si completó el flujo de iniciación la primera vez
  affiliateTierLevel?: 1 | 2 | 3; // 1 = Nivel 1 (Básico), 2 = Nivel 2 (Pro), 3 = Más Alto Nivel (Equipo/Empresa)
  freeLevel2PacksAvailable?: number; // Afiliados de más alto nivel tienen derecho a 1 pack nivel 2 sin costo extra
  freeLevel2PacksUsed?: number;
  planExpiresAt?: string;
  hasAutoPaymentCard?: boolean;
  cardLast4?: string;
  lastRenewalNoticeSentAt?: string;
  payoutClabe?: string; // 18 dígitos CLABE interbancaria mexicana para recibir pagos
  payoutBank?: string; // Nombre del banco mexicano (BBVA, Santander, Nu, etc.)
  payoutHolderName?: string; // Nombre o razón social del titular de la cuenta
  payoutRfc?: string; // RFC fiscal del titular (opcional)
  payoutSchedule?: 'weekly' | 'instant'; // 'weekly' = Semanal sin comisión (0%), 'instant' = Inmediato (1.5% comisión Stripe)
  payoutInstantFeePercent?: number; // 1.5%
  lastPayoutAt?: string;
  totalPayoutsReceivedMxn?: number;
  referredByCode?: string; // Código de promotor que refirió a este afiliado
  updatedAt?: string;
}

export interface BuyerPersona {
  id: string;
  name: string;
  ageRange: string;
  gender: string;
  specificZone: string;
  fears: string[];
  desires: string[];
  buyingTriggers: string[];
  summaryHook: string;
}

export interface MarketingCampaignItem {
  id: string;
  level: '2d_standard' | 'pro_animated' | 'premium_cinema';
  title: string;
  targetPersonaId?: string;
  targetPersonaName?: string;
  headline: string;
  subheadline: string;
  bodyCopy: string;
  callToAction: string;
  badge: string;
  priceOffer?: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceType?: string;
  costExtraMxn: number;
  n8nWebhookUrl?: string;
  n8nDispatchedAt?: string;
  n8nStatus?: 'pending' | 'success' | 'simulated';
  isPublishedOnLanding: boolean;
  status?: 'draft' | 'published_on_landing' | 'archived';
  adminApprovalStatus?: 'pending_payment' | 'paid_pending_approval' | 'authorized_dispatched' | 'rejected';
  paymentConfirmedAt?: string;
  authorizedByAdminAt?: string;
  createdAt: string;
  publishedAt?: string;
}

export interface MarketingCampaignRequest {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliatePhone: string;
  affiliateEmail?: string;
  affiliateCity?: string;
  campaignId: string;
  level: 'pro_animated' | 'premium_cinema';
  levelLabel: string;
  headline: string;
  scriptHook?: string;
  voiceType?: string;
  costExtraMxn: number;
  isFreeBenefitApplied?: boolean; // True si el afiliado de más alto nivel usa su 1 pack nivel 2 sin costo extra ($0)
  benefitReason?: string;
  affiliateTierLevel?: 1 | 2 | 3;
  paymentStatus: 'pending_payment' | 'paid_verified';
  paymentMethod?: 'tarjeta' | 'mercadopago' | 'spei';
  paymentReference?: string;
  adminApprovalStatus: 'pending_approval' | 'authorized_dispatched' | 'rejected';
  n8nWebhookUrl?: string;
  n8nDispatchedAt?: string;
  n8nStatus?: 'pending' | 'dispatched' | 'simulated';
  n8nResultSummary?: string;
  notes?: string;
  requestedAt: string;
  authorizedAt?: string;
}

// ========================================================
// ADVANCED MARKETING & AUTOMATION (VÍA n8n + WHATSAPP)
// ========================================================

export interface PostAppointmentFollowupSettings {
  followup24hEnabled: boolean;
  followup24hDelayHours: number; // typically 24
  followup24hMessage: string;
  followupMaintenanceEnabled: boolean;
  followupMaintenanceDays: number; // e.g. 30
  followupMaintenanceMessage: string;
  autoRescheduleLinkEnabled: boolean;
}

export interface ReferralGamificationSettings {
  affiliateReferralCode: string;
  referralLink: string;
  clientRewardDiscountPercent: number; // e.g. 15%
  affiliateBonusDaysPreferred: number; // e.g. 7 days
  totalReferralsTracked: number;
  gamificationPoints: number;
  tierBadge: 'Bronce' | 'Plata' | 'Oro' | 'Diamante';
  recentReferrals: {
    id: string;
    referredName: string;
    referredPhone: string;
    status: 'invited' | 'booked_paid';
    date: string;
    pointsEarned: number;
  }[];
}

export interface ReEngagementSettings {
  inactiveDaysThreshold: number; // e.g. 60 days
  aiFlashOfferDiscountPercent: number; // e.g. 20%
  aiFlashOfferMessage: string;
  validHoursOffer: number; // e.g. 48 hrs
  isActiveAutoDispatch: boolean;
  totalReEngagedClients: number;
  lastCampaignDispatchedAt?: string;
}

export interface MarketingAnalyticsSummary {
  promoVideoClicks: number;
  verticalAdViews916: number;
  whatsappInquiries: number;
  confirmedAppointmentsFromMkt: number;
  realConversionRatePercent: number; // e.g. 18.5%
  estimatedRevenueGeneratedMxn: number;
  weeklyGrowthPercent: number;
  channelBreakdown: {
    whatsapp: number;
    videoPromo: number;
    instagramStories916: number;
    directDirectory: number;
  };
}

export interface WeeklyWhatsAppReportSettings {
  deliveryDay: string; // 'Lunes'
  deliveryTime: string; // '09:00'
  targetWhatsAppPhone: string;
  includeInfographic: boolean;
  autoSendActive: boolean;
  lastReportDispatchedAt?: string;
  sampleExecutiveSummary?: string;
}

export interface N8nAutomationHub {
  webhookPostAppointment: string;
  webhookReferrals: string;
  webhookReEngagement: string;
  webhookWeeklyReport: string;
  workflowsActive: {
    postAppointment: boolean;
    referrals: boolean;
    reEngagement: boolean;
    weeklyReport: boolean;
  };
  executionLogs: {
    id: string;
    flowName: string;
    targetRecipient: string;
    status: 'success' | 'simulated' | 'pending' | 'failed';
    timestamp: string;
    details: string;
  }[];
}

export type UserRole = 'client' | 'affiliate' | 'admin' | 'promoter';
export type AffiliateApprovalStatus = 'pending_approval' | 'approved' | 'rejected';
export type VerificationTier = 'inactive' | 'active' | 'destacado_seguro';
export type DocumentType = 'cedula' | 'titulo' | 'licencia_sanitaria' | 'certificado' | 'rfc_sat';

export interface DocumentRequirementDefinition {
  type: DocumentType;
  typeLabel: string;
  shortLabel: string;
  description: string;
  issuedByExample: string;
  exampleFolio: string;
  isRequiredForDestacado: boolean;
}

export const OFFICIAL_REQUIRED_DOCUMENTS: DocumentRequirementDefinition[] = [
  {
    type: 'cedula',
    typeLabel: 'Cédula Profesional',
    shortLabel: 'Cédula SEP',
    description: 'Expedida por la Dirección General de Profesiones (SEP)',
    issuedByExample: 'SEP / Dirección General de Profesiones',
    exampleFolio: 'SEP-DGP-10948291',
    isRequiredForDestacado: true
  },
  {
    type: 'titulo',
    typeLabel: 'Título Profesional Universitario',
    shortLabel: 'Título de Grado',
    description: 'Diploma o título expedido por institución con RVOE / UNAM / IPN',
    issuedByExample: 'Universidad Nacional Autónoma de México / Institución RVOE',
    exampleFolio: 'TIT-2019-48201',
    isRequiredForDestacado: true
  },
  {
    type: 'licencia_sanitaria',
    typeLabel: 'Licencia Sanitaria / Permiso COFEPRIS',
    shortLabel: 'Licencia COFEPRIS',
    description: 'Aviso de funcionamiento o licencia para consultorio o establecimiento',
    issuedByExample: 'COFEPRIS / Secretaría de Salud Estatal',
    exampleFolio: 'COFEPRIS-AV-2024-8841',
    isRequiredForDestacado: true
  },
  {
    type: 'rfc_sat',
    typeLabel: 'Constancia de Situación Fiscal (SAT)',
    shortLabel: 'Constancia SAT (RFC)',
    description: 'Constancia de Cédula de Identificación Fiscal (CIF) activa',
    issuedByExample: 'Servicio de Administración Tributaria (SAT)',
    exampleFolio: 'SAT-CIF-940281-MX',
    isRequiredForDestacado: true
  }
];

export interface ProfessionalDocument {
  id: string;
  type: DocumentType;
  typeLabel: string;
  documentNumber: string;
  fileName: string;
  fileDataUrl?: string; // base64 or preview data
  fileSize?: string;
  issuedBy: string;
  uploadedAt: string;
  verificationNotes?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  affiliateId?: string;
  approvalStatus?: AffiliateApprovalStatus;
  professionalDocument?: ProfessionalDocument;
  documents?: ProfessionalDocument[];
  verificationTier?: VerificationTier;
  isDestacadoSeguro?: boolean;
  hasCompletedOnboarding?: boolean; // Ha completado el flujo de bienvenida e iniciación
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePayoutStatus?: 'active' | 'pending' | 'none';
  payoutClabe?: string;
  payoutBank?: string;
  payoutHolderName?: string;
  payoutSchedule?: 'weekly' | 'instant';
  referredByCode?: string; // Código del promotor que lo recomendó
  promoterCode?: string; // Código de promotor único si el usuario es promotor
  createdAt: string;
  updatedAt: string;
}

export interface PromoterProfile {
  id: string; // promoter ID / user ID
  userId: string;
  referralCode: string; // e.g. "PROMO-MARIO40", "CITAPRO-JUAN"
  name: string;
  email: string;
  phone: string;
  commissionPercent: number; // 40 (40%)
  totalEarningsMxn: number; // Histórico ganado acumulado
  currentMonthEarningsMxn: number; // Ganancias proyectadas/generadas este mes
  availableBalanceMxn: number; // Saldo disponible para retiro
  totalPaidOutMxn: number; // Ya transferido por SPEI
  payoutClabe?: string;
  payoutBank?: string;
  payoutHolderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReferredAffiliateItem {
  id: string; // ID de registro de referencia
  promoterUserId: string;
  promoterCode: string;
  affiliateId: string;
  affiliateName: string;
  businessName: string;
  affiliateEmail: string;
  affiliatePhone: string;
  categoryLabel?: string;
  registeredAt: string;
  plan: SubscriptionPlanType; // 'basico' | 'pro' | 'equipo' | 'comision'
  monthlyPriceMxn: number; // e.g. 599 o 869
  monthlyCommissionMxn: number; // 40% del pago mensual
  isSubscriptionActive: boolean; // Mientras siga pagando la suscripción
  subscriptionStatus: 'active' | 'past_due' | 'cancelled';
  lastPaymentDate: string;
  nextBillingDate: string;
  totalCommissionsGeneratedMxn: number; // Suma acumulada de comisiones del 40% de este afiliado
}

export interface PromoterPayoutRecord {
  id: string;
  promoterUserId: string;
  amountMxn: number;
  clabe: string;
  bank: string;
  holderName: string;
  status: 'completed' | 'pending';
  requestedAt: string;
  reference: string;
}

export interface WhatsAppMessageAudit {
  id: string;
  type: 'confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation' | 'rescheduled' | 'note';
  title: string;
  content: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'read';
  twilioSid?: string;
}

export interface Appointment {
  id: string;
  affiliateId: string;
  affiliateName: string;
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'refunded_partial' | 'refunded_full' | 'pending';
  paymentMethod: 'tarjeta' | 'mercadopago' | 'spei' | 'stripe';
  paidAmount: number;
  refundAmount: number;
  rescheduleCount: number;
  notes?: string;
  internalNotes?: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  stripeReceiptUrl?: string;
  whatsappMessages: WhatsAppMessageAudit[];
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  affiliateId: string;
  appointmentId: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  createdAt: string;
}

export interface MexicanState {
  code: string;
  name: string;
  cities: string[];
  lat: number;
  lng: number;
}
