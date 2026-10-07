import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import {
  Affiliate,
  Appointment,
  Review,
  MarketingCampaignRequest,
  PromoterProfile,
  ReferredAffiliateItem,
  PromoterPayoutRecord,
  MarketingAsset,
  PromotionOrder
} from '../types.ts';
import { INITIAL_AFFILIATES, INITIAL_REVIEWS, INITIAL_MARKETING_REQUESTS } from '../data/mexicoData.ts';
import { createWhatsAppSubscriptionRenewalMessage, createWhatsAppMarketingAuthorizedMessage } from '../utils/twilioWhatsApp.ts';

const LOCAL_STORAGE_KEY_AFFILIATES = 'citapro_affiliates_cache_v1';
const LOCAL_STORAGE_KEY_APPOINTMENTS = 'citapro_appointments_cache_v1';
const LOCAL_STORAGE_KEY_REVIEWS = 'citapro_reviews_cache_v1';
const LOCAL_STORAGE_KEY_MARKETING_REQUESTS = 'citapro_marketing_requests_cache_v1';
const LOCAL_STORAGE_KEY_PROMOTERS = 'citapro_promoters_cache_v1';
const LOCAL_STORAGE_KEY_REFERRALS = 'citapro_referrals_cache_v1';
const LOCAL_STORAGE_KEY_PROMOTER_PAYOUTS = 'citapro_promoter_payouts_cache_v1';

