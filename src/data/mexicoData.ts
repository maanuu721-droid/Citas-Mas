import { MexicanState, Affiliate, Review, ProfessionalDocument, MarketingCampaignRequest } from '../types.ts';
import {
  CATEGORIES_CATALOG,
  ALL_SUBCATEGORIES,
  resolveCategory,
  getActiveCategoriesForUsers,
  affiliateMatchesCategory,
  SubCategoryItem,
  MainCategoryItem,
  ActiveCategoryOption
} from './categoriesData.ts';

export {
  CATEGORIES_CATALOG,
  ALL_SUBCATEGORIES,
  resolveCategory,
  getActiveCategoriesForUsers,
  affiliateMatchesCategory
};
export type { SubCategoryItem, MainCategoryItem, ActiveCategoryOption };

export const MEXICAN_STATES: MexicanState[] = [
  { code: 'CDMX', name: 'Ciudad de México', cities: ['Cuauhtémoc', 'Benito Juárez', 'Miguel Hidalgo', 'Coyoacán', 'Tlalpan'], lat: 19.4326, lng: -99.1332 },
  { code: 'JAL', name: 'Jalisco', cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Puerto Vallarta'], lat: 20.6597, lng: -103.3496 },
  { code: 'NL', name: 'Nuevo León', cities: ['Monterrey', 'San Pedro Garza García', 'San Nicolás', 'Guadalupe'], lat: 25.6866, lng: -100.3161 },
  { code: 'PUE', name: 'Puebla', cities: ['Puebla de Zaragoza', 'San Andrés Cholula', 'San Pedro Cholula', 'Tehuacán'], lat: 19.0414, lng: -98.2063 },
  { code: 'QRO', name: 'Querétaro', cities: ['Santiago de Querétaro', 'Juriquilla', 'Corregidora', 'El Marqués'], lat: 20.5888, lng: -100.3899 },
  { code: 'YUC', name: 'Yucatán', cities: ['Mérida', 'Progreso', 'Valladolid'], lat: 20.9674, lng: -89.5926 },
  { code: 'QROO', name: 'Quintana Roo', cities: ['Cancún', 'Playa del Carmen', 'Tulum', 'Cozumel'], lat: 21.1619, lng: -86.8515 },
  { code: 'BC', name: 'Baja California', cities: ['Tijuana', 'Mexicali', 'Ensenada'], lat: 32.5149, lng: -117.0382 },
  { code: 'GTO', name: 'Guanajuato', cities: ['León', 'Guanajuato', 'San Miguel de Allende', 'Irapuato'], lat: 21.1221, lng: -101.6826 },
  { code: 'EDOMEX', name: 'Estado de México', cities: ['Naucalpan', 'Huixquilucan', 'Toluca', 'Metepec', 'Tlalnepantla'], lat: 19.3553, lng: -99.6438 },
  { code: 'VER', name: 'Veracruz', cities: ['Veracruz', 'Boca del Río', 'Xalapa'], lat: 19.1738, lng: -96.1342 },
  { code: 'COAH', name: 'Coahuila', cities: ['Saltillo', 'Torreón'], lat: 25.4267, lng: -101.0053 },
  { code: 'SON', name: 'Sonora', cities: ['Hermosillo', 'Ciudad Obregón'], lat: 29.0729, lng: -110.9559 },
  { code: 'SIN', name: 'Sinaloa', cities: ['Culiacán', 'Mazatlán'], lat: 24.8091, lng: -107.3940 },
  { code: 'CHIH', name: 'Chihuahua', cities: ['Chihuahua', 'Ciudad Juárez'], lat: 28.6353, lng: -106.0889 }
];

export const SERVICE_CATEGORIES = [
  { id: 'all', label: 'Todos los servicios', icon: 'Sparkles' },
  ...ALL_SUBCATEGORIES.map((s) => ({
    id: s.id,
    label: s.label,
    icon: 'Tag'
  }))
];

export const INITIAL_AFFILIATES: Affiliate[] = [
  {
    id: 'aff-psico-bienestar',
    name: 'Mtra. Mariana Ruiz González',
    businessName: 'Clínica Bienestar Mental Condesa',
    category: 'psicologia',
    categoryLabel: 'Psicología & Psicoterapia',
    description: 'Especialista en psicoterapia cognitivo-conductual, manejo de ansiedad, estrés laboral y terapia de pareja. Más de 9 años de experiencia clínica brindando un espacio seguro, ético y libre de juicios.',
    state: 'CDMX',
    city: 'Cuauhtémoc',
    address: 'Av. Ámsterdam 142, Col. Hipódromo Condesa, CDMX',
    lat: 19.4124,
    lng: -99.1698,
    phone: '+525541928374',
    email: 'contacto@bienestarmental.mx',
    logo: 'https://images.unsplash.com/photo-1594824813589-411a0c86e082?w=240&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=1200&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&auto=format&fit=crop&q=80'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    rating: 4.9,
    reviewCount: 128,
    completedAppointments: 342,
    plan: 'equipo',
    affiliateTierLevel: 3,
    freeLevel2PacksAvailable: 1,
    freeLevel2PacksUsed: 0,
    isTurbo: true,
    isVerified: true,
    approvalStatus: 'approved',
    verificationTier: 'destacado_seguro',
    isDestacadoSeguro: true,
    documents: [
      {
        id: 'doc-psico-1',
        type: 'cedula',
        typeLabel: 'Cédula Profesional',
        documentNumber: 'SEP-DGP-10948291',
        fileName: 'cedula_profesional_mariana_ruiz.pdf',
        issuedBy: 'Dirección General de Profesiones (SEP)',
        uploadedAt: '2026-08-10',
        verificationNotes: 'Cédula de Maestría en Psicología Clínica validada oficialmente.'
      },
      {
        id: 'doc-psico-2',
        type: 'titulo',
        typeLabel: 'Título Profesional Universitario',
        documentNumber: 'UNAM-FES-2017-991',
        fileName: 'titulo_licenciatura_psicologia.pdf',
        issuedBy: 'Universidad Nacional Autónoma de México (UNAM)',
        uploadedAt: '2026-08-10',
        verificationNotes: 'Título de Grado con RVOE verificado.'
      },
      {
        id: 'doc-psico-3',
        type: 'licencia_sanitaria',
        typeLabel: 'Licencia Sanitaria / Permiso COFEPRIS',
        documentNumber: 'COFEPRIS-AV-2024-8841',
        fileName: 'aviso_funcionamiento_cofepris.pdf',
        issuedBy: 'COFEPRIS Ciudad de México',
        uploadedAt: '2026-08-11',
        verificationNotes: 'Aviso de funcionamiento vigente para consultorio privado.'
      },
      {
        id: 'doc-psico-4',
        type: 'rfc_sat',
        typeLabel: 'Constancia de Situación Fiscal (SAT)',
        documentNumber: 'RUGM890412-K92',
        fileName: 'constancia_situacion_fiscal_sat.pdf',
        issuedBy: 'Servicio de Administración Tributaria (SAT)',
        uploadedAt: '2026-08-11',
        verificationNotes: 'Régimen de Servicios Profesionales Activo y al corriente.'
      }
    ],
    availableToday: true,
    availableTomorrow: true,
    planExpiresAt: '2026-10-28T00:00:00.000Z',
    hasAutoPaymentCard: true,
    cardLast4: '4242',
    monthlyMessagesSent: 412,
    blockedSlots: [
      {
        id: 'block-sample-1',
        date: '2026-09-26',
        isAllDay: true,
        reason: 'Congreso Internacional de Psicología Clínica',
        createdAt: '2026-09-20T10:00:00.000Z'
      }
    ],
    workingHours: {
      days: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '19:00',
      breakStart: '14:00',
      breakEnd: '15:00',
      slotDuration: 50
    },
    services: [
      { id: 'srv-1', name: 'Sesión Psicoterapia Individual', price: 650, duration: 50, description: 'Consulta 1 a 1 para tratamiento de ansiedad, autoestima, duelo o depresión.' },
      { id: 'srv-2', name: 'Terapia de Pareja', price: 950, duration: 80, description: 'Resolución asertiva de conflictos y comunicación profunda en pareja.' },
      { id: 'srv-3', name: 'Evaluación y Diagnóstico Inicial', price: 800, duration: 60, description: 'Sesión integral para diseñar tu plan terapéutico personalizado.' }
    ]
  },
  {
    id: 'aff-spa-relajacion',
    name: 'Karla Domínguez & Terapeutas',
    businessName: 'Spa Relajación Total & Hidroterapia',
    category: 'masajes',
    categoryLabel: 'Masajes & Spa',
    description: 'Santuario de relajación profunda en Providencia. Masajes terapéuticos descontracturantes, piedras calientes, aromaterapia botánica y rituales de renovación corporal.',
    state: 'JAL',
    city: 'Guadalajara',
    address: 'Av. Terranova 680, Col. Providencia, Guadalajara, Jal.',
    lat: 20.6865,
    lng: -103.3872,
    phone: '+523318294721',
    email: 'info@sparelajaciontotal.com',
    logo: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=240&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&auto=format&fit=crop&q=80'
    ],
    rating: 4.8,
    reviewCount: 94,
    completedAppointments: 289,
    plan: 'pro',
    affiliateTierLevel: 2,
    freeLevel2PacksAvailable: 0,
    freeLevel2PacksUsed: 0,
    isTurbo: true,
    isVerified: true,
    approvalStatus: 'approved',
    verificationTier: 'active',
    isDestacadoSeguro: false,
    documents: [
      {
        id: 'doc-spa-1',
        type: 'cedula',
        typeLabel: 'Cédula Profesional',
        documentNumber: 'SEP-TEC-5819024',
        fileName: 'cedula_tecnico_fisioterapia_spa.pdf',
        issuedBy: 'Dirección General de Profesiones (SEP)',
        uploadedAt: '2026-08-14',
        verificationNotes: 'Cédula Técnica en Terapias Corporales cotejada.'
      },
      {
        id: 'doc-spa-2',
        type: 'licencia_sanitaria',
        typeLabel: 'Licencia Sanitaria / Permiso COFEPRIS',
        documentNumber: 'JAL-COFEPRIS-88192',
        fileName: 'licencia_sanitaria_spa_guadalajara.pdf',
        issuedBy: 'Secretaría de Salud Jalisco (COFEPRIS)',
        uploadedAt: '2026-08-14',
        verificationNotes: 'Permiso sanitario de cabinas de masaje y spa.'
      }
    ],
    availableToday: true,
    availableTomorrow: true,
    planExpiresAt: '2026-09-25T00:00:00.000Z',
    hasAutoPaymentCard: false,
    monthlyMessagesSent: 285,
    workingHours: {
      days: [1, 2, 3, 4, 5, 6, 0],
      startTime: '10:00',
      endTime: '20:00',
      slotDuration: 60
    },
    services: [
      { id: 'srv-spa-1', name: 'Masaje Descontracturante Profundo', price: 480, duration: 60, description: 'Alivio focalizado de nudos en cuello, espalda y hombros con aceites orgánicos.' },
      { id: 'srv-spa-2', name: 'Masaje de Piedras Volcánicas Calientes', price: 720, duration: 75, description: 'Equilibrio energético y relajación total con piedras basalticas calientes.' },
      { id: 'srv-spa-3', name: 'Ritual Facial Anti-Estrés + Drenaje', price: 600, duration: 60, description: 'Limpieza profunda botánica, mascarilla hidratante y masaje craneofacial.' }
    ]
  },
  {
    id: 'aff-barber-estilo',
    name: 'Carlos Méndez (Master Barber)',
    businessName: 'Barbería El Estilo Tradicional',
    category: 'barberia',
    categoryLabel: 'Barbería & Cuidado Masculino',
    description: 'Tradición y vanguardia en el arte del corte masculino y afeitado clásico con toalla caliente. Cerveza artesanal de cortesía y ambiente exclusivo.',
    state: 'NL',
    city: 'San Pedro Garza García',
    address: 'Calzada del Valle 340, San Pedro Garza García, NL',
    lat: 25.6558,
    lng: -100.3582,
    phone: '+528114920485',
    email: 'citas@barberiaelestilo.mx',
    logo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=240&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80'
    ],
    rating: 4.7,
    reviewCount: 165,
    completedAppointments: 610,
    plan: 'basico',
    affiliateTierLevel: 1,
    freeLevel2PacksAvailable: 0,
    freeLevel2PacksUsed: 0,
    isTurbo: false,
    isVerified: true,
    approvalStatus: 'approved',
    verificationTier: 'active',
    isDestacadoSeguro: false,
    documents: [
      {
        id: 'doc-barb-1',
        type: 'rfc_sat',
        typeLabel: 'Constancia de Situación Fiscal (SAT)',
        documentNumber: 'MEC820914-HX9',
        fileName: 'constancia_rfc_barberia_sanpedro.pdf',
        issuedBy: 'Servicio de Administración Tributaria (SAT)',
        uploadedAt: '2026-08-01',
        verificationNotes: 'RFC de Persona Física con Actividad Empresarial verificado.'
      }
    ],
    availableToday: false,
    availableTomorrow: true,
    planExpiresAt: '2026-09-26T00:00:00.000Z',
    hasAutoPaymentCard: false,
    monthlyMessagesSent: 195,
    workingHours: {
      days: [2, 3, 4, 5, 6, 0],
      startTime: '10:00',
      endTime: '20:00',
      slotDuration: 40
    },
    services: [
      { id: 'srv-barb-1', name: 'Corte de Autor + Lavado Premium', price: 250, duration: 40, description: 'Diseño de corte según tu fisionomía, lavado capilar y peinado con pomada.' },
      { id: 'srv-barb-2', name: 'Ritual Barba Clásica con Toalla Caliente', price: 220, duration: 35, description: 'Delineado preciso a navaja libre, bálsamo nutritivo y toallas calientes de eucalipto.' },
      { id: 'srv-barb-3', name: 'Combo Completo: Corte + Barba + Mascarilla Black', price: 420, duration: 70, description: 'La experiencia máxima de renovación con mascarilla de carbón activado.' }
    ]
  },
  {
    id: 'aff-dental-smile',
    name: 'Dr. Roberto Alarcón (Ortodoncista)',
    businessName: 'Dental Smile & Estética Odontológica',
    category: 'dental',
    categoryLabel: 'Dentista & Odontología',
    description: 'Odontología digital de mínima invasión. Especialistas en blanqueamiento láser, limpieza con ultrasonido, alineadores invisibles y urgencias dentales.',
    state: 'PUE',
    city: 'San Andrés Cholula',
    address: 'Vía Atlixcáyotl 2210, Plaza Sonata, Lomas de Angelópolis, Pue.',
    lat: 19.0068,
    lng: -98.2612,
    phone: '+522228391029',
    email: 'atencion@dentalsmile.com.mx',
    logo: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=240&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewCount: 204,
    completedAppointments: 530,
    plan: 'equipo',
    isTurbo: true,
    isVerified: true,
    approvalStatus: 'approved',
    verificationTier: 'destacado_seguro',
    isDestacadoSeguro: true,
    documents: [
      {
        id: 'doc-dent-1',
        type: 'cedula',
        typeLabel: 'Cédula Profesional',
        documentNumber: 'SEP-DGP-8491024',
        fileName: 'cedula_cirujano_dentista_sep.pdf',
        issuedBy: 'Dirección General de Profesiones (SEP)',
        uploadedAt: '2026-07-22',
        verificationNotes: 'Cédula de Cirujano Dentista y Especialidad en Ortodoncia validada.'
      },
      {
        id: 'doc-dent-2',
        type: 'titulo',
        typeLabel: 'Título Profesional Universitario',
        documentNumber: 'BUAP-FOL-2015-819',
        fileName: 'titulo_odontologia_buap.pdf',
        issuedBy: 'Benemérita Universidad Autónoma de Puebla (BUAP)',
        uploadedAt: '2026-07-22',
        verificationNotes: 'Título Profesional y acta de examen de grado verificados.'
      },
      {
        id: 'doc-dent-3',
        type: 'licencia_sanitaria',
        typeLabel: 'Licencia Sanitaria / Permiso COFEPRIS',
        documentNumber: 'PUE-COFEPRIS-CLIN-2023-410',
        fileName: 'licencia_sanitaria_clinica_dental.pdf',
        issuedBy: 'Secretaría de Salud de Puebla (COFEPRIS)',
        uploadedAt: '2026-07-23',
        verificationNotes: 'Licencia para clínica estomatológica y rayos X dental.'
      },
      {
        id: 'doc-dent-4',
        type: 'rfc_sat',
        typeLabel: 'Constancia de Situación Fiscal (SAT)',
        documentNumber: 'AALR860520-QR7',
        fileName: 'constancia_fiscal_sat_clinica.pdf',
        issuedBy: 'Servicio de Administración Tributaria (SAT)',
        uploadedAt: '2026-07-23',
        verificationNotes: 'Constancia de RFC activa y cumplimiento positivo.'
      }
    ],
    availableToday: false,
    availableTomorrow: true,
    monthlyMessagesSent: 520,
    workingHours: {
      days: [1, 2, 3, 4, 5, 6],
      startTime: '09:00',
      endTime: '19:00',
      slotDuration: 45
    },
    services: [
      { id: 'srv-dent-1', name: 'Limpieza Dental Ultrasonido + Pulido', price: 800, duration: 45, description: 'Remoción de sarro supragingival sin dolor y profilaxis con pasta diamantada.' },
      { id: 'srv-dent-2', name: 'Blanqueamiento Dental Láser LED', price: 1850, duration: 60, description: 'Aclara hasta 4 tonos en una sola sesión segura para el esmalte dental.' },
      { id: 'srv-dent-3', name: 'Valoración Ortodoncia Invisible (Scan 3D)', price: 450, duration: 40, description: 'Escaneo intraoral 3D y simulación computarizada de tu sonrisa ideal.' }
    ]
  },
  {
    id: 'aff-terapia-luna',
    name: 'Lic. Sofía Valenzuela',
    businessName: 'Terapia Holística Luna & Acupuntura',
    category: 'terapeuta',
    categoryLabel: 'Terapia Holística & Acupuntura',
    description: 'Armonización psicocorporal integrativa. Medicina tradicional china, biomagnetismo, flores de Bach y sanación con cuencos tibetanos para desintoxicar cuerpo y mente.',
    state: 'QRO',
    city: 'Santiago de Querétaro',
    address: 'Calle 5 de Mayo 88, Centro Histórico, Querétaro, Qro.',
    lat: 20.5937,
    lng: -100.3922,
    phone: '+524429381726',
    email: 'contacto@terapialuna.com',
    logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=240&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512290900672-1f486d34e9eb?w=600&auto=format&fit=crop&q=80'
    ],
    rating: 4.6,
    reviewCount: 68,
    completedAppointments: 190,
    plan: 'basico',
    isTurbo: false,
    isVerified: true,
    approvalStatus: 'approved',
    verificationTier: 'active',
    isDestacadoSeguro: false,
    documents: [
      {
        id: 'doc-luna-1',
        type: 'cedula',
        typeLabel: 'Cédula Profesional',
        documentNumber: 'SEP-DGP-9301948',
        fileName: 'cedula_acupuntura_medicina_china.pdf',
        issuedBy: 'Dirección General de Profesiones (SEP)',
        uploadedAt: '2026-08-05',
        verificationNotes: 'Cédula Profesional en Acupuntura Humana.'
      }
    ],
    availableToday: false,
    availableTomorrow: false,
    monthlyMessagesSent: 74,
    workingHours: {
      days: [1, 3, 5, 6],
      startTime: '11:00',
      endTime: '18:00',
      slotDuration: 60
    },
    services: [
      { id: 'srv-holis-1', name: 'Sesión de Acupuntura & Biomagnetismo', price: 550, duration: 60, description: 'Desbloqueo de meridianos bioenergéticos y regulación del dolor crónico.' },
      { id: 'srv-holis-2', name: 'Terapia de Reiki + Sonoterapia Cuencos', price: 650, duration: 60, description: 'Inducción de ondas alfa y theta para regeneración profunda del sistema nervioso.' }
    ]
  },
  {
    id: 'aff-belleza-glam',
    name: 'Valeria Ramos',
    businessName: 'Studio Belleza Glam & Microblading',
    category: 'belleza',
    categoryLabel: 'Belleza & Cosmetología',
    description: 'Especialistas en micropigmentación, diseño de cejas hiperrealista, lifting de pestañas con keratina y cuidado facial con aparatología de última generación.',
    state: 'YUC',
    city: 'Mérida',
    address: 'Paseo de Montejo 412, Zona Paseo, Mérida, Yuc.',
    lat: 20.9856,
    lng: -89.6190,
    phone: '+529994829103',
    email: 'contacto@glambelleza.mx',
    logo: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=240&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewCount: 89,
    completedAppointments: 310,
    plan: 'comision',
    isTurbo: true,
    isVerified: false,
    approvalStatus: 'pending_approval',
    verificationTier: 'inactive',
    isDestacadoSeguro: false,
    documents: [],
    availableToday: false,
    availableTomorrow: false,
    monthlyMessagesSent: 312,
    workingHours: {
      days: [1, 2, 3, 4, 5, 6],
      startTime: '10:00',
      endTime: '19:00',
      slotDuration: 60
    },
    services: [
      { id: 'srv-bel-1', name: 'Lifting de Pestañas + Tinte + Botox', price: 490, duration: 50, description: 'Curvatura natural y nutrición profunda para una mirada despierta sin rímel.' },
      { id: 'srv-bel-2', name: 'Laminado y Diseño de Cejas con Henna', price: 390, duration: 45, description: 'Perfilado milimétrico y sombreado temporal orgánico.' },
      { id: 'srv-bel-3', name: 'Limpieza Facial Profunda con Hidrodermoabrasión', price: 750, duration: 60, description: 'Extracción sin dolor, infusión de sueros antioxidantes y luz LED.' }
    ]
  },
  {
    id: 'aff-mty-fisio',
    name: 'Dr. Rodrigo Garza Cavazos',
    businessName: 'Clínica de Fisioterapia & Readaptación Monterrey',
    category: 'fisioterapeutas',
    categoryLabel: 'Fisioterapeutas y rehabilitadores',
    description: 'Especialista en medicina física y deportiva. Tratamiento de lesiones musculares, dolor lumbar, rehabilitación postquirúrgica y terapia manual avanzada en Monterrey.',
    state: 'NL',
    city: 'Monterrey',
    address: 'Av. Constitución 2050, Piso 8, Obispado, Monterrey, NL',
    lat: 25.6714,
    lng: -100.3095,
    phone: '+528189320194',
    email: 'contacto@fisiomty.mx',
    logo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=240&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&auto=format&fit=crop&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80'
    ],
    rating: 4.9,
    reviewCount: 112,
    completedAppointments: 420,
    plan: 'equipo',
    affiliateTierLevel: 3,
    freeLevel2PacksAvailable: 1,
    freeLevel2PacksUsed: 0,
    isTurbo: true,
    isVerified: true,
    approvalStatus: 'approved',
    verificationTier: 'destacado_seguro',
    isDestacadoSeguro: true,
    documents: [
      {
        id: 'doc-mty-1',
        type: 'cedula',
        typeLabel: 'Cédula Profesional',
        documentNumber: 'SEP-DGP-11829034',
        fileName: 'cedula_fisioterapia_uanl.pdf',
        issuedBy: 'Dirección General de Profesiones (SEP)',
        uploadedAt: '2026-08-01',
        verificationNotes: 'Licenciatura en Fisioterapia UANL cotejada.'
      }
    ],
    availableToday: true,
    availableTomorrow: true,
    planExpiresAt: '2026-10-30T00:00:00.000Z',
    hasAutoPaymentCard: true,
    cardLast4: '8811',
    monthlyMessagesSent: 340,
    workingHours: {
      days: [1, 2, 3, 4, 5, 6],
      startTime: '08:00',
      endTime: '19:00',
      slotDuration: 50
    },
    services: [
      { id: 'srv-mty-1', name: 'Sesión Fisioterapia Integral Deportiva', price: 650, duration: 50, description: 'Electroterapia, ultrasonido, punción seca y terapia manual.' },
      { id: 'srv-mty-2', name: 'Rehabilitación de Columna & Postura', price: 700, duration: 60, description: 'Descompresión y fortalecimiento para hernias y lumbalgia.' },
      { id: 'srv-mty-3', name: 'Descarga Muscular con Presoterapia', price: 500, duration: 40, description: 'Botas de presoterapia secuencial y masaje de recuperación para atletas.' }
    ]
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    affiliateId: 'aff-psico-bienestar',
    appointmentId: 'CP-91024',
    clientName: 'Andrea Morales V.',
    rating: 5,
    comment: 'Excelente profesional. La confirmación por WhatsApp me llegó de inmediato con las indicaciones precisas. El consultorio es muy acogedor.',
    date: '18 Sep 2026',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rev-2',
    affiliateId: 'aff-psico-bienestar',
    appointmentId: 'CP-87412',
    clientName: 'Alejandro Toledo',
    rating: 5,
    comment: 'Pagar por adelantado me dio total certidumbre de mi horario sin filas ni esperas. Me mandaron el recordatorio 2 horas antes.',
    date: '14 Sep 2026',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rev-3',
    affiliateId: 'aff-spa-relajacion',
    appointmentId: 'CP-84910',
    clientName: 'Mariana Elizondo',
    rating: 5,
    comment: 'El masaje descontracturante fue maravilloso. Atención puntual y el mensaje de WhatsApp me permitió reagendar fácilmente cuando se me complicó la hora.',
    date: '16 Sep 2026',
    createdAt: new Date().toISOString()
  },
  {
    id: 'rev-4',
    affiliateId: 'aff-dental-smile',
    appointmentId: 'CP-78192',
    clientName: 'Javier Domínguez',
    rating: 5,
    comment: 'El Dr. Roberto explica todo con peras y manzanas. La clínica es de primer nivel y la cita pagada agilizó todo en recepción.',
    date: '11 Sep 2026',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_MARKETING_REQUESTS: MarketingCampaignRequest[] = [
  {
    id: 'mkt-req-101',
    affiliateId: 'aff-psico-bienestar',
    affiliateName: 'Clínica Bienestar Mental Condesa',
    affiliatePhone: '+525541928374',
    affiliateEmail: 'contacto@bienestarmental.mx',
    affiliateCity: 'Cuauhtémoc, CDMX',
    campaignId: 'camp-pro-psico-free-1',
    level: 'pro_animated',
    levelLabel: 'Campaña Nivel Pro (Flyer Animado + Voz IA)',
    headline: 'Salud Emocional de Vanguardia en la Condesa',
    scriptHook: 'Un espacio confidencial y seguro para superar el estrés, la ansiedad y reencontrar tu equilibrio con especialistas certificados.',
    voiceType: 'female_warm',
    costExtraMxn: 0,
    isFreeBenefitApplied: true,
    benefitReason: '1 Pack de Publicidad Nivel 2 incluido SIN COSTO EXTRA por Membresía de Más Alto Nivel (Plan Equipo)',
    affiliateTierLevel: 3,
    paymentStatus: 'paid_verified',
    paymentMethod: 'mercadopago',
    paymentReference: 'BENEFICIO-ALTO-NIVEL-CORTESIA-100%',
    adminApprovalStatus: 'pending_approval',
    notes: 'Afiliado de más alto nivel (Plan Equipo). Aplica su derecho a 1 pack de publicidad nivel 2 sin costo extra ($0 MXN). Listo para autorizar y activar campaña.',
    requestedAt: '2026-09-22T06:30:00Z'
  },
  {
    id: 'mkt-req-102',
    affiliateId: 'aff-barber-estilo',
    affiliateName: 'Barbería El Estilo Tradicional',
    affiliatePhone: '+528114920485',
    affiliateEmail: 'citas@barberiaelestilo.mx',
    affiliateCity: 'San Pedro Garza García, NL',
    campaignId: 'camp-pro-barb-1',
    level: 'pro_animated',
    levelLabel: 'Campaña Nivel Pro (Flyer Animado + Voz IA)',
    headline: 'Ritual Barba Clásica con Toalla Caliente & Corte de Autor',
    scriptHook: 'Tu imagen es tu carta de presentación. Agenda con los mejores barberos de San Pedro.',
    voiceType: 'young_dynamic',
    costExtraMxn: 550,
    isFreeBenefitApplied: false,
    benefitReason: undefined,
    affiliateTierLevel: 1,
    paymentStatus: 'pending_payment',
    paymentMethod: 'spei',
    paymentReference: 'SPEI-PENDING-CLABE-8841',
    adminApprovalStatus: 'pending_approval',
    notes: 'Usuario Nivel 1 (Plan Básico). Obligatorio que abone los $550 MXN por el uso de herramientas publicitarias. Comprobante en validación bancaria.',
    requestedAt: '2026-09-22T07:15:00Z'
  },
  {
    id: 'mkt-req-103',
    affiliateId: 'aff-spa-relajacion',
    affiliateName: 'Spa Relajación Total & Hidroterapia',
    affiliatePhone: '+523318294721',
    affiliateEmail: 'info@sparelajaciontotal.com',
    affiliateCity: 'Guadalajara, JAL',
    campaignId: 'camp-prem-spa-1',
    level: 'premium_cinema',
    levelLabel: 'Campaña Premium (Video Cinematográfico 4K)',
    headline: 'Renueva tu cuerpo con Masaje Descontracturante & Hidroterapia',
    scriptHook: '¿Sientes tensión acumulada en cuello y espalda? Descubre Spa Relajación Total con circuito termal.',
    voiceType: 'female_warm',
    costExtraMxn: 1250,
    isFreeBenefitApplied: false,
    affiliateTierLevel: 2,
    paymentStatus: 'paid_verified',
    paymentMethod: 'tarjeta',
    paymentReference: 'STRIPE-TXN-984210492',
    adminApprovalStatus: 'pending_approval',
    notes: 'Campaña Premium Cinematográfica ($1,250 MXN). Pago verificado con tarjeta. Listo para autorizar y activar campaña.',
    requestedAt: '2026-09-22T07:55:00Z'
  }
];
