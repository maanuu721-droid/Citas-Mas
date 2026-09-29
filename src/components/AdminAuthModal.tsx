import React, { useState } from 'react';
import { Lock, Shield, AlertCircle, CheckCircle2, X, Eye, EyeOff, Mail, KeyRound } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminEmail: string) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'password' | 'google'>('password');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [googleEmail, setGoogleEmail] = useState('maanuu721@gmail.com');
  const [googleError, setGoogleError] = useState('');
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(false);

  if (!isOpen) return null;

  // Master authorized credentials
  const MASTER_PASSWORD = '072189';
  const AUTHORIZED_ADMIN_EMAIL = 'maanuu721@gmail.com';

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password.trim() === MASTER_PASSWORD) {
      setStep('google');
    } else {
      setPasswordError('Contraseña incorrecta. Acceso restringido al personal directivo.');
    }
  };

  const handleGoogleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setGoogleError('');
    setIsVerifyingGoogle(true);

    setTimeout(() => {
      setIsVerifyingGoogle(false);
      const cleanEmail = googleEmail.trim().toLowerCase();

      if (cleanEmail === AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        // Successful verification!
        onSuccess(AUTHORIZED_ADMIN_EMAIL);
      } else {
        setGoogleError(
          `Acceso denegado: La cuenta "${googleEmail}" no tiene permisos de Administrador General. Únicamente la cuenta ${AUTHORIZED_ADMIN_EMAIL} está autorizada.`
        );
      }
    }, 600);
  };

  const handleResetAndClose = () => {
    setPassword('');
    setPasswordError('');
    setGoogleError('');
    setStep('password');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative text-slate-100">
        {/* Subtle close button */}
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1.5 rounded-full hover:bg-slate-800 transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: PASSWORD VERIFICATION */}
        {step === 'password' && (
          <div className="p-7 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Acceso a Administración General
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Ingresa la clave de seguridad maestra para iniciar la autenticación del sistema.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                  Contraseña de Acceso
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Introduce contraseña..."
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 text-white rounded-xl py-3 pl-10 pr-10 text-sm tracking-widest font-mono focus:outline-hidden transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Validar Contraseña</span>
              </button>
            </form>

            <div className="text-center pt-2">
              <span className="text-[10px] text-slate-600 font-mono">
                CitaPro MX • Área Restringida
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: GOOGLE ACCOUNT LOGIN SPECIFIC FOR maanuu721@gmail.com */}
        {step === 'google' && (
          <div className="p-7 space-y-6">
            <div className="text-center space-y-2">
              {/* Google Brand Symbol */}
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-md">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Iniciar Sesión con Google
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Por motivos de seguridad, únicamente la cuenta registrada tiene autorización para ingresar al Panel General.
              </p>
            </div>

            {/* Registered Account Prompt Card */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Cuenta Autorizada:</span>
                <span className="bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-700/60 text-[11px] flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Único Propietario</span>
                </span>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-900 rounded-xl border border-slate-700/80">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow">
                  M
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white block truncate">
                    {AUTHORIZED_ADMIN_EMAIL}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    Administrador General CitaPro MX
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleGoogleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">
                  Confirmar Correo de Google
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => {
                      setGoogleEmail(e.target.value);
                      if (googleError) setGoogleError('');
                    }}
                    placeholder="tucorreo@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-400 text-white rounded-xl py-3 pl-10 pr-3 text-xs font-medium focus:outline-hidden transition-colors"
                  />
                </div>
              </div>

              {googleError && (
                <div className="p-3 bg-rose-950/70 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-start space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{googleError}</span>
                </div>
              )}

              {/* Google Button */}
              <button
                type="submit"
                disabled={isVerifyingGoogle}
                className="w-full bg-white hover:bg-slate-100 text-slate-800 font-bold py-3.5 rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2 border border-slate-300 disabled:opacity-75"
              >
                {isVerifyingGoogle ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
                    <span>Verificando credenciales de Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Continuar como maanuu721@gmail.com</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
              <button
                type="button"
                onClick={() => setStep('password')}
                className="hover:text-slate-300 underline"
              >
                ← Volver a contraseña
              </button>
              <span className="flex items-center space-x-1 text-slate-500">
                <Shield className="w-3 h-3 text-emerald-500" />
                <span>Acceso 100% Cifrado</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
