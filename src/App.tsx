import React, { useState, useEffect } from 'react';
import { Affiliate, Appointment, WhatsAppMessageAudit, UserProfile, SubscriptionPlanType } from './types.ts';
import { DataService } from './services/dataService.ts';
import { AuthService } from './services/authService.ts';
import { ExploreView } from './components/ExploreView.tsx';
import { AffiliateLandingView } from './components/AffiliateLandingView.tsx';
import { AffiliateDashboardView } from './components/AffiliateDashboardView.tsx';
import { ManageAppointmentView } from './components/ManageAppointmentView.tsx';
import { PromoBusinessView } from './components/PromoBusinessView.tsx';
import { BookingModal } from './components/BookingModal.tsx';
import { PlanCheckoutModal } from './components/PlanCheckoutModal.tsx';
import { WhatsAppSimulatorDrawer } from './components/WhatsAppSimulatorDrawer.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { UserProfileMenu } from './components/UserProfileMenu.tsx';
import { AdminDashboardView } from './components/AdminDashboardView.tsx';
import { AdminAuthModal } from './components/AdminAuthModal.tsx';
import { AffiliateOnboardingModal } from './components/AffiliateOnboardingModal.tsx';
import { PromoterDashboardView } from './components/PromoterDashboardView.tsx';
import {
  Calendar,
  MessageSquare,
  Search,
  LayoutDashboard,
  ShieldCheck,
  Shield,
  Lock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  DollarSign,
  PhoneCall,
  LogIn,
  UserPlus,
  UserCheck,
  User,
  Building2,
  TrendingUp,
  Share2
} from 'lucide-react';

type ViewMode = 'explore' | 'affiliate_landing' | 'dashboard' | 'manage' | 'promo' | 'admin' | 'promoter';

