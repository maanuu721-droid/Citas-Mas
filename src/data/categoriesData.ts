export interface SubCategoryItem {
  id: string;
  label: string;
  mainCategoryId: string;
  mainCategoryName: string;
  keywords?: string[];
  legacyAliases?: string[]; // Para compatibilidad hacia atrás con datos existentes
}

export interface MainCategoryItem {
  id: string;
  name: string;
  icon: string;
  subcategories: SubCategoryItem[];
}

export const CATEGORIES_CATALOG: MainCategoryItem[] = [
  {
    id: 'salud_bienestar',
    name: '1. Salud y bienestar',
    icon: 'HeartPulse',
    subcategories: [
      {
        id: 'clinicas_medicas',
        label: 'Clínicas médicas (medicina general, especialistas)',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        keywords: ['médico', 'doctor', 'consulta médica', 'especialista', 'salud']
      },
      {
        id: 'dentistas_ortodoncistas',
        label: 'Dentistas y ortodoncistas',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        legacyAliases: ['dental', 'odontologia', 'dentista'],
        keywords: ['dientes', 'limpieza dental', 'brackets', 'caries', 'ortodoncia', 'odontología']
      },
      {
        id: 'fisioterapeutas_rehabilitadores',
        label: 'Fisioterapeutas y rehabilitadores',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        legacyAliases: ['fisioterapia', 'rehabilitacion'],
        keywords: ['rehabilitación', 'fisioterapia', 'dolor de espalda', 'lesión', 'terapia física']
      },
      {
        id: 'psicologos_psiquiatras_terapeutas',
        label: 'Psicólogos, psiquiatras y terapeutas',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        legacyAliases: ['psicologia', 'terapeuta', 'salud_mental'],
        keywords: ['psicología', 'terapia', 'ansiedad', 'depresión', 'psiquiatra', 'salud mental', 'terapeuta']
      },
      {
        id: 'nutricionistas_dietistas',
        label: 'Nutricionistas y dietistas',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        legacyAliases: ['nutricion'],
        keywords: ['dieta', 'alimentación', 'nutriólogo', 'peso', 'plan nutricional']
      },
      {
        id: 'quiropracticos_osteopatas',
        label: 'Quiroprácticos y osteópatas',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        keywords: ['columna', 'ajuste quiropráctico', 'osteopatía', 'cuello', 'postura']
      },
      {
        id: 'optometristas_oftalmologos',
        label: 'Optometristas y oftalmólogos',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        keywords: ['vista', 'ojos', 'lentes', 'graduación', 'oftalmología']
      },
      {
        id: 'veterinarias_mascotas',
        label: 'Veterinarias y clínicas de mascotas',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        legacyAliases: ['veterinaria'],
        keywords: ['perro', 'gato', 'animales', 'veterinario', 'vacunas']
      },
      {
        id: 'laboratorios_clinicos',
        label: 'Laboratorios de análisis clínicos',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        keywords: ['análisis de sangre', 'estudios', 'laboratorio', 'muestras']
      },
      {
        id: 'medicina_estetica_cirugia',
        label: 'Centros de medicina estética y cirugía plástica',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        keywords: ['bótox', 'ácido hialurónico', 'rejuvenecimiento', 'cirugía estética']
      },
      {
        id: 'fertilidad_ginecologia',
        label: 'Clínicas de fertilidad y ginecología',
        mainCategoryId: 'salud_bienestar',
        mainCategoryName: 'Salud y bienestar',
        keywords: ['ginecólogo', 'papanicolau', 'embarazo', 'fertilidad', 'mujer']
      }
    ]
  },
  {
    id: 'belleza_cuidado',
    name: '2. Belleza y cuidado personal',
    icon: 'Sparkles',
    subcategories: [
      {
        id: 'peluquerias_barberias',
        label: 'Peluquerías y barberías',
        mainCategoryId: 'belleza_cuidado',
        mainCategoryName: 'Belleza y cuidado personal',
        legacyAliases: ['barberia', 'peluqueria'],
        keywords: ['corte de cabello', 'barba', 'fade', 'tinte', 'peinado']
      },
      {
        id: 'salones_unas',
        label: 'Salones de uñas (manicure/pedicure)',
        mainCategoryId: 'belleza_cuidado',
        mainCategoryName: 'Belleza y cuidado personal',
        keywords: ['manicura', 'pedicura', 'uñas de acrílico', 'gelish', 'nails']
      },
      {
        id: 'spas_masajes',
        label: 'Spas y centros de masajes',
        mainCategoryId: 'belleza_cuidado',
        mainCategoryName: 'Belleza y cuidado personal',
        legacyAliases: ['masajes', 'spa'],
        keywords: ['masaje relajante', 'descontracturante', 'spa', 'aromaterapia', 'sauna']
      },
      {
        id: 'esteticas_depilacion',
        label: 'Estéticas y centros de depilación',
        mainCategoryId: 'belleza_cuidado',
        mainCategoryName: 'Belleza y cuidado personal',
        legacyAliases: ['belleza'],
        keywords: ['depilación láser', 'cera', 'estética', 'facial']
      },
      {
        id: 'maquilladores_estilistas',
        label: 'Maquilladores y estilistas',
        mainCategoryId: 'belleza_cuidado',
        mainCategoryName: 'Belleza y cuidado personal',
        keywords: ['maquillaje profesional', 'novias', 'eventos', 'peinados']
      },
      {
        id: 'salones_tatuajes_piercing',
        label: 'Salones de tatuajes y piercing',
        mainCategoryId: 'belleza_cuidado',
        mainCategoryName: 'Belleza y cuidado personal',
        keywords: ['tattoo', 'tatuador', 'perforaciones', 'piercing', 'arte corporal']
      },
      {
        id: 'bronceado_tratamientos_faciales',
        label: 'Centros de bronceado y tratamientos faciales',
        mainCategoryId: 'belleza_cuidado',
        mainCategoryName: 'Belleza y cuidado personal',
        keywords: ['bronceado', 'limpieza facial', 'hidrafacial', 'microdermoabrasión']
      }
    ]
  },
  {
    id: 'servicios_profesionales',
    name: '3. Servicios profesionales',
    icon: 'Briefcase',
    subcategories: [
      {
        id: 'abogados_despachos',
        label: 'Abogados y despachos jurídicos',
        mainCategoryId: 'servicios_profesionales',
        mainCategoryName: 'Servicios profesionales',
        keywords: ['abogado', 'legal', 'demanda', 'contratos', 'asesoría legal', 'juicio']
      },
      {
        id: 'contadores_fiscales',
        label: 'Contadores y asesores fiscales',
        mainCategoryId: 'servicios_profesionales',
        mainCategoryName: 'Servicios profesionales',
        keywords: ['SAT', 'impuestos', 'declaración fiscal', 'contabilidad', 'facturas']
      },
      {
        id: 'consultores_coaches',
        label: 'Consultores de negocios y coaches',
        mainCategoryId: 'servicios_profesionales',
        mainCategoryName: 'Servicios profesionales',
        keywords: ['consultoría', 'estrategia', 'mentoring', 'negocios', 'pymes']
      },
      {
        id: 'asesores_financieros',
        label: 'Asesores financieros y planificadores patrimoniales',
        mainCategoryId: 'servicios_profesionales',
        mainCategoryName: 'Servicios profesionales',
        keywords: ['inversiones', 'ahorro', 'finanzas', 'patrimonio', 'retiro']
      },
      {
        id: 'notarios',
        label: 'Notarios',
        mainCategoryId: 'servicios_profesionales',
        mainCategoryName: 'Servicios profesionales',
        keywords: ['notaría', 'escrituras', 'poder notarial', 'testamento', 'actas']
      },
      {
        id: 'agentes_seguros',
        label: 'Agentes de seguros',
        mainCategoryId: 'servicios_profesionales',
        mainCategoryName: 'Servicios profesionales',
        keywords: ['seguro de auto', 'gastos médicos', 'seguro de vida', 'póliza']
      },
      {
        id: 'arquitectos_ingenieros',
        label: 'Arquitectos e ingenieros (consultas)',
        mainCategoryId: 'servicios_profesionales',
        mainCategoryName: 'Servicios profesionales',
        keywords: ['planos', 'remodelación', 'construcción', 'diseño arquitectónico']
      },
      {
        id: 'traductores_interpretes',
        label: 'Traductores e intérpretes',
        mainCategoryId: 'servicios_profesionales',
        mainCategoryName: 'Servicios profesionales',
        keywords: ['traducción pericial', 'inglés', 'idiomas', 'documentos oficiales']
      }
    ]
  },
  {
    id: 'educacion_formacion',
    name: '4. Educación y formación',
    icon: 'GraduationCap',
    subcategories: [
      {
        id: 'tutores_academias',
        label: 'Tutores particulares y academias de refuerzo',
        mainCategoryId: 'educacion_formacion',
        mainCategoryName: 'Educación y formación',
        keywords: ['clases particulares', 'matemáticas', 'regularización', 'asesoría escolar']
      },
      {
        id: 'escuelas_idiomas',
        label: 'Escuelas de idiomas',
        mainCategoryId: 'educacion_formacion',
        mainCategoryName: 'Educación y formación',
        keywords: ['inglés', 'francés', 'alemán', 'cursos de idiomas', 'toefl']
      },
      {
        id: 'profesores_musica',
        label: 'Profesores de música, canto o instrumentos',
        mainCategoryId: 'educacion_formacion',
        mainCategoryName: 'Educación y formación',
        keywords: ['guitarra', 'piano', 'canto', 'clases de música', 'batería']
      },
      {
        id: 'instructores_conduccion',
        label: 'Instructores de conducción (autoescuelas)',
        mainCategoryId: 'educacion_formacion',
        mainCategoryName: 'Educación y formación',
        keywords: ['aprender a manejar', 'escuela de manejo', 'licencia', 'clases de conducir']
      },
      {
        id: 'formacion_profesional_cursos',
        label: 'Centros de formación profesional y cursos especializados',
        mainCategoryId: 'educacion_formacion',
        mainCategoryName: 'Educación y formación',
        keywords: ['diplomados', 'certificación', 'talleres', 'capacitación']
      },
      {
        id: 'coaches_carrera_personal',
        label: 'Coaches de carrera o de desarrollo personal',
        mainCategoryId: 'educacion_formacion',
        mainCategoryName: 'Educación y formación',
        keywords: ['liderazgo', 'oratoria', 'desarrollo profesional', 'orientación vocacional']
      }
    ]
  },
  {
    id: 'fitness_deporte',
    name: '5. Fitness y deporte',
    icon: 'Dumbbell',
    subcategories: [
      {
        id: 'entrenadores_personales',
        label: 'Entrenadores personales',
        mainCategoryId: 'fitness_deporte',
        mainCategoryName: 'Fitness y deporte',
        keywords: ['personal trainer', 'gimnasio', 'pesas', 'rutina', 'crossfit']
      },
      {
        id: 'yoga_pilates_barre',
        label: 'Estudios de yoga, pilates o barre',
        mainCategoryId: 'fitness_deporte',
        mainCategoryName: 'Fitness y deporte',
        keywords: ['yoga', 'pilates reformer', 'barre', 'estiramientos', 'meditación']
      },
      {
        id: 'fisioterapia_deportiva',
        label: 'Clínicas de fisioterapia deportiva',
        mainCategoryId: 'fitness_deporte',
        mainCategoryName: 'Fitness y deporte',
        keywords: ['atletas', 'lesiones deportivas', 'rendimiento', 'descarga muscular']
      },
      {
        id: 'centros_rehabilitacion_fisica',
        label: 'Centros de rehabilitación',
        mainCategoryId: 'fitness_deporte',
        mainCategoryName: 'Fitness y deporte',
        keywords: ['recuperación física', 'rehabilitación motriz', 'terapia deportiva']
      },
      {
        id: 'clases_natacion_tenis_golf',
        label: 'Clases particulares de natación, tenis, golf, etc.',
        mainCategoryId: 'fitness_deporte',
        mainCategoryName: 'Fitness y deporte',
        keywords: ['natación', 'tenis', 'pádel', 'golf', 'clases deportivas']
      }
    ]
  },
  {
    id: 'hogar_tecnicos',
    name: '6. Servicios para el hogar y técnicos',
    icon: 'Wrench',
    subcategories: [
      {
        id: 'plomeria_electricidad_hvac',
        label: 'Fontaneros, electricistas y técnicos de HVAC (aire acondicionado/calefacción)',
        mainCategoryId: 'hogar_tecnicos',
        mainCategoryName: 'Servicios para el hogar y técnicos',
        keywords: ['fontanero', 'plomero', 'electricista', 'aire acondicionado', 'fuga de agua', 'climas']
      },
      {
        id: 'limpieza_domicilio',
        label: 'Empresas de limpieza a domicilio (especialmente limpieza profunda o regular)',
        mainCategoryId: 'hogar_tecnicos',
        mainCategoryName: 'Servicios para el hogar y técnicos',
        keywords: ['limpieza profunda', 'desinfección', 'aseo', 'limpieza de casas']
      },
      {
        id: 'control_plagas',
        label: 'Control de plagas',
        mainCategoryId: 'hogar_tecnicos',
        mainCategoryName: 'Servicios para el hogar y técnicos',
        keywords: ['fumigación', 'plagas', 'cucarachas', 'chinches', 'termitas']
      },
      {
        id: 'reparacion_electrodomesticos',
        label: 'Técnicos de reparación de electrodomésticos',
        mainCategoryId: 'hogar_tecnicos',
        mainCategoryName: 'Servicios para el hogar y técnicos',
        keywords: ['refrigeradores', 'lavadoras', 'secadoras', 'hornos', 'reparación']
      },
      {
        id: 'alarmas_camaras_domotica',
        label: 'Instaladores de alarmas, cámaras o domótica',
        mainCategoryId: 'hogar_tecnicos',
        mainCategoryName: 'Servicios para el hogar y técnicos',
        keywords: ['cámaras de seguridad', 'CCTV', 'alarma', 'casa inteligente', 'cerraduras']
      },
      {
        id: 'jardineros_paisajistas',
        label: 'Jardineros y paisajistas (citas de evaluación)',
        mainCategoryId: 'hogar_tecnicos',
        mainCategoryName: 'Servicios para el hogar y técnicos',
        keywords: ['jardín', 'poda de árboles', 'pasto', 'paisajismo', 'riego']
      }
    ]
  },
  {
    id: 'automocion_movilidad',
    name: '7. Automoción y movilidad',
    icon: 'Car',
    subcategories: [
      {
        id: 'talleres_mecanicos_pintura',
        label: 'Talleres mecánicos y de chapa/pintura',
        mainCategoryId: 'automocion_movilidad',
        mainCategoryName: 'Automoción y movilidad',
        keywords: ['mecánico', 'afinación', 'frenos', 'hojalatería y pintura', 'motor']
      },
      {
        id: 'detallado_automotriz',
        label: 'Centros de detalle automotriz (lavado premium)',
        mainCategoryId: 'automocion_movilidad',
        mainCategoryName: 'Automoción y movilidad',
        keywords: ['detailing', 'pulido', 'encerado', 'lavado de vestiduras', 'cerámico']
      },
      {
        id: 'neumaticos_alineacion',
        label: 'Talleres de neumáticos y alineación',
        mainCategoryId: 'automocion_movilidad',
        mainCategoryName: 'Automoción y movilidad',
        keywords: ['llantas', 'balanceo', 'alineación', 'suspensión', 'vulcanizadora']
      },
      {
        id: 'inspeccion_tecnica_vehicular',
        label: 'Servicios de inspección técnica (en algunos países)',
        mainCategoryId: 'automocion_movilidad',
        mainCategoryName: 'Automoción y movilidad',
        keywords: ['verificación', 'diagnóstico por computadora', 'escáner']
      },
      {
        id: 'concesionarios_pruebas_manejo',
        label: 'Concesionarios (citas de prueba de manejo o entrega)',
        mainCategoryId: 'automocion_movilidad',
        mainCategoryName: 'Automoción y movilidad',
        keywords: ['prueba de manejo', 'test drive', 'autos nuevos', 'seminuevos']
      }
    ]
  },
  {
    id: 'mascotas',
    name: '8. Mascotas',
    icon: 'Dog',
    subcategories: [
      {
        id: 'peluquerias_caninas_felinas',
        label: 'Peluquerías caninas y felinas',
        mainCategoryId: 'mascotas',
        mainCategoryName: 'Mascotas',
        keywords: ['estética canina', 'baño de perro', 'corte de pelo mascotas', 'grooming']
      },
      {
        id: 'adiestradores_perros',
        label: 'Adiestradores de perros',
        mainCategoryId: 'mascotas',
        mainCategoryName: 'Mascotas',
        keywords: ['educación canina', 'entrenador de perros', 'conducta', 'obediencia']
      },
      {
        id: 'guarderias_hoteles_mascotas',
        label: 'Guarderías y hoteles para mascotas (reservas + citas de evaluación)',
        mainCategoryId: 'mascotas',
        mainCategoryName: 'Mascotas',
        keywords: ['hospedaje para perros', 'pensión canina', 'guardería de mascotas']
      },
      {
        id: 'veterinarios_consultas_seguimiento',
        label: 'Veterinarios (consultas y citas de seguimiento)',
        mainCategoryId: 'mascotas',
        mainCategoryName: 'Mascotas',
        legacyAliases: ['veterinaria_seguimiento'],
        keywords: ['consulta veterinaria', 'desparasitación', 'cirugía veterinaria', 'urgencias mascotas']
      }
    ]
  },
  {
    id: 'otros_servicios',
    name: '9. Otros servicios con alta demanda de citas',
    icon: 'Layers',
    subcategories: [
      {
        id: 'fotografos_sesiones',
        label: 'Fotógrafos (sesiones familiares, corporativas, de producto)',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['fotografía', 'sesión de fotos', 'bodas', 'estudio fotográfico', 'retratos']
      },
      {
        id: 'agentes_inmobiliarios_visitas',
        label: 'Agentes inmobiliarios (visitas a propiedades)',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['bienes raíces', 'casas en renta', 'venta de departamentos', 'inmobiliaria']
      },
      {
        id: 'organizadores_eventos_weddings',
        label: 'Organizadores de eventos y wedding planners',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['bodas', 'fiestas', 'eventos corporativos', 'banquetes', 'wedding planner']
      },
      {
        id: 'impresion_diseno_grafico',
        label: 'Centros de impresión y diseño gráfico (consultas de proyecto)',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['imprenta', 'lonas', 'diseño de marca', 'rotulación', 'tarjetas']
      },
      {
        id: 'reparacion_electronica_moviles',
        label: 'Talleres de reparación de electrónica (móviles, ordenadores)',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['cambio de pantalla', 'celulares', 'laptops', 'servicio técnico', 'computadoras']
      },
      {
        id: 'servicios_mudanzas_evaluacion',
        label: 'Servicios de mudanzas (evaluaciones previas)',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['fletes', 'mudanzas', 'transporte de muebles', 'empaque']
      },
      {
        id: 'clinicas_terapia_ocupacional',
        label: 'Clínicas de fisioterapia o terapia ocupacional',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['terapia ocupacional', 'estimulación temprana', 'movilidad']
      },
      {
        id: 'audiologia_audifonos',
        label: 'Centros de audiología y audífonos',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['estudio auditivo', 'aparatos para sordera', 'oído', 'audiometría']
      },
      {
        id: 'estudios_grabacion_produccion',
        label: 'Estudios de grabación y producción de audio/video (sesiones)',
        mainCategoryId: 'otros_servicios',
        mainCategoryName: 'Otros servicios con alta demanda de citas',
        keywords: ['podcast', 'música', 'estudio de audio', 'grabación de video', 'locución']
      }
    ]
  }
];

