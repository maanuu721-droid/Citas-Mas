import { Appointment, WhatsAppMessageAudit } from '../types.ts';

export function generateTwilioSid(): string {
  const chars = '0123456789abcdef';
  let sid = 'SM';
  for (let i = 0; i < 32; i++) {
    sid += chars[Math.floor(Math.random() * chars.length)];
  }
  return sid;
}

export function createWhatsAppConfirmationMessage(
  apt: Pick<Appointment, 'id' | 'clientName' | 'affiliateName' | 'serviceName' | 'servicePrice' | 'date' | 'time'> & { address?: string }
): WhatsAppMessageAudit {
  const content = `*CitaPro MX* | *Confirmación de Cita*

¡Hola ${apt.clientName}! Tu cita ha sido confirmada y pagada con éxito.

📅 *Fecha:* ${apt.date} a las ${apt.time} hrs
💼 *Servicio:* ${apt.serviceName}
💳 *Total Pagado:* $${apt.servicePrice} MXN
🏢 *Profesional:* ${apt.affiliateName}
${apt.address ? `📍 *Ubicación:* ${apt.address}` : ''}
🔑 *Código de Cita:* #${apt.id}

Recibirás recordatorios 24h y 2h antes de tu sesión. Si requieres reagendar con más de 24h de anticipación, hazlo desde tu enlace de gestión.
¡Gracias por confiar en CitaPro MX!`;

  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'confirmation',
    title: 'Confirmación de Cita Pagada',
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}

