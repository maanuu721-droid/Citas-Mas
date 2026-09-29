import { Affiliate, MexicanState } from '../types.ts';
import { MEXICAN_STATES } from '../data/mexicoData.ts';
import { HISPANIC_COUNTRIES, getCountryByName, getCountryByCode, detectCountryFromText, CountryInfo } from '../data/countriesData.ts';

/**
 * Normaliza cadenas de texto para comparaciones insensibles a mayúsculas y acentos.
 */
export function normalizeZoneText(str?: string | null): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Normaliza y resuelve el país de un afiliado
 */
export function resolveCountry(countryStr?: string | null): CountryInfo {
  if (!countryStr) return HISPANIC_COUNTRIES[4]; // México default
  const found = getCountryByName(countryStr) || getCountryByCode(countryStr) || detectCountryFromText(countryStr);
  return found || {
    code: 'INTL',
    name: countryStr,
    flag: '🌎',
    dialCode: '+',
    currencyCode: 'USD',
    currencySymbol: '$',
    subdivisionLabel: 'Provincia / Región',
    lat: 0,
    lng: 0,
    states: []
  };
}

/**
 * Verifica si el país de un afiliado coincide con el país del filtro
 */
export function countryMatches(affCountry?: string | null, filterCountry?: string | null): boolean {
  if (!filterCountry || filterCountry === 'all' || filterCountry === '') return true;
  const filterNorm = normalizeZoneText(filterCountry);
  const affNorm = normalizeZoneText(affCountry || 'México');

  if (affNorm === filterNorm) return true;

  const fCountry = getCountryByName(filterCountry) || getCountryByCode(filterCountry);
  const aCountry = getCountryByName(affCountry || 'México') || getCountryByCode(affCountry || 'México');

  if (fCountry && aCountry) {
    return fCountry.code === aCountry.code;
  }

  return affNorm.includes(filterNorm) || filterNorm.includes(affNorm);
}

/**
 * Resuelve el estado a su objeto canónico en MEXICAN_STATES
 * Acepta tanto el código ('JAL', 'NL') como el nombre ('Jalisco', 'Nuevo León').
 */
export function resolveMexicanState(stateStr?: string | null): MexicanState | undefined {
  if (!stateStr) return undefined;
  const norm = normalizeZoneText(stateStr);
  return MEXICAN_STATES.find(
    (s) => normalizeZoneText(s.code) === norm || normalizeZoneText(s.name) === norm
  );
}

/**
 * Verifica si el estado de un afiliado coincide con el estado seleccionado en el filtro.
 */
export function stateMatches(affState?: string | null, filterState?: string | null): boolean {
  if (!filterState || filterState === 'all' || filterState === '') return true;
  if (!affState) return false;

  const filterNorm = normalizeZoneText(filterState);
  const affNorm = normalizeZoneText(affState);

  // Coincidencia directa textual
  if (affNorm === filterNorm) return true;

  // Resolver estados canónicos mexicanos
  const filterCanonical = resolveMexicanState(filterState);
  const affCanonical = resolveMexicanState(affState);

  if (filterCanonical && affCanonical) {
    return filterCanonical.code === affCanonical.code;
  }

  if (filterCanonical) {
    return (
      normalizeZoneText(filterCanonical.code) === affNorm ||
      normalizeZoneText(filterCanonical.name) === affNorm
    );
  }

  if (affCanonical) {
    return (
      normalizeZoneText(affCanonical.code) === filterNorm ||
      normalizeZoneText(affCanonical.name) === filterNorm
    );
  }

  return affNorm.includes(filterNorm) || filterNorm.includes(affNorm);
}

/**
 * Verifica si la ciudad de un afiliado coincide con la ciudad seleccionada en el filtro.
 */
export function cityMatches(affCity?: string | null, filterCity?: string | null): boolean {
  if (!filterCity || filterCity === 'all' || filterCity === '') return true;
  if (!affCity) return false;

  const affNorm = normalizeZoneText(affCity);
  const filterNorm = normalizeZoneText(filterCity);

  if (affNorm === filterNorm) return true;

  // Subcadena mutua para variaciones como "Guadalajara" vs "Guadalajara, Jal" o "Medellín" vs "Medellín - El Poblado"
  return affNorm.includes(filterNorm) || filterNorm.includes(affNorm);
}

export interface ActiveCountryOption {
  code: string;
  name: string;
  flag: string;
  count: number;
}

export interface ActiveStateOption {
  code: string;
  name: string;
  count: number;
  countryName?: string;
}

export interface ActiveCityOption {
  city: string;
  stateCode: string;
  stateName: string;
  countryName?: string;
  count: number;
}

