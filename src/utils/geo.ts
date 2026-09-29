import { Affiliate } from '../types.ts';

// Haversine formula to compute great-circle distance between two points in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function formatDistance(distanceKm: number | null | undefined): string | null {
  if (distanceKm === null || distanceKm === undefined) return null;
  if (distanceKm < 1) {
    return `a ${Math.round(distanceKm * 1000)} m`;
  }
  return `a ${distanceKm.toFixed(1)} km`;
}

export interface SortOptions {
  userLocation: { lat: number; lng: number } | null;
  sortBy: 'recommended' | 'nearest' | 'rating' | 'price';
}

export function sortAffiliates(
  affiliates: (Affiliate & { distanceKm?: number })[],
  options: SortOptions
): (Affiliate & { distanceKm?: number })[] {
  const { userLocation, sortBy } = options;

  return [...affiliates].sort((a, b) => {
    // 1. Group by availability tier first (unless user explicitly sorted by price or rating)
    if (sortBy === 'recommended' || sortBy === 'nearest') {
      const getAvailabilityTier = (aff: Affiliate) => {
        if (aff.availableToday) return 1;
        if (aff.availableTomorrow) return 2;
        return 3;
      };

      const tierA = getAvailabilityTier(a);
      const tierB = getAvailabilityTier(b);

      if (tierA !== tierB) {
        return tierA - tierB;
      }

      // Within the same availability group:
      // If user location is active, sort by distance first with a Turbo/Equipo priority nudge
      if (userLocation && a.distanceKm !== undefined && b.distanceKm !== undefined) {
        const boostA = (a.isTurbo ? 5 : 0) + (a.plan === 'equipo' ? 3 : 0);
        const boostB = (b.isTurbo ? 5 : 0) + (b.plan === 'equipo' ? 3 : 0);

        if (sortBy === 'nearest') {
          return a.distanceKm - b.distanceKm;
        }

        // Recommended with location: balance distance & boost
        const effectiveDistA = Math.max(0.1, a.distanceKm - boostA * 0.4);
        const effectiveDistB = Math.max(0.1, b.distanceKm - boostB * 0.4);
        return effectiveDistA - effectiveDistB;
      }

      // If no location, sort by Turbo/Plan boost + rating
      const scoreA = (a.isTurbo ? 100 : 0) + (a.plan === 'equipo' ? 40 : 0) + a.rating * 10 + Math.log(a.reviewCount + 1);
      const scoreB = (b.isTurbo ? 100 : 0) + (b.plan === 'equipo' ? 40 : 0) + b.rating * 10 + Math.log(b.reviewCount + 1);
      return scoreB - scoreA;
    }

    if (sortBy === 'rating') {
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    }

    if (sortBy === 'price') {
      const minPriceA = Math.min(...a.services.map((s) => s.price));
      const minPriceB = Math.min(...b.services.map((s) => s.price));
      return minPriceA - minPriceB;
    }

    return 0;
  });
}