// Flat list of all subcategories
export const ALL_SUBCATEGORIES: SubCategoryItem[] = CATEGORIES_CATALOG.flatMap(
  (main) => main.subcategories
);

// Map of legacy category IDs to current subcategory IDs
const LEGACY_MAP: Record<string, string> = {
  psicologia: 'psicologos_psiquiatras_terapeutas',
  masajes: 'spas_masajes',
  barberia: 'peluquerias_barberias',
  dental: 'dentistas_ortodoncistas',
  belleza: 'esteticas_depilacion',
  terapeuta: 'psicologos_psiquiatras_terapeutas',
  fisioterapia: 'fisioterapeutas_rehabilitadores',
  nutricion: 'nutricionistas_dietistas',
  veterinaria: 'veterinarias_mascotas'
};

/**
 * Normaliza y encuentra la información de categoría para cualquier ID o Label
 */
export function resolveCategory(rawCategory: string, rawLabel?: string): SubCategoryItem | null {
  if (!rawCategory) return null;
  const targetId = rawCategory.trim().toLowerCase();

  // 1. Direct match with subcategory ID
  const directMatch = ALL_SUBCATEGORIES.find((s) => s.id.toLowerCase() === targetId);
  if (directMatch) return directMatch;

  // 2. Legacy aliases
  if (LEGACY_MAP[targetId]) {
    const legacyTarget = ALL_SUBCATEGORIES.find((s) => s.id === LEGACY_MAP[targetId]);
    if (legacyTarget) return legacyTarget;
  }

  // 3. Search in subcategories legacyAliases array
  const aliasMatch = ALL_SUBCATEGORIES.find((s) =>
    s.legacyAliases?.some((a) => a.toLowerCase() === targetId)
  );
  if (aliasMatch) return aliasMatch;

  // 4. Match by label or rawLabel
  if (rawLabel) {
    const labelMatch = ALL_SUBCATEGORIES.find(
      (s) => s.label.toLowerCase() === rawLabel.trim().toLowerCase()
    );
    if (labelMatch) return labelMatch;
  }

  // 5. Partial match by label
  const partialMatch = ALL_SUBCATEGORIES.find(
    (s) =>
      s.label.toLowerCase().includes(targetId) ||
      targetId.includes(s.id) ||
      (rawLabel && s.label.toLowerCase().includes(rawLabel.toLowerCase()))
  );
  if (partialMatch) return partialMatch;

  return null;
}

