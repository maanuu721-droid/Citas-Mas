// Client-side Stripe Service for CitaPro MX

export interface StripeConfig {
  publishableKey: string;
  currency: string;
  mode: 'test' | 'live';
  capabilities: {
    checkout: boolean;
    elements: boolean;
    subscriptions: boolean;
    payouts: boolean;
  };
}

export interface StripePayoutItem {
  id: string;
  amountMxn: number;
  currency: string;
  status: string;
  arrivalDate: string;
  method?: string;
  destination?: string;
}

export interface StripeBalanceData {
  availableMxn: number;
  pendingMxn: number;
}

export class StripeService {
  private static instance: StripeService;
  private configCache: StripeConfig | null = null;

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  // Get configuration from server
  async getConfig(): Promise<StripeConfig> {
    if (this.configCache) {
      return this.configCache;
    }
    try {
      const res = await fetch('/api/stripe/config');
      if (!res.ok) throw new Error('Error al obtener config de Stripe');
      const data: StripeConfig = await res.json();
      this.configCache = data;
      return data;
    } catch {
      return {
        publishableKey: 'pk_live_juBl94na6c8tpv5B0IN1k0C200ZKABtek5',
        currency: 'mxn',
        mode: 'live',
        capabilities: { checkout: true, elements: true, subscriptions: true, payouts: true }
      };
    }
  }

  // Create Stripe Checkout Session for appointment booking
  async createAppointmentCheckoutSession(params: {
    amount: number;
    serviceName: string;
    affiliateName: string;
    affiliateId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    date: string;
    time: string;
    appointmentId?: string;
  }): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> {
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          originUrl: window.location.origin
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo iniciar Checkout de Stripe');
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Create PaymentIntent for card payment inside the app
  async createPaymentIntent(params: {
    amount: number;
    serviceName: string;
    clientEmail?: string;
    metadata?: Record<string, string>;
  }): Promise<{ success: boolean; clientSecret?: string; paymentIntentId?: string; error?: string }> {
    try {
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear PaymentIntent');
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Verify payment status
  async verifyPayment(params: {
    sessionId?: string;
    paymentIntentId?: string;
  }): Promise<{ paid: boolean; status?: string; amountTotal?: number; metadata?: any; error?: string }> {
    try {
      const res = await fetch('/api/stripe/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error verificando pago');
      return data;
    } catch (err: any) {
      return { paid: false, error: err.message };
    }
  }

  // Get payouts & balance for affiliate dashboard
  async getPayoutsAndBalance(): Promise<{
    success: boolean;
    balance: StripeBalanceData;
    payouts: StripePayoutItem[];
    error?: string;
  }> {
    try {
      const res = await fetch('/api/stripe/payouts');
      const data = await res.json();
      return {
        success: data.success ?? true,
        balance: data.balance || { availableMxn: 0, pendingMxn: 0 },
        payouts: data.payouts || []
      };
    } catch (err: any) {
      return {
        success: false,
        balance: { availableMxn: 0, pendingMxn: 0 },
        payouts: [],
        error: err.message
      };
    }
  }

  // Subscribe affiliate to membership plan with Stripe recurring billing
  async subscribeToPlan(params: {
    planId: string;
    planName: string;
    priceMxn: number;
    affiliateId: string;
    affiliateEmail?: string;
  }): Promise<{ success: boolean; sessionId?: string; url?: string; error?: string }> {
    try {
      const res = await fetch('/api/stripe/subscribe-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          originUrl: window.location.origin
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al iniciar suscripción');
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Save Affiliate Interbank CLABE and Payout Preference
  async savePayoutSettings(params: {
    affiliateId: string;
    payoutClabe: string;
    payoutBank: string;
    payoutHolderName: string;
    payoutSchedule: 'weekly' | 'instant';
  }): Promise<{ success: boolean; message?: string; settings?: any; error?: string }> {
    try {
      const res = await fetch('/api/stripe/save-payout-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar cuenta CLABE');
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // Request Payout (Instant with 1.5% fee or Weekly with 0% fee)
  async requestAffiliatePayout(params: {
    affiliateId: string;
    amountMxn: number;
    payoutClabe: string;
    payoutBank: string;
    payoutHolderName: string;
    payoutSchedule: 'weekly' | 'instant';
  }): Promise<{ success: boolean; message?: string; payout?: any; error?: string }> {
    try {
      const res = await fetch('/api/stripe/request-instant-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al solicitar dispersión');
      return data;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