export interface ActiveZonePill {
  id: string; // e.g. 'city-Guadalajara' o 'state-JAL'
  label: string; // e.g. 'Guadalajara, JAL'
  cityName: string;
  stateCode: string;
  stateName: string;
  countryName: string;
  countryFlag: string;
  count: number;
}

/**
 * Analiza la lista de afiliados registrados y extrae de forma DINÁMICA:
 * 1. Todos los países activos con afiliados (España, Colombia, Argentina, Chile, México, etc.).
 * 2. Solo los estados/regiones/departamentos activos en el país seleccionado.
 * 3. Solo las ciudades activas en el estado/país seleccionado.
 * 4. Píldoras de zona rápida para acceso directo con un clic.
 */
export function getActiveZonesForUsers(
  affiliates: Affiliate[],
  filterCountry?: string | null,
  filterState?: string | null
): {
  activeCountries: ActiveCountryOption[];
  activeStates: ActiveStateOption[];
  activeCities: ActiveCityOption[];
  quickZonePills: ActiveZonePill[];
} {
  const countryCountMap = new Map<string, { code: string; name: string; flag: string; count: number }>();
  const stateCountMap = new Map<string, { code: string; name: string; countryName: string; count: number }>();
  const cityCountMap = new Map<string, { city: string; stateCode: string; stateName: string; countryName: string; countryFlag: string; count: number }>();

  // 1. Contador por países
  for (const aff of affiliates) {
    const countryInfo = resolveCountry(aff.country);
    const countryCode = countryInfo.code;
    const existingC = countryCountMap.get(countryCode);
    if (existingC) {
      existingC.count += 1;
    } else {
      countryCountMap.set(countryCode, {
        code: countryCode,
        name: countryInfo.name,
        flag: countryInfo.flag,
        count: 1
      });
    }
  }

  // Filtrar afiliados por país para los estados y ciudades
  const affiliatesForZones = affiliates.filter((aff) => {
    if (filterCountry && filterCountry !== 'all' && filterCountry !== '') {
      return countryMatches(aff.country, filterCountry);
    }
    return true;
  });

  for (const aff of affiliatesForZones) {
    const countryInfo = resolveCountry(aff.country);
    const canonicalState = resolveMexicanState(aff.state);
    const stateCode = canonicalState ? canonicalState.code : aff.state || 'OTRO';
    const stateName = canonicalState ? canonicalState.name : aff.state || 'Región';
    const cityName = aff.city?.trim() || 'Principal';

    // Contador por estado
    const stateKey = `${countryInfo.code}:::${normalizeZoneText(stateCode)}`;
    const existingState = stateCountMap.get(stateKey);
    if (existingState) {
      existingState.count += 1;
    } else {
      stateCountMap.set(stateKey, {
        code: stateCode,
        name: stateName,
        countryName: countryInfo.name,
        count: 1
      });
    }

    // Contador por ciudad (clave compuesta: país + estado + ciudad)
    const cityKey = `${countryInfo.code}:::${stateCode}:::${normalizeZoneText(cityName)}`;
    const existingCity = cityCountMap.get(cityKey);
    if (existingCity) {
      existingCity.count += 1;
    } else {
      cityCountMap.set(cityKey, {
        city: cityName,
        stateCode,
        stateName,
        countryName: countryInfo.name,
        countryFlag: countryInfo.flag,
        count: 1
      });
    }
  }

  // Lista ordenada de países activos
  const activeCountries = Array.from(countryCountMap.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, 'es');
  });

  // Lista ordenada de estados activos
  const activeStates = Array.from(stateCountMap.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, 'es');
  });

  // Filtrar ciudades activas (si hay un estado seleccionado, solo las de ese estado)
  let allActiveCities = Array.from(cityCountMap.values());
  if (filterState && filterState !== 'all' && filterState !== '') {
    allActiveCities = allActiveCities.filter((c) => stateMatches(c.stateCode, filterState));
  }

  const activeCities = allActiveCities.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.city.localeCompare(b.city, 'es');
  });

  // Píldoras de zonas rápidas destacadas (ciudades activas con bandera de país)
  const quickZonePills: ActiveZonePill[] = Array.from(cityCountMap.values())
    .sort((a, b) => b.count - a.count)
    .map((c) => ({
      id: `${c.stateCode}-${normalizeZoneText(c.city)}`,
      label: `${c.countryFlag} ${c.city}, ${c.stateCode}`,
      cityName: c.city,
      stateCode: c.stateCode,
      stateName: c.stateName,
      countryName: c.countryName,
      countryFlag: c.countryFlag,
      count: c.count
    }));

  return {
    activeCountries,
    activeStates,
    activeCities,
    quickZonePills
  };
}
