export interface CountryStateItem {
  code: string;
  name: string;
  cities: string[];
}

export interface CountryInfo {
  code: string; // ISO 2 chars: 'CO', 'ES', 'AR', 'CL', 'MX', 'PE', etc.
  name: string;
  flag: string; // Emoji: '🇨🇴', '🇪🇸', '🇦🇷', etc.
  dialCode: string; // '+57', '+34', '+54', etc.
  currencyCode: string; // 'COP', 'EUR', 'ARS', 'CLP', 'MXN', 'PEN', 'USD'
  currencySymbol: string; // '$', '€', 'S/', etc.
  subdivisionLabel: string; // 'Departamento', 'Provincia / Comunidad', 'Provincia', 'Región', 'Estado'
  lat: number;
  lng: number;
  states: CountryStateItem[];
}

export const HISPANIC_COUNTRIES: CountryInfo[] = [
  {
    code: 'CO',
    name: 'Colombia',
    flag: '🇨🇴',
    dialCode: '+57',
    currencyCode: 'COP',
    currencySymbol: '$',
    subdivisionLabel: 'Departamento',
    lat: 4.7110,
    lng: -74.0721,
    states: [
      { code: 'BOG', name: 'Bogotá D.C.', cities: ['Bogotá - Chapinero', 'Bogotá - Usaquén', 'Bogotá - Teusaquillo', 'Bogotá - Suba', 'Bogotá - Santa Bárbara'] },
      { code: 'ANT', name: 'Antioquia', cities: ['Medellín - El Poblado', 'Medellín - Laureles', 'Envigado', 'Sabaneta', 'Rionegro', 'Bello'] },
      { code: 'VAC', name: 'Valle del Cauca', cities: ['Cali - Granada', 'Cali - Ciudad Jardín', 'Palmira', 'Buga', 'Tuluá'] },
      { code: 'ATL', name: 'Atlántico', cities: ['Barranquilla - El Prado', 'Barranquilla - Riomar', 'Soledad', 'Puerto Colombia'] },
      { code: 'SAN', name: 'Santander', cities: ['Bucaramanga - Cabecera', 'Floridablanca', 'Piedecuesta', 'Girón'] },
      { code: 'BOL', name: 'Bolívar', cities: ['Cartagena - Bocagrande', 'Cartagena - Centro Histórico', 'Cartagena - Manga'] },
      { code: 'CUN', name: 'Cundinamarca', cities: ['Chía', 'Cajicá', 'Zipaquirá', 'Soacha', 'Facatativá'] },
      { code: 'RIS', name: 'Risaralda', cities: ['Pereira - Circunvalar', 'Dosquebradas', 'Santa Rosa de Cabal'] },
      { code: 'CAL', name: 'Caldas', cities: ['Manizales - Cable', 'Villamaría', 'Chinchiná'] }
    ]
  },
  {
    code: 'ES',
    name: 'España',
    flag: '🇪🇸',
    dialCode: '+34',
    currencyCode: 'EUR',
    currencySymbol: '€',
    subdivisionLabel: 'Comunidad / Provincia',
    lat: 40.4168,
    lng: -3.7038,
    states: [
      { code: 'MAD', name: 'Madrid', cities: ['Madrid - Salamanca', 'Madrid - Chamberí', 'Madrid - Centro', 'Alcobendas', 'Pozuelo de Alarcón', 'Majadahonda', 'Getafe'] },
      { code: 'CAT', name: 'Barcelona (Cataluña)', cities: ['Barcelona - Eixample', 'Barcelona - Sarrià', 'Barcelona - Gràcia', 'Sant Cugat del Vallès', 'Badalona', 'Hospitalet de Llobregat'] },
      { code: 'AND', name: 'Sevilla (Andalucía)', cities: ['Sevilla - Nervión', 'Sevilla - Casco Antiguo', 'Málaga - Centro', 'Marbella', 'Granada', 'Córdoba'] },
      { code: 'VAL', name: 'Valencia', cities: ['Valencia - Ciutat Vella', 'Valencia - Ruzafa', 'Alicante', 'Elche', 'Castellón'] },
      { code: 'PVA', name: 'País Vasco', cities: ['Bilbao', 'San Sebastián', 'Vitoria-Gasteiz'] },
      { code: 'GAL', name: 'Galicia', cities: ['A Coruña', 'Vigo', 'Santiago de Compostela', 'Pontevedra'] },
      { code: 'ARA', name: 'Aragón', cities: ['Zaragoza', 'Huesca', 'Teruel'] },
      { code: 'BAL', name: 'Islas Baleares', cities: ['Palma de Mallorca', 'Ibiza', 'Menorca'] },
      { code: 'CAN', name: 'Islas Canarias', cities: ['Las Palmas de Gran Canaria', 'Santa Cruz de Tenerife'] }
    ]
  },
  {
    code: 'AR',
    name: 'Argentina',
    flag: '🇦🇷',
    dialCode: '+54',
    currencyCode: 'ARS',
    currencySymbol: '$',
    subdivisionLabel: 'Provincia / Distrito',
    lat: -34.6037,
    lng: -58.3816,
    states: [
      { code: 'CABA', name: 'Ciudad de Buenos Aires (CABA)', cities: ['Palermo', 'Recoleta', 'Belgrano', 'Caballito', 'Nuñez', 'Puerto Madero', 'San Telmo'] },
      { code: 'PBA', name: 'Provincia de Buenos Aires', cities: ['San Isidro', 'Vicente López', 'Tigre', 'La Plata', 'Pilar', 'Quilmes', 'Mar del Plata'] },
      { code: 'CBA', name: 'Córdoba', cities: ['Córdoba Capital - Nueva Córdoba', 'Córdoba - Cerro de las Rosas', 'Villa Carlos Paz', 'Río Cuarto'] },
      { code: 'SFE', name: 'Santa Fe', cities: ['Rosario - Pichincha', 'Rosario - Centro', 'Santa Fe Capital'] },
      { code: 'MDZ', name: 'Mendoza', cities: ['Mendoza Capital', 'Godoy Cruz', 'Luján de Cuyo', 'San Rafael'] },
      { code: 'TUC', name: 'Tucumán', cities: ['San Miguel de Tucumán', 'Yerba Buena'] },
      { code: 'SAL', name: 'Salta', cities: ['Salta Capital', 'San Lorenzo'] }
    ]
  },
  {
    code: 'CL',
    name: 'Chile',
    flag: '🇨🇱',
    dialCode: '+56',
    currencyCode: 'CLP',
    currencySymbol: '$',
    subdivisionLabel: 'Región',
    lat: -33.4489,
    lng: -70.6693,
    states: [
      { code: 'RM', name: 'Región Metropolitana (Santiago)', cities: ['Las Condes', 'Providencia', 'Vitacura', 'Santiago Centro', 'Ñuñoa', 'Lo Barnechea', 'La Florida'] },
      { code: 'VAL', name: 'Valparaíso', cities: ['Viña del Mar', 'Valparaíso', 'Concón', 'Quilpué', 'Villa Alemana'] },
      { code: 'BIO', name: 'Biobío', cities: ['Concepción', 'San Pedro de la Paz', 'Talcahuano', 'Chillán'] },
      { code: 'ANT', name: 'Antofagasta', cities: ['Antofagasta', 'Calama'] },
      { code: 'COQ', name: 'Coquimbo', cities: ['La Serena', 'Coquimbo'] },
      { code: 'ARA', name: 'La Araucanía', cities: ['Temuco', 'Pucón', 'Villarrica'] },
      { code: 'LOS', name: 'Los Lagos', cities: ['Puerto Montt', 'Puerto Varas', 'Osorno'] }
    ]
  },
  {
    code: 'MX',
    name: 'México',
    flag: '🇲🇽',
    dialCode: '+52',
    currencyCode: 'MXN',
    currencySymbol: '$',
    subdivisionLabel: 'Estado',
    lat: 19.4326,
    lng: -99.1332,
    states: [
      { code: 'CDMX', name: 'Ciudad de México', cities: ['Cuauhtémoc', 'Benito Juárez', 'Miguel Hidalgo', 'Coyoacán', 'Tlalpan', 'Álvaro Obregón'] },
      { code: 'JAL', name: 'Jalisco', cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Puerto Vallarta'] },
      { code: 'NL', name: 'Nuevo León', cities: ['Monterrey', 'San Pedro Garza García', 'San Nicolás', 'Guadalupe'] },
      { code: 'PUE', name: 'Puebla', cities: ['Puebla de Zaragoza', 'San Andrés Cholula', 'San Pedro Cholula', 'Tehuacán'] },
      { code: 'QRO', name: 'Querétaro', cities: ['Santiago de Querétaro', 'Juriquilla', 'Corregidora', 'El Marqués'] },
      { code: 'YUC', name: 'Yucatán', cities: ['Mérida', 'Progreso', 'Valladolid'] },
      { code: 'QROO', name: 'Quintana Roo', cities: ['Cancún', 'Playa del Carmen', 'Tulum', 'Cozumel'] },
      { code: 'BC', name: 'Baja California', cities: ['Tijuana', 'Mexicali', 'Ensenada'] },
      { code: 'GTO', name: 'Guanajuato', cities: ['León', 'Guanajuato', 'San Miguel de Allende', 'Irapuato'] },
      { code: 'EDOMEX', name: 'Estado de México', cities: ['Naucalpan', 'Huixquilucan', 'Toluca', 'Metepec', 'Tlalnepantla'] },
      { code: 'VER', name: 'Veracruz', cities: ['Veracruz', 'Boca del Río', 'Xalapa'] },
      { code: 'SIN', name: 'Sinaloa', cities: ['Culiacán', 'Mazatlán'] },
      { code: 'CHIH', name: 'Chihuahua', cities: ['Chihuahua', 'Ciudad Juárez'] }
    ]
  },
  {
    code: 'PE',
    name: 'Perú',
    flag: '🇵🇪',
    dialCode: '+51',
    currencyCode: 'PEN',
    currencySymbol: 'S/',
    subdivisionLabel: 'Departamento',
    lat: -12.0464,
    lng: -77.0428,
    states: [
      { code: 'LIM', name: 'Lima Metropolitana', cities: ['Miraflores', 'San Isidro', 'Santiago de Surco', 'Barranco', 'San Borja', 'Magdalena del Mar', 'Jesús María'] },
      { code: 'ARE', name: 'Arequipa', cities: ['Arequipa - Cayma', 'Arequipa - Yanahuara', 'Arequipa - Cerro Colorado'] },
      { code: 'CUS', name: 'Cusco', cities: ['Cusco Centro', 'Wanchaq', 'San Sebastián'] },
      { code: 'LLIB', name: 'La Libertad', cities: ['Trujillo - El Golf', 'Trujillo - California', 'Víctor Larco Herrera'] },
      { code: 'PIU', name: 'Piura', cities: ['Piura Centro', 'Castilla', 'Máncora'] },
      { code: 'LAM', name: 'Lambayeque', cities: ['Chiclayo', 'Pimentel'] }
    ]
  },
  {
    code: 'EC',
    name: 'Ecuador',
    flag: '🇪🇨',
    dialCode: '+593',
    currencyCode: 'USD',
    currencySymbol: '$',
    subdivisionLabel: 'Provincia',
    lat: -0.1807,
    lng: -78.4678,
    states: [
      { code: 'PIC', name: 'Pichincha (Quito)', cities: ['Quito - Cumbayá', 'Quito - La Floresta', 'Quito - González Suárez', 'Tumbaco'] },
      { code: 'GUA', name: 'Guayas (Guayaquil)', cities: ['Guayaquil - Samborondón', 'Guayaquil - Urdesa', 'Guayaquil - Puerto Santa Ana'] },
      { code: 'AZU', name: 'Azuay (Cuenca)', cities: ['Cuenca - Centro Histórico', 'Cuenca - El Vergel'] }
    ]
  },
  {
    code: 'UY',
    name: 'Uruguay',
    flag: '🇺🇾',
    dialCode: '+598',
    currencyCode: 'UYU',
    currencySymbol: '$',
    subdivisionLabel: 'Departamento',
    lat: -34.9011,
    lng: -56.1645,
    states: [
      { code: 'MON', name: 'Montevideo', cities: ['Pocitos', 'Punta Carretas', 'Carrasco', 'Cordón', 'Buceo', 'Centro'] },
      { code: 'MAL', name: 'Maldonado', cities: ['Punta del Este', 'Maldonado Centro', 'La Barra'] },
      { code: 'CAN', name: 'Canelones', cities: ['Ciudad de la Costa', 'Costa de Oro'] }
    ]
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    flag: '🇨🇷',
    dialCode: '+506',
    currencyCode: 'CRC',
    currencySymbol: '₡',
    subdivisionLabel: 'Provincia',
    lat: 9.9281,
    lng: -84.0907,
    states: [
      { code: 'SJ', name: 'San José', cities: ['Escazú', 'Santa Ana', 'San Pedro', 'Rohrmoser', 'Curridabat'] },
      { code: 'HER', name: 'Heredia', cities: ['Heredia Centro', 'San Rafael', 'Belén'] },
      { code: 'ALA', name: 'Alajuela', cities: ['Alajuela Centro', 'La Guácima'] }
    ]
  },
  {
    code: 'PA',
    name: 'Panamá',
    flag: '🇵🇦',
    dialCode: '+507',
    currencyCode: 'USD',
    currencySymbol: '$',
    subdivisionLabel: 'Provincia',
    lat: 8.9824,
    lng: -79.5199,
    states: [
      { code: 'PAN', name: 'Panamá', cities: ['Ciudad de Panamá - San Francisco', 'Costa del Este', 'Bella Vista', 'Punta Pacífica', 'El Cangrejo'] },
      { code: 'PO', name: 'Panamá Oeste', cities: ['La Chorrera', 'Arraiján', 'Coronado'] }
    ]
  },
  {
    code: 'DO',
    name: 'República Dominicana',
    flag: '🇩🇴',
    dialCode: '+1809',
    currencyCode: 'DOP',
    currencySymbol: 'RD$',
    subdivisionLabel: 'Provincia / Distrito',
    lat: 18.7357,
    lng: -70.1627,
    states: [
      { code: 'DN', name: 'Distrito Nacional', cities: ['Santo Domingo - Piantini', 'Naco', 'Bella Vista', 'Gascue', 'Evaristo Morales'] },
      { code: 'STG', name: 'Santiago', cities: ['Santiago de los Caballeros - Los Jardines', 'Villa Olga'] },
      { code: 'ALT', name: 'La Altagracia', cities: ['Punta Cana', 'Bávaro'] }
    ]
  },
  {
    code: 'GT',
    name: 'Guatemala',
    flag: '🇬🇹',
    dialCode: '+502',
    currencyCode: 'GTQ',
    currencySymbol: 'Q',
    subdivisionLabel: 'Departamento',
    lat: 14.6349,
    lng: -90.5069,
    states: [
      { code: 'GUA', name: 'Guatemala', cities: ['Ciudad de Guatemala - Zona 10', 'Zona 14', 'Zona 15', 'Carretera a El Salvador', 'Mixco'] },
      { code: 'SAC', name: 'Sacatepéquez', cities: ['Antigua Guatemala'] },
      { code: 'QUE', name: 'Quetzaltenango', cities: ['Quetzaltenango (Xela)'] }
    ]
  },
  {
    code: 'BO',
    name: 'Bolivia',
    flag: '🇧🇴',
    dialCode: '+591',
    currencyCode: 'BOB',
    currencySymbol: 'Bs',
    subdivisionLabel: 'Departamento',
    lat: -16.5000,
    lng: -68.1500,
    states: [
      { code: 'SCZ', name: 'Santa Cruz', cities: ['Santa Cruz de la Sierra - Equipetrol', 'Urubó', 'Centro'] },
      { code: 'LPZ', name: 'La Paz', cities: ['La Paz - Calacoto', 'San Miguel', 'Sopocachi'] },
      { code: 'CBB', name: 'Cochabamba', cities: ['Cochabamba Centro', 'Cala Cala'] }
    ]
  },
  {
    code: 'PY',
    name: 'Paraguay',
    flag: '🇵🇾',
    dialCode: '+595',
    currencyCode: 'PYG',
    currencySymbol: '₲',
    subdivisionLabel: 'Departamento / Distrito',
    lat: -25.2637,
    lng: -57.5759,
    states: [
      { code: 'ASU', name: 'Asunción', cities: ['Asunción - Villa Morra', 'Ycuá Satí', 'Carmelitas', 'Recoleta'] },
      { code: 'CEN', name: 'Central', cities: ['San Lorenzo', 'Luque', 'Fernando de la Mora'] }
    ]
  }
];

export function getCountryByCode(code?: string): CountryInfo {
  if (!code) return HISPANIC_COUNTRIES[0]; // Colombia default or MX
  const found = HISPANIC_COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found || HISPANIC_COUNTRIES[0];
}

export function getCountryByName(name?: string): CountryInfo | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  return HISPANIC_COUNTRIES.find(
    (c) => c.name.toLowerCase() === n || c.name.toLowerCase().includes(n) || n.includes(c.name.toLowerCase())
  );
}

export function detectCountryFromText(text?: string): CountryInfo | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase();
  for (const c of HISPANIC_COUNTRIES) {
    if (lower.includes(c.name.toLowerCase())) return c;
    if (c.code.toLowerCase() === lower.trim()) return c;
  }
  return undefined;
}