export function createWhatsAppAffiliateNotificationMessage(
  apt: Pick<
    Appointment,
    | 'id'
    | 'clientName'
    | 'clientPhone'
    | 'clientEmail'
    | 'affiliateName'
    | 'serviceName'
    | 'servicePrice'
    | 'date'
    | 'time'
    | 'notes'
  > & { address?: string }
): WhatsAppMessageAudit {
  const content = `*CitaPro MX* | *¡Nueva Cita Confirmada y Pagada!*

¡Hola ${apt.affiliateName}! Tienes una nueva cita establecida en tu agenda:

👤 *Cliente:* ${apt.clientName}
📱 *WhatsApp del Cliente:* ${apt.clientPhone}
💼 *Servicio:* ${apt.serviceName}
📅 *Fecha:* ${apt.date} a las ${apt.time} hrs
💰 *Monto Cobrado:* $${apt.servicePrice} MXN (Garantizado CitaPro MX)
🔑 *Código de Cita:* #${apt.id}
${apt.notes ? `📝 *Nota del Cliente:* "${apt.notes}"` : ''}

El cliente ya recibió su confirmación oficial y los recordatorios automáticos (24h y 2h antes) han sido activados.
¡Gracias por ser parte de la red de especialistas CitaPro MX!`;

  return {
    id: `msg-aff-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'confirmation',
    title: 'Notificación de Cita (Especialista)',
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}

export function createWhatsAppReminderMessage(
  apt: Appointment,
  hoursBefore: 24 | 2
): WhatsAppMessageAudit {
  const is24 = hoursBefore === 24;
  const content = is24
    ? `*CitaPro MX* | *Recordatorio 24 Horas*

¡Hola ${apt.clientName}! Te recordamos que mañana tienes cita con *${apt.affiliateName}*.
📅 *Fecha:* Mañana (${apt.date}) a las ${apt.time} hrs
💼 *Servicio:* ${apt.serviceName}
🔑 *Código:* #${apt.id}

Recuerda presentarte 5 minutos antes. ¡Te esperamos!`
    : `*CitaPro MX* | *Recordatorio 2 Horas*

¡Hola ${apt.clientName}! Tu cita con *${apt.affiliateName}* comienza en 2 horas.
⏰ *Hora:* ${apt.time} hrs
💼 *Servicio:* ${apt.serviceName}

Tu profesional ya tiene tu espacio listo.`;

  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: is24 ? 'reminder_24h' : 'reminder_2h',
    title: `Recordatorio ${hoursBefore}h Antes`,
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}

export function createWhatsAppNoteMessage(
  apt: Appointment,
  noteText: string
): WhatsAppMessageAudit {
  const content = `*CitaPro MX* | *Nota del Profesional*

Hola ${apt.clientName}, *${apt.affiliateName}* ha agregado una indicación importante para tu cita del ${apt.date} (${apt.time} hrs):

👉 "${noteText}"

Por favor tómala en cuenta para tu servicio.
CitaPro MX`;

  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'note',
    title: 'Nota de Servicio',
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}

export function createWhatsAppCancellationMessage(
  apt: Appointment,
  refundPercent: 50 | 0,
  refundAmount: number
): WhatsAppMessageAudit {
  const content = refundPercent > 0
    ? `*CitaPro MX* | *Cancelación y Reembolso*

Tu cita del ${apt.date} a las ${apt.time} hrs con ${apt.affiliateName} ha sido cancelada con más de 24 horas de anticipación.

💰 *Reembolso del 50%:* $${refundAmount} MXN aplicará en 3 a 7 días hábiles a tu cuenta bancaria.
El restante 50% se transfiere como compensación de agenda al profesional según la política CitaPro MX.
Código de cita: #${apt.id}`
    : `*CitaPro MX* | *Cancelación de Cita*

Tu cita del ${apt.date} a las ${apt.time} hrs con ${apt.affiliateName} ha sido cancelada con menos de 24 horas de anticipación.
Conforme a la política de cancelación tardía / no-show, no aplica reembolso y el profesional conserva el 100% del pago estipulado.`;

  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'cancellation',
    title: `Cancelación (${refundPercent}% Reembolso)`,
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}

export function createWhatsAppRescheduledMessage(
  apt: Appointment,
  newDate: string,
  newTime: string
): WhatsAppMessageAudit {
  const content = `*CitaPro MX* | *¡Cita Reagendada con Éxito!*

¡Listo ${apt.clientName}! Tu cita con *${apt.affiliateName}* ha sido reagendada.

📅 *Nueva Fecha:* ${newDate} a las ${newTime} hrs
💼 *Servicio:* ${apt.serviceName}
🔑 *Código de Cita:* #${apt.id}

Te enviaremos los recordatorios automáticos 24h y 2h antes del nuevo horario.`;

  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'rescheduled',
    title: 'Cita Reagendada',
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}

export function createWhatsAppDirectMessage(
  apt: Appointment,
  text: string,
  title: string = 'Mensaje del Especialista'
): WhatsAppMessageAudit {
  const content = `*CitaPro MX* | *${title}*

Hola ${apt.clientName}, tu especialista *${apt.affiliateName}* te envía el siguiente mensaje respecto a tu cita del ${apt.date} a las ${apt.time} hrs (${apt.serviceName}):

💬 "${text}"

Código de cita: #${apt.id}
CitaPro MX · Soporte & Gestión`;

  return {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'note',
    title,
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}

export function getWhatsAppDirectUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function createWhatsAppSubscriptionRenewalMessage(
  affiliate: { name: string; businessName?: string; phone: string; plan: string; planExpiresAt?: string }
): WhatsAppMessageAudit {
  const content = `*CitaPro MX* | *Aviso de Renovación de Plan*

¡Hola ${affiliate.businessName || affiliate.name}!

Te informamos que tu suscripción al plan *${affiliate.plan.toUpperCase()}* está por vencer ${
    affiliate.planExpiresAt ? `el próximo ${affiliate.planExpiresAt.slice(0, 10)}` : 'pronto'
  }.

⚠️ *Aviso de Pago:* Actualmente *NO* cuentas con una tarjeta guardada para cobro automático.
Para evitar la suspensión de tu visibilidad en el directorio, la recepción de nuevas citas y el envío automático de WhatsApp a tus clientes, por favor renueva tu plan o domicilia tu tarjeta en tu panel de administración.

👉 Gestiona tu plan en: https://citapro.mx/panel-afiliados
¡Gracias por pertenecer a la red CitaPro MX!`;

  return {
    id: `msg-renewal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'note',
    title: 'Aviso de Renovación de Plan (WhatsApp)',
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}

export function createWhatsAppMarketingAuthorizedMessage(
  affiliateName: string,
  levelLabel: string,
  cost: number
): WhatsAppMessageAudit {
  const content = `*CitaPro MX* | *¡Campaña de Marketing Autorizada!*

¡Hola ${affiliateName}!

El Administrador General de CitaPro MX ha verificado tu pago de *$${cost} MXN* y ha *ACTIVADO* tu campaña publicitaria *${levelLabel}*.

🚀 *Producción y edición en curso:*
- Análisis y edición de fotos del negocio.
- Generación de locución con Voz IA y masterización de audio.
- Composición de video vertical y flyer comercial.

En cuanto termine el procesamiento, el contenido quedará automáticamente publicado en tu Landing Page oficial.
CitaPro MX · Soporte & Administración`;

  return {
    id: `msg-mkt-auth-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'note',
    title: `Campaña ${levelLabel} Autorizada`,
    content,
    sentAt: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
    twilioSid: generateTwilioSid()
  };
}
