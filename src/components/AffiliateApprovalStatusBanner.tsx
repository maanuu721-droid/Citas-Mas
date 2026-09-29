import React, { useState } from 'react';
import {
  Affiliate,
  ProfessionalDocument,
  UserProfile,
  OFFICIAL_REQUIRED_DOCUMENTS,
  DocumentType,
  DocumentRequirementDefinition
} from '../types.ts';
import { AuthService } from '../services/authService.ts';
import {
  evaluateVerificationTier,
  normalizeAffiliateDocuments
} from '../utils/verification.ts';
import {
  ShieldCheck,
  Clock,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  FileText,
  BadgeCheck,
  Plus,
  Trash2,
  UploadCloud,
  X,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

interface Props {
  affiliate: Affiliate;
  currentUser?: UserProfile | null;
  onStatusChange?: (updatedAffiliate: Affiliate) => void;
}

export const AffiliateApprovalStatusBanner: React.FC<Props> = ({
  affiliate,
  currentUser,
  onStatusChange
}) => {
  const [showDocModal, setShowDocModal] = useState(false);
  const [activeUploadType, setActiveUploadType] = useState<DocumentType | null>(null);
  const [inputFolio, setInputFolio] = useState('');
  const [inputIssuer, setInputIssuer] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const documents = normalizeAffiliateDocuments(
    affiliate.documents || currentUser?.documents,
    affiliate.professionalDocument || currentUser?.professionalDocument
  );

  const evaluation = evaluateVerificationTier(documents);

  // File change handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Open modal for a specific document requirement
  const handleStartUploadFor = (req: DocumentRequirementDefinition) => {
    setActiveUploadType(req.type);
    setInputFolio(req.exampleFolio);
    setInputIssuer(req.issuedByExample);
    setSelectedFileName(`${req.type}_documento_oficial.pdf`);
    setSelectedFileDataUrl(undefined);
    setShowDocModal(true);
  };

  // Submit new document
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUploadType) return;
    if (!inputFolio.trim()) {
      alert('Ingresa el número de folio o cédula del documento');
      return;
    }

    const reqDef = OFFICIAL_REQUIRED_DOCUMENTS.find((r) => r.type === activeUploadType);
    const newDoc: ProfessionalDocument = {
      id: `doc-${activeUploadType}-${Date.now()}`,
      type: activeUploadType,
      typeLabel: reqDef?.typeLabel || 'Documento Oficial',
      documentNumber: inputFolio.trim(),
      fileName: selectedFileName || `${activeUploadType}_expediente.pdf`,
      fileDataUrl: selectedFileDataUrl,
      fileSize: '1.4 MB',
      issuedBy: inputIssuer.trim() || reqDef?.issuedByExample || 'Autoridad Oficial Competente',
      uploadedAt: new Date().toISOString(),
      verificationNotes: 'Cotejado y validado en plataforma CitaPro MX.'
    };

    setIsProcessing(true);
    setFeedbackMsg('');

    try {
      const result = await AuthService.getInstance().uploadAffiliateDocument(
        affiliate.id,
        newDoc
      );
      if (onStatusChange) {
        onStatusChange(result.updatedAffiliate);
      }
      setFeedbackMsg(`✓ ¡Documento "${reqDef?.shortLabel}" subido y validado exitosamente!`);
      setActiveUploadType(null);
      setTimeout(() => setFeedbackMsg(''), 3000);
    } catch (err: any) {
      alert(err?.message || 'Error al guardar el documento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete document
  const handleDeleteDocument = async (docId: string, docLabel: string) => {
    if (!confirm(`¿Deseas eliminar el documento "${docLabel}"? Esto actualizará tu nivel de verificación.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const result = await AuthService.getInstance().deleteAffiliateDocument(
        affiliate.id,
        docId
      );
      if (onStatusChange) {
        onStatusChange(result.updatedAffiliate);
      }
      setFeedbackMsg('Documento retirado. Nivel recalculado.');
      setTimeout(() => setFeedbackMsg(''), 2500);
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar el documento');
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Action: Subir todos los documentos para prueba inmediata
  const handleUploadAllDemoDocuments = async () => {
    setIsProcessing(true);
    try {
      let currentAff = affiliate;
      for (const req of OFFICIAL_REQUIRED_DOCUMENTS) {
        const doc: ProfessionalDocument = {
          id: `doc-demo-${req.type}-${Date.now()}`,
          type: req.type,
          typeLabel: req.typeLabel,
          documentNumber: req.exampleFolio,
          fileName: `${req.type}_oficial_validado.pdf`,
          fileSize: '1.2 MB',
          issuedBy: req.issuedByExample,
          uploadedAt: new Date().toISOString(),
          verificationNotes: 'Acreditación completa validada en modo demo.'
        };
        const res = await AuthService.getInstance().uploadAffiliateDocument(affiliate.id, doc);
        currentAff = res.updatedAffiliate;
      }
      if (onStatusChange) {
        onStatusChange(currentAff);
      }
      setFeedbackMsg('⭐ ¡Felicidades! Se han cargado todos los documentos oficiales. Ahora tienes la Insignia de Usuario Destacado Seguro.');
      setShowDocModal(false);
    } catch (err) {
      console.error('Error subiendo demo docs:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const progressPercent = Math.min(100, Math.round((evaluation.count / evaluation.totalRequired) * 100));

  return (
    <div className="space-y-3">
      {/* ========================================================================= */}
      {/* 1. TIER: DESTACADO SEGURO (4 de 4 documentos oficiales) */}
      {/* ========================================================================= */}
      {evaluation.tier === 'destacado_seguro' && (
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border-2 border-amber-500/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border-2 border-amber-400 shrink-0 shadow-xs ring-2 ring-amber-400/20">
              <Award className="w-6 h-6 fill-current text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-black text-sm sm:text-base text-amber-100 flex items-center space-x-1.5">
                  <span>Insignia de Usuario Destacado Seguro</span>
                  <span className="text-amber-400 text-xs">★★★★</span>
                </span>
                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                  Verificación 100% Blindada
                </span>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed max-w-2xl">
                ¡Acreditación total completada ({evaluation.count}/{evaluation.totalRequired} documentos oficiales)! Cuentas con Cédula SEP, Título de Grado, Licencia COFEPRIS y SAT validados. Tu perfil disfruta de la máxima confianza y prioridad de visibilidad.
              </p>
            </div>
          </div>

          <button
            id="manage-docs-banner-btn"
            onClick={() => setShowDocModal(true)}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl font-extrabold flex items-center space-x-2 transition-all shadow-md shrink-0 whitespace-nowrap"
          >
            <ShieldCheck className="w-4 h-4 text-slate-950" />
            <span>Ver Expediente Acreditado (4/4)</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TIER: USUARIO ACTIVO (1 a 3 documentos oficiales) */}
      {/* ========================================================================= */}
      {evaluation.tier === 'active' && (
        <div className="bg-emerald-950 text-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-600/70 shadow-md space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-black text-sm sm:text-base text-white">
                    Usuario Activo Acreditado
                  </span>
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {evaluation.count} de {evaluation.totalRequired} Docs Oficiales
                  </span>
                </div>
                <p className="text-xs text-emerald-200 mt-0.5 max-w-2xl">
                  Tu perfil aparece activo en el directorio y tu agenda pública está abierta. Sube los {evaluation.missingDefinitions.length} documentos oficiales restantes para obtener la <strong>Insignia de Usuario Destacado Seguro</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                id="manage-docs-banner-btn"
                onClick={() => setShowDocModal(true)}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Subir {evaluation.missingDefinitions.length} Faltantes para Insignia</span>
              </button>
            </div>
          </div>

          {/* Progress bar towards Destacado Seguro */}
          <div className="pt-2 border-t border-emerald-800/60 flex items-center space-x-3">
            <div className="flex-1 bg-emerald-900/60 rounded-full h-2.5 overflow-hidden border border-emerald-800">
              <div
                className="bg-gradient-to-r from-emerald-400 to-amber-400 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-emerald-300 font-bold shrink-0">
              {progressPercent}% completado para Insignia Destacado
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TIER: INACTIVO (0 documentos subidos) */}
      {/* ========================================================================= */}
      {evaluation.tier === 'inactive' && (
        <div className="bg-amber-950 text-white p-4 sm:p-5 rounded-2xl border-2 border-amber-600/80 shadow-md space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <span className="font-black text-sm sm:text-base text-amber-100">
                    Perfil Inactivo en el Directorio Público
                  </span>
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Requiere 1 Documento Mínimo
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 mt-1 leading-relaxed max-w-2xl">
                  <strong>La documentación no fue obligatoria para tu registro</strong>, pero para aparecer como <strong>Usuario Activo</strong> en el directorio público y que los clientes puedan agendarte citas, <strong>debes subir al menos 1 documento oficial</strong> (Cédula SEP, Título, COFEPRIS o SAT).
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <button
                id="activate-affiliate-now-btn"
                onClick={() => {
                  handleStartUploadFor(OFFICIAL_REQUIRED_DOCUMENTS[0]);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Subir Documento y Activarme</span>
              </button>

              <button
                onClick={() => setShowDocModal(true)}
                className="bg-amber-900/60 hover:bg-amber-800 text-amber-200 font-bold text-xs px-3 py-2.5 rounded-xl border border-amber-700 transition-colors"
              >
                Ver Requisitos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE GESTIÓN Y ACREDITACIÓN DE DOCUMENTOS */}
      {/* ========================================================================= */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Acreditación y Documentación Oficial
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    CitaPro MX · Validación de Profesionales
                  </span>
                </div>
              </div>
              <button
                id="close-doc-manager-modal"
                onClick={() => {
                  setShowDocModal(false);
                  setActiveUploadType(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Business Rules Explanation Card */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Reglas del Sistema de Acreditación:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className={`p-2 rounded-xl border ${evaluation.tier === 'inactive' ? 'bg-amber-50 border-amber-300 font-bold' : 'bg-white border-slate-200'}`}>
                  <span className="block text-slate-500 text-[10px]">0 Documentos:</span>
                  <span className="text-amber-900">⚠️ Inactivo (Oculto)</span>
                  <p className="text-[10px] text-slate-600 font-normal mt-0.5">
                    No apareces en búsquedas públicas hasta subir al menos 1 documento.
                  </p>
                </div>

                <div className={`p-2 rounded-xl border ${evaluation.tier === 'active' ? 'bg-emerald-50 border-emerald-300 font-bold' : 'bg-white border-slate-200'}`}>
                  <span className="block text-slate-500 text-[10px]">1 a 3 Documentos:</span>
                  <span className="text-emerald-800">🟢 Usuario Activo</span>
                  <p className="text-[10px] text-slate-600 font-normal mt-0.5">
                    Perfil público activo para agendar y recibir pagos de clientes.
                  </p>
                </div>

                <div className={`p-2 rounded-xl border ${evaluation.tier === 'destacado_seguro' ? 'bg-amber-100 border-amber-400 font-bold ring-1 ring-amber-400' : 'bg-white border-slate-200'}`}>
                  <span className="block text-slate-500 text-[10px]">Todos (4 de 4 Docs):</span>
                  <span className="text-amber-950">⭐ Destacado Seguro</span>
                  <p className="text-[10px] text-slate-600 font-normal mt-0.5">
                    Insignia dorada oficial y máxima confianza en todo México.
                  </p>
                </div>
              </div>
            </div>

            {feedbackMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl font-bold text-xs flex items-center space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {/* List of 4 Official Document Requirements */}
            <div className="space-y-3">
              <span className="block text-slate-700 font-bold text-xs uppercase tracking-wider">
                Documentos Oficiales Requeridos ({evaluation.count} de {evaluation.totalRequired} validados):
              </span>

              <div className="space-y-2.5">
                {OFFICIAL_REQUIRED_DOCUMENTS.map((req) => {
                  const uploaded = documents.find((d) => d.type === req.type);
                  const isBeingEdited = activeUploadType === req.type;

                  return (
                    <div
                      key={req.type}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        uploaded
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isBeingEdited
                          ? 'bg-slate-50 border-slate-900 ring-2 ring-slate-900/10'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                              uploaded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {uploaded ? <CheckCircle2 className="w-4 h-4" /> : <FileText className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-xs text-slate-900">
                                {req.typeLabel}
                              </span>
                              {uploaded ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full border border-emerald-200">
                                  ✓ Validado
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.2 rounded-full">
                                  Pendiente
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{req.description}</p>

                            {uploaded && (
                              <div className="mt-2 text-[11px] bg-white p-2 rounded-xl border border-emerald-100 space-y-0.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Folio / Número:</span>
                                  <span className="font-mono font-bold text-emerald-700">{uploaded.documentNumber}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Emisor:</span>
                                  <span className="text-slate-700">{uploaded.issuedBy}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">Archivo:</span>
                                  <span className="text-slate-700 truncate max-w-[200px]">{uploaded.fileName}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action for this document */}
                        <div className="shrink-0">
                          {uploaded ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(uploaded.id, req.shortLabel)}
                              disabled={isProcessing}
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Retirar documento"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartUploadFor(req)}
                              className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Subir</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* INLINE UPLOAD FORM FOR THIS DOCUMENT */}
                      {isBeingEdited && (
                        <form
                          onSubmit={handleSaveDocument}
                          className="mt-3 pt-3 border-t border-slate-200 space-y-3 bg-white p-3 rounded-xl border border-slate-300 animate-in fade-in"
                        >
                          <span className="font-bold text-xs text-slate-900 block">
                            Subir acreditación para: {req.shortLabel}
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div>
                              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                                Folio Oficial / Cédula:
                              </label>
                              <input
                                type="text"
                                required
                                value={inputFolio}
                                onChange={(e) => setInputFolio(e.target.value)}
                                placeholder={req.exampleFolio}
                                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                              />
                            </div>

                            <div>
                              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                                Organismo Emisor:
                              </label>
                              <input
                                type="text"
                                required
                                value={inputIssuer}
                                onChange={(e) => setInputIssuer(e.target.value)}
                                placeholder={req.issuedByExample}
                                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                              Archivo Digital (PDF o Imagen):
                            </label>
                            <div className="flex items-center space-x-2">
                              <label className="cursor-pointer text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-xl font-medium text-slate-700 flex items-center space-x-1.5">
                                <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                                <span>Examinar...</span>
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  onChange={handleFileSelect}
                                  className="hidden"
                                />
                              </label>
                              <span className="text-xs text-slate-600 truncate font-mono">
                                {selectedFileName || `${req.type}_expediente.pdf`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setActiveUploadType(null)}
                              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-bold"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isProcessing}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                            >
                              {isProcessing ? 'Guardando...' : 'Guardar y Validar Documento'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Demo Upload All Button */}
            <div className="p-3 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-extrabold text-amber-300 block text-xs">
                  ⚡ Modo Prueba Rápida (Demostración):
                </span>
                <span className="text-[11px] text-slate-300">
                  Carga en un clic los 4 documentos oficiales (Cédula, Título, COFEPRIS y SAT) para ver la Insignia de Destacado Seguro de inmediato.
                </span>
              </div>
              <button
                type="button"
                onClick={handleUploadAllDemoDocuments}
                disabled={isProcessing || evaluation.tier === 'destacado_seguro'}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2 rounded-xl text-xs whitespace-nowrap shadow-sm transition-all"
              >
                Cargar Todos (4/4) Ahora
              </button>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowDocModal(false)}
                className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
