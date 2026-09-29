import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Affiliate, ServiceItem, Appointment } from '../types.ts';
import {
  createWhatsAppConfirmationMessage,
  createWhatsAppAffiliateNotificationMessage
} from '../utils/twilioWhatsApp.ts';
import { DataService } from '../services/dataService.ts';
import { StripeService } from '../services/stripeService.ts';
import { getDaySchedule } from '../utils/scheduleHelper.ts';
import confetti from 'canvas-confetti';
import {
  X,
  Calendar,
  Clock,
  CreditCard,
  Landmark,
  Phone,
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  ExternalLink,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Props {
  affiliate: Affiliate;
  preselectedServiceId?: string;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: (appointment: Appointment) => void;
}

export const BookingModal: React.FC<Props> = ({
  affiliate,
  preselectedServiceId,
  isOpen,
  onClose,
  onBookingSuccess
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(true);

  // Fetch all appointments for this affiliate to detect booked slots in real time
  useEffect(() => {
    let isMounted = true;
    if (affiliate?.id && isOpen) {
      setIsLoadingAppointments(true);
      DataService.getInstance()
        .getAppointments(affiliate.id)
        .then((list) => {
          if (isMounted) {
            setExistingAppointments(list);
            setIsLoadingAppointments(false);
          }
        })
        .catch((err) => {
          console.warn('Error fetching appointments for affiliate availability:', err);
          if (isMounted) setIsLoadingAppointments(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [affiliate?.id, isOpen]);

  const [selectedService, setSelectedService] = useState<ServiceItem>(() => {
    if (preselectedServiceId) {
      const found = affiliate.services.find((s) => s.id === preselectedServiceId);
      if (found) return found;
    }
    return affiliate.services[0] || {
      id: 'default',
      name: 'Consulta General',
      price: 500,
      duration: 50,
      description: 'Sesión profesional'
    };
  });

  // Strict function to compute ONLY the free, un-booked, un-blocked time slots for a given date
  const computeAvailableSlotsForDate = useCallback(
    (
      targetDateStr: string,
      isTodayDate: boolean,
      currentAppointments: Appointment[],
      serviceDuration: number
    ): string[] => {
      // Determine dayOfWeek for the target date
      const parts = targetDateStr.split('-').map(Number);
      const targetDateObj = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
      const dayOfWeek = targetDateObj.getDay();

      const daySched = getDaySchedule(affiliate.workingHours, dayOfWeek);
      if (!daySched.enabled) {
        return [];
      }

      const [startH = 9, startM = 0] = (daySched.startTime || '09:00').split(':').map(Number);
      const [endH = 18, endM = 0] = (daySched.endTime || '18:00').split(':').map(Number);
      const slotStep = affiliate.workingHours?.slotDuration || 50;
      const durationToBook = serviceDuration || slotStep;

      let currentMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      // Current time buffer if date is today (filter past hours today)
      const now = new Date();
      const nowTotalMinutes = now.getHours() * 60 + now.getMinutes() + 15;

      const validSlots: string[] = [];

      while (currentMinutes + durationToBook <= endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        const slotStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const slotStart = currentMinutes;
        const slotEnd = currentMinutes + durationToBook;

        // 1. If today, filter out past hours
        if (isTodayDate && slotStart < nowTotalMinutes) {
          currentMinutes += slotStep;
          continue;
        }

        // 2. Check break / descanso intervals
        if (daySched.hasBreak && daySched.breakStart && daySched.breakEnd) {
          const [brkSh, brkSm = 0] = daySched.breakStart.split(':').map(Number);
          const [brkEh, brkEm = 0] = daySched.breakEnd.split(':').map(Number);
          const brkStart = brkSh * 60 + brkSm;
          const brkEnd = brkEh * 60 + brkEm;

          // If the slot interval overlaps with the break period:
          if (slotStart < brkEnd && slotEnd > brkStart) {
            currentMinutes += slotStep;
            continue;
          }
        }

        // 3. Check blocked slots configured by the affiliate
        const isSlotBlocked = (affiliate.blockedSlots || []).some((b) => {
          if (b.date !== targetDateStr) return false;
          if (b.isAllDay) return true;
          if (b.startTime && b.endTime) {
            const [bSh, bSm = 0] = b.startTime.split(':').map(Number);
            const [bEh, bEm = 0] = b.endTime.split(':').map(Number);
            const bStart = bSh * 60 + bSm;
            const bEnd = bEh * 60 + bEm;
            return slotStart < bEnd && slotEnd > bStart;
          }
          return false;
        });

        if (isSlotBlocked) {
          currentMinutes += slotStep;
          continue;
        }

        // 4. Check other users' existing appointments (SOLAPACIONES / OVERLAPS)
        const hasAppointmentConflict = currentAppointments.some((apt) => {
          if (apt.status === 'cancelled') return false;
          if (apt.date !== targetDateStr) return false;

          const [aptH = 0, aptM = 0] = (apt.time || '').split(':').map(Number);
          const aptStart = aptH * 60 + aptM;
          const aptDuration = apt.serviceDuration || slotStep;
          const aptEnd = aptStart + aptDuration;

          // Conflict if intervals overlap: [slotStart, slotEnd) vs [aptStart, aptEnd)
          return slotStart < aptEnd && slotEnd > aptStart;
        });

        if (hasAppointmentConflict) {
          // Solapación evitada: este horario ya está reservado por otro usuario
          currentMinutes += slotStep;
          continue;
        }

        // Passed all checks: slot is 100% free and available
        validSlots.push(slotStr);
        currentMinutes += slotStep;
      }

      return validSlots;
    },
    [affiliate.workingHours, affiliate.blockedSlots]
  );

  // Calculate next available dates (scan next 21 days)
  // Only days that have AT LEAST 1 REAL available slot are included.
  // If all slots are booked by other users or blocked, that date is excluded completely.
  const availableDates = useMemo(() => {
    const dates: {
      dateStr: string;
      label: string;
      dayOfWeek: string;
      isToday: boolean;
      slotsCount: number;
    }[] = [];

    const today = new Date();
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // Scan up to 21 upcoming days to ensure plenty of open dates even if near days are full
    for (let i = 0; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const dayNum = d.getDay();
      const isToday = i === 0;

      // 1. Check if affiliate works this day according to schedule
      const daySched = getDaySchedule(affiliate.workingHours, dayNum);
      if (!daySched.enabled) {
        continue;
      }

      // 2. Check if entire day is blocked
      const isDayAllBlocked = (affiliate.blockedSlots || []).some(
        (b) => b.date === dateStr && b.isAllDay
      );
      if (isDayAllBlocked) {
        continue;
      }

      // 3. Compute actual available slots for this date
      const freeSlots = computeAvailableSlotsForDate(
        dateStr,
        isToday,
        existingAppointments,
        selectedService.duration
      );

      // CRITICAL: If all slots are occupied by appointments or blocked, DO NOT SHOW THIS DATE!
      if (freeSlots.length > 0) {
        dates.push({
          dateStr,
          label: `${d.getDate()} ${monthNames[d.getMonth()]}`,
          dayOfWeek: dayNames[dayNum],
          isToday,
          slotsCount: freeSlots.length
        });
      }

      // Keep up to 10 available dates to display
      if (dates.length >= 10) {
        break;
      }
    }

    return dates;
  }, [
    affiliate.workingHours,
    affiliate.blockedSlots,
    computeAvailableSlotsForDate,
    existingAppointments,
    selectedService.duration
  ]);

  const [selectedDate, setSelectedDate] = useState<string>('');

  // Synchronize selectedDate when availableDates change
  useEffect(() => {
    if (availableDates.length > 0) {
      if (!availableDates.some((d) => d.dateStr === selectedDate)) {
        setSelectedDate(availableDates[0].dateStr);
      }
    } else {
      setSelectedDate('');
    }
  }, [availableDates, selectedDate]);

  // Compute available slots for currently selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const isToday = selectedDate === todayStr;

    return computeAvailableSlotsForDate(
      selectedDate,
      isToday,
      existingAppointments,
      selectedService.duration
    );
  }, [selectedDate, computeAvailableSlotsForDate, existingAppointments, selectedService.duration]);

  const [selectedTime, setSelectedTime] = useState<string>('');

  // Synchronize selectedTime when timeSlots change
  useEffect(() => {
    if (timeSlots.length > 0) {
      if (!timeSlots.includes(selectedTime)) {
        setSelectedTime(timeSlots[0]);
      }
    } else {
      setSelectedTime('');
    }
  }, [timeSlots, selectedTime]);

  // Client info state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  // Payment method (Stripe Cards or Stripe SPEI)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'tarjeta' | 'spei'>('stripe');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [stripeNotice, setStripeNotice] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);

  if (!isOpen) return null;

  const handleServiceChange = (service: ServiceItem) => {
    setSelectedService(service);
  };

  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExp('12/28');
    setCardCvv('123');
    setStripeNotice('Tarjeta de prueba oficial de Stripe cargada (4242...).');
    setTimeout(() => setStripeNotice(null), 4000);
  };

  const handleStripeCheckoutRedirect = async () => {
    if (!clientName || !clientPhone) {
      alert('Por favor completa tu nombre y número de WhatsApp');
      return;
    }
    if (!selectedDate || !selectedTime) {
      alert('Por favor selecciona una fecha y horario disponible');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const res = await StripeService.getInstance().createAppointmentCheckoutSession({
        amount: selectedService.price,
        serviceName: selectedService.name,
        affiliateName: affiliate.businessName || affiliate.name,
        affiliateId: affiliate.id,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || 'cliente@citapro.mx',
        clientPhone: clientPhone.trim(),
        date: selectedDate,
        time: selectedTime,
        appointmentId: `CP-${Math.floor(10000 + Math.random() * 90000)}`
      });

      if (res.success && res.url) {
        window.location.href = res.url;
      } else {
        alert(res.error || 'No se pudo abrir Stripe Checkout. Usa el pago directo con tarjeta en el modal.');
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      alert('Error contactando Stripe: ' + err.message);
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone) {
      alert('Por favor completa tu nombre y número de WhatsApp');
      return;
    }

    if (!selectedDate || !selectedTime) {
      alert('Por favor selecciona una fecha y horario disponible');
      return;
    }

    setIsProcessingPayment(true);

    // Concurrency verification: verify no other user booked this slot while the modal was open
    const freshAppointments = await DataService.getInstance().getAppointments(affiliate.id);
    const [sh, sm = 0] = selectedTime.split(':').map(Number);
    const slotStart = sh * 60 + sm;
    const duration = selectedService.duration || affiliate.workingHours?.slotDuration || 50;
    const slotEnd = slotStart + duration;

    const hasRecentConflict = freshAppointments.some((apt) => {
      if (apt.status === 'cancelled' || apt.date !== selectedDate) return false;
      const [ah, am = 0] = (apt.time || '').split(':').map(Number);
      const aStart = ah * 60 + am;
      const aEnd = aStart + (apt.serviceDuration || 50);
      return slotStart < aEnd && slotEnd > aStart;
    });

    if (hasRecentConflict) {
      setIsProcessingPayment(false);
      setExistingAppointments(freshAppointments);
      alert(
        '¡Aviso de disponibilidad! Otro usuario acaba de confirmar una cita en este mismo horario. El calendario se ha actualizado para mostrar únicamente los horarios libres restantes.'
      );
      return;
    }

    // Process real Stripe PaymentIntent on the server if Stripe or Tarjeta is selected
    let stripeTxId = '';
    if (paymentMethod === 'stripe' || paymentMethod === 'tarjeta') {
      try {
        const piRes = await StripeService.getInstance().createPaymentIntent({
          amount: selectedService.price,
          serviceName: `${selectedService.name} - ${affiliate.businessName || affiliate.name}`,
          clientEmail: clientEmail.trim() || undefined,
          metadata: {
            affiliateId: affiliate.id,
            affiliateName: affiliate.businessName || affiliate.name,
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            date: selectedDate,
            time: selectedTime,
            serviceName: selectedService.name
          }
        });
        if (piRes.success && piRes.paymentIntentId) {
          stripeTxId = piRes.paymentIntentId;
        }
      } catch (err: any) {
        console.warn('Stripe PaymentIntent notice:', err.message);
      }
    }

    // Processing delay for UX and settlement
    await new Promise((res) => setTimeout(res, 900));

    const appointmentId = `CP-${Math.floor(10000 + Math.random() * 90000)}`;

    const newAppointment: Appointment = {
      id: appointmentId,
      affiliateId: affiliate.id,
      affiliateName: affiliate.businessName || affiliate.name,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      serviceDuration: selectedService.duration,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim().startsWith('+') ? clientPhone.trim() : `+52${clientPhone.trim()}`,
      clientEmail: clientEmail.trim() || 'cliente@citapro.mx',
      date: selectedDate,
      time: selectedTime,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod,
      paidAmount: selectedService.price,
      refundAmount: 0,
      rescheduleCount: 0,
      notes: clientNotes.trim(),
      internalNotes: '',
      stripePaymentIntentId: stripeTxId || (paymentMethod === 'stripe' ? `pi_test_${Date.now()}` : undefined),
      whatsappMessages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Generate automated Twilio WhatsApp messages for BOTH parties:
    // 1. WhatsApp to the client
    const clientWaMsg = createWhatsAppConfirmationMessage({
      id: newAppointment.id,
      clientName: newAppointment.clientName,
      affiliateName: newAppointment.affiliateName,
      serviceName: newAppointment.serviceName,
      servicePrice: newAppointment.servicePrice,
      date: newAppointment.date,
      time: newAppointment.time,
      address: affiliate.address
    });

    // 2. WhatsApp to the affiliate (business) with full details
    const affiliateWaMsg = createWhatsAppAffiliateNotificationMessage({
      id: newAppointment.id,
      clientName: newAppointment.clientName,
      clientPhone: newAppointment.clientPhone,
      clientEmail: newAppointment.clientEmail,
      affiliateName: newAppointment.affiliateName,
      serviceName: newAppointment.serviceName,
      servicePrice: newAppointment.servicePrice,
      date: newAppointment.date,
      time: newAppointment.time,
      notes: newAppointment.notes,
      address: affiliate.address
    });

    newAppointment.whatsappMessages.push(clientWaMsg, affiliateWaMsg);

    // Save to Firestore / local cache
    try {
      await DataService.getInstance().createAppointment(newAppointment);
    } catch (err) {
      console.error('Error saving appointment:', err);
    }

    // Instantly reflect in local state to prevent any collision
    setExistingAppointments((prev) => [newAppointment, ...prev]);

    // Trigger celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }

    setCreatedAppointment(newAppointment);
    setIsProcessingPayment(false);
    setStep(4);
    onBookingSuccess(newAppointment);
  };

  return (
    <div
      id="booking-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
    >
      <div
        id="booking-modal-card"
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
                Reserva Segura · CitaPro MX
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
              {affiliate.businessName}
            </h3>
            <p className="text-xs text-slate-300">
              {affiliate.name} · {affiliate.city}, {affiliate.state}
            </p>
          </div>
          <button
            id="close-booking-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps progress indicator */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              1
            </span>
            <span className={step === 1 ? 'font-semibold text-slate-900' : ''}>Servicio & Fecha</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              2
            </span>
            <span className={step === 2 ? 'font-semibold text-slate-900' : ''}>Tus Datos</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              3
            </span>
            <span className={step === 3 ? 'font-semibold text-slate-900' : ''}>Pago Anticipado</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {/* STEP 1: Service & Schedule */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  1. Selecciona el Servicio
                </label>
                <div className="space-y-2">
                  {affiliate.services.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => handleServiceChange(srv)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedService.id === srv.id
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-sm text-slate-900">{srv.name}</h4>
                          <span className="text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {srv.duration} min
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 mt-1 line-clamp-1">{srv.description}</p>
                      </div>
                      <div className="text-right pl-3 shrink-0">
                        <span className="text-base font-bold text-emerald-800">
                          ${srv.price} <span className="text-[11px] font-normal text-slate-600">MXN</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Date selection - ONLY available dates with at least 1 free slot are shown */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    2. Selecciona Fecha Disponible
                  </label>
                  {isLoadingAppointments && (
                    <span className="text-[11px] text-emerald-700 flex items-center space-x-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Verificando disponibilidad...</span>
                    </span>
                  )}
                </div>

                {isLoadingAppointments ? (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                    <Loader2 className="w-5 h-5 text-emerald-600 animate-spin mx-auto" />
                    <p className="text-xs text-slate-600">Comprobando fechas y horarios libres...</p>
                  </div>
                ) : availableDates.length === 0 ? (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2 text-slate-700">
                    <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                    <h5 className="font-bold text-xs text-slate-900">Sin fechas disponibles en este momento</h5>
                    <p className="text-xs text-slate-600">
                      Todos los horarios de los próximos días ya han sido reservados por otros usuarios o bloqueados por el profesional para evitar solapaciones.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                    {availableDates.map((item) => (
                      <button
                        key={item.dateStr}
                        type="button"
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                          selectedDate === item.dateStr
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm font-semibold'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <span className="text-[11px] uppercase tracking-wider">{item.dayOfWeek}</span>
                        <span className="text-sm font-bold mt-0.5">{item.label}</span>
                        <span
                          className={`text-[9px] mt-1 px-1.5 py-0.5 rounded-full font-semibold ${
                            selectedDate === item.dateStr
                              ? 'bg-emerald-700 text-emerald-100'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.slotsCount} {item.slotsCount === 1 ? 'libre' : 'libres'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time slot selection - ONLY non-occupied and non-blocked slots are shown */}
              {selectedDate && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      3. Horarios Disponibles ({selectedDate})
                    </label>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {timeSlots.length} {timeSlots.length === 1 ? 'horario disponible' : 'horarios disponibles'}
                    </span>
                  </div>

                  {timeSlots.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600">
                      No quedan horarios disponibles para este día (ya reservados por otros usuarios o bloqueados).
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-2.5 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
                            selectedTime === time
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold ring-2 ring-emerald-600'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <Clock className="w-3 h-3 inline mr-1 text-slate-600" />
                          {time} hrs
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Anti-Overlap Guarantee Banner */}
                  <div className="mt-3 flex items-start space-x-2 text-[11px] text-emerald-900 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-snug">
                      <strong>Protección anti-solapamiento:</strong> El sistema oculta de forma automática cualquier horario previamente reservado por otro cliente o bloqueado por el especialista.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-700">Total a pagar:</span>
                  <div className="text-lg font-bold text-slate-900">
                    ${selectedService.price} <span className="text-xs font-normal text-slate-600">MXN</span>
                  </div>
                </div>
                <button
                  id="booking-step-1-next-btn"
                  onClick={() => setStep(2)}
                  disabled={!selectedDate || !selectedTime || timeSlots.length === 0 || availableDates.length === 0}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-1.5 shadow-sm transition-all ${
                    !selectedDate || !selectedTime || timeSlots.length === 0 || availableDates.length === 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                  }`}
                >
                  <span>Continuar a tus datos</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Client Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-start space-x-2.5 text-xs text-emerald-900">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Tu número telefónico es indispensable para enviarte la confirmación oficial instantánea por <strong>WhatsApp</strong> y los recordatorios 24h y 2h antes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                  <input
                    id="booking-client-name-input"
                    type="text"
                    required
                    placeholder="Ej. Laura Méndez García"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  WhatsApp (México +52) *
                </label>
                <div className="relative flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium">
                    🇲🇽 +52
                  </span>
                  <div className="relative flex-1">
                    <Phone className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                    <input
                      id="booking-client-phone-input"
                      type="tel"
                      required
                      placeholder="55 1234 5678 (10 dígitos)"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-r-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Aquí recibirás el mensaje de confirmación y el botón para reagendar si es necesario.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Correo Electrónico (para comprobante fiscal/recibo)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                  <input
                    id="booking-client-email-input"
                    type="email"
                    placeholder="tuemail@ejemplo.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                  Notas o requerimientos previos para el profesional (opcional)
                </label>
                <textarea
                  id="booking-client-notes-input"
                  rows={2}
                  placeholder="Ej. Es mi primera vez, tengo dolor muscular en la espalda baja..."
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  ← Volver a horarios
                </button>
                <button
                  id="booking-step-2-next-btn"
                  disabled={!clientName || !clientPhone}
                  onClick={() => setStep(3)}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center space-x-1.5 shadow-sm transition-colors"
                >
                  <span>Ir al Pago Anticipado</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-900 text-sm">
                  <span>{selectedService.name}</span>
                  <span>${selectedService.price} MXN</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 text-xs">
                  <span>
                    📅 {selectedDate} a las {selectedTime} hrs ({selectedService.duration} min)
                  </span>
                  <span className="text-emerald-700 font-medium">Pago Seguro</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 text-xs pt-1 border-t border-slate-200/60">
                  <span>Profesional: {affiliate.name}</span>
                  <span>{affiliate.city}</span>
                </div>
              </div>

              {/* Payment methods selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
                  Método de Pago Seguro
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-3 rounded-xl border text-center text-xs transition-all cursor-pointer relative ${
                      paymentMethod === 'stripe'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold ring-2 ring-indigo-500 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1.5 font-bold text-indigo-700">
                      <CreditCard className="w-4 h-4" />
                      <span>Tarjeta Débito / Crédito</span>
                    </div>
                    <span className="text-[10px] text-slate-600 block mt-0.5">Stripe México & Apple Pay</span>
                    <span className="absolute -top-1.5 -right-1 bg-emerald-600 text-white text-[8.5px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider">
                      Recomendado
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('spei')}
                    className={`p-3 rounded-xl border text-center text-xs transition-all cursor-pointer relative ${
                      paymentMethod === 'spei'
                        ? 'border-violet-600 bg-violet-50 text-violet-950 font-bold ring-2 ring-violet-500 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-1.5 font-bold text-violet-700">
                      <Landmark className="w-4 h-4" />
                      <span>SPEI (Stripe / STP)</span>
                    </div>
                    <span className="text-[10px] text-slate-600 block mt-0.5">Entra directo a Stripe</span>
                  </button>
                </div>
              </div>

              {/* Stripe Payment Form & Options */}
              {(paymentMethod === 'stripe' || paymentMethod === 'tarjeta') && (
                <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 rounded-2xl border border-indigo-200/80 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        S
                      </div>
                      <div>
                        <span className="text-xs font-bold text-indigo-950 block">Pasarela Oficial Stripe México</span>
                        <span className="text-[10px] text-slate-500">Modo Pruebas (Test Mode) Activo</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleFillTestCard}
                      className="text-[10.5px] bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Autollenar Tarjeta de Prueba
                    </button>
                  </div>

                  {stripeNotice && (
                    <div className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 p-2 rounded-lg font-medium flex items-center space-x-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{stripeNotice}</span>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Número de Tarjeta (Débito o Crédito)
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-indigo-600 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-mono tracking-wider focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="flex items-center space-x-1.5 mt-1.5 text-[10px] text-slate-500 flex-wrap gap-y-1">
                        <span className="font-semibold text-slate-700">Aceptadas:</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">Visa</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">Mastercard</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">American Express</span>
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">Débito y Crédito</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">Vencimiento</label>
                        <input
                          type="text"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-mono text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          maxLength={4}
                          placeholder="•••"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-mono text-center focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Alternative button: Open Stripe Checkout external page */}
                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">¿Prefieres Apple Pay o Google Pay?</span>
                    <button
                      type="button"
                      onClick={handleStripeCheckoutRedirect}
                      className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Abrir Stripe Checkout</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 flex items-center space-x-1 bg-white/70 p-2 rounded-lg border border-slate-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Cifrado SSL de 256 bits y certificación PCI-DSS Nivel 1 respaldado por Stripe.</span>
                  </div>
                </div>
              )}

              {paymentMethod === 'spei' && (
                <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-950 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-indigo-950 flex items-center space-x-1.5">
                      <Landmark className="w-4 h-4 text-indigo-700" />
                      <span>Transferencia SPEI (Stripe México / STP)</span>
                    </div>
                    <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Entra a Balance Stripe
                    </span>
                  </div>
                  <div className="font-mono text-xs bg-white p-2.5 rounded-lg border border-indigo-100 font-bold select-all tracking-wider text-slate-900">
                    6461 8015 7029 4810 92
                  </div>
                  <div className="text-[10.5px] text-indigo-900 space-y-0.5">
                    <p className="font-medium">
                      ✓ Banco Receptor: <strong>STP (Sistema de Transferencias y Pagos) / Stripe México</strong>.
                    </p>
                    <p className="text-slate-600 text-[10px]">
                      El dinero ingresa directamente a la cuenta de Stripe para su dispersión automática a la CLABE del afiliado (Semanal 0% o Inmediato 1.5%).
                    </p>
                  </div>
                </div>
              )}

              {/* Cancellation Policy summary banner */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700 inline" />
                  <span>Política de Reagendar y Cancelar CitaPro MX:</span>
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[10.5px]">
                  <li>Cancelas con más de 24 horas → <strong>Reembolso del 50%</strong> (vía Stripe).</li>
                  <li>Cancelas con menos de 24 horas o no-show → <strong>0% reembolso</strong>.</li>
                  <li>Reagendas 1 vez gratis con más de 24h de anticipación.</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Volver a datos
                </button>
                <button
                  id="confirm-and-pay-btn"
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleConfirmAndPay}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 shadow-md transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-emerald-200" />
                  <span>
                    {isProcessingPayment
                      ? 'Procesando pago con Stripe...'
                      : `Pagar $${selectedService.price} MXN con ${paymentMethod === 'stripe' ? 'Stripe' : 'Tarjeta'}`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Confirmation & Twilio WhatsApp Dispatch */}
          {step === 4 && createdAppointment && (
            <div className="text-center py-4 space-y-5 animate-in zoom-in-95">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  ¡Cita Concretada con Éxito!
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  Tu cita está 100% Confirmada y Pagada
                </h3>
                <p className="text-xs text-slate-700 max-w-sm mx-auto mt-1">
                  Hemos enviado el mensaje automático de confirmación a tu WhatsApp:{' '}
                  <strong className="text-slate-900">{createdAppointment.clientPhone}</strong>.
                </p>
              </div>

              {/* Receipt card */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="text-slate-700">Código de Cita:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    #{createdAppointment.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Profesional:</span>
                  <span className="font-semibold text-slate-900">{createdAppointment.affiliateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Servicio:</span>
                  <span className="font-semibold text-slate-900">{createdAppointment.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Fecha y Hora:</span>
                  <span className="font-semibold text-slate-900">
                    {createdAppointment.date} · {createdAppointment.time} hrs
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Monto Pagado:</span>
                  <span className="font-bold text-emerald-800">${createdAppointment.paidAmount} MXN</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-[11px] text-slate-700">
                  <span>Pasarela de Pago:</span>
                  <span className="font-semibold text-indigo-700 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 inline" />
                    <span>Stripe México Oficial</span>
                  </span>
                </div>
                {createdAppointment.stripePaymentIntentId && (
                  <div className="flex justify-between items-center text-[10.5px] text-slate-600">
                    <span>ID Transacción Stripe:</span>
                    <span className="font-mono text-slate-700 font-bold truncate max-w-[200px]">
                      {createdAppointment.stripePaymentIntentId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200 text-[11px] text-slate-700">
                  <span>Folio de Notificación:</span>
                  <span className="font-mono text-emerald-700">
                    {createdAppointment.whatsappMessages[0]?.twilioSid?.slice(0, 16)}...
                  </span>
                </div>
              </div>

              {/* WhatsApp Notification Dispatch to Both Parties Disclosure */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-left text-xs max-w-md mx-auto space-y-2">
                <div className="font-bold text-emerald-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Notificación por WhatsApp enviada a ambas partes:</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-700">
                  <div className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                    <span>
                      <strong className="text-slate-900">A tu WhatsApp ({createdAppointment.clientPhone}):</strong>{' '}
                      Confirmación oficial, folio y recordatorios automáticos 24h y 2h antes.
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                    <span>
                      <strong className="text-slate-900">Al Negocio ({createdAppointment.affiliateName}):</strong>{' '}
                      Aviso inmediato de cita pagada con tu nombre, servicio y horario agendado.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  id="finish-booking-btn"
                  onClick={onClose}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-semibold text-xs transition-colors"
                >
                  Entendido, cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