export default function App() {
  const [activeView, setActiveView] = useState<ViewMode>('explore');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'recover'>('login');
  const [authModalRole, setAuthModalRole] = useState<'client' | 'affiliate' | 'promoter'>('client');

  // Selected affiliate for public landing view
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  // Affiliate active in the dashboard (default to first affiliate)
  const [currentAffiliateUser, setCurrentAffiliateUser] = useState<Affiliate | null>(null);

  // Global Plan Upgrade Modal state
  const [isGlobalPlanModalOpen, setIsGlobalPlanModalOpen] = useState(false);
  const [globalUpgradeTargetPlan, setGlobalUpgradeTargetPlan] = useState<SubscriptionPlanType | 'turbo'>('pro');

  const handleOpenUpgradePlan = () => {
    const nextPlan: SubscriptionPlanType =
      currentAffiliateUser?.plan === 'basico' ? 'pro' : currentAffiliateUser?.plan === 'pro' ? 'equipo' : 'equipo';
    setGlobalUpgradeTargetPlan(nextPlan);
    setIsGlobalPlanModalOpen(true);
  };

  const handleGlobalPlanSuccess = (plan: SubscriptionPlanType, isTurbo?: boolean) => {
    if (currentAffiliateUser) {
      const updatedAff: Affiliate = {
        ...currentAffiliateUser,
        plan,
        isTurbo: isTurbo ? true : currentAffiliateUser.isTurbo,
        affiliateTierLevel: plan === 'equipo' ? 3 : plan === 'pro' ? 2 : 1
      };
      handleUpdateAffiliateInState(updatedAff);
      DataService.getInstance().saveAffiliate(updatedAff);
    }
    setIsGlobalPlanModalOpen(false);
  };

  // Direct booking modal state
  const [bookingAffiliate, setBookingAffiliate] = useState<Affiliate | null>(null);
  const [pendingMarketingCount, setPendingMarketingCount] = useState<number>(0);

  // Affiliate Onboarding modal state (only first time an affiliate logs in)
  const [isAffiliateOnboardingOpen, setIsAffiliateOnboardingOpen] = useState(false);

  // Admin General Security Access (Protected by PIN 072189 + Google maanuu721@gmail.com)
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('citapro_admin_authed') === 'true';
  });
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return sessionStorage.getItem('citapro_admin_email') || 'maanuu721@gmail.com';
  });

  const handleAdminAuthSuccess = (authorizedEmail: string) => {
    setIsAdminAuthenticated(true);
    setAdminEmail(authorizedEmail);
    sessionStorage.setItem('citapro_admin_authed', 'true');
    sessionStorage.setItem('citapro_admin_email', authorizedEmail);
    setIsAdminAuthModalOpen(false);
    setSelectedAffiliate(null);
    setActiveView('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem('citapro_admin_authed');
    setActiveView('explore');
  };

  // Twilio WhatsApp Drawer simulator
  const [isWhatsAppDrawerOpen, setIsWhatsAppDrawerOpen] = useState(false);
  const [simulatedMessages, setSimulatedMessages] = useState<WhatsAppMessageAudit[]>([
    {
      id: 'demo-msg-welcome',
      type: 'confirmation',
      title: 'Sistema de Notificaciones Activo',
      content: '*Citas Más* | Bienvenido a la red de citas profesionales. Cada reserva genera mensajes automáticos de confirmación, recordatorios 24h y 2h antes.',
      sentAt: '09:00',
      status: 'delivered',
      twilioSid: 'SM8492048102948201948201'
    }
  ]);
  const [simulatedPhone, setSimulatedPhone] = useState('+52 55 1234 5678');

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Subscribe to Authentication state - Ensure strict affiliate isolation
  useEffect(() => {
    const unsub = AuthService.getInstance().subscribe(async (user) => {
      setCurrentUser(user);

      // IMPORTANT: Always clear the affiliate panel immediately when auth state changes.
      // This prevents stale data from a previous session or a different account from
      // remaining visible while the new user's affiliate data is being loaded.
      setCurrentAffiliateUser(null);

      if (user?.role === 'affiliate') {
        const allAffiliates = await DataService.getInstance().getAffiliates();
        // Strictly match by ownerId (uid) first — most reliable unique identifier.
        // Fall back to ownerEmail only as secondary signal, affiliateId as tertiary.
        const myAff = allAffiliates.find(
          (a) =>
            a.ownerId === user.uid ||
            (user.email && a.ownerEmail?.toLowerCase() === user.email.toLowerCase()) ||
            (user.affiliateId && a.id === user.affiliateId)
        );

        if (myAff) {
          setCurrentAffiliateUser(myAff);
        }
        // If no affiliate found, currentAffiliateUser stays null → onboarding will open

        // Trigger Onboarding ONLY the first time with this account
        const isDoneLocally = localStorage.getItem(`citapro_onboarding_done_${user.uid}`) === 'true';
        const hasCompleted = user.hasCompletedOnboarding || isDoneLocally || (myAff && myAff.hasCompletedOnboarding);
        if (!hasCompleted) {
          setIsAffiliateOnboardingOpen(true);
        } else {
          setIsAffiliateOnboardingOpen(false);
        }
      } else if (!user) {
        // Logout — already cleared above, nothing more needed
      }
    });
    return () => unsub();
  }, []);

  // Load initial data from DataService / Firestore
  useEffect(() => {
    loadAllData();

    // Check URL query parameters for promoter referral codes (?ref=..., ?promoter=..., ?code=..., ?view=...)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref') || params.get('promoter') || params.get('code');
      if (refCode) {
        localStorage.setItem('citapro_referral_code', refCode.toUpperCase());
        localStorage.setItem('citapro_promoter_referral', refCode.toUpperCase());
      }
      const viewParam = params.get('view');
      if (viewParam === 'promoter') {
        setActiveView('promoter');
        setSelectedAffiliate(null);
      }
    }
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const list = await DataService.getInstance().getAffiliates();
      setAffiliates(list);

      const loggedUser = AuthService.getInstance().getCurrentUser();
      if (loggedUser?.role === 'affiliate') {
        // Strictly match by uid (ownerId) first — never show another user's data
        const myAff = list.find(
          (a) =>
            a.ownerId === loggedUser.uid ||
            (loggedUser.email && a.ownerEmail?.toLowerCase() === loggedUser.email.toLowerCase()) ||
            (loggedUser.affiliateId && a.id === loggedUser.affiliateId)
        );
        // Only set if the matched affiliate belongs to the currently authenticated uid
        if (myAff && (myAff.ownerId === loggedUser.uid || myAff.ownerEmail?.toLowerCase() === loggedUser.email?.toLowerCase())) {
          setCurrentAffiliateUser(myAff);
        }
      }

      const reqs = await DataService.getInstance().getMarketingRequests();
      const pending = reqs.filter((r) => r.adminApprovalStatus === 'pending_approval').length;
      setPendingMarketingCount(pending);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenLogin = (role: 'client' | 'affiliate' | 'promoter' = 'client') => {
    setAuthModalRole(role);
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenSignup = (role: 'client' | 'affiliate' | 'promoter' = 'client') => {
    setAuthModalRole(role);
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  };

  const handleOpenAffiliateLanding = () => {
    const targetAff =
      currentAffiliateUser ||
      (currentUser?.affiliateId ? affiliates.find((a) => a.id === currentUser.affiliateId) : null);

    if (targetAff) {
      setSelectedAffiliate(targetAff);
      setActiveView('affiliate_landing');
    } else if (currentUser?.role === 'affiliate') {
      setIsAffiliateOnboardingOpen(true);
    }
  };

  const handleAuthSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    // Refresh affiliates to include any newly registered professional
    const refreshed = await DataService.getInstance().getAffiliates();
    setAffiliates(refreshed);

    if (user.role === 'affiliate') {
      const myAff = refreshed.find(
        (a) =>
          a.ownerId === user.uid ||
          (user.email && a.ownerEmail?.toLowerCase() === user.email.toLowerCase()) ||
          (user.affiliateId && a.id === user.affiliateId)
      );

      if (myAff) {
        setCurrentAffiliateUser(myAff);
      } else {
        setCurrentAffiliateUser(null);
      }

      const isDoneLocally = localStorage.getItem(`citapro_onboarding_done_${user.uid}`) === 'true';
      const hasCompleted = user.hasCompletedOnboarding || isDoneLocally || (myAff && myAff.hasCompletedOnboarding);

      if (!hasCompleted) {
        setIsAffiliateOnboardingOpen(true);
      }

      setActiveView('dashboard');
      setSelectedAffiliate(null);
    } else if (user.role === 'promoter') {
      setActiveView('promoter');
      setSelectedAffiliate(null);
    } else {
      setActiveView('explore');
      setSelectedAffiliate(null);
    }
  };

  const handleAffiliateOnboardingComplete = (createdAffiliate: Affiliate, updatedUser: UserProfile) => {
    setCurrentAffiliateUser(createdAffiliate);
    setCurrentUser(updatedUser);
    setAffiliates((prev) => [createdAffiliate, ...prev.filter((a) => a.id !== createdAffiliate.id)]);
    setIsAffiliateOnboardingOpen(false);
    setActiveView('dashboard');
    setSelectedAffiliate(null);
  };

  const handleSelectAffiliate = (aff: Affiliate) => {
    setSelectedAffiliate(aff);
    setActiveView('affiliate_landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBooking = (aff: Affiliate) => {
    setBookingAffiliate(aff);
  };

  const handleBookingSuccess = (newAppointment: Appointment) => {
    setBookingAffiliate(null);
    if (newAppointment.whatsappMessages.length > 0) {
      setSimulatedMessages(newAppointment.whatsappMessages);
      setSimulatedPhone(newAppointment.clientPhone);
      setIsWhatsAppDrawerOpen(true);
    }
  };

  const handleTriggerWhatsAppDrawer = (appointment: Appointment) => {
    if (appointment.whatsappMessages && appointment.whatsappMessages.length > 0) {
      setSimulatedMessages(appointment.whatsappMessages);
    }
    setSimulatedPhone(appointment.clientPhone);
    setIsWhatsAppDrawerOpen(true);
  };

  const handleUpdateAffiliateInState = (updated: Affiliate) => {
    setCurrentAffiliateUser(updated);
    setAffiliates((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      {/* Top Notification / Deployment Bar */}
      <div className="bg-slate-950 text-white text-[11px] py-1.5 px-4 text-center border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
            Sistema Activo
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Citas profesionales con cobro anticipado y confirmaciones instantáneas por WhatsApp
          </span>
        </div>

        <button
          onClick={() => setIsWhatsAppDrawerOpen(!isWhatsAppDrawerOpen)}
          className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1 ml-auto shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Notificaciones WhatsApp ({simulatedMessages.length})</span>
        </button>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => {
              setActiveView('explore');
              setSelectedAffiliate(null);
            }}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-600 transition-colors">
              <Calendar className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 leading-none">
                  Citas <span className="text-emerald-600">Más</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-600 font-medium tracking-wide">
                Citas con cobro anticipado, IA & WhatsApp · España, Colombia, Argentina, Chile, México y más
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links - STRICTLY SEGREGATED BY ROLE */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-bold">
            {currentUser?.role === 'affiliate' ? (
              /* MENÚ EXCLUSIVO DE AFILIADO */
              <>
                <button
                  id="nav-affiliate-dashboard-btn"
                  onClick={() => {
                    setActiveView('dashboard');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'dashboard'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mi Agenda & Citas</span>
                </button>

                <button
                  id="nav-affiliate-landing-btn"
                  onClick={handleOpenAffiliateLanding}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'affiliate_landing'
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver Mi Página Pública</span>
                </button>

                <button
                  id="nav-affiliate-whatsapp-btn"
                  onClick={() => setIsWhatsAppDrawerOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Notificaciones WhatsApp</span>
                </button>

                <button
                  id="nav-affiliate-promo-btn"
                  onClick={() => {
                    setActiveView('promo');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'promo'
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mi Plan de Negocio</span>
                </button>

                <button
                  id="nav-affiliate-upgrade-btn"
                  type="button"
                  onClick={handleOpenUpgradePlan}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl transition-all flex items-center space-x-1.5 shadow-2xs border border-amber-300 cursor-pointer"
                  title="Aumentar mi plan o servicio"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Upgrade mi plan</span>
                </button>
              </>
            ) : currentUser?.role === 'promoter' ? (
              /* MENÚ EXCLUSIVO DE PROMOTOR / EMBAJADOR (40%) */
              <>
                <button
                  id="nav-promoter-dashboard-btn"
                  onClick={() => {
                    setActiveView('promoter');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'promoter'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-amber-50'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                  <span>Mi Panel de Embajador (40%)</span>
                </button>

                <button
                  id="nav-promoter-explore-btn"
                  onClick={() => {
                    setActiveView('explore');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'explore'
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Explorar Especialistas</span>
                </button>
              </>
            ) : currentUser?.role === 'client' ? (
              /* MENÚ EXCLUSIVO DE USUARIO FINAL */
              <>
                <button
                  id="nav-client-explore-btn"
                  onClick={() => {
                    setActiveView('explore');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'explore' || activeView === 'affiliate_landing'
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Explorar Especialistas</span>
                </button>

                <button
                  id="nav-client-manage-btn"
                  onClick={() => {
                    setActiveView('manage');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'manage'
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mis Citas & Reservaciones</span>
                </button>

                <button
                  id="nav-client-whatsapp-btn"
                  onClick={() => setIsWhatsAppDrawerOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center space-x-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Notificaciones WhatsApp</span>
                </button>
              </>
            ) : (
              /* MENÚ INVITADO (SIN SESIÓN) */
              <>
                <button
                  id="nav-guest-explore-btn"
                  onClick={() => {
                    setActiveView('explore');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'explore' || activeView === 'affiliate_landing'
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Explorar Especialistas</span>
                </button>

                <button
                  id="nav-guest-promo-btn"
                  onClick={() => {
                    setActiveView('promo');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'promo'
                      ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Para Profesionales (Promo)</span>
                </button>

                <button
                  id="nav-guest-promoter-btn"
                  onClick={() => {
                    setActiveView('promoter');
                    setSelectedAffiliate(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
                    activeView === 'promoter'
                      ? 'bg-amber-100 text-amber-900 font-black'
                      : 'text-amber-800 hover:text-amber-950 hover:bg-amber-50 font-bold'
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>Embajadores (Gana 40%)</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action Button & Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                {currentUser.role === 'affiliate' ? (
                  <button
                    id="affiliate-quick-dash-btn"
                    onClick={() => {
                      setActiveView('dashboard');
                      setSelectedAffiliate(null);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mi Consultorio</span>
                  </button>
                ) : currentUser.role === 'promoter' ? (
                  <button
                    id="promoter-quick-dash-btn"
                    onClick={() => {
                      setActiveView('promoter');
                      setSelectedAffiliate(null);
                    }}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-xs flex items-center space-x-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-slate-950" />
                    <span>Mi Panel Embajador (40%)</span>
                  </button>
                ) : (
                  <button
                    id="client-explore-quick-btn"
                    onClick={() => {
                      setActiveView('explore');
                      setSelectedAffiliate(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar Especialista</span>
                  </button>
                )}

                <UserProfileMenu
                  user={currentUser}
                  onOpenDashboard={() => {
                    setActiveView('dashboard');
                    setSelectedAffiliate(null);
                  }}
                  onOpenPublicLanding={handleOpenAffiliateLanding}
                  onOpenClientAppointments={() => {
                    setActiveView('manage');
                    setSelectedAffiliate(null);
                  }}
                  onOpenExplore={() => {
                    setActiveView('explore');
                    setSelectedAffiliate(null);
                  }}
                  onOpenWhatsAppAudit={() => setIsWhatsAppDrawerOpen(true)}
                  onOpenPromo={() => {
                    setActiveView('promo');
                    setSelectedAffiliate(null);
                  }}
                  onOpenPromoterDashboard={() => {
                    setActiveView('promoter');
                    setSelectedAffiliate(null);
                  }}
                  onOpenAuthModal={() => handleOpenLogin('client')}
                  onOpenUpgradePlan={handleOpenUpgradePlan}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="nav-login-client-btn"
                  onClick={() => handleOpenLogin('client')}
                  className="px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 border border-slate-200"
                >
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ingresar como Usuario</span>
                </button>

                <button
                  id="nav-login-affiliate-btn"
                  onClick={() => handleOpenLogin('affiliate')}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ingresar como Afiliado</span>
                </button>

                <button
                  id="nav-login-promoter-btn"
                  onClick={() => handleOpenLogin('promoter')}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-1.5 shadow-2xs"
                >
                  <DollarSign className="w-3.5 h-3.5 text-slate-900" />
                  <span>Embajador 40%</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            id="mobile-menu-toggle-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu - STRICTLY SEGREGATED BY ROLE */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 space-y-2 text-sm font-semibold">
            {/* User status in mobile */}
            {currentUser ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-7 h-7 rounded-xl text-white flex items-center justify-center font-bold text-xs ${
                        currentUser.role === 'promoter'
                          ? 'bg-amber-500'
                          : currentUser.role === 'affiliate'
                          ? 'bg-slate-900'
                          : 'bg-emerald-600'
                      }`}
                    >
                      {currentUser.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                        {currentUser.displayName}
                      </p>
                      <p className="text-[10px] text-slate-500">{currentUser.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      currentUser.role === 'promoter'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : currentUser.role === 'affiliate'
                        ? currentUser.approvalStatus === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {currentUser.role === 'promoter'
                      ? '💰 Embajador (40%)'
                      : currentUser.role === 'affiliate'
                      ? currentUser.approvalStatus === 'approved'
                        ? 'Afiliado Aprobado'
                        : 'En Revisión'
                      : 'Usuario Final'}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await AuthService.getInstance().logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-xs font-bold text-rose-600 hover:underline pt-1 block"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 mb-3 pb-3 border-b border-slate-100">
                <button
                  onClick={() => {
                    handleOpenLogin('client');
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold text-center flex flex-col items-center justify-center"
                >
                  <User className="w-4 h-4 text-emerald-600 mb-1" />
                  <span>Usuario</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenLogin('affiliate');
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold text-center flex flex-col items-center justify-center"
                >
                  <Building2 className="w-4 h-4 text-emerald-400 mb-1" />
                  <span>Afiliado</span>
                </button>
                <button
                  onClick={() => {
                    handleOpenLogin('promoter');
                    setIsMobileMenuOpen(false);
                  }}
                  className="py-2.5 px-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[11px] font-black text-center flex flex-col items-center justify-center"
                >
                  <DollarSign className="w-4 h-4 text-slate-900 mb-1" />
                  <span>Embajador</span>
                </button>
              </div>
            )}

            {/* Mobile Links strictly segregated */}
            {currentUser?.role === 'affiliate' ? (
              <>
                <button
                  onClick={() => {
                    setActiveView('dashboard');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-800 hover:bg-slate-50 flex items-center space-x-2 font-bold"
                >
                  <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                  <span>Mi Agenda & Citas (Escritorio)</span>
                </button>

                <button
                  onClick={() => {
                    handleOpenAffiliateLanding();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Ver Mi Página Pública</span>
                </button>

                <button
                  onClick={() => {
                    setIsWhatsAppDrawerOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>Notificaciones WhatsApp</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('promo');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Mi Plan de Negocio</span>
                </button>

                <button
                  type="button"
                  id="mobile-nav-affiliate-upgrade-btn"
                  onClick={() => {
                    handleOpenUpgradePlan();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 flex items-center justify-between font-black text-xs shadow-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 fill-slate-950" />
                    <span>Upgrade mi plan</span>
                  </div>
                  <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-full uppercase">
                    Mejorar
                  </span>
                </button>
              </>
            ) : currentUser?.role === 'promoter' ? (
              <>
                <button
                  onClick={() => {
                    setActiveView('promoter');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-900 bg-amber-50 hover:bg-amber-100 flex items-center space-x-2 font-black"
                >
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>Mi Panel de Embajador (40%)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('explore');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-2 font-bold"
                >
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Explorar Especialistas</span>
                </button>
              </>
            ) : currentUser?.role === 'client' ? (
              <>
                <button
                  onClick={() => {
                    setActiveView('explore');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-800 hover:bg-slate-50 flex items-center space-x-2 font-bold"
                >
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Explorar Especialistas</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('manage');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mis Citas & Reservaciones</span>
                </button>

                <button
                  onClick={() => {
                    setIsWhatsAppDrawerOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>Notificaciones WhatsApp</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setActiveView('explore');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <Search className="w-4 h-4 text-emerald-600" />
                  <span>Explorar Especialistas</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('promo');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Para Profesionales (Promo & Planes)</span>
                </button>

                <button
                  onClick={() => {
                    setActiveView('promoter');
                    setSelectedAffiliate(null);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-2 px-3 rounded-lg text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center space-x-2 font-bold"
                >
                  <DollarSign className="w-4 h-4 text-amber-600" />
                  <span>Programa Embajadores (Gana 40%)</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Cargando especialistas...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: EXPLORE DIRECTORY */}
            {activeView === 'explore' && (
              <ExploreView
                affiliates={affiliates}
                onSelectAffiliate={handleSelectAffiliate}
                onOpenBookingForAffiliate={handleOpenBooking}
              />
            )}

            {/* VIEW 2: PUBLIC AFFILIATE LANDING PAGE */}
            {activeView === 'affiliate_landing' && selectedAffiliate && (
              <AffiliateLandingView
                affiliate={selectedAffiliate}
                currentUser={currentUser}
                onBack={() => {
                  if (currentUser?.role === 'affiliate') {
                    setActiveView('dashboard');
                  } else {
                    setActiveView('explore');
                  }
                  setSelectedAffiliate(null);
                }}
                onOpenBooking={(serviceId) => {
                  setBookingAffiliate(selectedAffiliate);
                }}
                onOpenLogin={handleOpenLogin}
                onUpdateAffiliate={handleUpdateAffiliateInState}
              />
            )}

            {/* VIEW 3: PROMO & BUSINESS PROPOSAL */}
            {activeView === 'promo' && (
              <PromoBusinessView
                onGoToDashboard={() => setActiveView('dashboard')}
                onGoToExplore={() => setActiveView('explore')}
                onRegisterAffiliate={() => handleOpenSignup('affiliate')}
              />
            )}

            {/* VIEW 4: AFFILIATE DASHBOARD / ESCRITORIO */}
            {activeView === 'dashboard' && (
              currentAffiliateUser ? (
                <AffiliateDashboardView
                  currentAffiliate={currentAffiliateUser}
                  onUpdateAffiliate={handleUpdateAffiliateInState}
                  onPreviewLanding={handleSelectAffiliate}
                  onTriggerWhatsAppDrawer={handleTriggerWhatsAppDrawer}
                  onOpenOnboardingTour={() => setIsAffiliateOnboardingOpen(true)}
                />
              ) : (
                <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">
                    {!currentUser ? 'Crear Cuenta y Configurar mi Empresa' : 'Configuración de tu Empresa'}
                  </h2>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {!currentUser
                      ? 'Para crear tu cuenta de afiliado puedes registrarte con tu Cuenta de Google o con correo electrónico y contraseña. Al registrarte ingresarás de inmediato a llenar el formulario con los datos de tu negocio, horarios y catálogo de servicios.'
                      : 'Estás a un paso de activar tu panel de control privado. Completa la información inicial de tu compañía, historia, logotipo, teléfono de WhatsApp y servicios con precios.'}
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      id="start-onboarding-tour-btn"
                      onClick={() => {
                        if (!currentUser) {
                          handleOpenSignup('affiliate');
                        } else {
                          setIsAffiliateOnboardingOpen(true);
                        }
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer inline-flex items-center justify-center space-x-2"
                    >
                      <span>
                        {!currentUser
                          ? 'Registrarme y Configurar mi Empresa'
                          : 'Iniciar Paseo y Configuración de mi Empresa'}
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </button>
                    {!currentUser && (
                      <button
                        id="login-existing-affiliate-btn"
                        onClick={() => handleOpenLogin('affiliate')}
                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center justify-center space-x-1.5 border border-slate-200"
                      >
                        <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ya tengo cuenta (Iniciar Sesión)</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            )}

            {/* VIEW 5: MANAGE & CANCEL APPOINTMENTS */}
            {activeView === 'manage' && (
              <ManageAppointmentView
                affiliates={affiliates}
                currentUser={currentUser}
                onTriggerWhatsAppDrawer={handleTriggerWhatsAppDrawer}
              />
            )}

            {/* VIEW 6: ADMIN GENERAL (MARKETING PRO/PREMIUM & SUSCRIPCIONES - ACCESO RESTRINGIDO) */}
            {activeView === 'admin' && (
              isAdminAuthenticated ? (
                <AdminDashboardView
                  adminEmail={adminEmail}
                  onLogoutAdmin={handleAdminLogout}
                  onBackToApp={() => setActiveView('explore')}
                  onSelectAffiliateView={(affId) => {
                    const aff = affiliates.find((a) => a.id === affId);
                    if (aff) {
                      setSelectedAffiliate(aff);
                      setActiveView('affiliate_landing');
                    }
                  }}
                />
              ) : (
                <div className="max-w-md mx-auto my-24 p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl text-slate-200">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black text-white">Acceso Administrativo Bloqueado</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Este panel está reservado exclusivamente para la administración general autorizada. Se requiere contraseña de seguridad maestra (072189) y acceso verificado con Google (maanuu721@gmail.com).
                  </p>
                  <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => setIsAdminAuthModalOpen(true)}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow cursor-pointer transition-all"
                    >
                      Desbloquear con Contraseña & Google
                    </button>
                    <button
                      onClick={() => setActiveView('explore')}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all"
                    >
                      Volver al Inicio
                    </button>
                  </div>
                </div>
              )
            )}

            {/* VIEW 7: PROMOTER DASHBOARD (AFILIADO PROMOTOR / EMBAJADOR 40% MENSUAL RECURRENTE) */}
            {activeView === 'promoter' && (
              <PromoterDashboardView
                currentUser={currentUser}
                onOpenExplore={() => {
                  setActiveView('explore');
                  setSelectedAffiliate(null);
                }}
                onOpenSignup={() => handleOpenSignup('promoter')}
                onOpenLogin={() => handleOpenLogin('promoter')}
              />
            )}
          </>
        )}
      </main>

      {/* Auth Modal for Login, Signup (User/Affiliate) & Password Recovery */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        initialRole={authModalRole}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Direct Booking Modal */}
      {bookingAffiliate && (
        <BookingModal
          affiliate={bookingAffiliate}
          isOpen={Boolean(bookingAffiliate)}
          onClose={() => setBookingAffiliate(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Twilio WhatsApp Realtime Simulator Toast / Drawer */}
      <WhatsAppSimulatorDrawer
        messages={simulatedMessages}
        targetPhone={simulatedPhone}
        isOpen={isWhatsAppDrawerOpen}
        onClose={() => setIsWhatsAppDrawerOpen(false)}
      />

      {/* Admin General Security Auth Gate Modal (Password 072189 + Google maanuu721@gmail.com) */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Affiliate Onboarding & Welcome Tour Modal (Opens for new or existing affiliates) */}
      {isAffiliateOnboardingOpen && (
        <AffiliateOnboardingModal
          isOpen={isAffiliateOnboardingOpen}
          user={
            currentUser
              ? { ...currentUser, role: 'affiliate' }
              : {
                  uid: `aff-user-${Date.now().toString(36)}`,
                  email: '',
                  displayName: 'Mi Consultorio Profesional',
                  role: 'affiliate',
                  phone: '55 1234 5678',
                  approvalStatus: 'approved',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
          }
          onComplete={handleAffiliateOnboardingComplete}
          onClose={() => setIsAffiliateOnboardingOpen(false)}
        />
      )}

      {/* Global Plan Upgrade Checkout Modal */}
      <PlanCheckoutModal
        isOpen={isGlobalPlanModalOpen}
        initialPlan={globalUpgradeTargetPlan}
        affiliate={currentAffiliateUser}
        onClose={() => setIsGlobalPlanModalOpen(false)}
        onPaymentSuccess={handleGlobalPlanSuccess}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-white font-black text-sm">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Citas Más</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Plataforma web de citas para servicios profesionales en países de habla hispana (España, Colombia, Argentina, Chile, México y más con dirección exacta y WhatsApp).
            </p>
            <div className="text-[11px] text-emerald-400 font-medium">
              Infraestructura en la nube con alta disponibilidad.
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Políticas de Cita</h4>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li>• Cancelación &gt;24h: 50% de reembolso</li>
              <li>• Cancelación &le;24h: 0% de reembolso</li>
              <li>• 1 reagendamiento gratis con &gt;24h</li>
              <li>• Cobro 100% anticipado obligatorio</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Planes para Afiliados</h4>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li>• Plan Básico: $179 MXN/mes (o equivalente)</li>
              <li>• Plan Pro (14 días gratis): $359 MXN/mes</li>
              <li>• Plan Equipo: $869 MXN/mes</li>
              <li>• Add-on Turbo: $1,500 MXN/mes</li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">Tecnología & Integración</h4>
            <ul className="space-y-1 text-[11px] text-slate-400">
              <li>• Sincronización en tiempo real</li>
              <li>• Notificaciones WhatsApp Automáticas</li>
              <li>• Pasarela Stripe & Pagos Seguros</li>
              <li>• Búsqueda por países y dirección física exacta</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>© 2026 Citas Más. Todos los derechos reservados. Red internacional para profesionales en países de habla hispana.</span>
          <div className="flex items-center space-x-3">
            <button onClick={() => setActiveView('promo')} className="hover:text-white transition-colors">
              Planes
            </button>
            <button onClick={() => setActiveView('promoter')} className="hover:text-amber-400 font-bold transition-colors">
              Embajadores (40%)
            </button>
            <button onClick={() => setActiveView('manage')} className="hover:text-white transition-colors">
              Políticas
            </button>
            <button onClick={() => setActiveView('dashboard')} className="hover:text-white transition-colors">
              Afiliados
            </button>
            {/* Botón apenas visible para el Administrador General */}
            <button
              id="footer-admin-discreet-btn"
              type="button"
              onClick={() => setIsAdminAuthModalOpen(true)}
              className="text-slate-800 hover:text-slate-600 opacity-20 hover:opacity-80 transition-opacity text-[10px] tracking-widest select-none cursor-pointer inline-flex items-center px-1 py-0.5 rounded"
              title="Acceso administrativo"
              aria-label="Acceso administrativo"
            >
              <span className="font-mono text-[9px]">•</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
