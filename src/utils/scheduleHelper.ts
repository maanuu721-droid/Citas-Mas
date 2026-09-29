import { WorkingHours, DaySchedule, BlockedTimeSlot, Appointment } from '../types.ts';

export const DAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export const DAY_SHORT_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/**
 * Plantilla inicial con el ejemplo solicitado:
 * - Lunes a Viernes: 09:00 a 21:00 con descanso de 17:00 a 19:00
 * - Sábado: 09:00 a 14:00 sin descanso
 * - Domingo: Descanso / cerrado
 */
export const DEFAULT_EXAMPLE_DAY_SCHEDULES: DaySchedule[] = [
  {
    dayOfWeek: 1,
    dayName: 'Lunes',
    enabled: true,
    startTime: '09:00',
    endTime: '21:00',
    hasBreak: true,
    breakStart: '17:00',
    breakEnd: '19:00'
  },
  {
    dayOfWeek: 2,
    dayName: 'Martes',
    enabled: true,
    startTime: '09:00',
    endTime: '21:00',
    hasBreak: true,
    breakStart: '17:00',
    breakEnd: '19:00'
  },
  {
    dayOfWeek: 3,
    dayName: 'Miércoles',
    enabled: true,
    startTime: '09:00',
    endTime: '21:00',
    hasBreak: true,
    breakStart: '17:00',
    breakEnd: '19:00'
  },
  {
    dayOfWeek: 4,
    dayName: 'Jueves',
    enabled: true,
    startTime: '09:00',
    endTime: '21:00',
    hasBreak: true,
    breakStart: '17:00',
    breakEnd: '19:00'
  },
  {
    dayOfWeek: 5,
    dayName: 'Viernes',
    enabled: true,
    startTime: '09:00',
    endTime: '21:00',
    hasBreak: true,
    breakStart: '17:00',
    breakEnd: '19:00'
  },
  {
    dayOfWeek: 6,
    dayName: 'Sábado',
    enabled: true,
    startTime: '09:00',
    endTime: '14:00',
    hasBreak: false,
    breakStart: '13:00',
    breakEnd: '14:00'
  },
  {
    dayOfWeek: 0,
    dayName: 'Domingo',
    enabled: false,
    startTime: '10:00',
    endTime: '14:00',
    hasBreak: false
  }
];

/**
 * Obtiene el horario efectivo para un día de la semana específico
 */
export function getDaySchedule(workingHours: WorkingHours | undefined, dayOfWeek: number): DaySchedule {
  if (!workingHours) {
    return {
      dayOfWeek,
      dayName: DAY_NAMES_ES[dayOfWeek] || 'Día',
      enabled: [1, 2, 3, 4, 5].includes(dayOfWeek),
      startTime: '09:00',
      endTime: '18:00',
      hasBreak: false
    };
  }

  // Si tiene daySchedules y customDaysEnabled (o tiene configuraciones guardadas)
  if (workingHours.daySchedules && workingHours.daySchedules.length > 0) {
    const found = workingHours.daySchedules.find((d) => d.dayOfWeek === dayOfWeek);
    if (found) {
      return {
        ...found,
        dayName: DAY_NAMES_ES[dayOfWeek] || found.dayName || 'Día'
      };
    }
  }

  // Fallback con la configuración global
  const isEnabled = (workingHours.days || [1, 2, 3, 4, 5]).includes(dayOfWeek);
  return {
    dayOfWeek,
    dayName: DAY_NAMES_ES[dayOfWeek] || 'Día',
    enabled: isEnabled,
    startTime: workingHours.startTime || '09:00',
    endTime: workingHours.endTime || '18:00',
    hasBreak: Boolean(workingHours.breakStart && workingHours.breakEnd),
    breakStart: workingHours.breakStart || '14:00',
    breakEnd: workingHours.breakEnd || '15:00'
  };
}

export interface DaySlotInfo {
  time: string; // "09:00"
  timeEnd: string; // "09:50"
  slotMinutesStart: number;
  slotMinutesEnd: number;
  status: 'available' | 'appointment' | 'blocked' | 'break';
  label: string;
  appointment?: Appointment;
  blockedSlot?: BlockedTimeSlot;
}

/**
 * Genera todos los slots para un día específico considerando:
 * - Horario de inicio y fin de ese día de la semana
 * - Pausa de descanso si aplica
 * - Citas agendadas
 * - Bloqueos manuales de horario (parciales o día completo)
 */
