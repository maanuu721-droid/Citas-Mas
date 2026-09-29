import React, { useState, useEffect } from 'react';
import { Affiliate, Review, Appointment, UserProfile } from '../types.ts';
import { DataService } from '../services/dataService.ts';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  Send,
  X,
  MessageSquare,
  Search,
  Calendar,
  User,
  ThumbsUp,
  Info
} from 'lucide-react';

interface Props {
  affiliate: Affiliate;
  currentUser?: UserProfile | null;
  reviews: Review[];
  onReviewAdded: (newReview: Review, updatedAffiliate?: Affiliate) => void;
  onOpenLogin?: () => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: 'Malo - El servicio no cumplió con las expectativas mínimas',
  2: 'Regular - Tuvo deficiencias importantes en el servicio',
  3: 'Bueno - Cumplió con lo esperado de manera adecuada',
  4: 'Muy bueno - Excelente atención y profesionalismo',
  5: 'Excelente - ¡Servicio insuperable y ampliamente recomendado!'
};

export const AffiliateReviewSection: React.FC<Props> = ({
  affiliate,
  currentUser,
  reviews,
  onReviewAdded,
  onOpenLogin
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');

  // Verification step state
  const [queryCodeOrPhone, setQueryCodeOrPhone] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    eligible: boolean;
    appointment?: Appointment;
    message: string;
    alreadyReviewed?: boolean;
  } | null>(null);

  // Auto-detected completed appointments for authenticated user
  const [userCompletedAppointments, setUserCompletedAppointments] = useState<Appointment[]>([]);
  const [isLoadingUserAppointments, setIsLoadingUserAppointments] = useState(false);

  // Form submission state
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [clientDisplayName, setClientDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch eligible appointments when currentUser changes or modal opens
  useEffect(() => {
    if (isModalOpen && currentUser) {
      loadUserEligibleAppointments();
    }
  }, [isModalOpen, currentUser?.email, currentUser?.phone, affiliate.id]);

  const loadUserEligibleAppointments = async () => {
    if (!currentUser) return;
    setIsLoadingUserAppointments(true);
    try {
      const eligible = await DataService.getInstance().getCompletedAppointmentsForUser(
        affiliate.id,
        currentUser.email,
        currentUser.phone
      );
      setUserCompletedAppointments(eligible);
      if (eligible.length > 0 && !validationResult) {
        // Automatically select the first eligible completed appointment
        selectAppointmentForReview(eligible[0]);
      }
    } catch (err) {
      console.warn('Error loading user eligible appointments:', err);
    } finally {
      setIsLoadingUserAppointments(false);
    }
  };

  const handleOpenReviewModal = () => {
    setValidationResult(null);
    setSubmitError('');
    setSubmitSuccess(false);
    setComment('');
    setRating(5);
    setIsModalOpen(true);
  };

  const handleValidateAppointment = async (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : queryCodeOrPhone).trim();
    if (!q) {
      setValidationResult({
        eligible: false,
        message: 'Por favor ingresa tu Folio de Cita (ej. CP-63019) o el teléfono con el que reservaste.'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setSubmitError('');

    try {
      const res = await DataService.getInstance().validateAppointmentForReview(affiliate.id, q);
      setValidationResult(res);
      if (res.eligible && res.appointment) {
        setClientDisplayName(res.appointment.clientName || currentUser?.displayName || 'Cliente Verificado');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setValidationResult({
        eligible: false,
        message: 'Ocurrió un error al verificar tu cita. Por favor intenta de nuevo.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const selectAppointmentForReview = (apt: Appointment) => {
    setValidationResult({
      eligible: true,
      appointment: apt,
      message: `¡Cita completada y verificada! (Folio: ${apt.id} - ${apt.serviceName}). Puedes redactar tu reseña.`
    });
    setClientDisplayName(apt.clientName || currentUser?.displayName || 'Cliente Verificado');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult?.eligible || !validationResult.appointment) {
      setSubmitError('Debes validar una cita completada antes de publicar tu reseña.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setSubmitError('El comentario debe contener al menos 10 caracteres describiendo tu experiencia.');
      return;
    }

    if (comment.length > 1000) {
      setSubmitError('El comentario no puede exceder 1,000 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      affiliateId: affiliate.id,
      appointmentId: validationResult.appointment.id,
      clientName: clientDisplayName.trim() || validationResult.appointment.clientName,
      rating,
      comment: comment.trim(),
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    try {
      const result = await DataService.getInstance().submitVerifiedReview(newReview);
      if (result.success) {
        setSubmitSuccess(true);
        onReviewAdded(newReview, result.updatedAffiliate);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess(false);
        }, 2200);
      } else {
        setSubmitError(result.error || 'Error al registrar la reseña.');
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setSubmitError(err instanceof Error ? err.message : 'Error inesperado al guardar la reseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter reviews by rating
  const filteredReviews = reviews.filter((r) => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  // Calculate rating stats
  const totalReviews = reviews.length;
  const ratingDistribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    if (ratingDistribution[r.rating] !== undefined) {
      ratingDistribution[r.rating]++;
    }
  });

  return (
    <section className="space-y-5" id="affiliate-reviews-section">
      {/* Header with Title & Stats Overview */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Reseñas Verificadas de Clientes
              </h2>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Solo Citas Completadas</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Garantía de transparencia: cada reseña está vinculada y auditada a una cita efectivamente realizada.
            </p>
          </div>

          {/* Action button to leave a review */}
          <button
            id="open-write-review-modal-btn"
            onClick={handleOpenReviewModal}
            className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
          >
            <Star className="w-4 h-4 fill-white" />
            <span>Calificar Servicio</span>
          </button>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 items-center">
          {/* Main Average Score */}
          <div className="flex flex-col items-center justify-center sm:border-r border-slate-100 pr-4">
            <div className="text-4xl font-black text-slate-900 tracking-tight flex items-baseline space-x-1">
              <span>{affiliate.rating.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-600">/ 5.0</span>
            </div>
            <div className="flex items-center text-amber-400 my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(affiliate.rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 fill-slate-100'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-600 font-medium">
              Basado en {totalReviews} {totalReviews === 1 ? 'reseña real' : 'reseñas reales'}
            </span>
          </div>

          {/* Star bars */}
          <div className="md:col-span-2 space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingDistribution[stars] || 0;
              const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center space-x-2 text-xs">
                  <span className="w-12 font-medium text-slate-700 flex items-center justify-end space-x-1">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
                  </span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-[11px] text-slate-600 font-mono text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center space-x-2 pt-4 mt-4 border-t border-slate-100 flex-wrap gap-y-2">
          <span className="text-xs text-slate-600 font-medium mr-1">Filtrar por:</span>
          <button
            onClick={() => setFilterRating('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              filterRating === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todas ({totalReviews})
          </button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <button
              key={stars}
              onClick={() => setFilterRating(stars)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors ${
                filterRating === stars
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{stars}</span>
              <Star className="w-3 h-3 fill-current" />
              <span className="text-[10px] text-slate-600">({ratingDistribution[stars] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Sin reseñas en este filtro</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Si tuviste una cita con {affiliate.businessName}, puedes ser el primero en compartir tu experiencia validando tu folio completado.
            </p>
            <button
              onClick={handleOpenReviewModal}
              className="mt-2 inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Publicar primera reseña verificada</span>
            </button>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs hover:border-slate-300 transition-all space-y-2.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                    {rev.clientName ? rev.clientName.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">{rev.clientName}</span>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Cita Verificada</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono">
                      Cita #{rev.appointmentId} · Publicado el {rev.date}
                    </span>
                  </div>
                </div>

                {/* Stars */}
                <div className="flex items-center text-amber-400 shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Comment text */}
              <p className="text-xs text-slate-700 leading-relaxed pl-12 italic border-l-2 border-slate-100">
                "{rev.comment}"
              </p>
            </div>
          ))
        )}
      </div>

      {/* WRITE REVIEW MODAL (WITH COMPLETED APPOINTMENT VALIDATION IN FIRESTORE) */}
      {isModalOpen && (
        <div
          id="review-modal-backdrop"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 relative">
              <button
                id="close-review-modal-btn"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verificación de Autenticidad</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Calificar a {affiliate.businessName}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Para evitar reseñas falsas o no verificadas, únicamente los pacientes con cita completada en la plataforma pueden calificar.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              {submitSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-base text-emerald-950">
                    ¡Reseña Publicada con Éxito!
                  </h4>
                  <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                    Tu calificación de {rating} estrellas y comentario han sido registrados y verificados para {affiliate.businessName}.
                  </p>
                </div>
              ) : (
                <>
                  {/* STEP 1: VALIDATE COMPLETED APPOINTMENT */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px] font-mono">
                          1
                        </span>
                        <span>Comprobación de Cita Completada</span>
                      </span>

                      {validationResult?.eligible && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Cita Aprobada</span>
                        </span>
                      )}
                    </div>

                    {/* If user has pre-detected completed appointments in Firestore */}
                    {currentUser && userCompletedAppointments.length > 0 && !validationResult?.eligible && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                        <span className="text-xs font-bold text-emerald-900 block">
                          Citas completadas registradas con tu cuenta ({currentUser.email}):
                        </span>
                        <div className="space-y-1.5">
                          {userCompletedAppointments.map((apt) => (
                            <button
                              key={apt.id}
                              type="button"
                              onClick={() => selectAppointmentForReview(apt)}
                              className="w-full text-left p-2.5 bg-white border border-emerald-200 hover:border-emerald-400 rounded-lg text-xs flex items-center justify-between transition-all group"
                            >
                              <div>
                                <span className="font-bold text-slate-900 block group-hover:text-emerald-700">
                                  {apt.serviceName}
                                </span>
                                <span className="text-[11px] text-slate-600">
                                  Fecha: {apt.date} · Folio: <span className="font-mono font-semibold">{apt.id}</span>
                                </span>
                              </div>
                              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                                Seleccionar ✓
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manual input for Folio or Phone */}
                    {!validationResult?.eligible ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              id="appointment-query-input"
                              type="text"
                              value={queryCodeOrPhone}
                              onChange={(e) => setQueryCodeOrPhone(e.target.value)}
                              placeholder="Folio de cita (ej. CP-63019) o teléfono"
                              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                            />
                          </div>
                          <button
                            id="verify-appointment-btn"
                            type="button"
                            onClick={() => handleValidateAppointment()}
                            disabled={isValidating}
                            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-colors shadow-xs"
                          >
                            {isValidating ? (
                              <span>Validando...</span>
                            ) : (
                              <>
                                <Search className="w-3.5 h-3.5" />
                                <span>Verificar</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Quick testing demo chips */}
                        <div className="flex items-center space-x-2 text-[11px] text-slate-600 flex-wrap gap-y-1">
                          <span className="font-medium text-slate-600">Probar folio de demo:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setQueryCodeOrPhone('CP-63019');
                              handleValidateAppointment('CP-63019');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold px-2 py-0.5 rounded-md transition-colors"
                          >
                            CP-63019 (Completada)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQueryCodeOrPhone('CP-55201');
                              handleValidateAppointment('CP-55201');
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold px-2 py-0.5 rounded-md transition-colors"
                          >
                            CP-55201 (Completada)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQueryCodeOrPhone('CP-77102');
                              handleValidateAppointment('CP-77102');
                            }}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-mono px-2 py-0.5 rounded-md transition-colors"
                            title="Prueba con una cita que aún está en estado confirmada pero no completada"
                          >
                            CP-77102 (Confirmada / No completada)
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display confirmed appointment badge */
                      <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-bold text-xs text-emerald-950">
                              Cita #{validationResult.appointment?.id} - Verificada como COMPLETADA
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 pl-5.5">
                            Servicio: <span className="font-semibold">{validationResult.appointment?.serviceName}</span> · Fecha: {validationResult.appointment?.date} ({validationResult.appointment?.time} hrs)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setValidationResult(null);
                            setQueryCodeOrPhone('');
                          }}
                          className="text-[11px] text-slate-600 hover:text-slate-800 underline font-medium"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}

                    {/* Feedback message for appointment validation */}
                    {validationResult && !validationResult.eligible && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                          validationResult.alreadyReviewed
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <AlertCircle
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            validationResult.alreadyReviewed ? 'text-blue-600' : 'text-amber-600'
                          }`}
                        />
                        <div className="space-y-1">
                          <p className="leading-relaxed font-medium">{validationResult.message}</p>
                          {validationResult.appointment && validationResult.appointment.status !== 'completed' && (
                            <p className="text-[11px] text-slate-600">
                              Consejo: Puedes ingresar al panel de citas o contactar al profesional para que marque el servicio como concluido.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: REVIEW STARS & COMMENT (ENABLED ONLY WHEN VALIDATED) */}
                  <form onSubmit={handleSubmitReview} className="space-y-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px] font-mono">
                        2
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Calificación y Opinión
                      </span>
                    </div>

                    {!validationResult?.eligible ? (
                      <div className="p-4 bg-slate-100/60 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
                        <LockIndicator />
                        <span className="block mt-1 font-medium">
                          Completa el paso 1 verificando tu cita para habilitar el formulario de calificación.
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Interactive Star Selection */}
                        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                          <label className="block text-xs font-bold text-slate-800">
                            ¿Cómo calificarías tu experiencia general?
                          </label>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                className="p-1 focus:outline-hidden transform hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`w-7 h-7 ${
                                    star <= (hoverRating || rating)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300 fill-slate-100'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-medium text-amber-700 block">
                            {RATING_DESCRIPTIONS[hoverRating || rating]}
                          </span>
                        </div>

                        {/* Client Name Input */}
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-800">
                            Tu Nombre para la Reseña:
                          </label>
                          <input
                            type="text"
                            value={clientDisplayName}
                            onChange={(e) => setClientDisplayName(e.target.value)}
                            placeholder="Ej. Carlos M. o tu nombre completo"
                            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                          />
                        </div>

                        {/* Comment Textarea */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <label className="font-bold text-slate-800">
                              Tu Comentario u Opinión Detallada:
                            </label>
                            <span
                              className={`text-[11px] font-mono ${
                                comment.length >= 10 ? 'text-emerald-700' : 'text-slate-600'
                              }`}
                            >
                              {comment.length} / 1000 caracteres (mín. 10)
                            </span>
                          </div>
                          <textarea
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Describe la puntualidad, profesionalismo, resultados del servicio y las instalaciones..."
                            className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
                          />
                        </div>

                        {/* Error Message */}
                        {submitError && (
                          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          id="submit-verified-review-btn"
                          type="submit"
                          disabled={isSubmitting || comment.trim().length < 10}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                        >
                          {isSubmitting ? (
                            <span>Guardando...</span>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Publicar Reseña Verificada</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const LockIndicator: React.FC = () => (
  <div className="flex items-center justify-center space-x-1 text-slate-600 mb-1">
    <ShieldCheck className="w-4 h-4 text-slate-600" />
    <span className="font-semibold text-xs text-slate-700">Validación Requerida</span>
  </div>
);
