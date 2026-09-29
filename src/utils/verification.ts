import {
  ProfessionalDocument,
  VerificationTier,
  OFFICIAL_REQUIRED_DOCUMENTS,
  DocumentType,
  DocumentRequirementDefinition
} from '../types.ts';

export interface VerificationEvaluation {
  tier: VerificationTier;
  count: number;
  totalRequired: number;
  isDestacadoSeguro: boolean;
  isActive: boolean;
  uploadedDocuments: ProfessionalDocument[];
  missingDefinitions: DocumentRequirementDefinition[];
  statusLabel: string;
  shortLabel: string;
  badgeClass: string;
  helpMessage: string;
}

/**
 * Normaliza la lista de documentos de un afiliado
 * considerando tanto el array `documents` como el campo legacy `professionalDocument`.
 */
export function normalizeAffiliateDocuments(
  docs?: ProfessionalDocument[],
  legacyDoc?: ProfessionalDocument
): ProfessionalDocument[] {
  const result: ProfessionalDocument[] = [];
  const seenTypes = new Set<string>();

  if (Array.isArray(docs)) {
    for (const d of docs) {
      if (d && !seenTypes.has(d.type)) {
        seenTypes.add(d.type);
        result.push(d);
      }
    }
  }

  if (legacyDoc && !seenTypes.has(legacyDoc.type)) {
    seenTypes.add(legacyDoc.type);
    result.push(legacyDoc);
  }

  return result;
}

/**
 * Evalúa el estatus de acreditación según las reglas de negocio:
 * 1. 0 documentos: Inactivo (debe subir al menos 1 para aparecer activo).
 * 2. 1 a 3 documentos: Activo (aparece en el directorio público y puede recibir citas).
 * 3. 4 de 4 documentos oficiales: Insignia de Usuario Destacado Seguro (verificación total 100%).
 */
export function evaluateVerificationTier(
  docs?: ProfessionalDocument[],
  legacyDoc?: ProfessionalDocument
): VerificationEvaluation {
  const allDocs = normalizeAffiliateDocuments(docs, legacyDoc);
  const totalRequired = OFFICIAL_REQUIRED_DOCUMENTS.length; // 4: cedula, titulo, licencia_sanitaria, rfc_sat

  const uploadedTypes = new Set(allDocs.map((d) => d.type));
  const validRequiredCount = OFFICIAL_REQUIRED_DOCUMENTS.filter((req) =>
    uploadedTypes.has(req.type)
  ).length;

  const missingDefinitions = OFFICIAL_REQUIRED_DOCUMENTS.filter(
    (req) => !uploadedTypes.has(req.type)
  );

  // Regla 1: 0 documentos
  if (allDocs.length === 0 || validRequiredCount === 0) {
    return {
      tier: 'inactive',
      count: 0,
      totalRequired,
      isDestacadoSeguro: false,
      isActive: false,
      uploadedDocuments: allDocs,
      missingDefinitions,
      statusLabel: 'Usuario Inactivo (Sin Documentación)',
      shortLabel: 'Inactivo',
      badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
      helpMessage:
        'La documentación no es obligatoria para registrarte, pero debes subir al menos un documento oficial para aparecer como usuario activo en el directorio de búsqueda.'
    };
  }

  // Regla 3: Todos los documentos oficiales (4/4) -> Destacado Seguro
  if (validRequiredCount >= totalRequired) {
    return {
      tier: 'destacado_seguro',
      count: validRequiredCount,
      totalRequired,
      isDestacadoSeguro: true,
      isActive: true,
      uploadedDocuments: allDocs,
      missingDefinitions: [],
      statusLabel: 'Usuario Destacado Seguro',
      shortLabel: 'Destacado Seguro',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs ring-1 ring-amber-400/40',
      helpMessage:
        '¡Felicidades! Has subido todos los documentos oficiales y cuentas con la Insignia de Usuario Destacado Seguro con certificación 100% blindada.'
    };
  }

  // Regla 2: Al menos 1 documento (1 a 3) -> Usuario Activo
  return {
    tier: 'active',
    count: validRequiredCount,
    totalRequired,
    isDestacadoSeguro: false,
    isActive: true,
    uploadedDocuments: allDocs,
    missingDefinitions,
    statusLabel: `Usuario Activo (${validRequiredCount}/${totalRequired} docs)`,
    shortLabel: 'Usuario Activo',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    helpMessage:
      `Tu perfil está activo en el directorio y puedes recibir citas (${validRequiredCount}/${totalRequired} documentos subidos). Sube todos los documentos oficiales para obtener la Insignia de Usuario Destacado Seguro.`
  };
}
