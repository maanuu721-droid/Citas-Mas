import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types.ts';
import { AuthService } from '../services/authService.ts';
import {
  User,
  LogOut,
  Building2,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Calendar,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Search,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Share2
} from 'lucide-react';

interface Props {
  user: UserProfile;
  onOpenDashboard?: () => void;
  onOpenPublicLanding?: () => void;
  onOpenClientAppointments?: () => void;
  onOpenExplore?: () => void;
  onOpenWhatsAppAudit?: () => void;
  onOpenPromo?: () => void;
  onOpenPromoterDashboard?: () => void;
  onOpenAuthModal?: () => void;
  onOpenUpgradePlan?: () => void;
}

export const UserProfileMenu: React.FC<Props> = ({
  user,
  onOpenDashboard,
  onOpenPublicLanding,
  onOpenClientAppointments,
  onOpenExplore,
  onOpenWhatsAppAudit,
  onOpenPromo,
  onOpenPromoterDashboard,
  onOpenAuthModal,
  onOpenUpgradePlan
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await AuthService.getInstance().logout();
    setIsOpen(false);
  };

  const isAffiliate = user.role === 'affiliate';
  const isPromoter = user.role === 'promoter';
  const isApproved = user.approvalStatus === 'approved';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        id="user-profile-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200/80 rounded-2xl transition-all border border-slate-200 text-left"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-7 h-7 rounded-xl object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
              isPromoter
                ? 'bg-amber-500 text-slate-950 font-black'
                : isAffiliate
                ? 'bg-slate-900 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isPromoter ? '$' : user.displayName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="hidden sm:block">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-xs text-slate-900 truncate max-w-[110px]">
              {user.displayName.split(' ')[0]}
            </span>
            {isPromoter ? (
              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                40%
              </span>
            ) : isAffiliate ? (
              isApproved ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Afiliado Aprobado" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Pendiente de Aprobación" />
              )
            ) : null}
          </div>
          <span className="text-[10px] text-slate-500 block leading-tight font-medium">
            {isPromoter
              ? `Embajador (${user.promoterCode || '40%'})`
              : isAffiliate
              ? 'Afiliado Profesional'
              : 'Usuario Final / Cliente'}
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
          {/* Header info */}
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-bold text-xs text-slate-900 truncate">{user.displayName}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>

            <div className="mt-2 flex items-center space-x-1.5">
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                  isPromoter
                    ? 'bg-amber-100 text-amber-950 border border-amber-300'
                    : isAffiliate
                    ? isApproved
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {isPromoter
                  ? '💰 Embajador Promotor (40%)'
                  : isAffiliate
                  ? isApproved
                    ? '✅ Afiliado Aprobado'
                    : '⏳ En Revisión'
                  : '👤 Usuario Final'}
              </span>
            </div>
          </div>

          {/* Navigation Actions STRICTLY segregated by role */}
          <div className="py-1 text-xs font-semibold text-slate-700">
            {/* Direct Upgrade Plan Button */}
            {onOpenUpgradePlan && (
              <div className="px-2 pt-1 pb-1.5 border-b border-slate-100 mb-1">
                <button
                  id="menu-upgrade-plan-btn"
                  type="button"
                  onClick={() => {
                    onOpenUpgradePlan();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer border border-amber-300"
                >
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Upgrade mi plan</span>
                  </div>
                  <span className="text-[10px] bg-slate-950 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
                    Aumentar
                  </span>
                </button>
              </div>
            )}

            {isPromoter ? (
              /* MENÚ EXCLUSIVO PARA AFILIADO PROMOTOR */
              <>
                {onOpenPromoterDashboard && (
                  <button
                    id="menu-promoter-dashboard"
                    onClick={() => {
                      onOpenPromoterDashboard();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-amber-50/80 flex items-center space-x-2 text-slate-900 font-extrabold"
                  >
                    <DollarSign className="w-4 h-4 text-amber-600" />
                    <span>Mi Panel de Embajador (40%)</span>
                  </button>
                )}

                <div className="px-4 py-2 text-[11px] text-slate-600 bg-amber-50/50 border-t border-b border-amber-100 my-1">
                  <div className="flex items-center space-x-1 text-amber-900 font-bold mb-0.5">
                    <Share2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Tu Código de Usuario:</span>
                  </div>
                  <span className="font-mono font-black text-amber-800 text-xs">
                    {user.promoterCode || 'CITAPRO40'}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Ganas el 40% mensual de cada afiliado registrado.
                  </p>
                </div>

                {onOpenExplore && (
                  <button
                    onClick={() => {
                      onOpenExplore();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                  >
                    <Search className="w-4 h-4 text-slate-500" />
                    <span>Ver Directorio de Especialistas</span>
                  </button>
                )}
              </>
            ) : isAffiliate ? (
              /* MENÚ EXCLUSIVO PARA AFILIADOS */
              <>
                {onOpenDashboard && (
                  <button
                    id="menu-affiliate-dashboard"
                    onClick={() => {
                      onOpenDashboard();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 font-bold"
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Mi Agenda & Citas</span>
                  </button>
                )}

                {onOpenPublicLanding && (
                  <button
                    id="menu-affiliate-landing"
                    onClick={() => {
                      onOpenPublicLanding();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    <span>Ver Mi Página Pública</span>
                  </button>
                )}

                {onOpenWhatsAppAudit && (
                  <button
                    id="menu-affiliate-whatsapp"
                    onClick={() => {
                      onOpenWhatsAppAudit();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>Notificaciones WhatsApp</span>
                  </button>
                )}

                {onOpenPromo && (
                  <button
                    id="menu-affiliate-promo"
                    onClick={() => {
                      onOpenPromo();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Mi Plan de Negocio</span>
                  </button>
                )}

                {user.professionalDocument && (
                  <div className="px-4 py-2 text-[11px] text-slate-600 bg-emerald-50/50 border-t border-b border-emerald-100 my-1">
                    <div className="flex items-center space-x-1 text-emerald-800 font-bold mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Acreditación Registrada:</span>
                    </div>
                    <span className="truncate block font-medium">{user.professionalDocument.typeLabel}</span>
                    <span className="text-emerald-700 font-mono font-bold">
                      Folio: {user.professionalDocument.documentNumber}
                    </span>
                  </div>
                )}
              </>
            ) : (
              /* MENÚ EXCLUSIVO PARA USUARIOS FINALES */
              <>
                {onOpenExplore && (
                  <button
                    id="menu-client-explore"
                    onClick={() => {
                      onOpenExplore();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-800 font-bold"
                  >
                    <Search className="w-4 h-4 text-emerald-600" />
                    <span>Explorar Especialistas</span>
                  </button>
                )}

                {onOpenClientAppointments && (
                  <button
                    id="menu-client-appointments"
                    onClick={() => {
                      onOpenClientAppointments();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                  >
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Mis Citas & Reservaciones</span>
                  </button>
                )}

                {onOpenWhatsAppAudit && (
                  <button
                    id="menu-client-whatsapp"
                    onClick={() => {
                      onOpenWhatsAppAudit();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center space-x-2 text-slate-700"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>Notificaciones WhatsApp</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Logout */}
          <div className="pt-1 border-t border-slate-100">
            <button
              id="logout-btn"
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
