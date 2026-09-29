import React, { useState, useEffect } from 'react';
import { Appointment, Affiliate, UserProfile } from '../types.ts';
import { DataService } from '../services/dataService.ts';
import {
  createWhatsAppRescheduledMessage,
  createWhatsAppCancellationMessage
} from '../utils/twilioWhatsApp.ts';
import {
  Search,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Phone,
  DollarSign,
  ArrowRight
} from 'lucide-react';

interface Props {
  affiliates: Affiliate[];
  currentUser?: UserProfile | null;
  onTriggerWhatsAppDrawer: (appointment: Appointment) => void;
}

export const ManageAppointmentView: React.FC<Props> = ({
  affiliates,
  currentUser,
  onTriggerWhatsAppDrawer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedAppointment, setSearchedAppointment] = useState<Appointment | null>(null);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto load for logged in user
  useEffect(() => {
    if (currentUser) {
      loadForCurrentUser();
    }
  }, [currentUser?.email, currentUser?.phone]);

  const loadForCurrentUser = async () => {
    if (!currentUser) return;
    try {
      const allAppointments = await DataService.getInstance().getAppointments();
      const userPhoneClean = currentUser.phone ? currentUser.phone.replace(/[^0-9]/g, '') : '';
      const userEmailClean = currentUser.email.toLowerCase();

      const matched = allAppointments.filter((a) => {
        const aptPhoneClean = a.clientPhone.replace(/[^0-9]/g, '');
        const matchesPhone = userPhoneClean && aptPhoneClean.includes(userPhoneClean.slice(-8));
        const matchesEmail = a.clientEmail && a.clientEmail.toLowerCase() === userEmailClean;
        return matchesPhone || matchesEmail;
      });

      setUserAppointments(matched);
      if (matched.length > 0 && !searchedAppointment) {
        setSearchedAppointment(matched[0]);
        setHasSearched(true);
      }
    } catch (e) {
      console.warn('Error loading user appointments:', e);
    }
  };

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('2026-09-24');
  const [newTime, setNewTime] = useState('11:00');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setHasSearched(true);
    setFeedbackMsg(null);
    setIsRescheduling(false);

    const queryClean = searchQuery.trim().toLowerCase();
    const apt = await DataService.getInstance().getAppointmentById(queryClean);

    if (apt) {
      setSearchedAppointment(apt);
    } else {
      // Try search by phone
      const allAppointments = await DataService.getInstance().getAppointments();
      const found = allAppointments.find(
        (a) => a.clientPhone.includes(queryClean) || a.id.toLowerCase() === queryClean
      );
      setSearchedAppointment(found || null);
    }
  };

  // Calculate hours remaining until appointment date & time
  const getHoursRemaining = (dateStr: string, timeStr: string) => {
    try {
      const aptDateTime = new Date(`${dateStr}T${timeStr}:00`);
      const now = new Date();
      const diffMs = aptDateTime.getTime() - now.getTime();
      return Math.round(diffMs / (1000 * 60 * 60));
    } catch {
      return 48; // fallback
    }
  };

  const hoursRemaining = searchedAppointment
    ? getHoursRemaining(searchedAppointment.date, searchedAppointment.time)
    : 0;

  const isMoreThan24Hours = hoursRemaining > 24;
  const canReschedule = isMoreThan24Hours && (searchedAppointment?.rescheduleCount || 0) < 1;

  // Handle Reschedule Action
  const handleConfirmReschedule = async () => {
    if (!searchedAppointment) return;

    const oldDate = searchedAppointment.date;
    const oldTime = searchedAppointment.time;

    const updated: Appointment = {
      ...searchedAppointment,
      date: newDate,
      time: newTime,
      rescheduleCount: (searchedAppointment.rescheduleCount || 0) + 1,
      updatedAt: new Date().toISOString()
    };

    const waMsg = createWhatsAppRescheduledMessage(updated, oldDate, oldTime);
    updated.whatsappMessages.unshift(waMsg);

    await DataService.getInstance().updateAppointment(updated);
    setSearchedAppointment(updated);
    setIsRescheduling(false);
    setFeedbackMsg({
      type: 'success',
      text: `¡Tu cita ha sido reagendada con éxito para el ${newDate} a las ${newTime} hrs! Se ha enviado la confirmación a tu WhatsApp.`
    });
    onTriggerWhatsAppDrawer(updated);
  };

  // Handle Cancel Action
  const handleCancelAppointment = async () => {
    if (!searchedAppointment) return;

    const refund = isMoreThan24Hours ? Math.round(searchedAppointment.paidAmount * 0.5) : 0;
    const confirmText = isMoreThan24Hours
      ? `¿Confirmas que deseas cancelar tu cita? Al hacerlo con más de 24h de anticipación (${hoursRemaining}h restantes), recibirás un reembolso del 50% ($${refund} MXN).`
      : `Atención: Faltan ${Math.max(0, hoursRemaining)}h para tu cita (menos de 24 horas). De acuerdo a la política de Citas Más no aplica reembolso (0%). ¿Deseas cancelar de todos modos?`;

    if (!window.confirm(confirmText)) return;

    const updated: Appointment = {
      ...searchedAppointment,
      status: 'cancelled',
      paymentStatus: isMoreThan24Hours ? 'refunded_partial' : 'paid',
      refundAmount: refund,
      updatedAt: new Date().toISOString()
    };

    const cancelMsg = createWhatsAppCancellationMessage(updated, isMoreThan24Hours ? 50 : 0, hoursRemaining);
    updated.whatsappMessages.unshift(cancelMsg);

    await DataService.getInstance().updateAppointment(updated);
    setSearchedAppointment(updated);
    setFeedbackMsg({
      type: 'success',
      text: isMoreThan24Hours
        ? `Tu cita fue cancelada. Se procesó el reembolso del 50% ($${refund} MXN) a tu método de pago y se envió el comprobante a tu WhatsApp.`
        : `Tu cita fue cancelada. Conforme a la política, no aplicó reembolso (0%). Se notificó al profesional para liberar el espacio.`
    });
    onTriggerWhatsAppDrawer(updated);
  };

  // Target affiliate
  const affiliateObj = searchedAppointment
    ? affiliates.find((a) => a.id === searchedAppointment.affiliateId)
    : null;

  return (
    <div id="manage-appointments-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Autogestión de Citas
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Consulta, Reagenda o Cancela tu Cita
        </h1>
        <p className="text-xs sm:text-sm text-slate-700">
          Ingresa tu código de cita (ej. <strong className="text-slate-900">CP-84910</strong>) o los 10 dígitos de tu número de WhatsApp registrado.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="max-w-lg mx-auto flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" />
          <input
            id="manage-search-query-input"
            type="text"
            required
            placeholder="Código (CP-84910) o teléfono WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-xs"
          />
        </div>
        <button
          id="manage-search-submit-btn"
          type="submit"
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-bold transition-colors shadow-sm"
        >
          Buscar Cita
        </button>
      </form>

      {/* Logged in user appointments list */}
      {userAppointments.length > 0 && (
        <div className="max-w-lg mx-auto space-y-2">
          <span className="text-xs font-bold text-slate-700 block">
            Tus Citas Registradas ({userAppointments.length}):
          </span>
          <div className="grid grid-cols-1 gap-2">
            {userAppointments.map((apt) => (
              <button
                key={apt.id}
                type="button"
                onClick={() => {
                  setSearchedAppointment(apt);
                  setHasSearched(true);
                  setIsRescheduling(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  searchedAppointment?.id === apt.id
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-800">{apt.id}</span>
                    <span className="font-bold text-xs text-slate-900">{apt.serviceName}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {apt.affiliateName} · {apt.date} a las {apt.time} hrs
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    apt.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : apt.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-start space-x-2.5 max-w-xl mx-auto ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{feedbackMsg.text}</p>
        </div>
      )}

      {/* Appointment Result Card */}
      {searchedAppointment ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                  #{searchedAppointment.id}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    searchedAppointment.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : searchedAppointment.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : searchedAppointment.status === 'cancelled'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  ● {searchedAppointment.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-2">
                {searchedAppointment.serviceName}
              </h2>
              <p className="text-xs text-slate-700">
                Especialista: <strong className="text-slate-900">{searchedAppointment.affiliateName}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-700 block">Total pagado por adelantado:</span>
              <span className="text-xl font-black text-slate-900">
                ${searchedAppointment.paidAmount} MXN
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold block">
                ✓ Cobro Acreditado
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-700 block mb-1">Fecha & Horario</span>
              <span className="font-bold text-slate-900 text-sm flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-emerald-600 mr-1" />
                <span>
                  {searchedAppointment.date} · {searchedAppointment.time} hrs
                </span>
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-700 block mb-1">Cliente & WhatsApp</span>
              <span className="font-bold text-slate-900 text-sm flex items-center space-x-1">
                <Phone className="w-4 h-4 text-emerald-600 mr-1" />
                <span>{searchedAppointment.clientPhone}</span>
              </span>
              <span className="text-[11px] text-slate-700 block mt-0.5">{searchedAppointment.clientName}</span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-700 block mb-1">Política de Cancelación</span>
              <div className="flex items-center space-x-1.5 mt-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900">
                  {hoursRemaining > 0 ? `${hoursRemaining}h restantes` : 'Cita concluida o pasada'}
                </span>
              </div>
            </div>
          </div>

          {/* Cancellation and Reschedule Policy Assessment Box */}
          {searchedAppointment.status !== 'cancelled' && searchedAppointment.status !== 'completed' && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-2 ${
                isMoreThan24Hours
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center space-x-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Diagnóstico de Política Citas Más para tu Cita:</span>
              </div>

              {isMoreThan24Hours ? (
                <div className="space-y-1 text-xs">
                  <p>
                    ✓ <strong>Faltan más de 24 horas</strong> para tu cita. Tienes las siguientes opciones respaldadas por la plataforma:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11.5px] text-emerald-900">
                    <li>
                      <strong>Reagendar sin costo:</strong> Tienes{' '}
                      {1 - (searchedAppointment.rescheduleCount || 0)} reagendamiento gratuito disponible.
                    </li>
                    <li>
                      <strong>Cancelar con reembolso del 50%:</strong> Se te reembolsarán{' '}
                      <strong>${Math.round(searchedAppointment.paidAmount * 0.5)} MXN</strong> directamente a tu cuenta/tarjeta de origen.
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  <p>
                    ⚠️ <strong>Faltan menos de 24 horas</strong> para tu cita ({hoursRemaining} hrs restantes).
                  </p>
                  <p className="text-[11.5px] text-amber-900">
                    Por respeto y compensación al especialista que ya reservó su consultorio y tiempo para ti,{' '}
                    <strong>no aplica reembolso (0%)</strong> ni reagendamiento directo sin nuevo pago.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Form to Reschedule */}
          {isRescheduling && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4 animate-in fade-in">
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                Selecciona la Nueva Fecha y Horario
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nueva Fecha:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Nuevo Horario:</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="10:00">10:00 hrs</option>
                    <option value="11:00">11:00 hrs</option>
                    <option value="12:30">12:30 hrs</option>
                    <option value="15:00">15:00 hrs</option>
                    <option value="16:30">16:30 hrs</option>
                    <option value="18:00">18:00 hrs</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReschedule}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
                >
                  Confirmar Nueva Fecha y Avisar por WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {searchedAppointment.status !== 'cancelled' && searchedAppointment.status !== 'completed' && !isRescheduling && (
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                {canReschedule ? (
                  <button
                    id="manage-reschedule-btn"
                    onClick={() => setIsRescheduling(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reagendar Cita (1 vez gratis)</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-700 italic">
                    {searchedAppointment.rescheduleCount && searchedAppointment.rescheduleCount >= 1
                      ? 'Ya utilizaste tu reagendamiento gratuito.'
                      : 'Reagendamiento deshabilitado (<24h).'}
                  </span>
                )}
              </div>

              <button
                id="manage-cancel-btn"
                onClick={handleCancelAppointment}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>
                  {isMoreThan24Hours
                    ? `Cancelar cita (50% reembolso: $${Math.round(searchedAppointment.paidAmount * 0.5)} MXN)`
                    : 'Cancelar cita (0% reembolso)'}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : hasSearched ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-500 text-xs space-y-2">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="font-bold text-slate-800">No encontramos ninguna cita con esos datos</p>
          <p className="text-slate-400">Verifica el código (ej. CP-84910) o tu número de WhatsApp a 10 dígitos.</p>
        </div>
      ) : (
        /* Explanatory Policy Card */
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Política Oficial de Reagendar y Cancelar Citas Más
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">1. Cancelación</h4>
              <p>
                <strong>Más de 24 horas:</strong> Reembolso del <strong>50%</strong> del monto pagado. El 50% restante cubre el apartado y costos operativos.
              </p>
              <p>
                <strong>24 horas o menos / No-show:</strong> <strong>0% de reembolso</strong>. El monto se transfiere al profesional para compensar el tiempo apartado.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">2. Reagendamiento</h4>
              <p>
                <strong>1 sola vez sin costo adicional:</strong> Siempre que se realice con más de 24 horas de antelación a la cita original.
              </p>
              <p>
                <strong>Con 24 horas o menos:</strong> No se permite reagendar directo. Deberá cancelarse y programarse una nueva sesión con nuevo pago.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
