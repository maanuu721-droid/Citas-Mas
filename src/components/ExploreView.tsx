import React, { useState, useEffect, useMemo } from 'react';
import { Affiliate } from '../types.ts';
import {
  MEXICAN_STATES,
  SERVICE_CATEGORIES,
  getActiveCategoriesForUsers,
  affiliateMatchesCategory,
  ActiveCategoryOption
} from '../data/mexicoData.ts';
import {
  stateMatches,
  cityMatches,
  getActiveZonesForUsers,
  normalizeZoneText,
  ActiveZonePill
} from '../utils/zoneHelper.ts';
import { calculateDistanceKm, formatDistance, sortAffiliates, SortOptions } from '../utils/geo.ts';
import { evaluateVerificationTier } from '../utils/verification.ts';
import {
  Search,
  MapPin,
  Star,
  Zap,
  ShieldCheck,
  Navigation,
  SlidersHorizontal,
  Clock,
  Sparkles,
  ArrowRight,
  FilterX,
  Award
} from 'lucide-react';

interface Props {
  affiliates: Affiliate[];
  onSelectAffiliate: (affiliate: Affiliate) => void;
  onOpenBookingForAffiliate: (affiliate: Affiliate) => void;
}

export const ExploreView: React.FC<Props> = ({
  affiliates,
  onSelectAffiliate,
  onOpenBookingForAffiliate
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterTodayOnly, setFilterTodayOnly] = useState(false);
  const [filterTomorrowOnly, setFilterTomorrowOnly] = useState(false);
  const [filterHighRating, setFilterHighRating] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number>(2500);
  const [verificationFilter, setVerificationFilter] = useState<'all_active' | 'destacados_only' | 'show_all_with_inactive'>('all_active');

  // Sorting and location
  const [sortBy, setSortBy] = useState<SortOptions['sortBy']>('recommended');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Dynamic Active zones: Only show States and Cities that currently have at least 1 registered affiliate
  const { activeStates, activeCities, quickZonePills } = useMemo(() => {
    return getActiveZonesForUsers(affiliates, selectedState);
  }, [affiliates, selectedState]);

  // Affiliates in the currently selected zone (state & city)
  const zoneAffiliates = useMemo(() => {
    return affiliates.filter((aff) => {
      if (selectedState && !stateMatches(aff.state, selectedState)) return false;
      if (selectedCity && !cityMatches(aff.city, selectedCity)) return false;
      return true;
    });
  }, [affiliates, selectedState, selectedCity]);

  // Dynamic Active categories: Only show categories that currently have at least 1 registered affiliate
  // Contextual to the active zone if a zone is selected
  const activeCategories = useMemo(() => {
    const listToEvaluate = zoneAffiliates.length > 0 ? zoneAffiliates : affiliates;
    return getActiveCategoriesForUsers(listToEvaluate);
  }, [zoneAffiliates, affiliates]);

  // If currently selected category no longer exists in activeCategories, fall back to 'all'
  useEffect(() => {
    if (selectedCategory !== 'all') {
      const isStillActive = activeCategories.some((c) => c.id === selectedCategory);
      if (!isStillActive) {
        setSelectedCategory('all');
      }
    }
  }, [activeCategories, selectedCategory]);

  // If currently selected city is no longer valid for the selected state, reset it
  useEffect(() => {
    if (selectedCity) {
      const cityStillExists = activeCities.some((c) => cityMatches(c.city, selectedCity));
      if (!cityStillExists) {
        setSelectedCity('');
      }
    }
  }, [activeCities, selectedCity]);

  // Request browser geolocation
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        // If permission denied, provide demo default (CDMX coordinates) for preview delight
        console.warn('Geolocation error or permission denied:', err);
        setLocationError('Permiso no concedido o no disponible. Activando ubicación demostrativa en CDMX.');
        setUserLocation({
          lat: 19.4326,
          lng: -99.1332
        });
      },
      { timeout: 8000 }
    );
  };

  // Compute distances if location active
  const affiliatesWithDistance = useMemo(() => {
    return affiliates.map((aff) => {
      let distanceKm: number | undefined = undefined;
      if (userLocation) {
        distanceKm = calculateDistanceKm(userLocation.lat, userLocation.lng, aff.lat, aff.lng);
      }
      return {
        ...aff,
        distanceKm
      };
    });
  }, [affiliates, userLocation]);

  // Filter affiliates
  const filteredAffiliates = useMemo(() => {
    return affiliatesWithDistance.filter((aff) => {
      // Search text (matches name, business, description, category, services, city, and state)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const normQuery = normalizeZoneText(query);
        const matchesName = aff.name.toLowerCase().includes(query);
        const matchesBusiness = aff.businessName.toLowerCase().includes(query);
        const matchesDesc = aff.description.toLowerCase().includes(query);
        const matchesCategory = (aff.categoryLabel || aff.category).toLowerCase().includes(query);
        const matchesServices = aff.services.some((s) => s.name.toLowerCase().includes(query));
        const matchesCity = normalizeZoneText(aff.city).includes(normQuery);
        const matchesState = normalizeZoneText(aff.state).includes(normQuery);
        const matchesAddress = normalizeZoneText(aff.address).includes(normQuery);

        if (
          !matchesName &&
          !matchesBusiness &&
          !matchesDesc &&
          !matchesCategory &&
          !matchesServices &&
          !matchesCity &&
          !matchesState &&
          !matchesAddress
        ) {
          return false;
        }
      }

      // Zone filter - State (normalized code & name matching)
      if (selectedState && !stateMatches(aff.state, selectedState)) {
        return false;
      }

      // Zone filter - City (strict city matching e.g. Guadalajara vs Monterrey)
      if (selectedCity && !cityMatches(aff.city, selectedCity)) {
        return false;
      }

      // Category filter - dynamic matching including aliases and parent group
      if (selectedCategory !== 'all' && !affiliateMatchesCategory(aff, selectedCategory)) {
        return false;
      }

      // Today filter
      if (filterTodayOnly && !aff.availableToday) {
        return false;
      }

      // Tomorrow filter
      if (filterTomorrowOnly && !aff.availableTomorrow) {
        return false;
      }

      // Rating filter (4.5+)
      if (filterHighRating && aff.rating < 4.5) {
        return false;
      }

      // Price filter
      const minServicePrice = Math.min(...aff.services.map((s) => s.price));
      if (minServicePrice > maxPrice) {
        return false;
      }

      // Verification Tier filter:
      // Subir al menos 1 documento para aparecer activo, o todos para Destacado Seguro
      const evalTier = evaluateVerificationTier(aff.documents, aff.professionalDocument);
      if (verificationFilter === 'destacados_only') {
        if (!evalTier.isDestacadoSeguro) return false;
      } else if (verificationFilter === 'all_active') {
        if (!evalTier.isActive) return false;
      }

      return true;
    });
  }, [
    affiliatesWithDistance,
    searchTerm,
    selectedState,
    selectedCity,
    selectedCategory,
    filterTodayOnly,
    filterTomorrowOnly,
    filterHighRating,
    maxPrice,
    verificationFilter
  ]);

  // Sort filtered affiliates
  const sortedAffiliates = useMemo(() => {
    return sortAffiliates(filteredAffiliates, {
      userLocation,
      sortBy
    });
  }, [filteredAffiliates, userLocation, sortBy]);

  // Helper text banner
  const todayAvailableCount = useMemo(() => {
    return sortedAffiliates.filter((a) => a.availableToday).length;
  }, [sortedAffiliates]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedCity('');
    setSelectedCategory('all');
    setFilterTodayOnly(false);
    setFilterTomorrowOnly(false);
    setFilterHighRating(false);
    setMaxPrice(2500);
    setSortBy('recommended');
  };

  return (
    <div id="explore-view" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header Search & Title */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="max-w-3xl">
          <span className="inline-flex items-center space-x-1.5 bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 text-xs px-3 py-1 rounded-full font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Red Nacional de Profesionales · México</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Agenda tu cita en segundos con confirmación por WhatsApp
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2 leading-relaxed">
            Encuentra psicólogos, masajistas, dentistas, barberos y terapeutas cerca de ti. Citas 100% garantizadas con pago anticipado.
          </p>
        </div>

        {/* Big Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              id="search-affiliates-input"
              type="text"
              placeholder="Buscar por servicio, clínica, especialista o zona (ej. 'Guadalajara', 'Monterrey', 'masaje', 'dentista')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 text-white placeholder-slate-400 rounded-2xl border border-white/20 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:bg-slate-900 transition-all text-sm"
            />
          </div>

          <button
            id="use-my-location-btn"
            type="button"
            onClick={handleRequestLocation}
            disabled={isLocating}
            className={`px-5 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shrink-0 ${
              userLocation
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-white hover:bg-slate-100 text-slate-900'
            }`}
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>
              {isLocating
                ? 'Obteniendo GPS...'
                : userLocation
                ? 'Ubicación Activa ✓'
                : 'Usar mi ubicación'}
            </span>
          </button>
        </div>

        {locationError && (
          <p className="text-xs text-amber-300 mt-2 flex items-center space-x-1">
            <span>ℹ</span>
            <span>{locationError}</span>
          </p>
        )}
      </div>

      {/* Quick Zone Filter Pills - Only zones with registered affiliates */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center space-x-1 text-xs font-bold text-slate-700 shrink-0 mr-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zona:</span>
        </div>

        {/* All zones pill */}
        <button
          id="zone-pill-all"
          type="button"
          onClick={() => {
            setSelectedState('');
            setSelectedCity('');
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
            !selectedState && !selectedCity
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Toda la República</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              !selectedState && !selectedCity ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {affiliates.length}
          </span>
        </button>

        {/* Dynamic Zone pills: only cities with registered affiliates */}
        {quickZonePills.map((zone) => {
          const isActive =
            cityMatches(selectedCity, zone.cityName) ||
            (!selectedCity && stateMatches(selectedState, zone.stateCode));
          return (
            <button
              key={zone.id}
              id={`zone-pill-${zone.id}`}
              type="button"
              onClick={() => {
                if (isActive) {
                  setSelectedState('');
                  setSelectedCity('');
                } else {
                  setSelectedState(zone.stateCode);
                  setSelectedCity(zone.cityName);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{zone.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                }`}
              >
                {zone.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Categories Horizontal Scroll - Only categories with registered affiliates */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {/* All categories pill */}
        <button
          id="cat-pill-all"
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>Todos los servicios</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {zoneAffiliates.length}
          </span>
        </button>

        {/* Dynamic active category pills - only categories with registered affiliates */}
        {activeCategories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              id={`cat-pill-${cat.id}`}
              type="button"
              onClick={() => setSelectedCategory(isActive ? 'all' : cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm ring-1 ring-slate-900'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* State filter - Dynamic: Only states with registered affiliates */}
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-700 font-medium">Estado:</span>
              <select
                id="filter-state-select"
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity('');
                }}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 text-xs"
              >
                <option value="">Toda la República ({affiliates.length})</option>
                {activeStates.map((st) => (
                  <option key={st.code} value={st.code}>
                    {st.name} ({st.count})
                  </option>
                ))}
              </select>
            </div>

            {/* City filter - Dynamic: Only cities with registered affiliates */}
            {activeCities.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-700 font-medium">Ciudad:</span>
                <select
                  id="filter-city-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 text-xs"
                >
                  <option value="">Todas las ciudades ({zoneAffiliates.length})</option>
                  {activeCities.map((cityObj) => (
                    <option key={`${cityObj.stateCode}-${cityObj.city}`} value={cityObj.city}>
                      {cityObj.city} ({cityObj.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category filter dropdown - Only categories with registered affiliates */}
            {activeCategories.length > 0 && (
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-700 font-medium">Categoría:</span>
                <select
                  id="filter-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 font-medium focus:ring-1 focus:ring-emerald-500 text-xs max-w-[200px] truncate"
                >
                  <option value="all">Todas ({affiliates.length})</option>
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Toggles */}
            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                id="filter-today-checkbox"
                type="checkbox"
                checked={filterTodayOnly}
                onChange={(e) => setFilterTodayOnly(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                ● Disponible Hoy
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                id="filter-tomorrow-checkbox"
                type="checkbox"
                checked={filterTomorrowOnly}
                onChange={(e) => setFilterTomorrowOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                ● Disponible Mañana
              </span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                id="filter-rating-checkbox"
                type="checkbox"
                checked={filterHighRating}
                onChange={(e) => setFilterHighRating(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
              />
              <span className="font-medium text-slate-700">⭐ 4.5+ calificación</span>
            </label>

            {/* Verification Tier Filter Selector */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setVerificationFilter('all_active')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  verificationFilter === 'all_active'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mostrar profesionales activos con al menos 1 documento"
              >
                🟢 Activos
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('destacados_only')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center space-x-1 ${
                  verificationFilter === 'destacados_only'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
                title="Solo con Insignia de Usuario Destacado Seguro (4 de 4 documentos)"
              >
                <Award className="w-3 h-3 fill-current" />
                <span>⭐ Destacados Seguros</span>
              </button>
              <button
                type="button"
                onClick={() => setVerificationFilter('show_all_with_inactive')}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  verificationFilter === 'show_all_with_inactive'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ver todos, incluyendo perfiles inactivos sin documentos"
              >
                Ver Inactivos
              </button>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center space-x-2 ml-auto">
            <span className="text-slate-700 font-medium">Ordenar:</span>
            <select
              id="sort-by-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 font-semibold text-xs focus:ring-1 focus:ring-emerald-500"
            >
              <option value="recommended">Recomendados (Inteligente)</option>
              <option value="nearest">Más cercanos (GPS)</option>
              <option value="rating">Mejor calificados</option>
              <option value="price">Menor precio</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Feedback Message & Active Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {userLocation ? (
            <span className="font-medium text-emerald-800 flex items-center space-x-1">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 inline" />
              <span>Mostrando los más cercanos según tu ubicación actual</span>
            </span>
          ) : todayAvailableCount > 0 ? (
            <span className="font-medium text-emerald-800">
              Hay {todayAvailableCount} profesionales disponibles hoy listos para atenderte
            </span>
          ) : (
            <span className="text-slate-700">
              Mostrando {sortedAffiliates.length} profesionales disponibles.
            </span>
          )}

          {/* Active Zone Badge */}
          {(selectedCity || selectedState) && (
            <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold px-2.5 py-1 rounded-lg">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>
                Zona:{' '}
                {selectedCity
                  ? `${selectedCity}${selectedState ? `, ${activeStates.find((s) => s.code === selectedState)?.name || selectedState}` : ''}`
                  : activeStates.find((s) => s.code === selectedState)?.name || selectedState}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCity('');
                  setSelectedState('');
                }}
                className="text-emerald-700 hover:text-rose-600 ml-1 font-bold cursor-pointer"
                title="Quitar filtro de zona"
              >
                ×
              </button>
            </span>
          )}

          {/* Active Category Badge */}
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-800 border border-slate-300 font-semibold px-2.5 py-1 rounded-lg">
              <Sparkles className="w-3 h-3 text-slate-600" />
              <span>
                Categoría: {activeCategories.find((c) => c.id === selectedCategory)?.label || selectedCategory}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-slate-600 hover:text-rose-600 ml-1 font-bold cursor-pointer"
                title="Quitar filtro de categoría"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {(searchTerm || selectedState || selectedCity || selectedCategory !== 'all' || filterTodayOnly || filterTomorrowOnly || filterHighRating) && (
          <button
            onClick={resetFilters}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center space-x-1 cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Limpiar todos los filtros</span>
          </button>
        )}
      </div>

      {/* Affiliates Grid List */}
      {sortedAffiliates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No encontramos resultados</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Intenta cambiar el estado, la categoría o borrar los filtros para encontrar otros especialistas en México.
          </p>
          <button
            onClick={resetFilters}
            className="mt-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-slate-800"
          >
            Ver todos los profesionales
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAffiliates.map((aff) => {
            const minPrice = Math.min(...aff.services.map((s) => s.price));
            const formattedDist = formatDistance(aff.distanceKm);
            const evalTier = evaluateVerificationTier(aff.documents, aff.professionalDocument);

            return (
              <div
                key={aff.id}
                id={`affiliate-card-${aff.id}`}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col group ${
                  evalTier.isDestacadoSeguro
                    ? 'border-amber-300 shadow-md hover:border-amber-500 hover:shadow-xl ring-1 ring-amber-200/60'
                    : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-lg'
                }`}
              >
                {/* Banner & Badges */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={affiliatePhotoOrDefault(aff.banner)}
                    alt={aff.businessName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-wide">
                      {aff.categoryLabel || aff.category}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {evalTier.isDestacadoSeguro ? (
                        <span
                          className="inline-flex items-center space-x-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-full shadow-md border border-amber-200 uppercase tracking-wider"
                          title="Usuario Destacado Seguro: Acreditación completa de 4 documentos oficiales (Cédula, Título, COFEPRIS y SAT)"
                        >
                          <Award className="w-3 h-3 fill-slate-950" />
                          <span>DESTACADO SEGURO</span>
                        </span>
                      ) : evalTier.isActive ? (
                        <span
                          className="inline-flex items-center space-x-1 bg-emerald-600/95 backdrop-blur-xs text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-emerald-400/40 shadow-xs"
                          title="Usuario Activo: Documento oficial acreditado y validado"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>ACTIVO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-slate-800/90 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30">
                          <span>EN ACTIVACIÓN</span>
                        </span>
                      )}

                      {aff.isTurbo && (
                        <span className="inline-flex items-center space-x-1 bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                          <Zap className="w-3 h-3 fill-current" />
                          <span>TURBO</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom overlay inside image: Availability & Distance */}
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
                    <div className="flex items-center space-x-2">
                      {aff.availableToday ? (
                        <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center shadow-xs">
                          ● Disponible hoy
                        </span>
                      ) : aff.availableTomorrow ? (
                        <span className="bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center shadow-xs">
                          ● Disponible mañana
                        </span>
                      ) : (
                        <span className="bg-slate-800/80 text-slate-200 text-[10px] px-2 py-0.5 rounded-full">
                          Próximos días
                        </span>
                      )}
                    </div>

                    {formattedDist && (
                      <span className="bg-black/60 backdrop-blur-xs text-emerald-300 font-semibold text-[11px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                        {formattedDist}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">
                          {aff.businessName}
                        </h3>
                        <p className="text-xs font-medium text-slate-700 mt-0.5">{aff.name}</p>
                      </div>

                      <img
                        src={affiliatePhotoOrDefault(aff.logo)}
                        alt={aff.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                      />
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-700 mt-2.5">
                      <div className="flex items-center text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current mr-1" />
                        <span>{aff.rating}</span>
                        <span className="text-slate-600 font-normal ml-0.5">({aff.reviewCount})</span>
                      </div>
                      <span className="text-slate-300">·</span>
                      <div className="flex items-center text-slate-700 truncate">
                        <MapPin className="w-3.5 h-3.5 mr-0.5 text-slate-600 shrink-0" />
                        <span className="truncate">
                          {aff.city}, {aff.state}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 line-clamp-2 leading-relaxed">
                      {aff.description}
                    </p>

                    {/* Accreditation status pill */}
                    <div className="mt-2.5">
                      {evalTier.isDestacadoSeguro ? (
                        <div className="inline-flex items-center space-x-1.5 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-300 text-amber-950 rounded-xl px-2.5 py-1 text-[11px] font-bold w-full shadow-2xs">
                          <Award className="w-3.5 h-3.5 text-amber-600 shrink-0 fill-amber-400" />
                          <span className="truncate">Insignia Destacado Seguro · 4/4 Docs Oficiales</span>
                        </div>
                      ) : evalTier.isActive ? (
                        <div className="inline-flex items-center space-x-1.5 bg-emerald-50/80 border border-emerald-200 text-emerald-900 rounded-xl px-2.5 py-1 text-[11px] font-semibold w-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">Usuario Activo · {evalTier.count} de 4 docs oficiales</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1 text-[11px] font-medium w-full">
                          <span className="text-amber-600 font-bold">⚠️</span>
                          <span className="truncate">En Activación · Requiere 1 doc para activarse</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-600 uppercase font-medium">Desde</span>
                      <div className="text-base font-extrabold text-slate-900">
                        ${minPrice}{' '}
                        <span className="text-[11px] font-normal text-slate-600">MXN</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        id={`view-profile-btn-${aff.id}`}
                        type="button"
                        onClick={() => onSelectAffiliate(aff)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        Ver Perfil
                      </button>
                      <button
                        id={`quick-book-btn-${aff.id}`}
                        type="button"
                        onClick={() => onOpenBookingForAffiliate(aff)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                      >
                        Concretar Cita
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

function affiliatePhotoOrDefault(url?: string): string {
  if (url && url.startsWith('http')) return url;
  return 'https://images.unsplash.com/photo-1527689368864-3a821dbccc34?w=600&auto=format&fit=crop&q=80';
}
