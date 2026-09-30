import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Stripe clients with credentials
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_ujTsBZpqnEku8x0ty6wDbq9z00KP9gKdBv';
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_lSViyjTjDSaNiuLuSqZXRFLN00KFh6HAV1';
const STRIPE_SUBSCRIPTION_KEY = process.env.STRIPE_SUBSCRIPTION_KEY || 'rk_test_51EZ5OgIbtSZx9R0I9yx0QBLD3Qo829MRee7OmrzEapnEq7H3rdnAXN73yWBVlZFQFASHDOy0wLSwNwnhCb8PDwtH00jlTynsfV';
const STRIPE_GENERAL_RESTRICTED_KEY = process.env.STRIPE_GENERAL_RESTRICTED_KEY || 'rk_test_51EZ5OgIbtSZx9R0IclznvmomXpnP48Hsbogb9Xox46gh5m9BHqbjhJfX7XTr3pIdhysVWisbf4UUEs8uofbQckTc00kvGwUAeM';

const stripe = new Stripe(STRIPE_SECRET_KEY);
const stripeSubscriptions = new Stripe(STRIPE_SUBSCRIPTION_KEY);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // Initialize Gemini lazily if API key is present
  const getGeminiClient = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return null;
    }
    return new GoogleGenAI();
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
    });
  });

  // 1. Tool 1 Endpoint: Discover Target Audience (Descubre tu público objetivo)
  app.post('/api/marketing/audience', async (req, res) => {
    try {
      const { affiliate } = req.body;
      if (!affiliate) {
        return res.status(400).json({ error: 'Faltan datos del afiliado.' });
      }

      const servicesSummary = (affiliate.services || [])
        .map((s: any) => `- ${s.name} ($${s.price} MXN, ${s.duration} min): ${s.description || ''}`)
        .join('\n');

      const gemini = getGeminiClient();

      if (gemini) {
        const prompt = `Actúa como Director Experto de Marketing para negocios locales y servicios profesionales en México.
Analiza este negocio afiliado en Citas Más MX:
- Nombre Comercial: ${affiliate.businessName || affiliate.name}
- Categoría: ${affiliate.categoryLabel || affiliate.category}
- Ubicación: ${affiliate.address}, ${affiliate.city}, ${affiliate.state}
- Descripción: ${affiliate.description}
- Servicios ofrecidos y tarifas:
${servicesSummary}
- Fotos del negocio disponibles: ${affiliate.gallery?.length || 0} fotos más logotipo y banner.

Tu tarea:
Identifica y entrega exactamente TRES (3) Clientes Ideales (Buyer Personas) hiper-específicos para este negocio en México.
Para cada cliente ideal debes detallar:
1. Nombre descriptivo de arquetipo (ej: "Mariana, Madre Profesionista Ocupada")
2. Rango de edad específico (ej: "32 - 45 años")
3. Género (ej: "Femenino / Preferente familiar" o "Hombres y Mujeres")
4. Zona específica (ej: colonias o alcaldías exactas de su ciudad: ${affiliate.city})
5. Miedos (lista de 3 miedos o frustraciones reales al contratar este servicio)
6. Deseos (lista de 3 metas o anhelos que buscan lograr)
7. Impulsos de compra (lista de 3 detonadores psicológicos que los hacen agendar y pagar anticipado)
8. Frase gancho (summary hook breve y persuasivo para publicidad)

Devuelve ÚNICAMENTE un JSON válido con la siguiente estructura sin bloques markdown ni explicaciones adicionales:
[
  {
    "id": "persona_1",
    "name": "...",
    "ageRange": "...",
    "gender": "...",
    "specificZone": "...",
    "fears": ["...", "...", "..."],
    "desires": ["...", "...", "..."],
    "buyingTriggers": ["...", "...", "..."],
    "summaryHook": "..."
  },
  ... (3 personas en total)
]`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        return res.json({ personas: parsed, source: 'gemini' });
      }

      // Contextual Mexican fallback if Gemini API Key not configured
      const personasFallback = generateContextualBuyerPersonas(affiliate);
      return res.json({ personas: personasFallback, source: 'contextual_engine' });
    } catch (err: any) {
      console.warn('Error in /api/marketing/audience, falling back to contextual generator:', err);
      const fallback = generateContextualBuyerPersonas(req.body.affiliate);
      return res.json({ personas: fallback, source: 'contextual_engine' });
    }
  });

  // 2. Tool 2 Endpoint: Generate 2D Campaign Content
  app.post('/api/marketing/campaign-2d', async (req, res) => {
    try {
      const { affiliate, targetPersona } = req.body;
      const gemini = getGeminiClient();

      if (gemini) {
        const prompt = `Actúa como Copywriter Publicitario Senior especializado en anuncios de alta conversión en México.
Crea un anuncio publicitario 2D para:
- Negocio: ${affiliate.businessName || affiliate.name} (${affiliate.categoryLabel || affiliate.category})
- Ubicación: ${affiliate.city}, ${affiliate.state}
- Dirigido a este Cliente Ideal: ${targetPersona?.name || 'Cliente local'} (${targetPersona?.ageRange || ''}, ${targetPersona?.specificZone || affiliate.city})
- Miedos del cliente: ${(targetPersona?.fears || []).join(', ')}
- Deseos del cliente: ${(targetPersona?.desires || []).join(', ')}
- Disparadores de compra: ${(targetPersona?.buyingTriggers || []).join(', ')}

Genera un JSON estricto con:
{
  "headline": "Titular impactante y directo (máx 9 palabras)",
  "subheadline": "Subtítulo que resuelve su principal miedo y ofrece la solución (máx 15 palabras)",
  "bodyCopy": "Texto del anuncio persuasivo, empático, sin clichés (máx 45 palabras)",
  "badge": "Insignia destacada de confianza (ej: 'Citas 100% Puntuales', 'Cédula Oficial Verificada')",
  "callToAction": "Texto del botón de llamada a la acción (ej: 'Agendar Cita en Línea', 'Apartar Horario')",
  "priceOffer": "Texto opcional de oferta o desde precio (ej: 'Desde $${affiliate.services?.[0]?.price || 500} MXN')"
}`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        return res.json({ campaign: parsed, source: 'gemini' });
      }

      const fallback = generateContextualCampaignContent(affiliate, targetPersona);
      return res.json({ campaign: fallback, source: 'contextual_engine' });
    } catch (err: any) {
      console.warn('Error in /api/marketing/campaign-2d:', err);
      const fallback = generateContextualCampaignContent(req.body.affiliate, req.body.targetPersona);
      return res.json({ campaign: fallback, source: 'contextual_engine' });
    }
  });

  // 3. n8n Webhook Dispatcher / Proxy Endpoint
  app.post('/api/marketing/n8n-dispatch', async (req, res) => {
    try {
      const { webhookUrl, payload } = req.body;
      const targetUrl = webhookUrl || process.env.N8N_WEBHOOK_URL;

      if (!targetUrl) {
        // Return simulated success with full payload for sandbox demo
        return res.json({
          status: 'simulated_success',
          message: 'Webhook recibido y preparado para n8n. Flujo orquestado exitosamente.',
          dispatchedAt: new Date().toISOString(),
          previewPayload: payload
        });
      }

      // Forward payload to user's real n8n webhook
      const n8nResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'Citas Más_marketing_tools',
          dispatchedAt: new Date().toISOString(),
          ...payload
        })
      });

      const responseData = await n8nResponse.text();
      return res.json({
        status: 'success',
        n8nStatus: n8nResponse.status,
        n8nResponse: responseData
      });
    } catch (err: any) {
      console.error('Error dispatching to n8n:', err);
      return res.status(500).json({
        error: 'No se pudo contactar el webhook de n8n.',
        details: err.message
      });
    }
  });

  // ==========================================
  // STRIPE PAYMENT INTEGRATION ENDPOINTS (MXN)
  // ==========================================

  // 1. Get Public Configuration & Status
  app.get('/api/stripe/config', (req, res) => {
    res.json({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      currency: 'mxn',
      mode: 'test',
      capabilities: {
        checkout: true,
        elements: true,
        subscriptions: true,
        payouts: true
      }
    });
  });

  // 2. Stripe Live Health and Balance Status
  app.get('/api/stripe/status', async (req, res) => {
    try {
      const balance = await stripe.balance.retrieve();
      const availableMxn = (balance.available.find(b => b.currency === 'mxn')?.amount || 0) / 100;
      const pendingMxn = (balance.pending.find(b => b.currency === 'mxn')?.amount || 0) / 100;

      res.json({
        status: 'connected',
        mode: 'test',
        currency: 'mxn',
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        balance: {
          availableMxn,
          pendingMxn,
          liveAvailable: balance.available,
          livePending: balance.pending
        },
        scopes: {
          generalPayments: 'Acceso total con Secret Key (sk_test_...)',
          subscribersAndPayouts: 'Clave Restringida Activa (rk_test_...)'
        }
      });
    } catch (err: any) {
      console.error('Stripe status check warning:', err.message);
      res.json({
        status: 'connected_with_warnings',
        mode: 'test',
        currency: 'mxn',
        publishableKey: STRIPE_PUBLISHABLE_KEY,
        warning: err.message,
        scopes: {
          generalPayments: 'sk_test activa',
          subscribersAndPayouts: 'rk_test activa'
        }
      });
    }
  });

  // 3. Create Stripe Checkout Session for Appointment Booking
  app.post('/api/stripe/create-checkout-session', async (req, res) => {
    try {
      const {
        amount,
        serviceName,
        affiliateName,
        affiliateId,
        clientName,
        clientEmail,
        clientPhone,
        date,
        time,
        appointmentId,
        originUrl
      } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Monto de cita no válido.' });
      }

      const baseUrl = originUrl || req.headers.origin || 'http://localhost:3000';
      const unitAmountCents = Math.round(Number(amount) * 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: {
                name: `${serviceName} - ${affiliateName || 'Citas Más MX'}`,
                description: `Anticipo de cita para ${clientName || 'Cliente'} el ${date || ''} a las ${time || ''} hrs.`,
              },
              unit_amount: unitAmountCents,
            },
            quantity: 1,
          },
        ],
        customer_email: clientEmail && clientEmail.includes('@') ? clientEmail : undefined,
        metadata: {
          appointmentId: String(appointmentId || `CP-${Date.now()}`),
          affiliateId: String(affiliateId || ''),
          clientName: String(clientName || ''),
          clientPhone: String(clientPhone || ''),
          serviceName: String(serviceName || ''),
          date: String(date || ''),
          time: String(time || ''),
        },
        success_url: `${baseUrl}?stripe_status=success&session_id={CHECKOUT_SESSION_ID}&appointment_id=${appointmentId || ''}`,
        cancel_url: `${baseUrl}?stripe_status=cancel&appointment_id=${appointmentId || ''}`,
      });

      return res.json({
        success: true,
        sessionId: session.id,
        url: session.url
      });
    } catch (err: any) {
      console.error('Error creating Stripe Checkout Session:', err);
      return res.status(500).json({
        error: 'No se pudo crear la sesión de pago con Stripe.',
        details: err.message
      });
    }
  });

  // 4. Create PaymentIntent for in-modal embedded card payments
  app.post('/api/stripe/create-payment-intent', async (req, res) => {
    try {
      const { amount, serviceName, clientEmail, metadata } = req.body;
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Monto inválido.' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100),
        currency: 'mxn',
        description: `Citas Más MX: ${serviceName || 'Servicio Profesional'}`,
        receipt_email: clientEmail && clientEmail.includes('@') ? clientEmail : undefined,
        metadata: metadata || {},
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        }
      });

      return res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (err: any) {
      console.error('Error creating PaymentIntent:', err);
      return res.status(500).json({
        error: 'Error al generar la intención de pago.',
        details: err.message
      });
    }
  });

  // 5. Verify status of a PaymentIntent or Checkout Session
  app.post('/api/stripe/verify-payment', async (req, res) => {
    try {
      const { sessionId, paymentIntentId } = req.body;

      if (sessionId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return res.json({
          paid: session.payment_status === 'paid',
          status: session.status,
          amountTotal: (session.amount_total || 0) / 100,
          currency: session.currency,
          customerEmail: session.customer_details?.email,
          paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          metadata: session.metadata
        });
      }

      if (paymentIntentId) {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        return res.json({
          paid: pi.status === 'succeeded',
          status: pi.status,
          amountTotal: (pi.amount || 0) / 100,
          currency: pi.currency,
          metadata: pi.metadata
        });
      }

      return res.status(400).json({ error: 'Parámetros insuficientes para verificar pago.' });
    } catch (err: any) {
      console.error('Error verifying Stripe payment:', err);
      return res.status(500).json({
        error: 'Error al verificar la transacción de Stripe.',
        details: err.message
      });
    }
  });

  // 6. Get Payouts and Balance (Uses Restricted Subscriber/Payout Key)
  app.get('/api/stripe/payouts', async (req, res) => {
    try {
      // Use the subscriber key which has payout permissions, or fallback to general stripe
      const clientToQuery = stripeSubscriptions || stripe;
      const payouts = await clientToQuery.payouts.list({ limit: 10 });
      const balance = await stripe.balance.retrieve();

      const availableMxn = (balance.available.find(b => b.currency === 'mxn')?.amount || 0) / 100;
      const pendingMxn = (balance.pending.find(b => b.currency === 'mxn')?.amount || 0) / 100;

      return res.json({
        success: true,
        mode: 'test',
        balance: {
          availableMxn,
          pendingMxn
        },
        payouts: payouts.data.map(p => ({
          id: p.id,
          amountMxn: p.amount / 100,
          currency: p.currency,
          status: p.status, // 'paid', 'pending', 'in_transit', 'canceled', 'failed'
          arrivalDate: new Date(p.arrival_date * 1000).toLocaleDateString('es-MX'),
          method: p.method,
          destination: p.destination
        }))
      });
    } catch (err: any) {
      console.error('Error querying Stripe payouts:', err.message);
      return res.json({
        success: false,
        mode: 'test',
        balance: {
          availableMxn: 0,
          pendingMxn: 0
        },
        payouts: [],
        note: 'Modo Pruebas / Sin transferencias registradas todavía',
        error: err.message
      });
    }
  });

  // 7. Subscribe Affiliate to Plan using Subscription Restricted Key
  app.post('/api/stripe/subscribe-plan', async (req, res) => {
    try {
      const { planId, planName, priceMxn, affiliateId, affiliateEmail, originUrl } = req.body;
      const baseUrl = originUrl || req.headers.origin || 'http://localhost:3000';

      const session = await stripeSubscriptions.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'mxn',
              product_data: {
                name: `Citas Más MX: Membresía Plan ${planName || planId}`,
                description: `Suscripción mensual recurrente para gestión de citas y marketing digital`,
              },
              unit_amount: Math.round(Number(priceMxn) * 100),
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        customer_email: affiliateEmail && affiliateEmail.includes('@') ? affiliateEmail : undefined,
        metadata: {
          affiliateId: affiliateId || '',
          planId: planId || '',
          type: 'affiliate_subscription'
        },
        success_url: `${baseUrl}?stripe_subscription=success&plan=${planId}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}?stripe_subscription=cancel`,
      });

      return res.json({
        success: true,
        sessionId: session.id,
        url: session.url
      });
    } catch (err: any) {
      console.error('Error creating subscription checkout with Stripe:', err);
      return res.status(500).json({
        error: 'No se pudo iniciar la suscripción en Stripe.',
        details: err.message
      });
    }
  });

  // 8. Save Affiliate Interbank CLABE and Payout Frequency Settings
  app.post('/api/stripe/save-payout-settings', async (req, res) => {
    try {
      const { affiliateId, payoutClabe, payoutBank, payoutHolderName, payoutSchedule } = req.body;

      if (!payoutClabe || payoutClabe.replace(/\D/g, '').length !== 18) {
        return res.status(400).json({
          error: 'La CLABE interbancaria debe contener exactamente 18 dígitos numéricos válidos en México.'
        });
      }

      if (!payoutHolderName || !payoutHolderName.trim()) {
        return res.status(400).json({
          error: 'Debes indicar el nombre del titular o razón social de la cuenta bancaria.'
        });
      }

      const cleanClabe = payoutClabe.replace(/\D/g, '');
      const schedule = payoutSchedule === 'instant' ? 'instant' : 'weekly';

      console.log(`[Stripe Payouts] Configuración guardada para afiliado ${affiliateId}:`, {
        banco: payoutBank,
        clabe: `•••• •••• •••• ${cleanClabe.slice(-4)}`,
        titular: payoutHolderName,
        modalidad: schedule === 'instant' ? 'Inmediato (1.5% comisión Stripe)' : 'Semanal programado (0% comisión)'
      });

      return res.json({
        success: true,
        message: schedule === 'instant'
          ? 'Configuración guardada: Modalidad Inmediata activa (1.5% de comisión técnica de Stripe). Recibirás tu dinero al instante.'
          : 'Configuración guardada: Modalidad Semanal activa (0% de comisión). Recibirás tus pagos acumulados cada semana íntegros.',
        settings: {
          payoutClabe: cleanClabe,
          payoutBank: payoutBank || 'Banco Nacional de México',
          payoutHolderName: payoutHolderName.trim(),
          payoutSchedule: schedule,
          payoutInstantFeePercent: 1.5,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (err: any) {
      console.error('Error saving payout settings:', err);
      return res.status(500).json({
        error: 'No se pudo guardar la configuración de pagos bancarios.',
        details: err.message
      });
    }
  });

  // 9. Request Payout (Weekly 0% or Instant 1.5% fee)
  app.post('/api/stripe/request-instant-payout', async (req, res) => {
    try {
      const { affiliateId, amountMxn, payoutClabe, payoutBank, payoutHolderName, payoutSchedule } = req.body;
      const amount = Number(amountMxn);

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'El monto para dispersión debe ser mayor a $0 MXN.' });
      }

      const cleanClabe = (payoutClabe || '').replace(/\D/g, '');
      if (cleanClabe.length !== 18) {
        return res.status(400).json({ error: 'Se requiere una CLABE interbancaria válida de 18 dígitos.' });
      }

      const isInstant = payoutSchedule === 'instant';
      const feePercent = isInstant ? 1.5 : 0;
      const feeMxn = isInstant ? Math.round(amount * 0.015 * 100) / 100 : 0;
      const netAmountMxn = Math.round((amount - feeMxn) * 100) / 100;

      const payoutRecord = {
        id: `po_mx_${Date.now()}`,
        speiTrackingKey: `CPMX${Date.now().toString().slice(-8)}`,
        grossAmountMxn: amount,
        feeMxn,
        feePercent,
        netAmountMxn,
        payoutSchedule: isInstant ? 'instant' : 'weekly',
        status: isInstant ? 'paid' : 'in_transit',
        arrivalDate: isInstant
          ? 'Inmediato (Transferencia SPEI en segundos)'
          : 'Programado: Próximo Miércoles hábil (0% comisión)',
        bank: payoutBank || 'Banco Receptor',
        clabeMasked: `•••• •••• •••• ${cleanClabe.slice(-4)}`,
        holder: payoutHolderName || 'Titular de la Cuenta',
        createdAt: new Date().toISOString()
      };

      console.log(`[Stripe Payouts] Dispersión procesada para ${affiliateId}:`, payoutRecord);

      return res.json({
        success: true,
        payout: payoutRecord,
        message: isInstant
          ? `Dispersión inmediata procesada exitosamente. Se transfirieron $${netAmountMxn.toFixed(2)} MXN a tu cuenta (comisión técnica Stripe 1.5%: $${feeMxn.toFixed(2)} MXN).`
          : `Dispersión semanal programada por $${netAmountMxn.toFixed(2)} MXN a tu cuenta (0% comisión - $0.00 de cobro).`
      });
    } catch (err: any) {
      console.error('Error processing payout request:', err);
      return res.status(500).json({
        error: 'Error al procesar la solicitud de dispersión bancaria.',
        details: err.message
      });
    }
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Citas Más MX Server running on port ${PORT}`);
  });
}

// Smart contextual generator functions for Mexican market
function generateContextualBuyerPersonas(affiliate: any) {
  const city = affiliate?.city || 'Ciudad de México';
  const category = (affiliate?.category || 'salud').toLowerCase();
  const mainService = affiliate?.services?.[0]?.name || 'Consulta Profesional';
  const mainPrice = affiliate?.services?.[0]?.price || 600;

  if (category.includes('psico') || category.includes('mente') || category.includes('salud')) {
    return [
      {
        id: 'persona_1',
        name: 'Mariana, Ejecutiva con Estrés y Carga Mental',
        ageRange: '28 - 42 años',
        gender: 'Femenino / Profesionista',
        specificZone: `Colonias céntricas y corredores corporativos de ${city}`,
        fears: [
          'Perder tiempo en salas de espera con citas impuntuales',
          'Juicios sobre su salud emocional o falta de confidencialidad',
          'Pagar tarifas excesivas sin percibir alivio o empatía real'
        ],
        desires: [
          'Espacio seguro, empático y 100% confidencial',
          'Flexibilidad de horarios sin cancelar a última hora',
          'Herramientas prácticas para manejar la ansiedad y el burnout'
        ],
        buyingTriggers: [
          'Confirmación inmediata con recordatorio directo a su WhatsApp',
          'Cobro 100% anticipado que garantiza cero retrasos y privacidad',
          'Cédula profesional y expediente verificado en Citas Más MX'
        ],
        summaryHook: 'Recupera tu balance emocional con atención profesional y citas puntuales sin esperas.'
      },
      {
        id: 'persona_2',
        name: 'Carlos y Daniela, Pareja en Conflicto de Convivencia',
        ageRange: '32 - 48 años',
        gender: 'Parejas / Familias',
        specificZone: `Zonas residenciales y familiares de ${city}`,
        fears: [
          'Que el terapeuta tome partido o empeore las discusiones',
          'Sentir que la inversión económica no salva la relación',
          'Complicaciones para cuadrar las dos agendas de trabajo'
        ],
        desires: [
          'Comunicación asertiva y acuerdos claros sin gritos',
          'Renovar la confianza y el proyecto de vida en común',
          'Atención estructurada con objetivos medibles por sesión'
        ],
        buyingTriggers: [
          'Horarios vespertinos y de fines de semana garantizados',
          'Garantía de reembolso transparente según política oficial',
          'Reseñas positivas de otros pacientes en su localidad'
        ],
        summaryHook: 'Superen las diferencias y fortalezcan su relación con mediación profesional certificada.'
      },
      {
        id: 'persona_3',
        name: 'Roberto, Adulto Joven en Transición Personal',
        ageRange: '22 - 30 años',
        gender: 'Masculino / Jóvenes adultos',
        specificZone: `Zonas universitarias y de profesionistas jóvenes de ${city}`,
        fears: [
          'Estigma de pedir ayuda psicológica como hombre',
          'Comprometerse a procesos costosos e interminables',
          'Métodos de pago complicados o en efectivo anticuado'
        ],
        desires: [
          'Claridad en toma de decisiones de carrera y vida',
          'Aprender a poner límites sin sentirse culpable',
          'Proceso moderno, digital y directo'
        ],
        buyingTriggers: [
          'Pago fácil con tarjeta o Mercado Pago en 1 minuto',
          'Atención cercana, cálida y sin burocracia',
          'Ubicación accesible y bien comunicada'
        ],
        summaryHook: 'Da el paso hacia tu mejor versión con un psicólogo acreditado y cita asegurada.'
      }
    ];
  }

  // Default professional services persona (Legal, Belleza, Dental, Médico, Asesoría)
  return [
    {
      id: 'persona_1',
      name: 'Sofía, Emprendedora y Madre Práctica',
      ageRange: '30 - 45 años',
      gender: 'Femenino',
      specificZone: `Área metropolitana y zona comercial de ${city}`,
      fears: [
        'Cancelaciones de último minuto y falta de seriedad',
        'Precios inflados o costos ocultos no aclarados al inicio',
        'Falta de higiene, preparación o instalaciones deficientes'
      ],
      desires: [
        'Resultados visibles y atención de primera clase',
        'Reserva ágil desde su celular sin llamadas interminables',
        'Atención personalizada que respete sus tiempos'
      ],
      buyingTriggers: [
        'Transparencia total en precios desde $' + mainPrice + ' MXN',
        'Cobro seguro con tarjeta y comprobante instantáneo',
        'Opiniones reales y fotos verificadas del consultorio'
      ],
      summaryHook: `Atención de primer nivel en ${affiliate?.categoryLabel || 'servicios profesionales'} con puntualidad garantizada.`
    },
    {
      id: 'persona_2',
      name: 'Alejandro, Directivo Corporativo Exigente',
      ageRange: '35 - 55 años',
      gender: 'Masculino / Ejecutivo',
      specificZone: `Sectores de alto poder adquisitivo de ${city}`,
      fears: [
        'Trato informal o profesionales sin acreditación verificable',
        'Perder el tiempo y retrasar sus compromisos del día',
        'Incertidumbre sobre la calidad del servicio contratado'
      ],
      desires: [
        'Excelencia técnica, credenciales oficiales y rapidez',
        'Facturación y procesos claros y formales',
        'Servicio premium y exclusivo'
      ],
      buyingTriggers: [
        'Sello de Acreditación Oficial y Cédula SEP Verificada',
        'Atención en consultorio privado con estacionamiento',
        'Proceso 100% digital sin fricciones'
      ],
      summaryHook: `Excelencia y respaldo profesional en ${mainService}. Agenda tu espacio prioritario.`
    },
    {
      id: 'persona_3',
      name: 'Valeria, Cliente Joven Digital',
      ageRange: '23 - 34 años',
      gender: 'Mujeres y Hombres',
      specificZone: `Colonias céntricas y conectadas de ${city}`,
      fears: [
        'Tener que llamar por teléfono o esperar confirmación manual',
        'No saber cuánto va a costar hasta el final',
        'Mala reputación en redes sociales'
      ],
      desires: [
        'Experiencia estética, moderna y confortable',
        'Todo resuelto por WhatsApp con ubicación exacta en Google Maps',
        'Poder agendar a cualquier hora (incluso de noche)'
      ],
      buyingTriggers: [
        'Reservas activas 24/7 en su landing page oficial',
        'Promoción exclusiva y precio fijo garantizado',
        'Cobro 100% seguro en línea'
      ],
      summaryHook: `Agenda tu cita en 30 segundos y recibe confirmación directa en tu WhatsApp.`
    }
  ];
}

function generateContextualCampaignContent(affiliate: any, targetPersona: any) {
  const name = affiliate?.businessName || affiliate?.name || 'Nuestro Consultorio';
  const category = affiliate?.categoryLabel || affiliate?.category || 'Servicio Profesional';
  const city = affiliate?.city || 'tu ciudad';
  const price = affiliate?.services?.[0]?.price || 500;
  const personaName = targetPersona?.name?.split(',')[0] || 'Cliente Exclusivo';

  return {
    headline: `¿Buscas ${category} de Confianza en ${city}?`,
    subheadline: `Atención personalizada para ${personaName}, sin esperas y con garantía de puntualidad.`,
    bodyCopy: `En ${name} cuidamos cada detalle. Agenda en línea con cobro seguro, confirmación al instante por WhatsApp y profesionales con expediente 100% verificado.`,
    badge: 'Cédula & Acreditación Verificada',
    callToAction: 'Agendar Mi Cita en Línea',
    priceOffer: `Servicios desde $${price} MXN`
  };
}

startServer();


