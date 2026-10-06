import React, { useState, useRef } from 'react';
import { UserProfile, Affiliate, ServiceItem } from '../types.ts';
import { DataService } from '../services/dataService.ts';
import { AuthService } from '../services/authService.ts';
import { MEXICAN_STATES, SERVICE_CATEGORIES, ALL_SUBCATEGORIES, resolveCategory } from '../data/mexicoData.ts';
import { CategorySelector } from './CategorySelector.tsx';
import { optimizeAndConvertImage } from '../utils/imageUpload.ts';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  MessageSquare,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  MapPin,
  Phone,
  HelpCircle,
  Plus,
  Trash2,
  FileText,
  Lock,
  Layers,
  Star,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  X,
  Globe
} from 'lucide-react';
import { HISPANIC_COUNTRIES, CountryInfo } from '../data/countriesData.ts';

interface Props {
  isOpen: boolean;
  user: UserProfile;
  affiliate?: Affiliate | null;
  onComplete: (affiliate: Affiliate, updatedUser: UserProfile) => void;
  onClose?: () => void;
}

export const AffiliateOnboardingModal: React.FC<Props> = ({
  isOpen,
  user,
  affiliate,
  onComplete,
  onClose
}) => {
  // Step navigation: 1: Bienvenida & Tour, 2: Datos de Empresa e Historia, 3: Ubicación & WhatsApp, 4: Logo & Fotos, 5: Servicios y Precios, 6: Resumen y Activación
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [tourFeatureIndex, setTourFeatureIndex] = useState<number>(0);

  // New user credentials (if starting without prior login)
  const [accountEmail, setAccountEmail] = useState(user.email || '');
  const [accountPassword, setAccountPassword] = useState('');

  // Form states
  const [businessName, setBusinessName] = useState(
    user.displayName ? `${user.displayName}` : 'Mi Negocio Profesional'
  );
  const [specialistName, setSpecialistName] = useState(
    user.displayName || 'Especialista Titular'
  );
  const [category, setCategory] = useState(ALL_SUBCATEGORIES[0]?.id || 'clinicas_medicas');
  const [categoryLabel, setCategoryLabel] = useState(ALL_SUBCATEGORIES[0]?.label || 'Clínicas médicas');
  const [story, setStory] = useState(
    'Fundada con la vocación de brindar atención profesional de la más alta calidad, con un enfoque ético, personalizado y enfocado en la satisfacción y bienestar de cada uno de nuestros clientes.'
  );

  // Location & Contact (Países de Habla Hispana & Dirección Física Exacta)
  const [countryCode, setCountryCode] = useState('CO');
  const [customCountryName, setCustomCountryName] = useState('');
  const [stateName, setStateName] = useState('Antioquia');
  const [cityName, setCityName] = useState('Medellín - El Poblado');
  const [streetAddress, setStreetAddress] = useState('Carrera 43A # 1-50');
  const [neighborhood, setNeighborhood] = useState('El Poblado');
  const [postalCode, setPostalCode] = useState('050021');
  const [addressReferences, setAddressReferences] = useState('Edificio San Fernando Plaza, Torre 2, Consultorio 604');
  const [phone, setPhone] = useState(user.phone || '310 456 7890');

  // Media
  const [logo, setLogo] = useState(
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80'
  );
  const [gallery, setGallery] = useState<string[]>([
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
  ]);

  // Gallery multi-upload state
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Services
  const [services, setServices] = useState<ServiceItem[]>([
    {
      id: `srv-${Date.now()}-1`,
      name: 'Consulta General Inicial',
      duration: 50,
      price: 600,
      description: 'Evaluación integral diagnóstica, revisión de antecedentes y propuesta de plan de atención.'
    },
    {
      id: `srv-${Date.now()}-2`,
      name: 'Sesión de Seguimiento Especializado',
      duration: 45,
      price: 500,
      description: 'Atención personalizada, seguimiento puntual de objetivos y recomendaciones prácticas.'
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepError, setStepError] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      if (affiliate) {
        if (affiliate.businessName) setBusinessName(affiliate.businessName);
        if (affiliate.name) setSpecialistName(affiliate.name);
        if (affiliate.category) setCategory(affiliate.category);
        if (affiliate.categoryLabel) setCategoryLabel(affiliate.categoryLabel);
        if (affiliate.story) setStory(affiliate.story);
        if (affiliate.countryCode) setCountryCode(affiliate.countryCode);
        if (affiliate.state) setStateName(affiliate.state);
        if (affiliate.city) setCityName(affiliate.city);
        if (affiliate.address) setStreetAddress(affiliate.address);
        if (affiliate.phone) setPhone(affiliate.phone);
        if (affiliate.logo) setLogo(affiliate.logo);
        if (affiliate.gallery && affiliate.gallery.length > 0) setGallery(affiliate.gallery);
        if (affiliate.services && affiliate.services.length > 0) setServices(affiliate.services);
        if (affiliate.email) setAccountEmail(affiliate.email);
      } else if (user) {
        if (user.email) setAccountEmail(user.email);
        if (user.displayName) {
          setSpecialistName(user.displayName);
          if (businessName === 'Mi Negocio Profesional' || !businessName) {
            setBusinessName(user.displayName);
          }
        }
        if (user.phone) setPhone(user.phone);
      }
    }
  }, [isOpen, user, affiliate]);

  if (!isOpen) return null;

  // Selected country obj
  const selectedCountryObj: CountryInfo =
    HISPANIC_COUNTRIES.find((c) => c.code === countryCode) || HISPANIC_COUNTRIES[0];
  const effectiveCountryName = countryCode === 'OTRO' ? (customCountryName.trim() || 'Otro País') : selectedCountryObj.name;
  const subdivisionLabel = countryCode === 'OTRO' ? 'Estado / Provincia / Departamento' : selectedCountryObj.subdivisionLabel;

  const fullFormattedAddress = React.useMemo(() => {
    const parts = [
      streetAddress.trim(),
      neighborhood.trim() ? `Barrio/Col. ${neighborhood.trim()}` : '',
      postalCode.trim() ? `CP ${postalCode.trim()}` : '',
      cityName.trim(),
      stateName.trim(),
      effectiveCountryName
    ].filter(Boolean);
    return parts.join(', ');
  }, [streetAddress, neighborhood, postalCode, cityName, stateName, effectiveCountryName]);

  const selectedCatObj = SERVICE_CATEGORIES.find((c) => c.id === category) || SERVICE_CATEGORIES[0];

  // Tour features
  const tourFeatures = [
    {
      title: '1. Tu Panel de Control 100% Privado',
      badge: 'Privacidad Garantizada',
      description:
        'Solo tú tienes acceso a tus datos, ingresos generados, configuración de agenda y expedientes de clientes. Todo está blindado bajo tu cuenta exclusiva.',
      icon: Lock,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      details: [
        'Aislamiento total de datos: nadie más puede ver tu información comercial',
        'Acceso exclusivo a tu métrica de ingresos y citas agendadas',
        'Configuraciones y horarios personalizables en cualquier momento'
      ]
    },
    {
      title: '2. Gestión Inteligente de Citas y Horarios',
      badge: 'Cero Faltas',
      description:
        'Configura tus días de atención, horarios de apertura, descansos y duración por cita. El sistema bloquea automáticamente los horarios ya ocupados.',
      icon: Calendar,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      details: [
        'Calendario interactivo con vista mensual, semanal y diaria',
        'Bloqueo de días festivos o emergencias con un solo clic',
        'Duración de citas personalizable (30, 45, 60 o 90 minutos)'
      ]
    },
    {
      title: '3. Mensajería Automática de WhatsApp',
      badge: 'Confirmación al Instante',
      description:
        'Tus clientes reciben su confirmación oficial por WhatsApp de forma inmediata en cuanto pagan su anticipo, reduciendo el ausentismo al mínimo.',
      icon: MessageSquare,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      details: [
        'Recordatorios automáticos 24 horas y 2 horas antes de la cita',
        'Ubicación GPS en Google Maps enviada directamente al celular del cliente',
        'Simulador de envíos en tiempo real integrado en tu panel'
      ]
    },
    {
      title: '4. Pagos Anticipados Garantizados',
      badge: 'Protección Financiera',
      description:
        'Olvídate de las personas que reservan y no asisten. Todas las citas en Citas Más requieren pago de anticipo o liquidación completa previa.',
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      details: [
        'Depósitos directos y recepción por tarjetas bancarias o SPEI',
        'Reagendamiento gratuito permitido únicamente con más de 24 hrs de aviso',
        'Cobro de comisión justa o planes fijos sin letras chiquitas'
      ]
    },
    {
      title: '5. Tu Propia Landing Page Oficial Pública',
      badge: 'Tu Marca en Internet',
      description:
        'Obtienes tu enlace personalizado (ej. citapro.mx/tu-negocio) con tu logotipo, historia, fotos de servicios, ubicación en mapa y botón de reserva.',
      icon: ExternalLink,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      details: [
        'Lista para compartir en tu biografía de Instagram, WhatsApp Business o Google Maps',
        'Diseño moderno optimizado para celulares y computadoras',
        'Reseñas verificadas de clientes que realmente asistieron'
      ]
    }
  ];

  // Handlers for adding/removing services
  const handleAddService = () => {
    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}-${services.length + 1}`,
      name: 'Nuevo Servicio Profesional',
      duration: 45,
      price: 500,
      description: 'Descripción detallada de la atención y beneficios incluidos.'
    };
    setServices([...services, newSrv]);
  };

  const handleUpdateService = (index: number, field: keyof ServiceItem, value: any) => {
    const copy = [...services];
    copy[index] = { ...copy[index], [field]: value };
    setServices(copy);
  };

  const handleRemoveService = (index: number) => {
    if (services.length <= 1) {
      setStepError('Debes mantener al menos 1 servicio activo para tus clientes.');
      return;
    }
    setStepError('');
    setServices(services.filter((_, idx) => idx !== index));
  };

  // Optimized Logo Upload
  const handleUploadLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimized = await optimizeAndConvertImage(file, 400, 400, 0.85);
      setLogo(optimized);
    } catch (err: any) {
      console.warn('Fallback reading logo:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setLogo(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      e.target.value = '';
    }
  };

  // Optimized Multiple Gallery Photos Upload
  const handleUploadGalleryFiles = async (filesToProcess: FileList | File[]) => {
    const fileArray = Array.from(filesToProcess).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      setPhotoError('Por favor selecciona archivos de imagen válidos (JPG, PNG, WebP).');
      return;
    }

    setPhotoError('');
    setIsProcessingPhotos(true);

    try {
      const convertedList: string[] = [];
      for (const file of fileArray) {
        // Optimize each image to lightweight dimensions & compression for fast saving
        const optimized = await optimizeAndConvertImage(file, 900, 700, 0.80);
        convertedList.push(optimized);
      }
      // Add all processed photos at once
      setGallery((prev) => [...prev, ...convertedList].slice(0, 16));
    } catch (err: any) {
      console.error('Error optimizing gallery photos:', err);
      setPhotoError('Hubo un detalle al procesar algunas fotos. Intenta de nuevo.');
    } finally {
      setIsProcessingPhotos(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleGalleryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadGalleryFiles(e.target.files);
    }
  };

  const handleDropGallery = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhotos(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadGalleryFiles(e.dataTransfer.files);
    }
  };

  // Preset logo options
  const logoPresets = [
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80'
  ];

  // Final submit: Activar mi Cuenta y Entrar a mi Panel Privado
  const handleFinishOnboarding = async () => {
    setStepError('');

    // Ensure safe defaults so button never fails to activate
    const finalBusinessName = businessName.trim() || user.displayName || 'Mi Consultorio Profesional';
    const finalPhone = phone.trim() || user.phone || '55 1234 5678';
    const cleanPhone = finalPhone.startsWith('+') ? finalPhone : `+52 ${finalPhone}`;

    const effectiveServices = services.length > 0 ? services : [
      {
        id: `srv-${Date.now()}-1`,
        name: 'Consulta General Inicial',
        duration: 50,
        price: 600,
        description: 'Atención personalizada y propuesta de tratamiento.'
      }
    ];

    setIsSubmitting(true);

    try {
      let activeUser: UserProfile = user;

      // If user came in as guest without existing email, create their affiliate credentials now
      if (!user.email) {
        const cleanEmail = accountEmail.trim();
        if (!cleanEmail || !cleanEmail.includes('@')) {
          setStepError('Por favor ingresa un correo electrónico válido para tu cuenta de afiliado.');
          setIsSubmitting(false);
          return;
        }
        if (!accountPassword || accountPassword.length < 6) {
          setStepError('La contraseña debe contener al menos 6 caracteres.');
          setIsSubmitting(false);
          return;
        }

        try {
          const res = await AuthService.getInstance().registerAffiliate({
            email: cleanEmail,
            password: accountPassword,
            displayName: specialistName.trim() || finalBusinessName,
            phone: cleanPhone,
            businessName: finalBusinessName,
            category,
            categoryLabel: categoryLabel || resolveCategory(category)?.label || selectedCatObj?.label || 'Servicios Profesionales',
            state: stateName.trim() || 'Principal',
            city: cityName.trim() || 'Principal',
            address: streetAddress.trim() || `${cityName.trim()}, ${stateName.trim()}`
          });
          activeUser = res.user;
        } catch (regErr: any) {
          console.warn('Registration notice, applying active user profile:', regErr);
          activeUser = {
            uid: `aff-${Date.now().toString(36)}`,
            email: cleanEmail,
            displayName: specialistName.trim() || finalBusinessName,
            role: 'affiliate',
            phone: cleanPhone,
            approvalStatus: 'approved',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          AuthService.getInstance().updateLocalProfile(activeUser);
        }
      }

      const affiliateId = activeUser.affiliateId || `aff-${activeUser.uid.replace(/[^a-zA-Z0-9_-]/g, '') || Date.now().toString(36)}`;

      const newAffiliate: Affiliate = {
        id: affiliateId,
        name: (specialistName.trim() || activeUser.displayName || 'Especialista CitaPro').substring(0, 120),
        businessName: finalBusinessName.substring(0, 120),
        category,
        categoryLabel: categoryLabel || resolveCategory(category)?.label || selectedCatObj?.label || 'Servicios Profesionales',
        description: story.trim() || `Especialista en ${categoryLabel || resolveCategory(category)?.label || 'Servicios Profesionales'}. Reserva tu cita con anticipación asegurada.`,
        story: story.trim(),
        country: effectiveCountryName,
        countryCode: countryCode,
        state: stateName.trim() || 'Principal',
        city: cityName.trim() || 'Principal',
        address: fullFormattedAddress || `${cityName}, ${stateName}`,
        postalCode: postalCode.trim() || undefined,
        addressDetails: {
          street: streetAddress.trim(),
          neighborhood: neighborhood.trim(),
          city: cityName.trim(),
          state: stateName.trim(),
          country: effectiveCountryName,
          countryCode: countryCode,
          postalCode: postalCode.trim(),
          references: addressReferences.trim()
        },
        lat: selectedCountryObj?.lat || 4.7110,
        lng: selectedCountryObj?.lng || -74.0721,
        phone: `${selectedCountryObj?.dialCode || '+57'} ${phone.trim()}`.substring(0, 30),
        email: activeUser.email || accountEmail.trim(),
        logo,
        banner: gallery[0] || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
        gallery: gallery.length > 0 ? gallery : [logo],
        rating: 5.0,
        reviewCount: 0,
        completedAppointments: 0,
        plan: 'basico',
        isTurbo: false,
        isVerified: true,
        approvalStatus: 'approved',
        verificationTier: 'destacado_seguro',
        isDestacadoSeguro: true,
        hasCompletedOnboarding: true,
        ownerId: activeUser.uid,
        ownerEmail: activeUser.email || accountEmail.trim(),
        monthlyMessagesSent: 0,
        availableToday: true,
        availableTomorrow: true,
        blockedSlots: [],
        workingHours: {
          days: [1, 2, 3, 4, 5, 6],
          startTime: '09:00',
          endTime: '19:00',
          breakStart: '14:00',
          breakEnd: '15:00',
          slotDuration: 50
        },
        services: effectiveServices
      };

      // 1. Save affiliate in Firestore database & local cache
      try {
        await DataService.getInstance().saveAffiliate(newAffiliate);
      } catch (saveErr) {
        console.warn('Notice saving affiliate to Firestore (saved locally):', saveErr);
      }

      // 2. Build updated user profile with affiliate role & onboarding completed
      const updatedUser: UserProfile = {
        ...activeUser,
        role: 'affiliate',
        affiliateId: newAffiliate.id,
        approvalStatus: 'approved',
        hasCompletedOnboarding: true,
        phone: cleanPhone,
        updatedAt: new Date().toISOString()
      };

      // 3. Mark locally as completed for this user ID
      localStorage.setItem(`citapro_onboarding_done_${activeUser.uid}`, 'true');

      // 4. Update in AuthService (syncs local state and Firestore users collection)
      AuthService.getInstance().updateLocalProfile(updatedUser);

      // 5. Celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch (e) {
        // ignore
      }

      // 6. Transition directly into the private dashboard with updated data
      onComplete(newAffiliate, updatedUser);
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      // Fallback: Ensure user is never trapped, proceed to dashboard
      localStorage.setItem(`citapro_onboarding_done_${user.uid}`, 'true');
      const fallbackUser: UserProfile = {
        ...user,
        role: 'affiliate',
        hasCompletedOnboarding: true,
        updatedAt: new Date().toISOString()
      };
      AuthService.getInstance().updateLocalProfile(fallbackUser);
      onComplete(
        {
          id: `aff-${user.uid}`,
          name: specialistName.trim() || user.displayName,
          businessName: finalBusinessName,
          category,
          categoryLabel: selectedCatObj?.label || categoryLabel || 'Servicios Profesionales',
          description: story.trim() || 'Servicios profesionales con anticipo garantizado.',
          story: story.trim(),
          state: stateName || 'Principal',
          city: cityName || 'Principal',
          address: streetAddress.trim() || `${cityName}, ${stateName}`,
          lat: 19.4326,
          lng: -99.1332,
          phone: cleanPhone,
          email: user.email,
          logo,
          banner: gallery[0] || logo,
          gallery: gallery.length > 0 ? gallery : [logo],
          rating: 5.0,
          reviewCount: 0,
          completedAppointments: 0,
          plan: 'basico',
          isTurbo: false,
          isVerified: true,
          approvalStatus: 'approved',
          verificationTier: 'destacado_seguro',
          isDestacadoSeguro: true,
          hasCompletedOnboarding: true,
          ownerId: user.uid,
          ownerEmail: user.email,
          monthlyMessagesSent: 0,
          availableToday: true,
          availableTomorrow: true,
          blockedSlots: [],
          workingHours: {
            days: [1, 2, 3, 4, 5, 6],
            startTime: '09:00',
            endTime: '19:00',
            breakStart: '14:00',
            breakEnd: '15:00',
            slotDuration: 50
          },
          services: effectiveServices
        },
        fallbackUser
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header with Steps */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 border-b border-slate-800">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 block">
                  Configuración Inicial Exclusiva
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {currentStep === 1 && '¡Bienvenido a Citas Más! Paseo por tu Plataforma'}
                  {currentStep === 2 && 'Datos de tu Compañía e Historia'}
                  {currentStep === 3 && 'Ubicación y WhatsApp de Confirmación'}
                  {currentStep === 4 && 'Logotipo y Fotos de tus Instalaciones'}
                  {currentStep === 5 && 'Tus Servicios, Duración y Precios'}
                  {currentStep === 6 && 'Activación Privada de tu Cuenta'}
                </h2>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
                <span className="text-slate-400 font-medium">Paso</span>
                <span className="font-bold text-emerald-400">{currentStep}</span>
                <span className="text-slate-500">de 6</span>
              </div>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Stepper indicator dots */}
          <div className="grid grid-cols-6 gap-2 mt-4">
            {[1, 2, 3, 4, 5, 6].map((st) => (
              <div
                key={st}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  st === currentStep
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                    : st < currentStep
                    ? 'bg-emerald-600'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-700">
          {stepError && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center space-x-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* STEP 1: Bienvenida & Tour por las funciones clave */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex items-start space-x-3.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Hola {user.displayName || 'Profesional'}, esta es tu única inducción inicial
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Este proceso solo se muestra <strong>la primera vez</strong> que inicias sesión. Tu cuenta tendrá acceso <strong>única y exclusivamente a tu propio panel</strong> y a tus datos protegidos. Ningún otro usuario podrá ver tus configuraciones.
                  </p>
                </div>
              </div>

              {/* Tour Carousel cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Conoce las 5 funciones clave de tu panel:
                  </span>
                  <div className="flex items-center space-x-1 text-xs">
                    {tourFeatures.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setTourFeatureIndex(i)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          tourFeatureIndex === i ? 'bg-emerald-600 w-6' : 'bg-slate-300 hover:bg-slate-400'
                        }`}
                        aria-label={`Ver función ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {(() => {
                  const feature = tourFeatures[tourFeatureIndex];
                  const Icon = feature.icon;
                  return (
                    <div className="border border-slate-200 rounded-2xl p-5 bg-white shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2.5 rounded-xl border ${feature.color}`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {feature.badge}
                            </span>
                            <h4 className="font-black text-base text-slate-900 mt-1">{feature.title}</h4>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setTourFeatureIndex((prev) => (prev > 0 ? prev - 1 : tourFeatures.length - 1))}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTourFeatureIndex((prev) => (prev < tourFeatures.length - 1 ? prev + 1 : 0))}
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>

                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {feature.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-xs text-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* STEP 2: Nombre de la Compañía, Especialista, Categoría e Historia */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  <span>Datos de tu Compañía e Historia</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Esta información se mostrará en tu página web oficial y en los recibos de tus clientes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nombre Comercial de la Compañía / Consultorio *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (stepError) setStepError('');
                    }}
                    placeholder="Ej. Clínica Dental Sonrisas, Psicología Integral..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nombre del Profesional Titular *
                  </label>
                  <input
                    type="text"
                    value={specialistName}
                    onChange={(e) => setSpecialistName(e.target.value)}
                    placeholder="Ej. Dra. Sofía Alarcón, Dr. Carlos Méndez..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <CategorySelector
                id="onboarding-category-select"
                label="Especialidad o Giro Comercial *"
                value={category}
                onChange={(subId, subLabel) => {
                  setCategory(subId);
                  setCategoryLabel(subLabel);
                }}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Historia de tu Compañía o Filosofía Profesional *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Aparecerá en tu landing para generar confianza
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Cuéntale a tus futuros clientes sobre tu trayectoria, certificaciones, años de experiencia y por qué elegirte..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Ubicación y Teléfono de WhatsApp */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <span>Ubicación y Teléfono de WhatsApp para Confirmaciones</span>
                </h3>
                <p className="text-xs text-slate-500">
                  El teléfono registrado será el canal donde recibirás los avisos de nuevas citas y pagos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    {subdivisionLabel} *
                  </label>
                  <input
                    type="text"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    placeholder="Ej. Ciudad de México, Antioquia, Madrid..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Ciudad / Municipio *
                  </label>
                  <input
                    type="text"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="Ej. Guadalajara, Medellín, Barcelona..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Dirección Exacta de Atención (Consultorio o Despacho) *
                </label>
                <input
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Ej. Calle Florencia 45, Int. 302, Col. Juárez"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Barrio / Colonia (opcional)
                  </label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ej. El Poblado, Polanco, Salamanca..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Código Postal (opcional)
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Ej. 06600, 050021..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* WhatsApp Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-xs text-emerald-950 uppercase tracking-wide">
                    Teléfono de WhatsApp para Confirmaciones Oficiales
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-snug">
                  Este es el número exclusivo registrado en el servidor de mensajería para recibir los avisos de nuevas citas con anticipo cobrado.
                </p>
                <div className="flex items-center space-x-2">
                  <span className="bg-white border border-emerald-300 px-3 py-2.5 rounded-xl font-bold text-xs text-slate-700">
                    {selectedCountryObj?.flag || '🌎'} {selectedCountryObj?.dialCode || '+1'}
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (stepError) setStepError('');
                    }}
                    placeholder="Número de WhatsApp"
                    className="flex-1 p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Logotipo y Fotos de Servicios (CON SELECCIÓN MÚLTIPLE SIMULTÁNEA) */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-emerald-600" />
                  <span>Logotipo y Fotos de tus Instalaciones</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Puedes seleccionar varias fotos a la vez desde tu celular o computadora para alimentar tu galería oficial.
                </p>
              </div>

              {/* Logo Section */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Logotipo o Foto de Perfil
                  </label>
                  <label className="cursor-pointer inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir logo</span>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogoFile}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center space-x-4">
                  <img
                    src={logo}
                    alt="Logo preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                  />
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-600 block">
                      O elige uno de nuestros predeterminados para iniciar:
                    </span>
                    <div className="flex items-center space-x-2">
                      {logoPresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setLogo(preset)}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            logo === preset ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-300 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gallery Section with MULTIPLE SELECTION */}
              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Galería de Fotos (Instalaciones y Servicios)
                      </label>
                      <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {gallery.length} fotos
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Selecciona múltiples fotos de una sola vez para tu espacio de atención.
                    </p>
                  </div>

                  {/* Hidden multiple file input */}
                  <input
                    ref={galleryFileInputRef}
                    id="affiliate-multi-photo-input"
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleGalleryInputChange}
                    className="hidden"
                  />

                  {/* Action buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {gallery.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setGallery([])}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        Limpiar todas
                      </button>
                    )}
                    <button
                      type="button"
                      id="onboarding-upload-multiple-photos-btn"
                      disabled={isProcessingPhotos}
                      onClick={() => galleryFileInputRef.current?.click()}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingPhotos ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Procesando fotos...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Seleccionar varias fotos a la vez</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {photoError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{photoError}</span>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingPhotos(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingPhotos(false);
                  }}
                  onDrop={handleDropGallery}
                  onClick={() => galleryFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                    isDraggingPhotos
                      ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-200'
                      : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <ImageIcon className="w-7 h-7 text-emerald-600" />
                    <p className="text-xs font-bold text-slate-800">
                      Arrastra y suelta varias fotos aquí, o haz clic para abrir el selector
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Puedes seleccionar 2, 4, 8 o más archivos simultáneos (JPG, PNG, WebP)
                    </p>
                  </div>
                </div>

                {/* Grid of uploaded thumbnails */}
                {gallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                    {gallery.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video group bg-slate-900 shadow-xs"
                      >
                        <img
                          src={img}
                          alt={`Foto ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGallery(gallery.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all shadow-md"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Servicios, Duración, Descripción y Precios */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span>Tus Servicios, Descripción y Precios ($ MXN)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define qué ofreces, cuánto dura la sesión y el precio anticipado que cobrarás.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Servicio</span>
                </button>
              </div>

              <div className="space-y-3">
                {services.map((srv, idx) => (
                  <div
                    key={srv.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Servicio #{idx + 1}
                      </span>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                          title="Eliminar servicio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Nombre del Servicio *
                        </label>
                        <input
                          type="text"
                          value={srv.name}
                          onChange={(e) => handleUpdateService(idx, 'name', e.target.value)}
                          placeholder="Ej. Consulta Especializada"
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Precio ($ MXN) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={srv.price}
                            onChange={(e) => handleUpdateService(idx, 'price', Number(e.target.value) || 0)}
                            className="w-full pl-6 p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Duración (Minutos)
                        </label>
                        <select
                          value={srv.duration}
                          onChange={(e) => handleUpdateService(idx, 'duration', Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                        >
                          <option value={30}>30 minutos</option>
                          <option value={45}>45 minutos</option>
                          <option value={50}>50 minutos</option>
                          <option value={60}>60 minutos (1 hr)</option>
                          <option value={90}>90 minutos (1.5 hrs)</option>
                          <option value={120}>120 minutos (2 hrs)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Descripción y Qué Incluye
                        </label>
                        <input
                          type="text"
                          value={srv.description}
                          onChange={(e) => handleUpdateService(idx, 'description', e.target.value)}
                          placeholder="Breve explicación de los beneficios incluidos..."
                          className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-600 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Resumen de Privacidad y Activación */}
          {currentStep === 6 && (
            <div className="space-y-5 animate-fadeIn">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>Resumen de tu Cuenta & Activación Privada</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Todo está listo. Al hacer clic en activar, tu información se guardará y entrarás directo a tu panel privado.
                </p>
              </div>

              {/* Privacy Badge / Credentials */}
              {user.email ? (
                <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>Aislamiento y Privacidad de Cuenta Garantizados</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Tu cuenta <strong>{user.email}</strong> es la única con acceso a tu panel de control, configuraciones, clientes y registros financieros. Ningún otro usuario o afiliado de Citas Más puede visualizar ni modificar tus datos.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3.5 shadow-md">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Lock className="w-4 h-4" />
                    <span>Crea tu Acceso Exclusivo de Afiliado</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Define tu correo y contraseña para que tu nuevo panel quede blindado y protegido bajo tu cuenta privada:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Correo Electrónico (Tu usuario de acceso) *
                      </label>
                      <input
                        type="email"
                        value={accountEmail}
                        onChange={(e) => setAccountEmail(e.target.value)}
                        placeholder="ejemplo@tunegocio.com"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Contraseña Privada *
                      </label>
                      <input
                        type="password"
                        value={accountPassword}
                        onChange={(e) => setAccountPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Clean History Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold block">Historial inicial en blanco</span>
                  <p className="text-emerald-800 mt-0.5">
                    Tu panel comenzará con el historial de citas limpio y en blanco, listo para registrar tus primeras reservas reales con pago anticipado y notificaciones por WhatsApp.
                  </p>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-xs" />
                  <div>
                    <h4 className="font-black text-sm text-slate-900">{businessName}</h4>
                    <p className="text-xs text-slate-500">
                      {specialistName} · {selectedCatObj?.label || categoryLabel} · {cityName}, {stateName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-600 uppercase font-bold block">WhatsApp Registrado</span>
                    <span className="font-bold text-slate-800">{phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 uppercase font-bold block">Servicios</span>
                    <span className="font-bold text-slate-800">{services.length} activos</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 uppercase font-bold block">Fotos Galería</span>
                    <span className="font-bold text-slate-800">{gallery.length} fotos</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-600 uppercase font-bold block">Anticipo Promedio</span>
                    <span className="font-bold text-emerald-700">
                      ${services[0]?.price || 500} MXN
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => {
                  setStepError('');
                  setCurrentStep(currentStep - 1);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2 && !businessName.trim()) {
                    setStepError('Por favor ingresa el nombre de tu compañía o consultorio.');
                    return;
                  }
                  if (currentStep === 3 && !phone.trim()) {
                    setStepError('Por favor ingresa tu número de WhatsApp para recibir las notificaciones.');
                    return;
                  }
                  setStepError('');
                  setCurrentStep(currentStep + 1);
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>{currentStep === 1 ? 'Iniciar configuración de mi empresa' : 'Continuar al siguiente paso'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="activate-affiliate-account-btn"
                type="button"
                onClick={handleFinishOnboarding}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md transition-all cursor-pointer disabled:opacity-75"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Guardando en BD y entrando a tu panel...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Activar mi Cuenta y Entrar a mi Panel Privado</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

