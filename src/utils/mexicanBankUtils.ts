// Utility functions for Mexican Interbank CLABEs, Banks and Payout Calculations (SPEI / Stripe)

export const MEXICAN_BANKS: Record<string, string> = {
  '002': 'Citibanamex (Banco Nacional de México)',
  '012': 'BBVA México',
  '014': 'Santander México',
  '021': 'HSBC México',
  '030': 'Banco del Bajío (BanBajío)',
  '036': 'Inbursa',
  '044': 'Scotiabank Inverlat',
  '058': 'Banregio',
  '060': 'Bansi',
  '062': 'Afirme',
  '072': 'Banorte / Ixe',
  '106': 'Bank of America México',
  '127': 'Banco Azteca',
  '136': 'Intercam Banco',
  '137': 'BanCoppel',
  '138': 'ABC Capital',
  '140': 'Hey Banco (Banregio)',
  '143': 'CIBanco',
  '166': 'Banco Multiva',
  '638': 'Nu México (Nu Pagos)',
  '646': 'STP (Sistema de Transferencias y Pagos)',
  '684': 'Mercado Pago Wallet / Albo',
  '710': 'Ualá México',
  '846': 'STP Servicios Financieros',
};

export interface ClabeValidationResult {
  cleanedClabe: string;
  isValidLength: boolean;
  isValidChecksum: boolean;
  bankCode: string;
  bankName: string;
  formattedClabe: string;
  error?: string;
}

/**
 * Validates and detects a Mexican 18-digit CLABE interbancaria
 * Banxico weights: [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7]
 */
export function validateAndDetectClabe(input: string): ClabeValidationResult {
  const cleaned = (input || '').replace(/\D/g, '');
  const bankCode = cleaned.substring(0, 3);
  const bankName = MEXICAN_BANKS[bankCode] || (cleaned.length >= 3 ? 'Banco Mexicano No Catalogado' : 'Esperando 18 dígitos...');

  const isValidLength = cleaned.length === 18;

  let isValidChecksum = false;
  if (isValidLength) {
    const weights = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      const digit = parseInt(cleaned[i], 10);
      sum += (digit * weights[i]) % 10;
    }
    const computedControl = (10 - (sum % 10)) % 10;
    const providedControl = parseInt(cleaned[17], 10);
    isValidChecksum = computedControl === providedControl;
  }

  // Format in groups: 3 - 3 - 11 - 1
  let formattedClabe = cleaned;
  if (cleaned.length > 0) {
    const parts = [
      cleaned.slice(0, 3),
      cleaned.slice(3, 6),
      cleaned.slice(6, 17),
      cleaned.slice(17, 18),
    ].filter(Boolean);
    formattedClabe = parts.join(' ');
  }

  let error: string | undefined;
  if (cleaned.length > 0 && cleaned.length < 18) {
    error = `Faltan ${18 - cleaned.length} dígitos para completar los 18 de la CLABE.`;
  } else if (cleaned.length > 18) {
    error = 'La CLABE interbancaria debe tener exactamente 18 dígitos numéricos.';
  }

  return {
    cleanedClabe: cleaned,
    isValidLength,
    isValidChecksum,
    bankCode,
    bankName,
    formattedClabe,
    error
  };
}

export interface PayoutBreakdown {
  schedule: 'weekly' | 'instant';
  scheduleTitle: string;
  badge: string;
  commissionPercent: number;
  commissionFeeMxn: number;
  grossAmountMxn: number;
  netPayoutMxn: number;
  description: string;
  timelineText: string;
  stripeCostCoverage: string;
}

/**
 * Calculates payout breakdown between weekly (0% commission) and instant (1.5% commission)
 */
export function calculatePayoutBreakdown(grossAmountMxn: number, schedule: 'weekly' | 'instant'): PayoutBreakdown {
  const safeGross = Math.max(0, Number(grossAmountMxn) || 0);

  if (schedule === 'instant') {
    const fee = Math.round((safeGross * 0.015) * 100) / 100;
    const net = Math.max(0, Math.round((safeGross - fee) * 100) / 100);
    return {
      schedule: 'instant',
      scheduleTitle: 'Liquidación Inmediata (Instant Payout)',
      badge: '1.5% Comisión Técnica Stripe',
      commissionPercent: 1.5,
      commissionFeeMxn: fee,
      grossAmountMxn: safeGross,
      netPayoutMxn: net,
      description: 'Transferencia SPEI en tiempo real (segundos) a tu cuenta CLABE cada vez que concluye una cita.',
      timelineText: 'Inmediato (menos de 60 segundos)',
      stripeCostCoverage: 'Cubre el costo de la pasarela Stripe por dispersión acelerada 24/7.'
    };
  }

  // Weekly: 0% fee
  return {
    schedule: 'weekly',
    scheduleTitle: 'Liquidación Semanal Programada',
    badge: '0% Comisión (Gratis)',
    commissionPercent: 0,
    commissionFeeMxn: 0,
    grossAmountMxn: safeGross,
    netPayoutMxn: safeGross,
    description: 'Depósito programado cada semana directo a tu CLABE por SPEI. Citas Más y Stripe absorben la dispersión ordinaria.',
    timelineText: 'Cada Miércoles / Viernes hábil',
    stripeCostCoverage: 'Sin comisiones ocultas ni costos de retiro. Recibes el 100% íntegro de tus ingresos.'
  };
}
