import React, { useState, useMemo } from 'react';
import {
  Affiliate,
  Appointment,
  BlockedTimeSlot,
  DaySchedule
} from '../types.ts';
import { DataService } from '../services/dataService.ts';
import {
  createWhatsAppDirectMessage,
  getWhatsAppDirectUrl
} from '../utils/twilioWhatsApp.ts';
import {
  DEFAULT_EXAMPLE_DAY_SCHEDULES,
  getDaySchedule,
  generateDaySlotsTimeline,
  DAY_NAMES_ES,
  DAY_SHORT_NAMES_ES,
  DaySlotInfo
} from '../utils/scheduleHelper.ts';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Unlock,
  Plus,
  Trash2,
  MessageSquare,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  FileText,
  Sparkles,
  Save,
  Info,
  CalendarDays,
  X,
  Coffee,
  Copy,
  Sliders,
  Check
} from 'lucide-react';

interface Props {
  affiliate: Affiliate;
  appointments: Appointment[];
  onUpdateAffiliate: (updated: Affiliate) => void;
  onUpdateAppointments: () => void;
  onTriggerWhatsAppDrawer: (appointment: Appointment) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const AffiliateCalendarView: React.FC<Props> = ({
  affiliate,
  appointments,
  onUpdateAffiliate,
  onUpdateAppointments,
  onTriggerWhatsAppDrawer
}) => {
  // Calendar view navigation state
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Format current date as YYYY-MM-DD
  const formatYMD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatYMD(today);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Settings & Blocking Modals/Sections
  const [showScheduleSettings, setShowScheduleSettings] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Schedule settings: flexible per-day schedules
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(() => {
    if (affiliate.workingHours.daySchedules && affiliate.workingHours.daySchedules.length > 0) {
      return affiliate.workingHours.daySchedules;
    }
    // Default example if not configured yet
    return DEFAULT_EXAMPLE_DAY_SCHEDULES.map((d) => {
      const isEnabled = affiliate.workingHours.days.includes(d.dayOfWeek);
      return {
        ...d,
        enabled: isEnabled,
        startTime: affiliate.workingHours.startTime || d.startTime,
        endTime: affiliate.workingHours.endTime || d.endTime,
        hasBreak: Boolean(affiliate.workingHours.breakStart && affiliate.workingHours.breakEnd),
        breakStart: affiliate.workingHours.breakStart || d.breakStart,
        breakEnd: affiliate.workingHours.breakEnd || d.breakEnd
      };
    });
  });

  const [slotDuration, setSlotDuration] = useState<number>(
    affiliate.workingHours.slotDuration || 50
  );
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState('');

  // Block slot form state
  const [blockDate, setBlockDate] = useState(selectedDateStr);
  const [blockIsAllDay, setBlockIsAllDay] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState('17:00');
  const [blockEndTime, setBlockEndTime] = useState('19:00');
  const [blockReason, setBlockReason] = useState('Pausa / Descanso / Asunto Personal');

  // WhatsApp Message compose state per appointment
  const [activeMessageAptId, setActiveMessageAptId] = useState<string | null>(null);
  const [customMsgText, setCustomMsgText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageFeedback, setMessageFeedback] = useState<{ id: string; text: string } | null>(null);

  // Comment edit state per appointment
  const [editingCommentAptId, setEditingCommentAptId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(formatYMD(now));
  };

  // Generate calendar grid days
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Blocked slots for the affiliate
  const blockedSlots = affiliate.blockedSlots || [];
  const selectedDateBlocks = blockedSlots.filter((b) => b.date === selectedDateStr);

  // Timeline computation for the selected date
  const selectedDateTimeline = useMemo(() => {
    return generateDaySlotsTimeline(
      affiliate.workingHours,
      selectedDateStr,
      appointments,
      blockedSlots
    );
  }, [affiliate.workingHours, selectedDateStr, appointments, blockedSlots]);

  // Appointments for the selected date
  const selectedDateAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === selectedDateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, selectedDateStr]);

  // Helper: update a single day schedule
  const handleUpdateDaySchedule = (dayOfWeek: number, patch: Partial<DaySchedule>) => {
    setDaySchedules((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d))
    );
  };

  // Helper: copy a day's schedule to all weekdays (Lunes a Viernes)
  const handleCopyMondayToFriday = (sourceDaySchedule: DaySchedule) => {
    setDaySchedules((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek >= 1 && d.dayOfWeek <= 5) {
          return {
            ...d,
            enabled: true,
            startTime: sourceDaySchedule.startTime,
            endTime: sourceDaySchedule.endTime,
            hasBreak: sourceDaySchedule.hasBreak,
            breakStart: sourceDaySchedule.breakStart,
            breakEnd: sourceDaySchedule.breakEnd
          };
        }
        return d;
      })
    );
    setScheduleFeedback('¡Horario y descanso aplicados a Lunes a Viernes!');
    setTimeout(() => setScheduleFeedback(''), 3000);
  };

  // Helper: Load exact user requested example
  const handleLoadUserExample = () => {
    setDaySchedules(DEFAULT_EXAMPLE_DAY_SCHEDULES);
    setScheduleFeedback('⚡ Horario cargado: Lun-Vie 9:00am a 9:00pm (descanso 5:00pm-7:00pm) y Sáb 9:00am a 2:00pm.');
    setTimeout(() => setScheduleFeedback(''), 4000);
  };

  // Save Working Hours Schedule in Firestore & Local cache
  const handleSaveWorkingHours = async () => {
    setIsSavingSchedule(true);
    try {
      const activeDays = daySchedules.filter((d) => d.enabled).map((d) => d.dayOfWeek);
      const monday = daySchedules.find((d) => d.dayOfWeek === 1) || daySchedules[0];

      const updatedAffiliate: Affiliate = {
        ...affiliate,
        workingHours: {
          days: activeDays.length > 0 ? activeDays : [1, 2, 3, 4, 5],
          startTime: monday?.startTime || '09:00',
          endTime: monday?.endTime || '21:00',
          slotDuration,
          breakStart: monday?.hasBreak ? monday.breakStart : undefined,
          breakEnd: monday?.hasBreak ? monday.breakEnd : undefined,
          customDaysEnabled: true,
          daySchedules
        }
      };

      await DataService.getInstance().saveAffiliate(updatedAffiliate);
      onUpdateAffiliate(updatedAffiliate);
      setScheduleFeedback('¡Horarios por día y descansos guardados exitosamente!');
      setTimeout(() => {
        setScheduleFeedback('');
        setShowScheduleSettings(false);
      }, 2500);
    } catch (err) {
      console.error(err);
      setScheduleFeedback('Ocurrió un error al guardar horarios.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Open Block Modal prefilled with slot
  const handleOpenBlockForSlot = (slot: DaySlotInfo) => {
    setBlockDate(selectedDateStr);
    setBlockIsAllDay(false);
    setBlockStartTime(slot.time);
    setBlockEndTime(slot.timeEnd);
    setBlockReason('Pausa / Descanso / Asunto Personal');
    setShowBlockModal(true);
  };

  // Add a Blocked Time Slot
  const handleAddBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBlock: BlockedTimeSlot = {
      id: `block-${Date.now()}`,
      date: blockDate,
      isAllDay: blockIsAllDay,
      startTime: blockIsAllDay ? undefined : blockStartTime,
      endTime: blockIsAllDay ? undefined : blockEndTime,
      reason: blockReason.trim() || 'Bloqueado por el especialista',
      createdAt: new Date().toISOString()
    };

    const updatedBlocks = [...blockedSlots, newBlock];
    const updatedAffiliate: Affiliate = {
      ...affiliate,
      blockedSlots: updatedBlocks
    };

    await DataService.getInstance().saveAffiliate(updatedAffiliate);
    onUpdateAffiliate(updatedAffiliate);
    setShowBlockModal(false);
  };

  // Remove a Blocked Time Slot
  const handleRemoveBlock = async (blockId: string) => {
    const updatedBlocks = blockedSlots.filter((b) => b.id !== blockId);
    const updatedAffiliate: Affiliate = {
      ...affiliate,
      blockedSlots: updatedBlocks
    };

    await DataService.getInstance().saveAffiliate(updatedAffiliate);
    onUpdateAffiliate(updatedAffiliate);
  };

  // Send Direct Message to Client via Twilio WhatsApp
  const handleSendMessageToClient = async (apt: Appointment) => {
    if (!customMsgText.trim()) return;
    setIsSendingMessage(true);

    try {
      const waMsg = createWhatsAppDirectMessage(
        apt,
        customMsgText.trim(),
        'Mensaje de tu Especialista'
      );

      const updatedAppointment: Appointment = {
        ...apt,
        whatsappMessages: [waMsg, ...(apt.whatsappMessages || [])],
        updatedAt: new Date().toISOString()
      };

      await DataService.getInstance().updateAppointment(updatedAppointment);
      onUpdateAppointments();
      onTriggerWhatsAppDrawer(updatedAppointment);

      setMessageFeedback({
        id: apt.id,
        text: '¡Mensaje despachado con éxito al WhatsApp del cliente!'
      });
      setCustomMsgText('');
      setTimeout(() => setMessageFeedback(null), 4000);
    } catch (err) {
      console.error('Error enviando mensaje WhatsApp:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Save Internal Comment / Clinical Observation
  const handleSaveInternalComment = async (apt: Appointment) => {
    setIsSavingComment(true);
    try {
      const updatedAppointment: Appointment = {
        ...apt,
        internalNotes: commentDraft.trim(),
        updatedAt: new Date().toISOString()
      };

      await DataService.getInstance().updateAppointment(updatedAppointment);
      onUpdateAppointments();
      setEditingCommentAptId(null);
    } catch (err) {
      console.error('Error guardando comentario:', err);
    } finally {
      setIsSavingComment(false);
    }
  };

  // Quick message presets
  const applyMessagePreset = (presetType: 'reminder' | 'arrival' | 'delay' | 'followup', apt: Appointment) => {
    switch (presetType) {
      case 'reminder':
        setCustomMsgText(`Hola ${apt.clientName}, te recordamos tu cita el día de hoy a las ${apt.time} hrs para ${apt.serviceName}. ¡Te esperamos en nuestro consultorio!`);
        break;
      case 'arrival':
        setCustomMsgText(`Hola ${apt.clientName}, por favor procura llegar 5 minutos antes de tu hora (${apt.time} hrs). Te recordamos traer identificación oficial y asistir puntualmente.`);
        break;
      case 'delay':
        setCustomMsgText(`Hola ${apt.clientName}, te informamos que tenemos un ligero retraso de 10 minutos. Te estaremos recibiendo aproximadamente a las ${apt.time} con atención completa.`);
        break;
      case 'followup':
        setCustomMsgText(`Hola ${apt.clientName}, un gusto haberte atendido en ${apt.affiliateName}. Si tienes alguna duda o requieres apoyo sobre tu sesión de ${apt.serviceName}, con gusto estamos para servirte.`);
        break;
    }
  };

  return (
    <div id="affiliate-calendar-workspace" className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-black text-slate-900">
              Calendario de Citas & Control de Disponibilidad
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Configura horarios y descansos por día (ej. Lun-Vie 9am-9pm con pausa 5pm-7pm, Sáb 9am-2pm), bloquea horas en 1 clic y gestiona tus citas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            id="calendar-toggle-schedule-btn"
            type="button"
            onClick={() => setShowScheduleSettings(!showScheduleSettings)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>{showScheduleSettings ? 'Ocultar Horarios por Día' : 'Configurar Horarios por Día'}</span>
          </button>

          <button
            id="calendar-block-slot-btn"
            type="button"
            onClick={() => {
              setBlockDate(selectedDateStr);
              setBlockIsAllDay(false);
              setBlockStartTime('17:00');
              setBlockEndTime('19:00');
              setShowBlockModal(true);
            }}
            className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
          >
            <Lock className="w-4 h-4" />
            <span>Bloquear Horario / Día</span>
          </button>
        </div>
      </div>

      {/* SCHEDULE SETTINGS ACCORDION: CONFIGURACIÓN DETALLADA POR DÍA */}
      {showScheduleSettings && (
        <div className="bg-white p-6 rounded-3xl border-2 border-emerald-500 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900">
                  Horarios Flexibles y Descansos por Día de la Semana
                </h3>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Puedes tener diferentes horarios según el día. Por ejemplo: de Lunes a Viernes de 9am a 9pm con descanso de 5pm a 7pm, y Sábado solo de 9am a 2pm.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleLoadUserExample}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
                title="Carga el horario: Lun-Vie 9am-9pm (descanso 5pm-7pm), Sáb 9am-2pm, Dom cerrado"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cargar Horario Recomendado</span>
              </button>

              <button
                type="button"
                onClick={() => setShowScheduleSettings(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Duración por cita global */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-xs text-slate-900 block">Duración de Bloque por Cita:</span>
              <span className="text-[11px] text-slate-500">
                Determina cada cuánto tiempo se genera un horario disponible en tu agenda.
              </span>
            </div>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
            >
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={50}>50 minutos (Recomendado)</option>
              <option value={60}>60 minutos (1 hora)</option>
              <option value={90}>90 minutos (1.5 horas)</option>
              <option value={120}>120 minutos (2 horas)</option>
            </select>
          </div>

          {/* Lista de días de la semana (Lunes a Domingo) */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">
              Configuración Día por Día (Lunes a Domingo):
            </span>

            <div className="grid grid-cols-1 gap-3">
              {/* Order: Lun (1), Mar (2), Mié (3), Jue (4), Vie (5), Sáb (6), Dom (0) */}
              {[1, 2, 3, 4, 5, 6, 0].map((dayOfWeek) => {
                const daySched = daySchedules.find((d) => d.dayOfWeek === dayOfWeek) || {
                  dayOfWeek,
                  dayName: DAY_NAMES_ES[dayOfWeek],
                  enabled: dayOfWeek !== 0,
                  startTime: '09:00',
                  endTime: dayOfWeek === 6 ? '14:00' : '21:00',
                  hasBreak: dayOfWeek >= 1 && dayOfWeek <= 5,
                  breakStart: '17:00',
                  breakEnd: '19:00'
                };

                return (
                  <div
                    key={dayOfWeek}
                    className={`p-4 rounded-2xl border transition-all ${
                      daySched.enabled
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200/60 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Day Name & Enabled Toggle */}
                      <div className="flex items-center space-x-3 w-48 shrink-0">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={daySched.enabled}
                            onChange={(e) =>
                              handleUpdateDaySchedule(dayOfWeek, { enabled: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                        <div>
                          <span className="font-black text-sm text-slate-900 block">
                            {DAY_NAMES_ES[dayOfWeek]}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              daySched.enabled ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {daySched.enabled ? 'Laborable' : 'Descanso / Cerrado'}
                          </span>
                        </div>
                      </div>

                      {/* Controls when enabled */}
                      {daySched.enabled ? (
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          {/* Horario Apertura y Cierre */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-600 block mb-1">
                              Hora de Inicio:
                            </span>
                            <input
                              type="time"
                              value={daySched.startTime}
                              onChange={(e) =>
                                handleUpdateDaySchedule(dayOfWeek, { startTime: e.target.value })
                              }
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                            />
                          </div>

                          <div>
                            <span className="text-[11px] font-bold text-slate-600 block mb-1">
                              Hora de Fin:
                            </span>
                            <input
                              type="time"
                              value={daySched.endTime}
                              onChange={(e) =>
                                handleUpdateDaySchedule(dayOfWeek, { endTime: e.target.value })
                              }
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                            />
                          </div>

                          {/* Break Toggle and Times */}
                          <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="flex items-center space-x-1.5 cursor-pointer text-[11px] font-bold text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={Boolean(daySched.hasBreak)}
                                  onChange={(e) =>
                                    handleUpdateDaySchedule(dayOfWeek, {
                                      hasBreak: e.target.checked,
                                      breakStart: daySched.breakStart || '17:00',
                                      breakEnd: daySched.breakEnd || '19:00'
                                    })
                                  }
                                  className="w-3.5 h-3.5 text-emerald-600 rounded accent-emerald-600"
                                />
                                <Coffee className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pausa / Descanso (Comida)</span>
                              </label>

                              {dayOfWeek >= 1 && dayOfWeek <= 5 && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyMondayToFriday(daySched)}
                                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center space-x-1 hover:underline"
                                  title="Copiar horario y descanso a Lunes, Martes, Miércoles, Jueves y Viernes"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar a Lun-Vie</span>
                                </button>
                              )}
                            </div>

                            {daySched.hasBreak && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Pausa Inicio:</span>
                                  <input
                                    type="time"
                                    value={daySched.breakStart || '17:00'}
                                    onChange={(e) =>
                                      handleUpdateDaySchedule(dayOfWeek, { breakStart: e.target.value })
                                    }
                                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 block">Pausa Fin:</span>
                                  <input
                                    type="time"
                                    value={daySched.breakEnd || '19:00'}
                                    onChange={(e) =>
                                      handleUpdateDaySchedule(dayOfWeek, { breakEnd: e.target.value })
                                    }
                                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 text-xs text-slate-400 italic">
                          Día marcado como no laborable. No se abrirán horarios para reservas en este día.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback & Save Bar */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {scheduleFeedback ? (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{scheduleFeedback}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Los cambios se aplicarán inmediatamente para que tus clientes agenden según tu disponibilidad real.</span>
              </div>
            )}

            <button
              type="button"
              id="save-working-hours-btn"
              onClick={handleSaveWorkingHours}
              disabled={isSavingSchedule}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingSchedule ? 'Guardando...' : 'Guardar Horarios'}</span>
            </button>
          </div>
        </div>
      )}

      {/* BLOCK MODAL: BLOQUEAR FECHA U HORARIO ESPECÍFICO */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Bloquear Horario o Día</h3>
                  <span className="text-[10px] text-slate-500">Ningún cliente podrá agendar en este intervalo</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Fecha a Bloquear:</label>
                <input
                  type="date"
                  required
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              {/* Toggle: Día Completo vs Horario Específico */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="all-day-checkbox"
                    checked={blockIsAllDay}
                    onChange={(e) => setBlockIsAllDay(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded accent-amber-600 cursor-pointer"
                  />
                  <label htmlFor="all-day-checkbox" className="font-bold text-slate-800 cursor-pointer">
                    Bloquear el día completo (no atender hoy)
                  </label>
                </div>

                {!blockIsAllDay && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-600 font-bold block mb-1">Hora Inicio:</span>
                      <input
                        type="time"
                        value={blockStartTime}
                        onChange={(e) => setBlockStartTime(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-slate-600 font-bold block mb-1">Hora Fin:</span>
                      <input
                        type="time"
                        value={blockEndTime}
                        onChange={(e) => setBlockEndTime(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Motivo / Razón del Bloqueo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Descanso de 5pm a 7pm, Asuntos personales..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Descanso 5pm - 7pm',
                    'Comida / Descanso',
                    'Asunto Personal',
                    'Cita Médica Personal',
                    'Capacitación / Congreso',
                    'Mantenimiento'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBlockReason(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  Guardar Bloqueo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: CALENDAR GRID (LEFT) + DATE DETAILS & TIMELINE (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CALENDAR GRID (6 COLS) */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 capitalize">
                {MONTH_NAMES[month]} {year}
              </h3>
              <button
                type="button"
                onClick={handleGoToday}
                className="text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAY_SHORT_NAMES_ES.map((name, i) => (
              <div
                key={name}
                className={`py-1.5 text-[11px] font-extrabold uppercase tracking-wider ${
                  i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-700'
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {/* Empty slots for starting offset */}
            {Array.from({ length: startingDayIndex }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="min-h-[70px] sm:min-h-[85px] bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 opacity-30"
              />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateObj = new Date(year, month, dayNum);
              const dateKey = formatYMD(dateObj);
              const dayOfWeek = dateObj.getDay();

              const isToday = dateKey === todayStr;
              const isSelected = dateKey === selectedDateStr;

              // Check if day is active based on schedule
              const daySched = getDaySchedule(affiliate.workingHours, dayOfWeek);
              const isWorkingDay = daySched.enabled;

              // Citas del día
              const dayAppointments = appointments.filter((a) => a.date === dateKey);
              const confirmedCount = dayAppointments.filter((a) => a.status === 'confirmed').length;
              const pendingCount = dayAppointments.filter((a) => a.status === 'pending').length;
              const completedCount = dayAppointments.filter((a) => a.status === 'completed').length;

              // Bloqueos del día
              const dayBlocks = blockedSlots.filter((b) => b.date === dateKey);
              const hasAllDayBlock = dayBlocks.some((b) => b.isAllDay);
              const hasPartialBlock = dayBlocks.some((b) => !b.isAllDay);

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDateStr(dateKey)}
                  className={`min-h-[70px] sm:min-h-[85px] p-2 rounded-2xl border text-left transition-all flex flex-col justify-between relative group cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20'
                      : isToday
                      ? 'border-slate-400 bg-slate-50'
                      : !isWorkingDay
                      ? 'border-slate-200/60 bg-slate-100/50 text-slate-400'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Day Number & Badges */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-slate-950 text-white'
                          : isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Block badge */}
                    {hasAllDayBlock ? (
                      <span
                        className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md uppercase"
                        title="Día bloqueado"
                      >
                        Bloq
                      </span>
                    ) : hasPartialBlock ? (
                      <span title="Horarios bloqueados">
                        <Lock className="w-3 h-3 text-amber-600" />
                      </span>
                    ) : null}
                  </div>

                  {/* Appointments Count Indicators */}
                  <div className="space-y-1 w-full pt-1">
                    {dayAppointments.length > 0 ? (
                      <div className="space-y-0.5">
                        {confirmedCount > 0 && (
                          <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-md truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                            <span className="truncate">{confirmedCount} conf.</span>
                          </div>
                        )}
                        {pendingCount > 0 && (
                          <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-md truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                            <span className="truncate">{pendingCount} pend.</span>
                          </div>
                        )}
                        {completedCount > 0 && (
                          <div className="flex items-center space-x-1 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-md truncate">
                            <span className="truncate">{completedCount} listos</span>
                          </div>
                        )}
                      </div>
                    ) : !isWorkingDay ? (
                      <span className="text-[10px] text-slate-400 block italic">Descanso</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block opacity-0 group-hover:opacity-100 transition-opacity">
                        Libre
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 gap-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Cita Confirmada</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-amber-200 border border-amber-400" />
                <span>Horario Bloqueado</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Coffee className="w-3 h-3 text-amber-600" />
                <span>Pausa / Descanso</span>
              </div>
            </div>
            <span>Haz clic en cualquier día para ver sus horarios</span>
          </div>
        </div>

        {/* DETAILS & TIMELINE OF SELECTED DATE (6 COLS) */}
        <div className="lg:col-span-6 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col space-y-5">
          {/* Date Header Box */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Fecha Seleccionada
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                  {selectedDateStr === todayStr ? 'Hoy, ' : ''}
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('es-MX', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Horario de este día:{' '}
                  {selectedDateTimeline.daySchedule.enabled
                    ? `${selectedDateTimeline.daySchedule.startTime} a ${selectedDateTimeline.daySchedule.endTime} hrs`
                    : 'Día de descanso (cerrado)'}
                  {selectedDateTimeline.daySchedule.hasBreak &&
                    ` · Pausa: ${selectedDateTimeline.daySchedule.breakStart} - ${selectedDateTimeline.daySchedule.breakEnd}`}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setBlockDate(selectedDateStr);
                    setBlockIsAllDay(false);
                    setBlockStartTime('17:00');
                    setBlockEndTime('19:00');
                    setShowBlockModal(true);
                  }}
                  className="px-3 py-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl border border-amber-300 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                  title="Bloquear un horario específico de este día"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bloquear Horario</span>
                </button>
              </div>
            </div>

            {/* Blocked slots banner if any */}
            {selectedDateBlocks.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {selectedDateBlocks.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="font-bold">
                          {b.isAllDay ? 'Día Completo Bloqueado' : `${b.startTime} a ${b.endTime} hrs`}
                        </span>
                        <span className="block text-[11px] text-amber-800">{b.reason}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(b.id)}
                      className="text-amber-800 hover:text-amber-950 p-1.5 rounded-lg hover:bg-amber-100 font-bold text-[11px] flex items-center space-x-1 cursor-pointer"
                      title="Desbloquear este horario"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Desbloquear</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TIMELINE OF SLOTS FOR THE SELECTED DAY */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[680px] pr-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Horarios y Citas del Día ({selectedDateTimeline.slots.length} intervalos)
              </h4>
            </div>

            {/* If the day is configured as off */}
            {selectedDateTimeline.isDayOff ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Coffee className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Día de Descanso / No Laborable</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Este día está configurado como descanso en tus horarios. Puedes activarlo o bloquearlo si lo necesitas.
                </p>
                <button
                  type="button"
                  onClick={() => setShowScheduleSettings(true)}
                  className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  Cambiar horario de este día
                </button>
              </div>
            ) : selectedDateTimeline.slots.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <CalendarDays className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No hay horarios configurados en esta fecha</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDateTimeline.slots.map((slot, sIdx) => {
                  // SLOT IS AN APPOINTMENT
                  if (slot.status === 'appointment' && slot.appointment) {
                    const apt = slot.appointment;
                    const isComposingMessage = activeMessageAptId === apt.id;
                    const isEditingComment = editingCommentAptId === apt.id;

                    return (
                      <div
                        key={`slot-apt-${sIdx}-${apt.id}`}
                        className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-4 space-y-3 hover:border-emerald-300 transition-colors shadow-xs"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-black text-slate-900">{slot.time} hrs</span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                ({apt.serviceDuration} min)
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-slate-800 mt-0.5">{apt.serviceName}</h5>
                          </div>

                          <div className="flex flex-col items-end space-y-1">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                                apt.status === 'confirmed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : apt.status === 'completed'
                                  ? 'bg-slate-200 text-slate-800'
                                  : apt.status === 'cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {apt.status === 'confirmed'
                                ? 'Confirmada'
                                : apt.status === 'completed'
                                ? 'Completada'
                                : apt.status === 'cancelled'
                                ? 'Cancelada'
                                : 'Pendiente'}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-white px-1.5 py-0.2 rounded-md border border-emerald-200">
                              ${apt.paidAmount} MXN Pagado
                            </span>
                          </div>
                        </div>

                        {/* Client details */}
                        <div className="p-2.5 bg-white rounded-xl border border-emerald-100 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                              <User className="w-3.5 h-3.5 text-slate-500" />
                              <span>{apt.clientName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">#{apt.id}</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-600 text-[11px]">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span className="font-semibold text-slate-800">{apt.clientPhone}</span>
                            </div>
                            <span>{apt.clientEmail}</span>
                          </div>
                        </div>

                        {/* WhatsApp Message direct action */}
                        <div className="pt-1 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMessageAptId(activeMessageAptId === apt.id ? null : apt.id);
                            }}
                            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center space-x-1 text-[11px]"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isComposingMessage ? 'Cerrar Mensaje' : 'Enviar WhatsApp al cliente'}</span>
                          </button>

                          <a
                            href={getWhatsAppDirectUrl(apt.clientPhone, `Hola ${apt.clientName}, te escribo respecto a tu cita en ${apt.affiliateName}.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-slate-700 text-[11px] flex items-center space-x-1"
                          >
                            <span>WhatsApp Web</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Composing Message Drawer */}
                        {isComposingMessage && (
                          <div className="space-y-2 p-3 bg-white rounded-xl border border-emerald-200 animate-in fade-in">
                            <div className="flex flex-wrap gap-1">
                              <button
                                type="button"
                                onClick={() => applyMessagePreset('reminder', apt)}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded"
                              >
                                Recordatorio
                              </button>
                              <button
                                type="button"
                                onClick={() => applyMessagePreset('arrival', apt)}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded"
                              >
                                Llegada puntual
                              </button>
                              <button
                                type="button"
                                onClick={() => applyMessagePreset('delay', apt)}
                                className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded"
                              >
                                Retraso 10m
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={customMsgText}
                              onChange={(e) => setCustomMsgText(e.target.value)}
                              placeholder={`Escribe un mensaje para ${apt.clientName}...`}
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => handleSendMessageToClient(apt)}
                                disabled={isSendingMessage || !customMsgText.trim()}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                              >
                                <Send className="w-3 h-3" />
                                <span>{isSendingMessage ? 'Enviando...' : 'Enviar Mensaje'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // SLOT IS BREAK / PAUSA DE COMIDA
                  if (slot.status === 'break') {
                    return (
                      <div
                        key={`slot-brk-${sIdx}`}
                        className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3 flex items-center justify-between text-xs text-amber-900"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                            <Coffee className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold block">
                              {slot.time} - {slot.timeEnd} hrs
                            </span>
                            <span className="text-[11px] text-amber-800">
                              {slot.label} (No disponible para clientes)
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full">
                          Pausa Horaria
                        </span>
                      </div>
                    );
                  }

                  // SLOT IS MANUALLY BLOCKED
                  if (slot.status === 'blocked') {
                    return (
                      <div
                        key={`slot-blk-${sIdx}`}
                        className="bg-slate-100 border border-slate-300 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-800"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold block">
                              {slot.time} - {slot.timeEnd} hrs
                            </span>
                            <span className="text-[11px] text-slate-600">
                              {slot.label}
                            </span>
                          </div>
                        </div>

                        {slot.blockedSlot && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBlock(slot.blockedSlot!.id)}
                            className="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg font-bold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                            title="Desbloquear este horario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Desbloquear</span>
                          </button>
                        )}
                      </div>
                    );
                  }

                  // SLOT IS AVAILABLE
                  return (
                    <div
                      key={`slot-free-${sIdx}`}
                      className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs hover:border-emerald-300 transition-colors group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="font-black text-slate-900 font-mono text-xs w-14">
                          {slot.time}
                        </span>
                        <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                          <Check className="w-3 h-3" />
                          <span>Disponible para Cita</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenBlockForSlot(slot)}
                        className="px-2.5 py-1 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-all border border-transparent hover:border-amber-300"
                        title="Bloquear este horario para que nadie lo aparte"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Bloquear Horario</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
