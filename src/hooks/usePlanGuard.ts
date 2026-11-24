import { Affiliate } from '../types.ts';

export interface PlanGuard {
  isPaid: boolean;
  canAccessMarketing: boolean;
  canAccessCRM: boolean;
  canUseEtapa1: boolean;
  canUseEtapa2: boolean;
  canUseEtapa3: boolean;
  canUseEtapa4: boolean;
  hasVideoThisMonth: boolean;
  videoTypeUsed: 'spot' | 'cinematic' | null;
  currentMonth: string;
  daysUntilNextMonth: number;
}

export function usePlanGuard(affiliate: Affiliate): PlanGuard {
  const isPaid =
    affiliate.plan === 'monthly' ||
    affiliate.plan === 'pro' ||
    affiliate.plan === 'equipo';

  const canAccessMarketing = isPaid;
  const canAccessCRM = isPaid;
  const canUseEtapa1 = isPaid;
  const hasPersonas = (affiliate.buyerPersonas?.length ?? 0) > 0;
  const hasPackages = (affiliate.imagePackages?.filter(p => p.status === 'ready').length ?? 0) > 0;
  const canUseEtapa2 = isPaid && hasPersonas;
  const canUseEtapa3 = isPaid && hasPackages;
  const canUseEtapa4 = isPaid && hasPackages;

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const videoThisMonth = affiliate.monthlyVideos?.find(
    v => v.month === currentMonth && (v.status === 'ready' || v.status === 'processing')
  );
  const hasVideoThisMonth = !!videoThisMonth;
  const videoTypeUsed = videoThisMonth?.videoType ?? null;

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysUntilNextMonth = Math.max(
    1,
    Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    isPaid,
    canAccessMarketing,
    canAccessCRM,
    canUseEtapa1,
    canUseEtapa2,
    canUseEtapa3,
    canUseEtapa4,
    hasVideoThisMonth,
    videoTypeUsed,
    currentMonth,
    daysUntilNextMonth,
  };
}