export interface ActiveCategoryOption {
  id: string;
  label: string;
  count: number;
  mainCategoryId?: string;
  mainCategoryName?: string;
}

/**
 * Regla de negocio solicitada por el usuario:
 * "en el área de usuarios solo se mostrará las categorías que tengan afiliados
 * registrados en esa categoría por ejemplo si no existe un ningún afiliado en la categoría
 * psicología no se muestra la categoría en el filtro pero si se registra uno se comienza a mostrar"
 */
export function getActiveCategoriesForUsers(
  affiliates: Array<{ category: string; categoryLabel?: string }>
): ActiveCategoryOption[] {
  const categoryCounts = new Map<string, { item: SubCategoryItem; count: number }>();

  // Count registered affiliates per category
  for (const aff of affiliates) {
    const resolved = resolveCategory(aff.category, aff.categoryLabel);
    if (resolved) {
      const existing = categoryCounts.get(resolved.id);
      if (existing) {
        existing.count += 1;
      } else {
        categoryCounts.set(resolved.id, { item: resolved, count: 1 });
      }
    } else if (aff.category && aff.category !== 'all') {
      // Si tiene una categoría personalizada no tipada pero con afiliados, se preserva
      const catKey = aff.category.toLowerCase();
      const existing = categoryCounts.get(catKey);
      if (existing) {
        existing.count += 1;
      } else {
        categoryCounts.set(catKey, {
          item: {
            id: aff.category,
            label: aff.categoryLabel || aff.category,
            mainCategoryId: 'otros_servicios',
            mainCategoryName: 'Otros servicios'
          },
          count: 1
        });
      }
    }
  }

  // Convert to array of active categories, sorted by count descending and name
  const activeList: ActiveCategoryOption[] = Array.from(categoryCounts.values())
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.item.label.localeCompare(b.item.label))
    .map((entry) => ({
      id: entry.item.id,
      label: entry.item.label,
      count: entry.count,
      mainCategoryId: entry.item.mainCategoryId,
      mainCategoryName: entry.item.mainCategoryName
    }));

  return activeList;
}

/**
 * Helper para verificar si un afiliado pertenece a la categoría seleccionada
 * Soporta tanto coincidencia directa como aliases legacy y coincidencia de grupo principal
 */
export function affiliateMatchesCategory(
  aff: { category: string; categoryLabel?: string },
  selectedCategory: string
): boolean {
  if (!selectedCategory || selectedCategory === 'all') return true;

  const resolved = resolveCategory(aff.category, aff.categoryLabel);
  if (!resolved) {
    return aff.category === selectedCategory || Boolean(aff.categoryLabel && aff.categoryLabel === selectedCategory);
  }

  // Coincide con el ID de la subcategoría
  if (resolved.id === selectedCategory) return true;

  // Coincide con algún alias legacy
  if (resolved.legacyAliases?.includes(selectedCategory)) return true;
  if (LEGACY_MAP[selectedCategory] === resolved.id) return true;

  // Coincide con la categoría principal (si se seleccionó un grupo)
  if (resolved.mainCategoryId === selectedCategory) return true;

  // Coincidencia directa de texto
  return aff.category === selectedCategory;
}
