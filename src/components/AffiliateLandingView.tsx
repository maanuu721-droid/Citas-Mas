import React, { useState, useEffect } from 'react';
import { Affiliate, Review, UserProfile, ServiceItem } from '../types.ts';
import { DataService } from '../services/dataService.ts';
import { BookingModal } from './BookingModal.tsx';
import { PlanCheckoutModal } from './PlanCheckoutModal.tsx';
import { AffiliateReviewSection } from './AffiliateReviewSection.tsx';
import { evaluateVerificationTier, normalizeAffiliateDocuments } from '../utils/verification.ts';
import { getWorkingHoursSummaryLines } from '../utils/scheduleHelper.ts';
import {
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  Phone,
  Video,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Award,
  FileText,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Building2,
  CreditCard,
  Lock
} from 'lucide-react';

interface Props {
  affiliate: Affiliate;
  currentUser?: UserProfile | null;
  onBack: () => void;
  onOpenBooking: (serviceId?: string) => void;
  onOpenLogin?: () => void;
  onUpdateAffiliate?: (updated: Affiliate) => void;
}

export const AffiliateLandingView: React.FC<Props> = ({
  affiliate,
  currentUser,
  onBack,
  onOpenBooking,
  onOpenLogin,
  onUpdateAffiliate
}) => {
  const [currentAffiliate, setCurrentAffiliate] = useState<Affiliate>(affiliate);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | undefined>(undefined);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

  // Direct Service Checkout Payment Panel state
  const [serviceToPay, setServiceToPay] = useState<ServiceItem | null>(null);
  const [isServiceCheckoutOpen, setIsServiceCheckoutOpen] = useState(false);
  const [servicePaymentSuccessMsg, setServicePaymentSuccessMsg] = useState('');

  useEffect(() => {
    setCurrentAffiliate(affiliate);
  }, [affiliate]);

  const evalTier = evaluateVerificationTier(currentAffiliate.documents, currentAffiliate.professionalDocument);
  const normalizedDocs = normalizeAffiliateDocuments(currentAffiliate.documents, currentAffiliate.professionalDocument);

  useEffect(() => {
    DataService.getInstance().getReviews(currentAffiliate.id).then(setReviews);
  }, [currentAffiliate.id]);

  const handleReviewAdded = (newReview: Review, updatedAff?: Affiliate) => {
    setReviews((prev) => [newReview, ...prev]);
    if (updatedAff) {
      setCurrentAffiliate(updatedAff);
      onUpdateAffiliate?.(updatedAff);
    }
  };

  const handleBookService = (serviceId?: string) => {
    setSelectedServiceId(serviceId);
    setIsBookingModalOpen(true);
  };

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return (
    <div id="affiliate-landing-page" className="min-h-screen bg-slate-50 pb-16">
      {/* Top back navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            id="back-to-explore-btn"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la búsqueda</span>
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-700 hidden sm:inline">
              Reserva oficial respaldada por
            </span>
            <span className="font-bold text-xs text-emerald-700">CitaPro MX</span>
          </div>
        </div>
      </div>

      {/* Hero / Cover Banner */}
      <div className="relative h-60 sm:h-80 w-full overflow-hidden bg-slate-900">
        <img
          src={affiliate.banner || 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=1200&auto=format&fit=crop&q=80'}
          alt={affiliate.businessName}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

        {/* Badges in hero */}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          {evalTier.isDestacadoSeguro ? (
            <span className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 px-3 py-1.5 rounded-full text-xs font-black shadow-lg border border-amber-200">
              <Award className="w-4 h-4 fill-slate-950" />
              <span>Insignia Destacado Seguro (4/4)</span>
            </span>
          ) : evalTier.isActive ? (
            <span className="inline-flex items-center space-x-1 bg-emerald-600/95 backdrop-blur-xs text-white px-3 py-1 rounded-full text-xs font-bold shadow-md border border-emerald-400/40">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Usuario Activo Verificado</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 bg-slate-800/90 text-amber-300 px-3 py-1 rounded-full text-xs font-bold shadow-md border border-amber-400/30">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>En Proceso de Activación</span>
            </span>
          )}

          {affiliate.isTurbo && (
            <span className="inline-flex items-center space-x-1 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Turbo</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Profile Info Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-20 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="flex items-start sm:items-center space-x-4">
              <img
                src={affiliate.logo || 'https://images.unsplash.com/photo-1594824813589-411a0c86e082?w=240&auto=format&fit=crop&q=80'}
                alt={affiliate.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wide">
                    {affiliate.categoryLabel || affiliate.category}
                  </span>
                  {affiliate.availableToday && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      ● Disponible Hoy
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                  {affiliate.businessName}
                </h1>
                <p className="text-sm font-medium text-slate-600 mt-0.5">{affiliate.name}</p>

                <div className="flex items-center space-x-4 text-xs text-slate-700 mt-2 flex-wrap gap-y-1">
                  <div className="flex items-center text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-current mr-1" />
                    <span>{affiliate.rating}</span>
                    <span className="text-slate-600 font-normal ml-1">
                      ({affiliate.reviewCount} reseñas)
                    </span>
                  </div>
                  <div className="flex items-center text-slate-700">
                    <MapPin className="w-4 h-4 mr-1 text-slate-600" />
                    <span>
                      {affiliate.city}, {affiliate.state}
                    </span>
                  </div>
                  <div className="flex items-center text-emerald-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    <span>{affiliate.completedAppointments} citas completadas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick action button */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                id="landing-hero-book-btn"
                onClick={() => handleBookService()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Concretar Cita</span>
              </button>
            </div>
          </div>

          {/* Grid with 2 columns: Details vs Booking sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left 2 cols */}
            <div className="lg:col-span-2 space-y-8">
              {/* Featured Published Marketing Campaign / Anuncio 2D / Video */}
              {affiliate.publishedMarketingCampaign && affiliate.publishedMarketingCampaign.isPublishedOnLanding && (
                <section
                  id="landing-featured-marketing-campaign"
                  className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 border border-emerald-500/40 shadow-xl overflow-hidden relative"
                >
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {affiliate.publishedMarketingCampaign.imageUrl && (
                      <div className="w-full md:w-56 shrink-0 aspect-square rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg bg-slate-900">
                        <img
                          src={affiliate.publishedMarketingCampaign.imageUrl}
                          alt={affiliate.publishedMarketingCampaign.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 fill-slate-950" />
                          <span>
                            {affiliate.publishedMarketingCampaign.level === '2d_standard'
                              ? 'Campaña Oficial 2D'
                              : affiliate.publishedMarketingCampaign.level === 'pro_animated'
                              ? 'Campaña Nivel Pro'
                              : 'Campaña Cinematográfica'}
                          </span>
                        </span>
                        {affiliate.publishedMarketingCampaign.badge && (
                          <span className="text-emerald-400 text-xs font-semibold">
                            ✓ {affiliate.publishedMarketingCampaign.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg md:text-xl font-black text-white leading-snug">
                        {affiliate.publishedMarketingCampaign.headline}
                      </h3>
                      {affiliate.publishedMarketingCampaign.subheadline && (
                        <p className="text-xs font-medium text-slate-300 leading-relaxed">
                          {affiliate.publishedMarketingCampaign.subheadline}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {affiliate.publishedMarketingCampaign.bodyCopy}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          id="landing-campaign-book-btn"
                          onClick={() => handleBookService()}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                        >
                          <span>
                            {affiliate.publishedMarketingCampaign.callToAction ||
                              'Agendar con esta Promoción'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        {affiliate.publishedMarketingCampaign.priceOffer && (
                          <span className="text-xs font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-800/80 px-3 py-1.5 rounded-xl">
                            {affiliate.publishedMarketingCampaign.priceOffer}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Company Story / Historia de la Compañía */}
              {affiliate.story && (
                <section className="space-y-2 p-5 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl border border-slate-200">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Nuestra Historia & Misión</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                    {affiliate.story}
                  </p>
                </section>
              )}

              {/* About description */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide text-xs">
                  Sobre el Servicio & Especialidad
                </h2>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                  {affiliate.description}
                </p>
              </section>

              {/* Acreditación Profesional & Respaldo Oficial */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Acreditación Oficial & Verificación CitaPro MX
                    </h2>
                  </div>
                  {evalTier.isDestacadoSeguro ? (
                    <span className="inline-flex items-center space-x-1 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[11px] px-2.5 py-0.5 rounded-full">
                      <Award className="w-3 h-3 text-amber-600 fill-amber-500" />
                      <span>Destacado Seguro (4/4)</span>
                    </span>
                  ) : evalTier.isActive ? (
                    <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Usuario Activo ({evalTier.count}/4)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 border border-slate-300 font-medium text-[11px] px-2.5 py-0.5 rounded-full">
                      <span>Pendiente de docs</span>
                    </span>
                  )}
                </div>

                <div
                  className={`rounded-2xl p-4 border ${
                    evalTier.isDestacadoSeguro
                      ? 'bg-gradient-to-br from-amber-50/70 via-white to-amber-100/40 border-amber-300 shadow-xs'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-3">
                    {evalTier.isDestacadoSeguro ? (
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                        <Award className="w-5 h-5 fill-slate-950" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">
                        {evalTier.isDestacadoSeguro
                          ? 'Expediente Oficial Completo y Verificado'
                          : evalTier.isActive
                          ? 'Profesional Acreditado en Plataforma'
                          : 'Expediente en Proceso'}
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {evalTier.isDestacadoSeguro
                          ? 'Este profesional cuenta con el máximo nivel de confianza: Cédula Profesional SEP, Título Universitario, Licencia Sanitaria y Constancia SAT validadas.'
                          : evalTier.isActive
                          ? 'Este profesional ha cumplido con el requisito de acreditación subiendo documentación oficial para ejercer y brindar sus servicios.'
                          : 'Para activarse plenamente en el directorio público, este profesional debe registrar al menos un documento.'}
                      </p>
                    </div>
                  </div>

                  {normalizedDocs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-200/80">
                      {normalizedDocs.map((doc, idx) => (
                        <div
                          key={doc.id || idx}
                          className="p-2.5 bg-white rounded-xl border border-slate-200/90 flex items-start space-x-2.5 shadow-2xs"
                        >
                          <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">
                              {doc.typeLabel || doc.type}
                            </span>
                            <span className="text-[11px] font-mono text-emerald-800 font-semibold block">
                              Folio: {doc.documentNumber}
                            </span>
                            {doc.issuedBy && (
                              <span className="text-[10px] text-slate-600 block truncate">
                                {doc.issuedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No se han adjuntado documentos oficiales todavía.</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Video presentation if available */}
              {affiliate.videoUrl && (
                <section className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Video className="w-4 h-4 text-emerald-600" />
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Video de Presentación
                    </h2>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-md border border-slate-200">
                    <iframe
                      src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0"
                      title="Video de presentación"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </section>
              )}

              {/* Photo Gallery */}
              {affiliate.gallery && affiliate.gallery.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Instalaciones & Trabajo Real
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {affiliate.gallery.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveGalleryIndex(idx)}
                        className={`rounded-xl overflow-hidden aspect-4/3 cursor-pointer border-2 transition-all ${
                          activeGalleryIndex === idx
                            ? 'border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-transparent hover:opacity-90'
                        }`}
                      >
                        <img src={img} alt="Instalación" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Services & Pricing List */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Servicios Disponibles & Tarifas
                  </h2>
                  <span className="text-xs text-slate-600 font-medium">Pago anticipado seguro</span>
                </div>

                <div className="space-y-3">
                  {affiliate.services.map((srv) => (
                    <div
                      key={srv.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-slate-900 text-sm">{srv.name}</h3>
                          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-slate-600" />
                            {srv.duration} min
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{srv.description}</p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-base font-bold text-slate-900">${srv.price}</span>
                          <span className="text-xs text-slate-600 ml-1">MXN</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            id={`pay-service-btn-${srv.id}`}
                            type="button"
                            onClick={() => {
                              setServiceToPay(srv);
                              setIsServiceCheckoutOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                            title={`Desplegar panel de cobro de ${srv.name}`}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pagar Servicio (${srv.price} MXN)</span>
                          </button>
                          <button
                            id={`book-service-btn-${srv.id}`}
                            type="button"
                            onClick={() => handleBookService(srv.id)}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            Pagar y Agendar Cita
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Verified Customer Reviews with Firestore Completed Appointment Validation */}
              <AffiliateReviewSection
                affiliate={currentAffiliate}
                currentUser={currentUser}
                reviews={reviews}
                onReviewAdded={handleReviewAdded}
                onOpenLogin={onOpenLogin}
              />
            </div>

            {/* Right column: Sticky Location & Policy Card */}
            <div className="space-y-5">
              {/* Location Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Ubicación & Contacto
                </h3>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">{affiliate.address}</p>
                      <p className="text-slate-600">
                        {affiliate.city}, {affiliate.state}, México
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2 pt-2 border-t border-slate-100 text-slate-700">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-tight">
                      <p className="font-semibold text-slate-900">Contacto & Confirmación por WhatsApp</p>
                      <p className="text-slate-500 mt-0.5">
                        Al concretar tu cita, el sistema enviará la confirmación automática por WhatsApp a ti y al especialista con todos los detalles.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Working hours table */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900">Horarios de Atención</h4>
                  </div>
                  <div className="text-xs space-y-1 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    {getWorkingHoursSummaryLines(affiliate.workingHours).map((line, idx) => (
                      <div key={idx} className="font-medium text-slate-800 text-[11px] leading-tight">
                        • {line}
                      </div>
                    ))}
                    <div className="pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                      Citas de {affiliate.workingHours?.slotDuration || 50} minutos con confirmación por WhatsApp
                    </div>
                  </div>
                </div>

                <button
                  id="landing-sidebar-book-btn"
                  onClick={() => handleBookService()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Concretar Cita Ahora</span>
                </button>
              </div>

              {/* Policy & Guarantee Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Política de Citas CitaPro MX</span>
                </div>
                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    Para garantizar la puntualidad de tu especialista, toda cita se confirma con el pago estipulado por adelantado.
                  </p>
                  <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-200">
                    <li>
                      <strong className="text-white">Cancelas con &gt; 24h:</strong> Se reembolsa el <strong>50%</strong> vía Stripe / tarjeta bancaria.
                    </li>
                    <li>
                      <strong className="text-white">Cancelas con &lt; 24h:</strong> 0% reembolso (se compensa al profesional).
                    </li>
                    <li>
                      <strong className="text-white">Reagendar:</strong> 1 vez gratis con más de 24 horas de antelación.
                    </li>
                  </ul>
                  <p className="text-[11px] text-emerald-300 pt-1 border-t border-slate-800">
                    ✓ Confirmación y recordatorios 24h y 2h antes automáticos vía WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <BookingModal
          affiliate={affiliate}
          preselectedServiceId={selectedServiceId}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onBookingSuccess={() => {
            // refresh data if needed
          }}
        />
      )}

      {/* Service Direct Checkout Payment Panel */}
      <PlanCheckoutModal
        isOpen={isServiceCheckoutOpen}
        service={serviceToPay}
        affiliate={currentAffiliate}
        onClose={() => {
          setIsServiceCheckoutOpen(false);
          setServiceToPay(null);
        }}
        onServicePaymentSuccess={(srv) => {
          setServicePaymentSuccessMsg(`¡Pago del servicio "${srv.name}" ($${srv.price} MXN) confirmado con éxito!`);
          setTimeout(() => setServicePaymentSuccessMsg(''), 6000);
        }}
      />

      {/* Payment Success Notification Toast */}
      {servicePaymentSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white border border-emerald-500/50 shadow-2xl px-5 py-3.5 rounded-2xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-white">{servicePaymentSuccessMsg}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">El pago ha sido registrado en la plataforma.</p>
          </div>
        </div>
      )}
    </div>
  );
};