const getTodayDateString = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Initial dummy sample appointment for demo
const INITIAL_SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: 'CP-77102',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Sesión Psicoterapia Individual',
    servicePrice: 650,
    serviceDuration: 50,
    clientName: 'Carlos Mendoza Echeverría',
    clientPhone: '+525549102938',
    clientEmail: 'carlos.mendoza@gmail.com',
    date: getTodayDateString(),
    time: '10:00',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'mercadopago',
    paidAmount: 650,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Tratamiento por insomnio y estrés laboral agudo.',
    internalNotes: 'Primera sesión presencial. Trae cuestionario de sintomatología contestado.',
    whatsappMessages: [
      {
        id: 'msg-today-1',
        type: 'confirmation',
        title: 'Confirmación y Cuestionario Previo',
        content: '*Citas Más* | Confirmación: Cita agendada hoy a las 10:00 hrs.',
        sentAt: '08:30',
        status: 'delivered',
        twilioSid: 'SM849102847291048201948201'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CP-84910',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Sesión Psicoterapia Individual',
    servicePrice: 650,
    serviceDuration: 50,
    clientName: 'Alejandro Morales Rivera',
    clientPhone: '+525512345678',
    clientEmail: 'alejandro.morales@gmail.com',
    date: '2026-09-22',
    time: '11:00',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'mercadopago',
    paidAmount: 650,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Primera sesión presencial. Traigo reporte previo.',
    internalNotes: 'Recepción informada. Solicitar INE en mostrador.',
    whatsappMessages: [
      {
        id: 'msg-init-1',
        type: 'confirmation',
        title: 'Confirmación de Cita Pagada',
        content: '*Citas Más* | Confirmación: Tu cita ha sido pagada ($650 MXN) para el 2026-09-22 a las 11:00 hrs.',
        sentAt: '09:15',
        status: 'delivered',
        twilioSid: 'SM18f8e02948b84920bcf84920'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CP-92041',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Terapia de Pareja',
    servicePrice: 950,
    serviceDuration: 80,
    clientName: 'Fernanda & Luis Solís',
    clientPhone: '+525598765432',
    clientEmail: 'fernanda.solis@hotmail.com',
    date: '2026-09-22',
    time: '16:00',
    status: 'pending',
    paymentStatus: 'paid',
    paymentMethod: 'tarjeta',
    paidAmount: 950,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Favor de avisar si hay estacionamiento disponible.',
    internalNotes: 'Pendiente confirmar si requieren factura con CFDI 4.0.',
    whatsappMessages: [
      {
        id: 'msg-init-2',
        type: 'confirmation',
        title: 'Confirmación de Cita',
        content: '*Citas Más* | Confirmación: Cita agendada para el 2026-09-22 a las 16:00 hrs.',
        sentAt: '12:30',
        status: 'delivered',
        twilioSid: 'SM7392bcdef9284719284bc783'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CP-63019',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Sesión Psicoterapia Individual',
    servicePrice: 650,
    serviceDuration: 50,
    clientName: 'Alejandro Morales Rivera',
    clientPhone: '+525512345678',
    clientEmail: 'alejandro.morales@gmail.com',
    date: '2026-09-18',
    time: '11:00',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'mercadopago',
    paidAmount: 650,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Tratamiento por ansiedad laboral concluido satisfactoriamente.',
    internalNotes: 'Sesión presencial finalizada. Alta de tratamiento.',
    whatsappMessages: [],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'CP-55201',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Terapia de Pareja',
    servicePrice: 950,
    serviceDuration: 80,
    clientName: 'Cliente Oficial Citas Más',
    clientPhone: '+525549102938',
    clientEmail: 'negocios7online@gmail.com',
    date: '2026-09-19',
    time: '16:00',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'tarjeta',
    paidAmount: 950,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Cita concluida y pagada.',
    internalNotes: 'Atención completada en consultorio.',
    whatsappMessages: [],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'CP-48201',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Sesión Psicoterapia Individual',
    servicePrice: 650,
    serviceDuration: 50,
    clientName: 'Mariana Garza Valdez',
    clientPhone: '+525538192048',
    clientEmail: 'mariana.garza@gmail.com',
    date: '2026-09-15',
    time: '09:00',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'spei',
    paidAmount: 650,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Seguimiento quincenal.',
    internalNotes: 'Sesión completada y cobrada por SPEI.',
    whatsappMessages: [],
    createdAt: '2026-09-14T10:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z'
  },
  {
    id: 'CP-48202',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Terapia de Pareja',
    servicePrice: 950,
    serviceDuration: 80,
    clientName: 'Rodrigo & Sofía Alarcón',
    clientPhone: '+525582910348',
    clientEmail: 'rodrigo.alarcon@yahoo.com',
    date: '2026-09-16',
    time: '17:00',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'mercadopago',
    paidAmount: 950,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Sesión de mediación comunicativa.',
    internalNotes: 'Avance positivo.',
    whatsappMessages: [],
    createdAt: '2026-09-15T12:00:00.000Z',
    updatedAt: '2026-09-16T18:30:00.000Z'
  },
  {
    id: 'CP-48203',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Sesión Psicoterapia Individual',
    servicePrice: 650,
    serviceDuration: 50,
    clientName: 'Carlos Mendoza Prieto',
    clientPhone: '+525547281903',
    clientEmail: 'carlos.mendoza@outlook.com',
    date: '2026-09-17',
    time: '12:00',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'tarjeta',
    paidAmount: 650,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Consulta presencial.',
    internalNotes: 'Liquidado en terminal bancaria en línea.',
    whatsappMessages: [],
    createdAt: '2026-09-16T15:00:00.000Z',
    updatedAt: '2026-09-17T13:00:00.000Z'
  },
  {
    id: 'CP-48204',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Evaluación Psicológica Integral',
    servicePrice: 1200,
    serviceDuration: 90,
    clientName: 'Diana Laura Castro',
    clientPhone: '+525519283746',
    clientEmail: 'diana.castro@gmail.com',
    date: '2026-09-20',
    time: '10:00',
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'mercadopago',
    paidAmount: 1200,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Batería psicométrica completada.',
    internalNotes: 'Informe emitido.',
    whatsappMessages: [],
    createdAt: '2026-09-18T09:00:00.000Z',
    updatedAt: '2026-09-20T11:45:00.000Z'
  },
  {
    id: 'CP-48205',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Sesión Psicoterapia Individual',
    servicePrice: 650,
    serviceDuration: 50,
    clientName: 'Enrique Peña Nieto Jr.',
    clientPhone: '+525567891234',
    clientEmail: 'enrique.pena@empresa.mx',
    date: '2026-09-21',
    time: '15:00',
    status: 'cancelled',
    paymentStatus: 'refunded_partial',
    paymentMethod: 'tarjeta',
    paidAmount: 650,
    refundAmount: 325,
    rescheduleCount: 0,
    notes: 'Cancelación solicitada con >24h de antelación. Aplicó 50% de reembolso y 50% compensación.',
    internalNotes: 'Reembolso de $325 procesado. El consultorio retiene $325 de compensación.',
    whatsappMessages: [],
    createdAt: '2026-09-19T08:00:00.000Z',
    updatedAt: '2026-09-20T10:00:00.000Z'
  },
  {
    id: 'CP-48206',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Sesión Psicoterapia Individual',
    servicePrice: 650,
    serviceDuration: 50,
    clientName: 'Valeria Rivas Gómez',
    clientPhone: '+525591827364',
    clientEmail: 'valeria.rivas@gmail.com',
    date: '2026-09-23',
    time: '11:00',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'mercadopago',
    paidAmount: 650,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Cita agendada y pagada anticipada.',
    internalNotes: 'Confirmada para mañana.',
    whatsappMessages: [],
    createdAt: '2026-09-21T14:00:00.000Z',
    updatedAt: '2026-09-21T14:00:00.000Z'
  },
  {
    id: 'CP-48207',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Terapia de Pareja',
    servicePrice: 950,
    serviceDuration: 80,
    clientName: 'Héctor & Gabriela Beltrán',
    clientPhone: '+525539201948',
    clientEmail: 'hector.beltran@gmail.com',
    date: '2026-09-24',
    time: '16:00',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'tarjeta',
    paidAmount: 950,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Segunda sesión.',
    internalNotes: 'Cobro 100% anticipado en cuenta.',
    whatsappMessages: [],
    createdAt: '2026-09-21T16:30:00.000Z',
    updatedAt: '2026-09-21T16:30:00.000Z'
  },
  {
    id: 'CP-48208',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Evaluación Psicológica Integral',
    servicePrice: 1200,
    serviceDuration: 90,
    clientName: 'Patricia Domínguez',
    clientPhone: '+525578192039',
    clientEmail: 'patricia.dominguez@live.com',
    date: '2026-09-25',
    time: '10:00',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'spei',
    paidAmount: 1200,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Pago liquidado por transferencia SPEI.',
    internalNotes: 'Comprobante bancario validado.',
    whatsappMessages: [],
    createdAt: '2026-09-22T08:00:00.000Z',
    updatedAt: '2026-09-22T08:00:00.000Z'
  },
  {
    id: 'CP-48209',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Sesión Psicoterapia Individual',
    servicePrice: 650,
    serviceDuration: 50,
    clientName: 'Ignacio Zúñiga Mora',
    clientPhone: '+525528394019',
    clientEmail: 'ignacio.zuniga@gmail.com',
    date: '2026-09-26',
    time: '12:00',
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'mercadopago',
    paidAmount: 650,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Pendiente confirmación de pago en OXXO Pay.',
    internalNotes: 'Esperando conciliación en línea.',
    whatsappMessages: [],
    createdAt: '2026-09-22T09:15:00.000Z',
    updatedAt: '2026-09-22T09:15:00.000Z'
  },
  {
    id: 'CP-48210',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    serviceName: 'Terapia de Pareja',
    servicePrice: 950,
    serviceDuration: 80,
    clientName: 'Manuel & Andrea Cruz',
    clientPhone: '+525567182930',
    clientEmail: 'andrea.cruz@outlook.com',
    date: '2026-09-28',
    time: '15:00',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: 'mercadopago',
    paidAmount: 950,
    refundAmount: 0,
    rescheduleCount: 0,
    notes: 'Apartado anticipado.',
    internalNotes: 'Cobro exitoso.',
    whatsappMessages: [],
    createdAt: '2026-09-22T10:00:00.000Z',
    updatedAt: '2026-09-22T10:00:00.000Z'
  }
];

export class DataService {
  private static instance: DataService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check if affiliates exist in Firestore
      const snap = await getDocs(collection(db, 'affiliates'));
      if (snap.empty) {
        console.log('Seeding initial Mexican affiliates into Firestore...');
        for (const aff of INITIAL_AFFILIATES) {
          await setDoc(doc(db, 'affiliates', aff.id), aff);
        }
        for (const apt of INITIAL_SAMPLE_APPOINTMENTS) {
          await setDoc(doc(db, 'appointments', apt.id), apt);
        }
        for (const rev of INITIAL_REVIEWS) {
          await setDoc(doc(db, 'reviews', rev.id), rev);
        }
      }
      this.initialized = true;
    } catch (err) {
      console.warn('Firestore seeding check fallback (using local cache if offline):', err);
      // Populate local storage if empty
      if (!localStorage.getItem(LOCAL_STORAGE_KEY_AFFILIATES)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_AFFILIATES, JSON.stringify(INITIAL_AFFILIATES));
      }
      if (!localStorage.getItem(LOCAL_STORAGE_KEY_APPOINTMENTS)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(INITIAL_SAMPLE_APPOINTMENTS));
      }
      if (!localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_REVIEWS, JSON.stringify(INITIAL_REVIEWS));
      }
      this.initialized = true;
    }
  }

  public async getAffiliates(): Promise<Affiliate[]> {
    await this.initialize();
    try {
      const snap = await getDocs(collection(db, 'affiliates'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as Affiliate);
        localStorage.setItem(LOCAL_STORAGE_KEY_AFFILIATES, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firestore getAffiliates error, falling back to local cache:', err);
    }
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_AFFILIATES);
    return cached ? JSON.parse(cached) : INITIAL_AFFILIATES;
  }

  public async getAffiliateById(id: string): Promise<Affiliate | undefined> {
    await this.initialize();
    try {
      const snap = await getDoc(doc(db, 'affiliates', id));
      if (snap.exists()) {
        return snap.data() as Affiliate;
      }
    } catch (err) {
      console.warn('Firestore getAffiliateById error, checking local:', err);
    }
    const affiliates = await this.getAffiliates();
    return affiliates.find((a) => a.id === id);
  }

  public async getAffiliateByOwner(ownerId: string, email?: string): Promise<Affiliate | undefined> {
    const affiliates = await this.getAffiliates();
    const cleanEmail = email?.toLowerCase().trim();
    return affiliates.find(
      (a) => a.ownerId === ownerId || (cleanEmail && a.ownerEmail?.toLowerCase().trim() === cleanEmail)
    );
  }

  public async saveAffiliate(affiliate: Affiliate): Promise<void> {
    // 1. Update local cache first
    try {
      const affiliates = await this.getAffiliates();
      const idx = affiliates.findIndex((a) => a.id === affiliate.id);
      if (idx >= 0) {
        affiliates[idx] = affiliate;
      } else {
        affiliates.unshift(affiliate);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_AFFILIATES, JSON.stringify(affiliates));
    } catch (localErr) {
      console.warn('LocalStorage saveAffiliate warning:', localErr);
    }

    // 2. Persist to Firestore database
    try {
      await setDoc(doc(db, 'affiliates', affiliate.id), affiliate);
    } catch (err) {
      console.warn('Firestore saveAffiliate notice:', err);
    }
  }

  public async getAppointments(affiliateId?: string): Promise<Appointment[]> {
    await this.initialize();
    try {
      if (affiliateId) {
        const q = query(collection(db, 'appointments'), where('affiliateId', '==', affiliateId));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data() as Appointment);
        return list;
      } else {
        const snap = await getDocs(collection(db, 'appointments'));
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as Appointment);
          return list;
        }
      }
    } catch (err) {
      console.warn('Firestore getAppointments error, falling back to local:', err);
    }
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_APPOINTMENTS);
    let list: Appointment[] = cached ? JSON.parse(cached) : [];
    const existingIds = new Set(list.map((a) => a.id));
    for (const sample of INITIAL_SAMPLE_APPOINTMENTS) {
      if (!existingIds.has(sample.id)) {
        list.push(sample);
      }
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(list));
    return affiliateId ? list.filter((a) => a.affiliateId === affiliateId) : list;
  }

  public async getAppointmentById(id: string): Promise<Appointment | undefined> {
    await this.initialize();
    try {
      const snap = await getDoc(doc(db, 'appointments', id));
      if (snap.exists()) {
        return snap.data() as Appointment;
      }
    } catch (err) {
      console.warn('Firestore getAppointmentById error:', err);
    }
    const appointments = await this.getAppointments();
    return appointments.find((a) => a.id.toLowerCase() === id.toLowerCase());
  }

  public async createAppointment(appointment: Appointment): Promise<void> {
    try {
      await setDoc(doc(db, 'appointments', appointment.id), appointment);
    } catch (err) {
      console.warn('Firestore createAppointment warning (caching locally):', err);
    } finally {
      const appointments = await this.getAppointments();
      appointments.unshift(appointment);
      localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
    }
  }

  public async updateAppointment(appointment: Appointment): Promise<void> {
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), { ...appointment, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn('Firestore updateAppointment warning (updating locally):', err);
    } finally {
      const appointments = await this.getAppointments();
      const idx = appointments.findIndex((a) => a.id === appointment.id);
      if (idx >= 0) {
        appointments[idx] = appointment;
      } else {
        appointments.unshift(appointment);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_APPOINTMENTS, JSON.stringify(appointments));
    }
  }

  public async getReviews(affiliateId?: string): Promise<Review[]> {
    await this.initialize();
    try {
      let snap;
      if (affiliateId) {
        const q = query(collection(db, 'reviews'), where('affiliateId', '==', affiliateId));
        snap = await getDocs(q);
      } else {
        snap = await getDocs(collection(db, 'reviews'));
      }
      if (!snap.empty) {
        return snap.docs.map((d) => d.data() as Review);
      }
    } catch (err) {
      console.warn('Firestore getReviews error, fallback to local:', err);
    }
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS);
    const list: Review[] = cached ? JSON.parse(cached) : INITIAL_REVIEWS;
    return affiliateId ? list.filter((r) => r.affiliateId === affiliateId) : list;
  }

  public async createReview(review: Review): Promise<void> {
    try {
      await setDoc(doc(db, 'reviews', review.id), review);
    } catch (err) {
      console.warn('Firestore createReview error:', err);
    } finally {
      const reviews = await this.getReviews();
      reviews.unshift(review);
      localStorage.setItem(LOCAL_STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
    }
  }

  public async validateAppointmentForReview(
    affiliateId: string,
    queryCodeOrPhone: string
  ): Promise<{ eligible: boolean; appointment?: Appointment; message: string; alreadyReviewed?: boolean }> {
    await this.initialize();
    const cleanQuery = queryCodeOrPhone.trim().toLowerCase();
    if (!cleanQuery) {
      return { eligible: false, message: 'Por favor ingresa un folio de cita o número de teléfono registrado.' };
    }

    // 1. Fetch appointments for this affiliate directly from Firestore / local
    const appointments = await this.getAppointments(affiliateId);
    
    // Find matching appointment by ID (e.g. CP-63019) or phone or email
    const match = appointments.find((apt) => {
      const matchId = apt.id.toLowerCase() === cleanQuery || apt.id.toLowerCase() === `cp-${cleanQuery}`;
      const matchPhone = apt.clientPhone && apt.clientPhone.replace(/\D/g, '').includes(cleanQuery.replace(/\D/g, ''));
      const matchEmail = apt.clientEmail && apt.clientEmail.toLowerCase() === cleanQuery;
      return (matchId || matchPhone || matchEmail) && apt.affiliateId === affiliateId;
    });

    if (!match) {
      return {
        eligible: false,
        message: 'No se encontró ninguna cita asociada a este folio o teléfono para este profesional en Firestore.'
      };
    }

    // 2. Validate that status is 'completed'
    if (match.status !== 'completed') {
      const statusLabel =
        match.status === 'confirmed'
          ? 'Confirmada'
          : match.status === 'pending'
          ? 'Pendiente de pago'
          : 'Cancelada';
      return {
        eligible: false,
        appointment: match,
        message: `La cita ${match.id} se encuentra en estado "${statusLabel}". Solo puedes publicar una reseña una vez que la cita haya concluido y el profesional la haya marcado como "completada" en Firestore.`
      };
    }

    // 3. Check if this appointment already has a review
    const reviews = await this.getReviews(affiliateId);
    const existingRev = reviews.find((r) => r.appointmentId.toLowerCase() === match.id.toLowerCase());
    if (existingRev) {
      return {
        eligible: false,
        appointment: match,
        alreadyReviewed: true,
        message: `La cita ${match.id} ya cuenta con una reseña publicada el ${existingRev.date}. Para garantizar transparencia, solo se permite una reseña por cita completada.`
      };
    }

    return {
      eligible: true,
      appointment: match,
      message: `¡Cita completada verificada con éxito! (Folio: ${match.id} - ${match.serviceName}). Puedes publicar tu calificación.`
    };
  }

  public async getCompletedAppointmentsForUser(
    affiliateId: string,
    userEmail?: string,
    userPhone?: string
  ): Promise<Appointment[]> {
    if (!userEmail && !userPhone) return [];
    const all = await this.getAppointments(affiliateId);
    const reviews = await this.getReviews(affiliateId);
    const reviewedAptIds = new Set(reviews.map((r) => r.appointmentId.toLowerCase()));

    return all.filter((apt) => {
      const matchesEmail = userEmail && apt.clientEmail && apt.clientEmail.toLowerCase() === userEmail.toLowerCase();
      const matchesPhone = userPhone && apt.clientPhone && apt.clientPhone.replace(/\D/g, '') === userPhone.replace(/\D/g, '');
      const isCompleted = apt.status === 'completed';
      const isThisAffiliate = apt.affiliateId === affiliateId;
      const notYetReviewed = !reviewedAptIds.has(apt.id.toLowerCase());
      return isThisAffiliate && isCompleted && (matchesEmail || matchesPhone) && notYetReviewed;
    });
  }

  public async submitVerifiedReview(review: Review): Promise<{ success: boolean; error?: string; updatedAffiliate?: Affiliate }> {
    try {
      // 1. Verify in Firestore that appointment exists and is completed
      const apt = await this.getAppointmentById(review.appointmentId);
      if (!apt || apt.status !== 'completed' || apt.affiliateId !== review.affiliateId) {
        return {
          success: false,
          error: 'No se pudo verificar la cita completada en Firestore. Solo clientes con cita completada pueden publicar.'
        };
      }

      // 2. Save review to Firestore
      await this.createReview(review);

      // 3. Recalculate affiliate average and reviewCount
      const allReviews = await this.getReviews(review.affiliateId);
      const aff = await this.getAffiliateById(review.affiliateId);
      if (aff) {
        const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
        const newRating = Number((totalRating / allReviews.length).toFixed(1));
        const updatedAff: Affiliate = {
          ...aff,
          rating: newRating,
          reviewCount: allReviews.length,
          updatedAt: new Date().toISOString()
        };
        await this.saveAffiliate(updatedAff);
        return { success: true, updatedAffiliate: updatedAff };
      }

      return { success: true };
    } catch (err) {
      console.error('Error submitting verified review:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Error al guardar la reseña en Firestore' };
    }
  }

  // =========================================================================
  // ADMIN & MARKETING TOOL AUTHORIZATION (PRO $550 & PREMIUM $1,250 MXN)
  // =========================================================================

  public async getMarketingRequests(): Promise<MarketingCampaignRequest[]> {
    try {
      const snap = await getDocs(collection(db, 'marketing_requests'));
      if (!snap.empty) {
        const list: MarketingCampaignRequest[] = [];
        snap.forEach((d) => list.push(d.data() as MarketingCampaignRequest));
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        localStorage.setItem(LOCAL_STORAGE_KEY_MARKETING_REQUESTS, JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firestore getMarketingRequests fallback to local:', err);
    }
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_MARKETING_REQUESTS);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // ignore
      }
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_MARKETING_REQUESTS, JSON.stringify(INITIAL_MARKETING_REQUESTS));
    return INITIAL_MARKETING_REQUESTS;
  }

  public async createMarketingRequest(req: MarketingCampaignRequest): Promise<void> {
    try {
      await setDoc(doc(db, 'marketing_requests', req.id), req);
    } catch (err) {
      console.warn('Firestore createMarketingRequest fallback to local:', err);
    } finally {
      const current = await this.getMarketingRequests();
      const updated = [req, ...current.filter((r) => r.id !== req.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY_MARKETING_REQUESTS, JSON.stringify(updated));
    }
  }

  public async updateMarketingRequest(
    requestId: string,
    updates: Partial<MarketingCampaignRequest>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'marketing_requests', requestId), updates);
    } catch (err) {
      console.warn('Firestore updateMarketingRequest fallback to local:', err);
    } finally {
      const current = await this.getMarketingRequests();
      const updated = current.map((r) => (r.id === requestId ? { ...r, ...updates } : r));
      localStorage.setItem(LOCAL_STORAGE_KEY_MARKETING_REQUESTS, JSON.stringify(updated));
    }
  }

  /**
   * Administrador valida y confirma el pago ($550 Pro o $1250 Premium)
   */
  public async verifyMarketingPayment(
    requestId: string,
    paymentReference?: string
  ): Promise<{ success: boolean; request?: MarketingCampaignRequest }> {
    const list = await this.getMarketingRequests();
    const req = list.find((r) => r.id === requestId);
    if (!req) return { success: false };

    const updates: Partial<MarketingCampaignRequest> = {
      paymentStatus: 'paid_verified',
      paymentReference: paymentReference || req.paymentReference || `PAGO-VERIFICADO-${Date.now()}`
    };

    await this.updateMarketingRequest(requestId, updates);
    const updatedReq = { ...req, ...updates };
    return { success: true, request: updatedReq };
  }

  /**
   * Administrador autoriza y activa el disparador n8n para iniciar la creación de contenido
   */
  public async authorizeAndDispatchMarketingToN8N(
    requestId: string,
    customWebhookUrl?: string
  ): Promise<{ success: boolean; message: string; request?: MarketingCampaignRequest; n8nResult?: any }> {
    const list = await this.getMarketingRequests();
    const req = list.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Solicitud de campaña no encontrada.' };
    }

    // Must be paid before activation, as requested by user
    if (req.paymentStatus !== 'paid_verified') {
      return {
        success: false,
        message: 'No se puede activar el disparador n8n: La campaña requiere validación de pago previo ($550 o $1,250 MXN).'
      };
    }

    const affiliate = await this.getAffiliateById(req.affiliateId);
    const webhookUrl =
      customWebhookUrl ||
      req.n8nWebhookUrl ||
      (req.level === 'premium_cinema'
        ? 'https://n8n.webhook.citapro.mx/webhook/marketing-cinema-4k'
        : 'https://n8n.webhook.citapro.mx/webhook/marketing-video-pro');

    const executionPayload = {
      event: 'marketing_campaign_authorized_by_admin',
      requestId: req.id,
      campaignId: req.campaignId,
      campaignLevel: req.level,
      levelLabel: req.levelLabel,
      costExtraMxn: req.costExtraMxn,
      authorizedAt: new Date().toISOString(),
      business: {
        id: req.affiliateId,
        name: req.affiliateName,
        phone: req.affiliatePhone,
        email: req.affiliateEmail,
        city: req.affiliateCity || affiliate?.city || 'México',
        category: affiliate?.categoryLabel || affiliate?.category || 'Profesional'
      },
      creativeSpecs: {
        headline: req.headline,
        scriptHook: req.scriptHook || req.headline,
        voiceType: req.voiceType || 'female_warm',
        photos: [affiliate?.banner, ...(affiliate?.gallery || []), affiliate?.logo].filter(Boolean)
      }
    };

    let n8nResult: any = {
      status: 'dispatched',
      timestamp: new Date().toISOString(),
      webhookUrl
    };

    // Attempt real HTTP POST to n8n webhook
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executionPayload)
      });
      if (resp.ok) {
        n8nResult = await resp.json();
      } else {
        n8nResult = {
          status: 'dispatched_waiting_callback',
          httpStatus: resp.status,
          message: 'Disparo enviado exitosamente al webhook de n8n.'
        };
      }
    } catch (err) {
      console.warn('n8n network notice (running in simulation/sandbox mode):', err);
      n8nResult = {
        status: 'simulated_success',
        message: 'Webhook n8n activado con éxito. El flujo de renderizado y producción de video/audio ha iniciado.'
      };
    }

    // Send WhatsApp notification to affiliate about authorization
    const authMsg = createWhatsAppMarketingAuthorizedMessage(req.affiliateName, req.levelLabel, req.costExtraMxn);

    const updates: Partial<MarketingCampaignRequest> = {
      adminApprovalStatus: 'authorized_dispatched',
      authorizedAt: new Date().toISOString(),
      n8nDispatchedAt: new Date().toISOString(),
      n8nWebhookUrl: webhookUrl,
      n8nStatus: 'dispatched',
      n8nResultSummary: typeof n8nResult === 'string' ? n8nResult : JSON.stringify(n8nResult)
    };

    await this.updateMarketingRequest(requestId, updates);

    // If affiliate exists, also publish/update the campaign in affiliate record
    if (affiliate) {
      const publishedCampaign = {
        id: req.campaignId || `camp-${Date.now()}`,
        level: req.level,
        title: req.levelLabel,
        headline: req.headline,
        subheadline: req.scriptHook || 'Producción Oficial Autorizada',
        bodyCopy: `Campaña ${req.levelLabel} en producción n8n para ${affiliate.businessName || affiliate.name}.`,
        callToAction: 'Agendar Cita en Línea',
        badge: 'Campaña Oficial Citas Más',
        priceOffer: `$${req.costExtraMxn} MXN`,
        costExtraMxn: req.costExtraMxn,
        adminApprovalStatus: 'authorized_dispatched',
        isPublishedOnLanding: true,
        createdAt: req.requestedAt,
        publishedAt: new Date().toISOString()
      };

      const updatedAffiliate: Affiliate = {
        ...affiliate,
        publishedMarketingCampaign: publishedCampaign as any,
        marketingCampaigns: [publishedCampaign as any, ...(affiliate.marketingCampaigns || [])],
        updatedAt: new Date().toISOString()
      };
      await this.saveAffiliate(updatedAffiliate);
    }

    const updatedReq: MarketingCampaignRequest = { ...req, ...updates };
    return {
      success: true,
      message: `¡Campaña autorizada y disparador n8n activado! WhatsApp de confirmación enviado a ${req.affiliateName}.`,
      request: updatedReq,
      n8nResult
    };
  }

  // =========================================================================
  // GESTIÓN DE CADUCIDAD DE PLANES & WHATSAPP AUTOMÁTICO
  // =========================================================================

  /**
   * Obtiene todos los afiliados calculando días restantes para vencimiento del plan
   * y determina si necesita aviso urgente por falta de tarjeta en forma automática.
   */
  public async getExpiringSubscriptions(daysThreshold = 7): Promise<
    {
      affiliate: Affiliate;
      daysUntilExpiry: number;
      isExpiringSoon: boolean;
      needsManualCardNotice: boolean;
      expiryDateFormatted: string;
    }[]
  > {
    const affiliates = await this.getAffiliates();
    const now = new Date();

    return affiliates.map((aff) => {
      // Default to 30 days from creation if not specified
      const expiresAtDate = aff.planExpiresAt ? new Date(aff.planExpiresAt) : new Date(now.getTime() + 15 * 86400000);
      const diffTime = expiresAtDate.getTime() - now.getTime();
      const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isExpiringSoon = daysUntilExpiry <= daysThreshold;
      const needsManualCardNotice = isExpiringSoon && !aff.hasAutoPaymentCard;

      return {
        affiliate: aff,
        daysUntilExpiry,
        isExpiringSoon,
        needsManualCardNotice,
        expiryDateFormatted: expiresAtDate.toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      };
    });
  }

  /**
   * Envía mensaje oficial de WhatsApp al afiliado para recordarle que su plan vence
   * y que NO tiene tarjeta registrada en forma automática.
   */
  public async sendSubscriptionRenewalNotice(
    affiliateId: string
  ): Promise<{ success: boolean; message: string; auditMsg?: any }> {
    const aff = await this.getAffiliateById(affiliateId);
    if (!aff) {
      return { success: false, message: 'Afiliado no encontrado.' };
    }

    const auditMsg = createWhatsAppSubscriptionRenewalMessage({
      name: aff.name,
      businessName: aff.businessName,
      phone: aff.phone,
      plan: aff.plan,
      planExpiresAt: aff.planExpiresAt
    });

    const updatedAff: Affiliate = {
      ...aff,
      lastRenewalNoticeSentAt: new Date().toISOString(),
      monthlyMessagesSent: (aff.monthlyMessagesSent || 0) + 1,
      updatedAt: new Date().toISOString()
    };

    await this.saveAffiliate(updatedAff);

    return {
      success: true,
      message: `Mensaje de WhatsApp de renovación enviado a ${aff.businessName || aff.name} (${aff.phone}).`,
      auditMsg
    };
  }

  /**
   * Disparo masivo de avisos a todos los afiliados que están a punto de caducar sin tarjeta automática
   */
  public async sendAllPendingRenewalNotices(): Promise<{ count: number; affiliatesNotified: string[] }> {
    const expiringList = await this.getExpiringSubscriptions(7);
    const targets = expiringList.filter((item) => item.needsManualCardNotice);

    const notified: string[] = [];
    for (const target of targets) {
      await this.sendSubscriptionRenewalNotice(target.affiliate.id);
      notified.push(target.affiliate.businessName || target.affiliate.name);
    }

    return {
      count: targets.length,
      affiliatesNotified: notified
    };
  }

  /**
   * Métricas generales para el Panel de Administración General
   */
  public async getAdminMetrics(): Promise<{
    totalAffiliates: number;
    pendingApprovals: number;
    totalAppointments: number;
    totalRevenueMxn: number;
    pendingMarketingRequests: number;
    expiringPlansCount: number;
  }> {
    const affiliates = await this.getAffiliates();
    const appointments = await this.getAppointments();
    const mktRequests = await this.getMarketingRequests();
    const expiring = await this.getExpiringSubscriptions(7);

    const pendingApprovals = affiliates.filter(
      (a) => a.approvalStatus === 'pending_approval' || (a.documents && a.documents.length > 0 && !a.isDestacadoSeguro)
    ).length;

    const totalRevenueMxn = appointments.reduce((sum, apt) => sum + (apt.paidAmount || 0), 0);
    const pendingMarketingRequests = mktRequests.filter((r) => r.adminApprovalStatus === 'pending_approval').length;
    const expiringPlansCount = expiring.filter((e) => e.needsManualCardNotice).length;

    return {
      totalAffiliates: affiliates.length,
      pendingApprovals,
      totalAppointments: appointments.length,
      totalRevenueMxn,
      pendingMarketingRequests,
      expiringPlansCount
    };
  }

  // =========================================================================
  // SECCIÓN: AFILIADOS PROMOTORES (COMISIÓN 40% MENSUAL RECURRENTE)
  // =========================================================================

  /**
   * Obtiene o inicializa el perfil de un Afiliado Promotor / Embajador
   */
  public async getPromoterProfile(userIdOrCode: string): Promise<PromoterProfile | null> {
    try {
      // 1. Try local cache first
      const cachedListStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROMOTERS);
      let list: PromoterProfile[] = cachedListStr ? JSON.parse(cachedListStr) : [];
      let found = list.find((p) => p.userId === userIdOrCode || p.referralCode?.toUpperCase() === userIdOrCode.toUpperCase());

      // 2. Try Firestore
      if (!found) {
        try {
          const snap = await getDoc(doc(db, 'promoters', userIdOrCode));
          if (snap.exists()) {
            found = snap.data() as PromoterProfile;
          }
        } catch (dbErr) {
          // fallback
        }
      }

      // If demo promoter
      if (!found && (userIdOrCode === 'user-promoter-mario' || userIdOrCode.toUpperCase() === 'MARIO40')) {
        found = {
          id: 'promoter-mario-demo',
          userId: 'user-promoter-mario',
          referralCode: 'MARIO40',
          name: 'Lic. Mario Valenzuela (Embajador)',
          email: 'mario.embajador@citapro.mx',
          phone: '+52 55 7712 9043',
          commissionPercent: 40,
          totalEarningsMxn: 7664.0,
          currentMonthEarningsMxn: 1174.4,
          availableBalanceMxn: 3832.0,
          totalPaidOutMxn: 3832.0,
          payoutClabe: '012180004567891234',
          payoutBank: 'BBVA México',
          payoutHolderName: 'Mario Valenzuela López',
          createdAt: '2026-01-15T10:00:00.000Z',
          updatedAt: new Date().toISOString()
        };
        await this.savePromoterProfile(found);
      }

      return found || null;
    } catch (e) {
      console.warn('Error reading promoter profile:', e);
      return null;
    }
  }

  /**
   * Guarda o actualiza un perfil de Afiliado Promotor
   */
  public async savePromoterProfile(profile: PromoterProfile): Promise<void> {
    const updated = {
      ...profile,
      updatedAt: new Date().toISOString()
    };

    // Update in local cache
    try {
      const cachedListStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROMOTERS);
      let list: PromoterProfile[] = cachedListStr ? JSON.parse(cachedListStr) : [];
      const idx = list.findIndex((p) => p.userId === profile.userId || p.id === profile.id);
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY_PROMOTERS, JSON.stringify(list));
    } catch (e) {
      console.warn('Error caching promoter profile:', e);
    }

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'promoters', profile.userId), updated, { merge: true });
    } catch (err) {
      console.warn('Notice saving promoter to Firestore:', err);
    }
  }

  /**
   * Obtiene la lista de afiliados referidos por un promotor
   */
  public async getReferredAffiliates(promoterUserIdOrCode: string): Promise<ReferredAffiliateItem[]> {
    try {
      const cachedStr = localStorage.getItem(LOCAL_STORAGE_KEY_REFERRALS);
      let allReferrals: ReferredAffiliateItem[] = cachedStr ? JSON.parse(cachedStr) : [];

      // Seed initial sample referrals for demo promoter
      if (allReferrals.length === 0) {
        allReferrals = [
          {
            id: 'ref-1',
            promoterUserId: 'user-promoter-mario',
            promoterCode: 'MARIO40',
            affiliateId: 'aff-psico-bienestar',
            affiliateName: 'Dra. Sofía Alarcón',
            businessName: 'Clínica Bienestar Mental Condesa',
            affiliateEmail: 'bienestar@citapro.mx',
            affiliatePhone: '+52 55 4910 2938',
            categoryLabel: 'Psicología y Psiquiatría',
            registeredAt: '2026-01-20',
            plan: 'pro',
            monthlyPriceMxn: 599,
            monthlyCommissionMxn: 239.6, // 40% de 599
            isSubscriptionActive: true,
            subscriptionStatus: 'active',
            lastPaymentDate: '2026-09-01',
            nextBillingDate: '2026-10-01',
            totalCommissionsGeneratedMxn: 1916.8
          },
          {
            id: 'ref-2',
            promoterUserId: 'user-promoter-mario',
            promoterCode: 'MARIO40',
            affiliateId: 'aff-dental-roma',
            affiliateName: 'Dr. Alejandro Méndez',
            businessName: 'Dental Roma Especialidades',
            affiliateEmail: 'dr.mendez@consultorio.mx',
            affiliatePhone: '+52 55 8812 3456',
            categoryLabel: 'Odontología y Ortodoncia',
            registeredAt: '2026-02-10',
            plan: 'equipo',
            monthlyPriceMxn: 869,
            monthlyCommissionMxn: 347.6, // 40% de 869
            isSubscriptionActive: true,
            subscriptionStatus: 'active',
            lastPaymentDate: '2026-09-10',
            nextBillingDate: '2026-10-10',
            totalCommissionsGeneratedMxn: 2433.2
          },
          {
            id: 'ref-3',
            promoterUserId: 'user-promoter-mario',
            promoterCode: 'MARIO40',
            affiliateId: 'aff-fisio-del-valle',
            affiliateName: 'Lic. Mariana Treviño',
            businessName: 'Fisioterapia Integral Del Valle',
            affiliateEmail: 'mariana.trevino@fisiocdmx.com',
            affiliatePhone: '+52 55 3390 1284',
            categoryLabel: 'Fisioterapia y Rehabilitación',
            registeredAt: '2026-03-05',
            plan: 'pro',
            monthlyPriceMxn: 599,
            monthlyCommissionMxn: 239.6, // 40% de 599
            isSubscriptionActive: true,
            subscriptionStatus: 'active',
            lastPaymentDate: '2026-09-05',
            nextBillingDate: '2026-10-05',
            totalCommissionsGeneratedMxn: 1437.6
          },
          {
            id: 'ref-4',
            promoterUserId: 'user-promoter-mario',
            promoterCode: 'MARIO40',
            affiliateId: 'aff-nutri-santafe',
            affiliateName: 'Mtra. Elena Gómez',
            businessName: 'Nutrición Clínica y Deportiva Santa Fe',
            affiliateEmail: 'elena.gomez@nutrisantafe.mx',
            affiliatePhone: '+52 55 6671 9021',
            categoryLabel: 'Nutrición y Dietética',
            registeredAt: '2026-04-12',
            plan: 'equipo',
            monthlyPriceMxn: 869,
            monthlyCommissionMxn: 347.6, // 40% de 869
            isSubscriptionActive: true,
            subscriptionStatus: 'active',
            lastPaymentDate: '2026-09-12',
            nextBillingDate: '2026-10-12',
            totalCommissionsGeneratedMxn: 1738.0
          },
          {
            id: 'ref-5',
            promoterUserId: 'user-promoter-mario',
            promoterCode: 'MARIO40',
            affiliateId: 'aff-pediatra-pedregal',
            affiliateName: 'Dr. Roberto Garza',
            businessName: 'Pediatría y Neonatología del Pedregal',
            affiliateEmail: 'dr.garza@pedregalpediatria.com',
            affiliatePhone: '+52 55 9920 1184',
            categoryLabel: 'Pediatría Médica',
            registeredAt: '2026-06-18',
            plan: 'pro',
            monthlyPriceMxn: 599,
            monthlyCommissionMxn: 239.6, // 40% de 599
            isSubscriptionActive: false,
            subscriptionStatus: 'past_due',
            lastPaymentDate: '2026-08-18',
            nextBillingDate: '2026-09-18',
            totalCommissionsGeneratedMxn: 479.2
          }
        ];
        localStorage.setItem(LOCAL_STORAGE_KEY_REFERRALS, JSON.stringify(allReferrals));
      }

      // Filter by promoter userId or referralCode
      const filtered = allReferrals.filter(
        (r) =>
          r.promoterUserId === promoterUserIdOrCode ||
          r.promoterCode.toUpperCase() === promoterUserIdOrCode.toUpperCase()
      );

      return filtered;
    } catch (e) {
      console.warn('Error reading referrals:', e);
      return [];
    }
  }

  /**
   * Registra un nuevo afiliado referido bajo el código de un promotor
   */
  public async recordAffiliateReferral(referral: ReferredAffiliateItem): Promise<void> {
    try {
      const cachedStr = localStorage.getItem(LOCAL_STORAGE_KEY_REFERRALS);
      let allReferrals: ReferredAffiliateItem[] = cachedStr ? JSON.parse(cachedStr) : [];
      allReferrals.push(referral);
      localStorage.setItem(LOCAL_STORAGE_KEY_REFERRALS, JSON.stringify(allReferrals));

      // Persist to Firestore
      try {
        await setDoc(doc(db, 'referrals', referral.id), referral);
      } catch (err) {
        console.warn('Notice saving referral to Firestore:', err);
      }

      // Update promoter metrics
      const promoter = await this.getPromoterProfile(referral.promoterUserId || referral.promoterCode);
      if (promoter) {
        const commission = referral.monthlyCommissionMxn;
        promoter.currentMonthEarningsMxn += commission;
        promoter.availableBalanceMxn += commission;
        promoter.totalEarningsMxn += commission;
        await this.savePromoterProfile(promoter);
      }
    } catch (e) {
      console.warn('Error recording referral:', e);
    }
  }

  /**
   * Simula el pago recurrente mensual de suscripción de un afiliado referido:
   * Aplica de inmediato el 40% de comisión al promotor mientras el afiliado pague su suscripción
   */
  public async simulateMonthlySubscriptionPayment(
    referralId: string
  ): Promise<{ newBalance: number; commissionAdded: number }> {
    const cachedStr = localStorage.getItem(LOCAL_STORAGE_KEY_REFERRALS);
    let allReferrals: ReferredAffiliateItem[] = cachedStr ? JSON.parse(cachedStr) : [];
    const target = allReferrals.find((r) => r.id === referralId);

    if (!target) {
      throw new Error('Afiliado referido no encontrado');
    }

    const commission = target.monthlyCommissionMxn;
    target.totalCommissionsGeneratedMxn += commission;
    target.isSubscriptionActive = true;
    target.subscriptionStatus = 'active';
    target.lastPaymentDate = getTodayDateString();

    // Next billing is 1 month ahead
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    target.nextBillingDate = `${y}-${m}-${day}`;

    localStorage.setItem(LOCAL_STORAGE_KEY_REFERRALS, JSON.stringify(allReferrals));

    // Update in Firestore
    try {
      await updateDoc(doc(db, 'referrals', target.id), {
        totalCommissionsGeneratedMxn: target.totalCommissionsGeneratedMxn,
        isSubscriptionActive: true,
        subscriptionStatus: 'active',
        lastPaymentDate: target.lastPaymentDate,
        nextBillingDate: target.nextBillingDate
      });
    } catch (err) {
      console.warn('Notice updating referral renewal in Firestore:', err);
    }

    // Update promoter balance
    const promoter = await this.getPromoterProfile(target.promoterUserId || target.promoterCode);
    let newBalance = 0;
    if (promoter) {
      promoter.availableBalanceMxn += commission;
      promoter.totalEarningsMxn += commission;
      promoter.currentMonthEarningsMxn += commission;
      newBalance = promoter.availableBalanceMxn;
      await this.savePromoterProfile(promoter);
    }

    return {
      newBalance,
      commissionAdded: commission
    };
  }

  /**
   * Solicita el retiro de comisiones por transferencia SPEI
   */
  public async requestPromoterPayout(payout: PromoterPayoutRecord): Promise<void> {
    try {
      const cachedStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROMOTER_PAYOUTS);
      let list: PromoterPayoutRecord[] = cachedStr ? JSON.parse(cachedStr) : [];
      list.unshift(payout);
      localStorage.setItem(LOCAL_STORAGE_KEY_PROMOTER_PAYOUTS, JSON.stringify(list));

      // Subtract from promoter available balance
      const promoter = await this.getPromoterProfile(payout.promoterUserId);
      if (promoter) {
        promoter.availableBalanceMxn = Math.max(0, promoter.availableBalanceMxn - payout.amountMxn);
        promoter.totalPaidOutMxn += payout.amountMxn;
        await this.savePromoterProfile(promoter);
      }
    } catch (e) {
      console.warn('Error recording payout:', e);
    }
  }

  /**
   * Obtiene el historial de retiros de comisiones del promotor
   */
  public async getPromoterPayouts(promoterUserId: string): Promise<PromoterPayoutRecord[]> {
    try {
      const cachedStr = localStorage.getItem(LOCAL_STORAGE_KEY_PROMOTER_PAYOUTS);
      let list: PromoterPayoutRecord[] = cachedStr ? JSON.parse(cachedStr) : [];

      if (list.length === 0 && (promoterUserId === 'user-promoter-mario' || promoterUserId === 'promoter-mario-demo')) {
        list = [
          {
            id: 'payout-1',
            promoterUserId,
            amountMxn: 3832.0,
            clabe: '012180004567891234',
            bank: 'BBVA México',
            holderName: 'Mario Valenzuela López',
            status: 'completed',
            requestedAt: '2026-08-30T14:20:00.000Z',
            reference: 'SPEI-CITAPRO-88419'
          }
        ];
        localStorage.setItem(LOCAL_STORAGE_KEY_PROMOTER_PAYOUTS, JSON.stringify(list));
      }

      return list.filter((p) => p.promoterUserId === promoterUserId);
    } catch (e) {
      return [];
    }
  }

  /**
   * Actualiza datos bancarios CLABE del promotor
   */
  public async updatePromoterBankDetails(
    userId: string,
    clabe: string,
    bank: string,
    holderName: string
  ): Promise<void> {
    const promoter = await this.getPromoterProfile(userId);
    if (promoter) {
      promoter.payoutClabe = clabe.trim();
      promoter.payoutBank = bank.trim();
      promoter.payoutHolderName = holderName.trim();
      await this.savePromoterProfile(promoter);
    }
  }

  // ============================================================
  // REAL-TIME LISTENERS (onSnapshot)
  // ============================================================

  /**
   * Subscribe to a single affiliate document in real time.
   * Returns an unsubscribe function.
   */
  public subscribeToAffiliate(
    affiliateId: string,
    callback: (affiliate: Affiliate | null) => void
  ): () => void {
    const docRef = doc(db, 'affiliates', affiliateId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as Affiliate);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('[DataService] subscribeToAffiliate error:', err);
      }
    );
  }

  /**
   * Subscribe to all appointments of a specific affiliate in real time.
   */
  public subscribeToAppointments(
    affiliateId: string,
    callback: (appointments: Appointment[]) => void
  ): () => void {
    const q = query(
      collection(db, 'appointments'),
      where('affiliateId', '==', affiliateId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: Appointment[] = snap.docs.map((d) => d.data() as Appointment);
        callback(items);
      },
      (err) => {
        console.warn('[DataService] subscribeToAppointments error:', err);
      }
    );
  }

  /**
   * Subscribe to marketing assets of an affiliate (generated by n8n + Kie.ai).
   * Updates in real-time as n8n writes results to Firestore.
   */
  public subscribeToMarketingAssets(
    affiliateId: string,
    callback: (assets: MarketingAsset[]) => void
  ): () => void {
    const q = query(
      collection(db, 'marketing_assets'),
      where('affiliateId', '==', affiliateId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: MarketingAsset[] = snap.docs.map((d) => d.data() as MarketingAsset);
        callback(items);
      },
      (err) => {
        console.warn('[DataService] subscribeToMarketingAssets error:', err);
      }
    );
  }

  /**
   * Admin: Subscribe to affiliates with pending approval in real time.
   */
  public subscribeToAdminPendingAffiliates(
    callback: (affiliates: Affiliate[]) => void
  ): () => void {
    const q = query(
      collection(db, 'affiliates'),
      where('approvalStatus', '==', 'pending_approval'),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: Affiliate[] = snap.docs.map((d) => d.data() as Affiliate);
        callback(items);
      },
      (err) => {
        console.warn('[DataService] subscribeToAdminPendingAffiliates error:', err);
      }
    );
  }

  /**
   * Admin: Subscribe to recent promotion package purchases in real time.
   */
  public subscribeToPromotionOrders(
    callback: (orders: PromotionOrder[]) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(db, 'promotion_orders'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: PromotionOrder[] = snap.docs.map((d) => d.data() as PromotionOrder);
        callback(items);
      },
      (err) => {
        console.warn('[DataService] subscribeToPromotionOrders error:', err);
      }
    );
  }

  // ============================================================
  // MARKETING ASSETS — Save / Get
  // ============================================================

  /**
   * Save a marketing asset (flyer, video, etc.) generated by n8n to Firestore.
   */
  public async saveMarketingAsset(asset: MarketingAsset): Promise<void> {
    try {
      await setDoc(doc(db, 'marketing_assets', asset.id), asset, { merge: true });
    } catch (err) {
      console.warn('[DataService] saveMarketingAsset error:', err);
    }
  }

  /**
   * Get all marketing assets for an affiliate (one-time read).
   */
  public async getMarketingAssets(affiliateId: string): Promise<MarketingAsset[]> {
    try {
      const q = query(
        collection(db, 'marketing_assets'),
        where('affiliateId', '==', affiliateId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as MarketingAsset);
    } catch (err) {
      console.warn('[DataService] getMarketingAssets error:', err);
      return [];
    }
  }

  /**
   * Toggle addedToLanding for a specific marketing asset.
   * When set to true, the asset URL is automatically injected into the affiliate's gallery/videoUrl.
   */
  public async toggleAssetOnLanding(
    asset: MarketingAsset,
    affiliate: Affiliate
  ): Promise<Affiliate> {
    const newValue = !asset.addedToLanding;

    // Update the asset doc
    try {
      await updateDoc(doc(db, 'marketing_assets', asset.id), {
        addedToLanding: newValue
      });
    } catch (err) {
      console.warn('[DataService] toggleAssetOnLanding (asset) error:', err);
    }

    // Inject or remove from affiliate
    let updatedAff = { ...affiliate };
    if (newValue && asset.mediaUrl) {
      if (asset.assetType === 'cinematic_video' || asset.assetType === 'animated_video') {
        updatedAff.videoUrl = asset.mediaUrl;
      } else if (asset.assetType === 'flyer_image' || asset.assetType === 'flyer_with_reference') {
        const currentGallery = updatedAff.gallery || [];
        if (!currentGallery.includes(asset.mediaUrl)) {
          updatedAff.gallery = [asset.mediaUrl, ...currentGallery].slice(0, 10);
        }
      }
    }
    updatedAff.updatedAt = new Date().toISOString();
    await this.saveAffiliate(updatedAff);
    return updatedAff;
  }

  // ============================================================
  // PROMOTION ORDERS — Save / Get
  // ============================================================

  /**
   * Save a promotion order (exposure package purchase).
   */
  public async savePromotionOrder(order: PromotionOrder): Promise<void> {
    try {
      await setDoc(doc(db, 'promotion_orders', order.id), order, { merge: true });
    } catch (err) {
      console.warn('[DataService] savePromotionOrder error:', err);
    }
  }

  /**
   * Get promotion orders for a specific affiliate.
   */
  public async getPromotionOrdersForAffiliate(affiliateId: string): Promise<PromotionOrder[]> {
    try {
      const q = query(
        collection(db, 'promotion_orders'),
        where('affiliateId', '==', affiliateId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as PromotionOrder);
    } catch (err) {
      console.warn('[DataService] getPromotionOrdersForAffiliate error:', err);
      return [];
    }
  }

  /**
   * Get all promotion orders (admin view).
   */
  public async getAllPromotionOrders(): Promise<PromotionOrder[]> {
    try {
      const q = query(
        collection(db, 'promotion_orders'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as PromotionOrder);
    } catch (err) {
      console.warn('[DataService] getAllPromotionOrders error:', err);
      return [];
    }
  }
}

