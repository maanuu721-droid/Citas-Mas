import { Affiliate, MexicanState } from '../types.ts';
import { MEXICAN_STATES } from '../data/mexicoData.ts';

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

  // Resolver estados canónicos
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

  return false;
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

  // Subcadena mutua para variaciones como "Guadalajara" vs "Guadalajara, Jal" o "Monterrey Centro"
  return affNorm.includes(filterNorm) || filterNorm.includes(affNorm);
}

export interface ActiveStateOption {
  code: string;
  name: string;
  count: number;
}

export interface ActiveCityOption {
  city: string;
  stateCode: string;
  stateName: string;
  count: number;
}

export interface ActiveZonePill {
  id: string; // e.g. 'city-Guadalajara' o 'state-JAL'
  label: string; // e.g. 'Guadalajara, JAL'
  cityName: string;
  stateCode: string;
  stateName: string;
  count: number;
}

/**
 * Analiza la lista de afiliados registrados y extrae de forma DINÁMICA:
 * 1. Solo los estados que cuentan con al menos 1 afiliado registrado (con su contador).
 * 2. Solo las ciudades que cuentan con al menos 1 afiliado registrado (con su contador).
 * 3. Píldoras de zona rápida para acceso directo con un clic.
 */
export function getActiveZonesForUsers(
  affiliates: Affiliate[],
  filterState?: string | null
): {
  activeStates: ActiveStateOption[];
  activeCities: ActiveCityOption[];
  quickZonePills: ActiveZonePill[];
} {
  const stateCountMap = new Map<string, { code: string; name: string; count: number }>();
  const cityCountMap = new Map<string, { city: string; stateCode: string; stateName: string; count: number }>();

  for (const aff of affiliates) {
    const canonicalState = resolveMexicanState(aff.state);
    const stateCode = canonicalState ? canonicalState.code : aff.state || 'OTRO';
    const stateName = canonicalState ? canonicalState.name : aff.state || 'Otro Estado';
    const cityName = aff.city?.trim() || 'Principal';

    // Contador por estado
    const existingState = stateCountMap.get(stateCode);
    if (existingState) {
      existingState.count += 1;
    } else {
      stateCountMap.set(stateCode, {
        code: stateCode,
        name: stateName,
        count: 1
      });
    }

    // Contador por ciudad (clave compuesta: estado + ciudad)
    const cityKey = `${stateCode}:::${normalizeZoneText(cityName)}`;
    const existingCity = cityCountMap.get(cityKey);
    if (existingCity) {
      existingCity.count += 1;
    } else {
      cityCountMap.set(cityKey, {
        city: cityName,
        stateCode,
        stateName,
        count: 1
      });
    }
  }

  // Lista ordenada de estados activos (solo los que tienen count > 0)
  const activeStates = Array.from(stateCountMap.values()).sort((a, b) => {
    // Más afiliados primero, luego alfabético
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

  // Píldoras de zonas rápidas destacadas (ciudades activas con formato amigable)
  const quickZonePills: ActiveZonePill[] = Array.from(cityCountMap.values())
    .sort((a, b) => b.count - a.count)
    .map((c) => ({
      id: `${c.stateCode}-${normalizeZoneText(c.city)}`,
      label: `${c.city}`,
      cityName: c.city,
      stateCode: c.stateCode,
      stateName: c.stateName,
      count: c.count
    }));

  return {
    activeStates,
    activeCities,
    quickZonePills
  };
}
