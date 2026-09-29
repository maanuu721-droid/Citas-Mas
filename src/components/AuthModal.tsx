import React, { useState } from 'react';
import {
  AuthService,
  RegisterClientParams,
  RegisterAffiliateParams
} from '../services/authService.ts';
import { UserProfile, UserRole, OFFICIAL_REQUIRED_DOCUMENTS, ProfessionalDocument } from '../types.ts';
import { MEXICAN_STATES, SERVICE_CATEGORIES, ALL_SUBCATEGORIES, resolveCategory } from '../data/mexicoData.ts';
import { CategorySelector } from './CategorySelector.tsx';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Building2,
  FileCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  FileText,
  KeyRound,
  ExternalLink,
  ChevronLeft,
  Award,
  DollarSign,
  TrendingUp,
  Share2
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  initialMode?: 'login' | 'signup' | 'recover';
  initialRole?: UserRole;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  initialMode = 'login',
  initialRole = 'client',
  onClose,
  onAuthSuccess
}) => {
  const authService = AuthService.getInstance();

  // Mode: 'login' | 'signup' | 'recover'
  const [mode, setMode] = useState<'login' | 'signup' | 'recover'>(initialMode);
  const [loginRole, setLoginRole] = useState<UserRole>(initialRole || 'client');
  const [signupRole, setSignupRole] = useState<UserRole>(initialRole);

  // Sync state whenever props change
  React.useEffect(() => {
    if (isOpen) {
      if (initialMode) setMode(initialMode);
      if (initialRole) {
        setLoginRole(initialRole);
        setSignupRole(initialRole);
      }
    }
  }, [isOpen, initialMode, initialRole]);

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [affiliateReferralCode, setAffiliateReferralCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('citapro_referral_code') || '';
    }
    return '';
  });
  const [promoterCustomCode, setPromoterCustomCode] = useState('');

  // Affiliate specific registration fields
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(ALL_SUBCATEGORIES[0]?.id || 'clinicas_medicas');
  const [categoryLabel, setCategoryLabel] = useState(ALL_SUBCATEGORIES[0]?.label || 'Clínicas médicas');
  const [stateCode, setStateCode] = useState(MEXICAN_STATES[0]?.code || 'CDMX');
  const [city, setCity] = useState(MEXICAN_STATES[0]?.cities[0] || 'Cuauhtémoc');
  const [address, setAddress] = useState('');

  // Professional document accreditation fields
  const [docUploadChoice, setDocUploadChoice] = useState<'upload_one' | 'upload_all_demo' | 'skip_later'>('upload_one');
  const [docType, setDocType] = useState<
    'cedula' | 'titulo' | 'licencia_sanitaria' | 'certificado' | 'rfc_sat'
  >('cedula');
  const [docNumber, setDocNumber] = useState('12948102');
  const [docIssuedBy, setDocIssuedBy] = useState('Secretaría de Educación Pública (DGP)');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    dataUrl?: string;
  } | null>({
    name: 'cedula_profesional_titular.pdf',
    size: '1.4 MB'
  });

  // Recovery state
  const [recoverEmail, setRecoverEmail] = useState('');
  const [recoverStep, setRecoverStep] = useState<'request' | 'confirm'>('request');
  const [recoverCode, setRecoverCode] = useState('');
  const [generatedDemoCode, setGeneratedDemoCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoverySuccessMsg, setRecoverySuccessMsg] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  // Selected state cities
  const currentStateObj = MEXICAN_STATES.find((s) => s.code === stateCode) || MEXICAN_STATES[0];

  // Document labels
  const docTypeLabels: Record<string, string> = {
    cedula: 'Cédula Profesional Federal (SEP / DGP)',
    titulo: 'Título Universitario de Licenciatura / Posgrado',
    licencia_sanitaria: 'Licencia Sanitaria COFEPRIS',
    certificado: 'Certificado de Consejo de Especialidad',
    rfc_sat: 'Constancia de Situación Fiscal con Actividad Profesional (SAT)'
  };

  // Handle Document File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const reader = new FileReader();

    reader.onload = () => {
      setUploadedFile({
        name: file.name,
        size: `${sizeInMb} MB`,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const user = await authService.loginWithEmail(email, password, loginRole);
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Sign Up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      if (signupRole === 'client') {
        const user = await authService.registerClient({
          email,
          password,
          displayName: displayName || email.split('@')[0],
          phone: phone || '+52 55 0000 0000'
        });
        setSuccessMessage('¡Cuenta de usuario creada con éxito! Sesión iniciada.');
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 1200);
      } else if (signupRole === 'promoter') {
        const user = await authService.registerPromoterAccount({
          email,
          password,
          displayName: displayName || email.split('@')[0],
          phone: phone || '+52 55 0000 0000',
          customReferralCode: promoterCustomCode.trim() ? promoterCustomCode.trim().toUpperCase() : undefined
        });
        setSuccessMessage('¡Cuenta de Afiliado Promotor creada! Accediendo a tu panel de comisiones del 40%...');
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 1200);
      } else {
        // Paso 1 para Afiliados Profesionales: Registrar y Crear su Cuenta
        const user = await authService.registerAffiliateAccount({
          email,
          password,
          displayName: displayName || (email ? email.split('@')[0] : 'Afiliado Profesional'),
          phone: phone || '+52 55 0000 0000',
          referralCode: affiliateReferralCode.trim() || undefined
        });
        setSuccessMessage('¡Cuenta de afiliado creada con éxito! Abriendo formulario para configurar tu negocio...');
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al completar el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login / Signup
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const roleToUse = mode === 'signup' ? signupRole : loginRole;
      const user = await authService.loginWithGoogle(roleToUse);
      if (mode === 'signup' && roleToUse === 'affiliate') {
        setSuccessMessage('¡Cuenta de Google conectada con éxito! Abriendo formulario de tu negocio...');
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 900);
      } else if (mode === 'signup' && roleToUse === 'promoter') {
        setSuccessMessage('¡Cuenta de Google conectada como Promotor! Abriendo tu panel de comisiones del 40%...');
        setTimeout(() => {
          onAuthSuccess(user);
          onClose();
        }, 900);
      } else {
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al autenticar con Google.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Logins
  const handleQuickDemo = async (type: 'client' | 'affiliate_approved' | 'affiliate_pending' | 'promoter') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      if (type === 'client') {
        const clientUser: UserProfile = {
          uid: 'user-demo-carlos',
          email: 'carlos.mendoza@gmail.com',
          displayName: 'Carlos Mendoza Echeverría',
          phone: '+52 55 4910 2938',
          role: 'client',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('citapro_auth_user_cache_v1', JSON.stringify(clientUser));
        onAuthSuccess(clientUser);
        onClose();
      } else if (type === 'affiliate_approved') {
        const approvedAff: UserProfile = {
          uid: 'aff-owner-sofia',
          email: 'bienestar@citapro.mx',
          displayName: 'Dra. Sofía Alarcón',
          phone: '+52 55 4910 2938',
          role: 'affiliate',
          affiliateId: 'aff-psico-bienestar',
          approvalStatus: 'approved',
          professionalDocument: {
            id: 'doc-approved-demo',
            type: 'cedula',
            typeLabel: 'Cédula Profesional Federal',
            documentNumber: '11849204',
            fileName: 'cedula_profesional_unam.pdf',
            fileSize: '2.1 MB',
            issuedBy: 'Secretaría de Educación Pública (DGP)',
            uploadedAt: '2026-01-10T12:00:00.000Z',
            verificationNotes: 'Cédula validada y autorizada ante el Registro Nacional de Profesionistas.'
          },
          createdAt: '2026-01-10T12:00:00.000Z',
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('citapro_auth_user_cache_v1', JSON.stringify(approvedAff));
        onAuthSuccess(approvedAff);
        onClose();
      } else if (type === 'promoter') {
        const demoPromoter: UserProfile = {
          uid: 'user-promoter-mario',
          email: 'mario.embajador@citapro.mx',
          displayName: 'Lic. Mario Valenzuela (Embajador)',
          phone: '+52 55 7712 9043',
          role: 'promoter',
          promoterCode: 'MARIO40',
          createdAt: '2026-01-15T10:00:00.000Z',
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('citapro_auth_user_cache_v1', JSON.stringify(demoPromoter));
        onAuthSuccess(demoPromoter);
        onClose();
      } else {
        // Pending approval affiliate
        const pendingAff: UserProfile = {
          uid: 'aff-owner-pending-1',
          email: 'dr.mendez@consultorio.mx',
          displayName: 'Dr. Alejandro Méndez Ruiz',
          phone: '+52 55 8812 3456',
          role: 'affiliate',
          affiliateId: 'aff-dental-roma',
          approvalStatus: 'pending_approval',
          professionalDocument: {
            id: 'doc-pending-demo',
            type: 'cedula',
            typeLabel: 'Cédula Profesional de Odontología / Cirujano Dentista',
            documentNumber: '9482103',
            fileName: 'cedula_odontologia_uam.pdf',
            fileSize: '1.8 MB',
            issuedBy: 'SEP DGP / Universidad Autónoma Metropolitana',
            uploadedAt: new Date().toISOString(),
            verificationNotes: 'En cotejo de cédula ante Dirección General de Profesiones (24-48 hrs hábiles).'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('citapro_auth_user_cache_v1', JSON.stringify(pendingAff));
        onAuthSuccess(pendingAff);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error en inicio demo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Recovery Flow
  const handleSendRecoveryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await authService.sendPasswordRecoveryEmail(recoverEmail);
      setGeneratedDemoCode(result.demoResetCode);
      setRecoverCode(result.demoResetCode); // Pre-fill code for effortless testing
      setRecoverStep('confirm');
      setSuccessMessage(result.message);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error enviando solicitud de recuperación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.confirmPasswordResetWithCode(recoverEmail, recoverCode, newPassword);
      setRecoverySuccessMsg('¡Contraseña actualizada exitosamente! Ahora puedes iniciar sesión con tu nueva clave.');
      setTimeout(() => {
        setRecoverySuccessMsg('');
        setMode('login');
        setEmail(recoverEmail);
        setPassword(newPassword);
        setRecoverStep('request');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between relative">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              {mode === 'recover' ? (
                <KeyRound className="w-5 h-5" />
              ) : mode === 'signup' ? (
                <FileCheck className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white">
                {mode === 'login' && 'Iniciar Sesión'}
                {mode === 'signup' && (signupRole === 'affiliate' ? 'Registro de Afiliado Profesional' : 'Crear Cuenta de Usuario')}
                {mode === 'recover' && 'Recuperar Contraseña por Correo'}
              </h3>
              <p className="text-xs text-slate-300">
                {mode === 'login' && 'Accede a tus citas, calendario y administración'}
                {mode === 'signup' && (signupRole === 'affiliate' ? 'Sube tu documento y acredita tu profesión' : 'Gestiona tus citas y pagos seguros')}
                {mode === 'recover' && 'Te enviaremos un enlace y código de seguridad a tu email'}
              </p>
            </div>
          </div>

          <button
            id="auth-modal-close-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Login / Sign Up) */}
        {mode !== 'recover' && (
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
              }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registrarse (Crear Cuenta)
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: INICIAR SESIÓN (LOGIN) */}
          {/* ========================================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              {/* Paso 1: Selección Obligatoria de Rol para Iniciar Sesión */}
              <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span>Determina cómo vas a iniciar sesión:</span>
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                      loginRole === 'affiliate'
                        ? 'bg-slate-900 text-white'
                        : loginRole === 'promoter'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {loginRole === 'affiliate'
                      ? '💼 Afiliado Profesional'
                      : loginRole === 'promoter'
                      ? '💰 Embajador Promotor (40%)'
                      : '👤 Usuario Final'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {/* Opción 1: Usuario Final / Cliente */}
                  <button
                    id="login-role-client-choice"
                    type="button"
                    onClick={() => setLoginRole('client')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                      loginRole === 'client'
                        ? 'border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          loginRole === 'client'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                      </div>
                      {loginRole === 'client' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-slate-900">Usuario Final</p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Agendar y pagar citas.
                      </p>
                    </div>
                  </button>

                  {/* Opción 2: Afiliado Profesional */}
                  <button
                    id="login-role-affiliate-choice"
                    type="button"
                    onClick={() => setLoginRole('affiliate')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                      loginRole === 'affiliate'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-xs ring-1 ring-slate-800'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          loginRole === 'affiliate'
                            ? 'bg-white text-slate-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      {loginRole === 'affiliate' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-extrabold text-xs ${
                          loginRole === 'affiliate' ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Afiliado Negocio
                      </p>
                      <p
                        className={`text-[10px] leading-tight mt-0.5 ${
                          loginRole === 'affiliate' ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        Gestionar consultorio y citas.
                      </p>
                    </div>
                  </button>

                  {/* Opción 3: Afiliado Promotor (Embajador 40%) */}
                  <button
                    id="login-role-promoter-choice"
                    type="button"
                    onClick={() => setLoginRole('promoter')}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                      loginRole === 'promoter'
                        ? 'border-amber-500 bg-amber-950 text-white shadow-xs ring-1 ring-amber-400'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          loginRole === 'promoter'
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </div>
                      {loginRole === 'promoter' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <span className="text-[9px] font-black bg-amber-200 text-amber-900 px-1 rounded">40%</span>
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-extrabold text-xs ${
                          loginRole === 'promoter' ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Afiliado Promotor
                      </p>
                      <p
                        className={`text-[10px] leading-tight mt-0.5 ${
                          loginRole === 'promoter' ? 'text-amber-200' : 'text-slate-500'
                        }`}
                      >
                        Comisiones 40% mensual.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Paso 2: Métodos de Autenticación */}
              <div className="space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span>
                    Accede como{' '}
                    <strong className="text-slate-900">
                      {loginRole === 'affiliate'
                        ? 'Afiliado Profesional'
                        : loginRole === 'promoter'
                        ? 'Afiliado Promotor (40%)'
                        : 'Usuario Final'}
                    </strong>
                    :
                  </span>
                </span>

                {/* Google One-Click Button */}
                <button
                  id="login-with-google-btn"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-2xl flex items-center justify-center space-x-2.5 transition-all shadow-2xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.41l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.15c.95-2.84 3.6-4.94 6.72-4.94z"
                    />
                  </svg>
                  <span className="truncate">
                    {loginRole === 'affiliate'
                      ? 'Continuar con Google (Afiliado Negocio)'
                      : loginRole === 'promoter'
                      ? 'Continuar con Google (Promotor 40%)'
                      : 'Continuar con Google (Usuario Final)'}
                  </span>
                </button>

                <div className="flex items-center my-3">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="px-3 text-[11px] text-slate-500 font-semibold uppercase">
                    O con correo y contraseña
                  </span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Correo Electrónico:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={
                        loginRole === 'affiliate'
                          ? 'doctor@consultorio.com'
                          : 'ejemplo@correo.com'
                      }
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">Contraseña:</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('recover');
                        setRecoverEmail(email);
                        setErrorMessage('');
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px]"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-600 absolute left-3.5 top-3" />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Login Button */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    loginRole === 'affiliate'
                      ? 'bg-slate-900 hover:bg-slate-800'
                      : loginRole === 'promoter'
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <span>
                    {isLoading
                      ? 'Comprobando credenciales...'
                      : loginRole === 'affiliate'
                      ? 'Iniciar Sesión como Afiliado Negocio'
                      : loginRole === 'promoter'
                      ? 'Iniciar Sesión como Promotor (40%)'
                      : 'Iniciar Sesión como Usuario Final'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Demo Accounts Quick Access */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block text-center uppercase tracking-wider">
                  Acceso Rápido Demo (
                  {loginRole === 'affiliate'
                    ? 'Modo Afiliado Negocio'
                    : loginRole === 'promoter'
                    ? 'Modo Promotor Embajador (40%)'
                    : 'Modo Usuario'}
                  ):
                </span>
                {loginRole === 'affiliate' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('affiliate_approved')}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-bold text-center"
                    >
                      ✅ Afiliado Aprobado (Dra. Sofía)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('affiliate_pending')}
                      className="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-bold text-center"
                    >
                      ⏳ Afiliado en Revisión (Dr. Alejandro)
                    </button>
                  </div>
                ) : loginRole === 'promoter' ? (
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('promoter')}
                      className="p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-[11px] text-amber-950 font-black text-center flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 text-amber-600" />
                      <span>Ingresar con Cuenta Demo de Embajador Promotor (Mario Valenzuela - 40%)</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('client')}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-800 font-bold text-center flex items-center justify-center space-x-2"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Ingresar con Cuenta Demo de Usuario (Carlos Mendoza)</span>
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: CREAR CUENTA (SIGN UP) */}
          {/* ========================================================================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4 text-xs">
              {/* Role Type Selector Cards */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold text-[11px] uppercase tracking-wider">
                  Tipo de Cuenta:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Card 1: Cliente */}
                  <button
                    type="button"
                    onClick={() => setSignupRole('client')}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      signupRole === 'client'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <User className={`w-4 h-4 ${signupRole === 'client' ? 'text-emerald-600' : 'text-slate-500'}`} />
                      {signupRole === 'client' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <div className="font-extrabold text-slate-900 text-xs">Soy Usuario / Cliente</div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                      Para reservar citas y pagar servicios.
                    </p>
                  </button>

                  {/* Card 2: Afiliado Negocio */}
                  <button
                    type="button"
                    onClick={() => setSignupRole('affiliate')}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      signupRole === 'affiliate'
                        ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Building2 className={`w-4 h-4 ${signupRole === 'affiliate' ? 'text-emerald-400' : 'text-slate-500'}`} />
                      {signupRole === 'affiliate' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className={`font-extrabold text-xs ${signupRole === 'affiliate' ? 'text-white' : 'text-slate-900'}`}>
                      Afiliado Negocio
                    </div>
                    <p className={`text-[10px] mt-0.5 leading-tight ${signupRole === 'affiliate' ? 'text-slate-300' : 'text-slate-500'}`}>
                      Ofrece servicios, cobra anticipado y gestiona citas.
                    </p>
                  </button>

                  {/* Card 3: Afiliado Promotor (Embajador 40%) */}
                  <button
                    type="button"
                    onClick={() => setSignupRole('promoter')}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      signupRole === 'promoter'
                        ? 'border-amber-500 bg-amber-950 text-white shadow-md ring-2 ring-amber-400/30'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <DollarSign className={`w-4 h-4 ${signupRole === 'promoter' ? 'text-amber-400' : 'text-amber-600'}`} />
                      {signupRole === 'promoter' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <span className="text-[9px] font-black bg-amber-200 text-amber-900 px-1 py-0.2 rounded">40%</span>
                      )}
                    </div>
                    <div className={`font-extrabold text-xs ${signupRole === 'promoter' ? 'text-white' : 'text-slate-900'}`}>
                      Afiliado Promotor
                    </div>
                    <p className={`text-[10px] mt-0.5 leading-tight ${signupRole === 'promoter' ? 'text-amber-200' : 'text-slate-500'}`}>
                      Promociona la web y gana el 40% mensual de suscripción.
                    </p>
                  </button>
                </div>
              </div>

              {/* Step info banner for affiliates */}
              {signupRole === 'affiliate' && (
                <div className="bg-emerald-50 border border-emerald-200/90 p-3.5 rounded-2xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px] font-black shrink-0">
                      1
                    </span>
                    <span>Paso 1: Registra y Crea tu Cuenta</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed pl-7">
                    Elige registrarte con tu <strong>Cuenta de Google</strong> o con <strong>correo y contraseña</strong>. Una vez creada tu cuenta, completarás el formulario con los datos de tu negocio, logotipo, ubicación y catálogo de servicios.
                  </p>
                </div>
              )}

              {/* Step info banner for promoters */}
              {signupRole === 'promoter' && (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center space-x-2 text-amber-950 font-bold text-xs">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 inline-flex items-center justify-center text-[10px] font-black shrink-0">
                      ★
                    </span>
                    <span>Programa de Afiliados Promotores: Gana el 40% Mensual Recurrente</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-relaxed pl-7">
                    Promociona la web y consigue que nuevos negocios y consultorios se afilien. Recibirás el <strong>40% de la suscripción mensual</strong> de todos los afiliados que se registren con tu código de usuario <strong>mientras sigan pagando su suscripción activa</strong>.
                  </p>
                </div>
              )}

              {/* Google Registration Button */}
              <button
                id="signup-google-btn"
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-2xl flex items-center justify-center space-x-2.5 transition-all shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.41l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.59l4.04 3.15c.95-2.84 3.6-4.94 6.72-4.94z"
                  />
                </svg>
                <span className="truncate">
                  {signupRole === 'affiliate'
                    ? 'Registrarse con Cuenta de Google (Afiliado Negocio)'
                    : signupRole === 'promoter'
                    ? 'Registrarse con Cuenta de Google (Promotor 40%)'
                    : 'Registrarse con Cuenta de Google'}
                </span>
              </button>

              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-slate-200" />
                <span className="px-3 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  O con correo electrónico y contraseña
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {signupRole === 'affiliate'
                      ? 'Nombre del Profesional / Titular:'
                      : signupRole === 'promoter'
                      ? 'Nombre Completo del Promotor / Embajador:'
                      : 'Nombre Completo:'}
                  </label>
                  <input
                    id="signup-displayname-input"
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={
                      signupRole === 'affiliate'
                        ? 'Ej. Dr. Mario Estrada García'
                        : signupRole === 'promoter'
                        ? 'Ej. Lic. Mario Valenzuela'
                        : 'Ej. Carlos Mendoza'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Teléfono Móvil (WhatsApp +52):</label>
                  <input
                    id="signup-phone-input"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Correo Electrónico:</label>
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      signupRole === 'affiliate'
                        ? 'doctor@consultorio.mx'
                        : signupRole === 'promoter'
                        ? 'promotor@embajadores.mx'
                        : 'ejemplo@correo.com'
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Contraseña:</label>
                  <div className="relative">
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full p-2.5 pr-8 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional Referral Code for Affiliate Business Signup */}
              {signupRole === 'affiliate' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1">
                  <label className="block text-slate-800 font-bold text-[11px] flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      <span>¿Tienes un código de promotor o embajador? (Opcional)</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-normal">Opcional</span>
                  </label>
                  <input
                    type="text"
                    value={affiliateReferralCode}
                    onChange={(e) => setAffiliateReferralCode(e.target.value.toUpperCase())}
                    placeholder="Ej. MARIO40 o PROMO-XXXX"
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-800 placeholder-slate-400 uppercase"
                  />
                  <p className="text-[10px] text-slate-500">
                    Si un embajador te recomendó Citas Más, ingresa su código para vincularlo a tu registro.
                  </p>
                </div>
              )}

              {/* Custom Referral Code for Promoter Signup */}
              {signupRole === 'promoter' && (
                <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl space-y-1">
                  <label className="block text-slate-800 font-bold text-[11px] flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Código de Promotor Personalizado (Opcional):</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-normal">Opcional</span>
                  </label>
                  <input
                    type="text"
                    value={promoterCustomCode}
                    onChange={(e) => setPromoterCustomCode(e.target.value.toUpperCase())}
                    placeholder="Ej. PROMO-MARIO40 o TUAPELLIDO40"
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-800 placeholder-slate-400 uppercase"
                  />
                  <p className="text-[10px] text-slate-600">
                    Este será el código que compartirás con los afiliados para recibir el 40% mensual de su suscripción. Si lo dejas vacío, se generará uno automáticamente con tu nombre.
                  </p>
                </div>
              )}

              {/* Submit Sign Up Button */}
              <button
                id="signup-submit-btn"
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                  signupRole === 'affiliate'
                    ? 'bg-slate-900 hover:bg-slate-800'
                    : signupRole === 'promoter'
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <span>
                  {isLoading
                    ? 'Creando cuenta...'
                    : signupRole === 'affiliate'
                    ? 'Crear Cuenta y Llenar Datos de Mi Negocio'
                    : signupRole === 'promoter'
                    ? 'Crear Cuenta de Promotor y Activar Enlace (40%)'
                    : 'Crear Mi Cuenta de Usuario'}
                </span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </button>

              {signupRole === 'affiliate' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[11px] text-slate-600 leading-snug">
                    <strong className="text-slate-800">Siguiente paso:</strong> Al crear tu cuenta ingresarás de inmediato al formulario de configuración para cargar el nombre de tu empresa, historia, logotipo, fotos, horarios y catálogo de servicios con precios.
                  </p>
                </div>
              )}

              {signupRole === 'promoter' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <p className="text-[11px] text-slate-600 leading-snug">
                    <strong className="text-slate-800">Acceso inmediato:</strong> Al registrarte tendrás acceso a tu panel de control con tu enlace de recomendación, código QR, métricas de comisiones recurrentes del 40% y solicitudes de retiro vía SPEI.
                  </p>
                </div>
              )}
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RECUPERACIÓN DE CONTRASEÑA POR CORREO ELECTRÓNICO */}
          {/* ========================================================================= */}
          {mode === 'recover' && (
            <div className="space-y-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-slate-500 hover:text-slate-800 flex items-center space-x-1 font-bold text-[11px]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Volver a Iniciar Sesión</span>
              </button>

              {recoverStep === 'request' ? (
                <form onSubmit={handleSendRecoveryEmail} className="space-y-4">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-800 block text-xs">Restablece tu acceso</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Ingresa el correo electrónico asociado a tu cuenta de CitaPro MX. Te enviaremos un código de
                      confirmación y enlace para que elijas una nueva contraseña.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Correo Electrónico:</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={recoverEmail}
                        onChange={(e) => setRecoverEmail(e.target.value)}
                        placeholder="tu-correo@dominio.com"
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{isLoading ? 'Enviando correo...' : 'Enviar Código y Enlace de Recuperación'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleConfirmPasswordReset} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-1.5">
                    <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Código de Seguridad Generado</span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Hemos enviado el código a <strong>{recoverEmail}</strong>. Para pruebas inmediatas, tu código
                      generado es:
                    </p>
                    <div className="p-2 bg-white rounded-xl border border-emerald-300 text-center font-mono font-black text-base text-emerald-700 tracking-widest">
                      {generatedDemoCode || '849201'}
                    </div>
                  </div>

                  {recoverySuccessMsg && (
                    <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-300 font-semibold text-xs">
                      {recoverySuccessMsg}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Código de 6 dígitos:</label>
                    <input
                      type="text"
                      required
                      value={recoverCode}
                      onChange={(e) => setRecoverCode(e.target.value)}
                      placeholder="123456"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-center font-bold text-slate-900 tracking-widest text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Nueva Contraseña:</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Confirmar Nueva Contraseña:</label>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    <span>{isLoading ? 'Actualizando contraseña...' : 'Restablecer y Guardar Contraseña'}</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