export function generateDaySlotsTimeline(
  workingHours: WorkingHours | undefined,
  targetDateStr: string,
  appointments: Appointment[],
  blockedSlots: BlockedTimeSlot[],
  serviceDurationOverride?: number
): {
  daySchedule: DaySchedule;
  slots: DaySlotInfo[];
  isDayOff: boolean;
  allDayBlock?: BlockedTimeSlot;
} {
  // Parse target date to get dayOfWeek
  const parts = targetDateStr.split('-').map(Number);
  const dateObj = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  const dayOfWeek = dateObj.getDay();

  const daySchedule = getDaySchedule(workingHours, dayOfWeek);
  const slotDuration = serviceDurationOverride || workingHours?.slotDuration || 50;

  // Check if all day block exists
  const allDayBlock = blockedSlots.find((b) => b.date === targetDateStr && b.isAllDay);

  if (!daySchedule.enabled) {
    return {
      daySchedule,
      slots: [],
      isDayOff: true,
      allDayBlock
    };
  }

  const [startH = 9, startM = 0] = (daySchedule.startTime || '09:00').split(':').map(Number);
  const [endH = 18, endM = 0] = (daySchedule.endTime || '18:00').split(':').map(Number);

  let curMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  const slots: DaySlotInfo[] = [];

  // Parse break times if any
  let brkStart = -1;
  let brkEnd = -1;
  if (daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd) {
    const [bSh = 0, bSm = 0] = daySchedule.breakStart.split(':').map(Number);
    const [bEh = 0, bEm = 0] = daySchedule.breakEnd.split(':').map(Number);
    brkStart = bSh * 60 + bSm;
    brkEnd = bEh * 60 + bEm;
  }

  // Filter day appointments & blocks
  const dayAppointments = appointments.filter(
    (a) => a.date === targetDateStr && a.status !== 'cancelled'
  );
  const dayBlocks = blockedSlots.filter((b) => b.date === targetDateStr);

  while (curMinutes + slotDuration <= endMinutes) {
    const slotStart = curMinutes;
    const slotEnd = curMinutes + slotDuration;

    const startHStr = String(Math.floor(slotStart / 60)).padStart(2, '0');
    const startMStr = String(slotStart % 60).padStart(2, '0');
    const endHStr = String(Math.floor(slotEnd / 60)).padStart(2, '0');
    const endMStr = String(slotEnd % 60).padStart(2, '0');

    const time = `${startHStr}:${startMStr}`;
    const timeEnd = `${endHStr}:${endMStr}`;

    // 1. Is All Day Blocked?
    if (allDayBlock) {
      slots.push({
        time,
        timeEnd,
        slotMinutesStart: slotStart,
        slotMinutesEnd: slotEnd,
        status: 'blocked',
        label: `Bloqueado (Día completo): ${allDayBlock.reason}`,
        blockedSlot: allDayBlock
      });
      curMinutes += slotDuration;
      continue;
    }

    // 2. Is Break Interval?
    if (brkStart >= 0 && brkEnd > brkStart) {
      if (slotStart < brkEnd && slotEnd > brkStart) {
        slots.push({
          time,
          timeEnd,
          slotMinutesStart: slotStart,
          slotMinutesEnd: slotEnd,
          status: 'break',
          label: `☕ Descanso / Comida (${daySchedule.breakStart} - ${daySchedule.breakEnd})`
        });
        curMinutes += slotDuration;
        continue;
      }
    }

    // 3. Is Manual Block for this interval?
    const blockMatch = dayBlocks.find((b) => {
      if (b.isAllDay) return true;
      if (b.startTime && b.endTime) {
        const [bSh = 0, bSm = 0] = b.startTime.split(':').map(Number);
        const [bEh = 0, bEm = 0] = b.endTime.split(':').map(Number);
        const bStartMin = bSh * 60 + bSm;
        const bEndMin = bEh * 60 + bEm;
        return slotStart < bEndMin && slotEnd > bStartMin;
      }
      return false;
    });

    if (blockMatch) {
      slots.push({
        time,
        timeEnd,
        slotMinutesStart: slotStart,
        slotMinutesEnd: slotEnd,
        status: 'blocked',
        label: `🔒 Bloqueado: ${blockMatch.reason}`,
        blockedSlot: blockMatch
      });
      curMinutes += slotDuration;
      continue;
    }

    // 4. Has Appointment Conflict?
    const aptMatch = dayAppointments.find((a) => {
      const [aH = 0, aM = 0] = (a.time || '').split(':').map(Number);
      const aStart = aH * 60 + aM;
      const aDur = a.serviceDuration || slotDuration;
      const aEnd = aStart + aDur;
      return slotStart < aEnd && slotEnd > aStart;
    });

    if (aptMatch) {
      slots.push({
        time,
        timeEnd,
        slotMinutesStart: slotStart,
        slotMinutesEnd: slotEnd,
        status: 'appointment',
        label: `Cita: ${aptMatch.clientName} (${aptMatch.serviceName})`,
        appointment: aptMatch
      });
      curMinutes += slotDuration;
      continue;
    }

    // 5. Free / Available
    slots.push({
      time,
      timeEnd,
      slotMinutesStart: slotStart,
      slotMinutesEnd: slotEnd,
      status: 'available',
      label: 'Disponible para Cita'
    });

    curMinutes += slotDuration;
  }

  return {
    daySchedule,
    slots,
    isDayOff: false,
    allDayBlock
  };
}

/**
 * Resumen formateado en español para mostrar en la Landing o panel
 */
export function getWorkingHoursSummaryLines(workingHours: WorkingHours | undefined): string[] {
  if (!workingHours) return ['Lunes a Viernes: 09:00 - 18:00 hrs'];

  if (workingHours.daySchedules && workingHours.daySchedules.length > 0) {
    const lines: string[] = [];
    const activeSchedules = workingHours.daySchedules.filter((d) => d.enabled);

    if (activeSchedules.length === 0) {
      return ['Horarios no configurados temporalmente'];
    }

    // Group Monday to Friday if identical
    const mf = activeSchedules.filter((d) => d.dayOfWeek >= 1 && d.dayOfWeek <= 5);
    const isMfIdentical =
      mf.length === 5 &&
      mf.every(
        (d) =>
          d.startTime === mf[0].startTime &&
          d.endTime === mf[0].endTime &&
          d.hasBreak === mf[0].hasBreak &&
          d.breakStart === mf[0].breakStart &&
          d.breakEnd === mf[0].breakEnd
      );

    if (isMfIdentical) {
      const first = mf[0];
      const breakText = first.hasBreak && first.breakStart && first.breakEnd
        ? ` (descanso ${first.breakStart} - ${first.breakEnd})`
        : '';
      lines.push(`Lun - Vie: ${first.startTime} - ${first.endTime} hrs${breakText}`);

      // Check Saturday
      const sat = activeSchedules.find((d) => d.dayOfWeek === 6);
      if (sat) {
        const satBreak = sat.hasBreak && sat.breakStart && sat.breakEnd
          ? ` (descanso ${sat.breakStart} - ${sat.breakEnd})`
          : '';
        lines.push(`Sábado: ${sat.startTime} - ${sat.endTime} hrs${satBreak}`);
      }

      // Check Sunday
      const sun = activeSchedules.find((d) => d.dayOfWeek === 0);
      if (sun) {
        lines.push(`Domingo: ${sun.startTime} - ${sun.endTime} hrs`);
      } else {
        lines.push('Domingo: Cerrado / Descanso');
      }

      return lines;
    }

    // Individual lines if custom
    activeSchedules.forEach((d) => {
      const breakText = d.hasBreak && d.breakStart && d.breakEnd
        ? ` (descanso ${d.breakStart} - ${d.breakEnd})`
        : '';
      lines.push(`${d.dayName}: ${d.startTime} - ${d.endTime} hrs${breakText}`);
    });

    const inactiveDays = workingHours.daySchedules.filter((d) => !d.enabled);
    if (inactiveDays.length > 0) {
      lines.push(`Cerrado: ${inactiveDays.map((d) => d.dayName).join(', ')}`);
    }

    return lines;
  }

  // Fallback simple
  const daysText = (workingHours.days || [1, 2, 3, 4, 5])
    .map((d) => DAY_SHORT_NAMES_ES[d] || `Día ${d}`)
    .join(', ');
  const breakText = workingHours.breakStart && workingHours.breakEnd
    ? ` (descanso ${workingHours.breakStart} - ${workingHours.breakEnd})`
    : '';

  return [
    `Días: ${daysText}`,
    `Horario: ${workingHours.startTime} - ${workingHours.endTime} hrs${breakText}`
  ];
}
