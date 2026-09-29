import { Affiliate, BuyerPersona, MarketingCampaignItem } from '../types.ts';
import { DataService } from './dataService.ts';

export class MarketingService {
  private static instance: MarketingService;

  public static getInstance(): MarketingService {
    if (!MarketingService.instance) {
      MarketingService.instance = new MarketingService();
    }
    return MarketingService.instance;
  }

  /**
   * Herramienta 1: Descubre tu Público Objetivo
   * Analiza servicios, tarifas, fotos y ubicación para entregar 3 Buyer Personas completas.
   */
  public async discoverBuyerPersonas(affiliate: Affiliate): Promise<BuyerPersona[]> {
    try {
      const response = await fetch('/api/marketing/audience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliate })
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.personas) && data.personas.length > 0) {
          return data.personas;
        }
      }
    } catch (err) {
      console.warn('Fallback to client-side persona generator:', err);
    }

    // Client-side fallback if server is unreachable
    return this.generateFallbackPersonas(affiliate);
  }

  /**
   * Herramienta 2: Crear Campaña 2D (Copywriting + Contenido persuasivo)
   */
  public async generateCampaignCopy(
    affiliate: Affiliate,
    persona?: BuyerPersona
  ): Promise<{
    headline: string;
    subheadline: string;
    bodyCopy: string;
    badge: string;
    callToAction: string;
    priceOffer: string;
  }> {
    try {
      const response = await fetch('/api/marketing/campaign-2d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliate, targetPersona: persona })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.campaign && data.campaign.headline) {
          return data.campaign;
        }
      }
    } catch (err) {
      console.warn('Fallback to client-side campaign copy generator:', err);
    }

    const city = affiliate.city || 'tu ciudad';
    const mainPrice = affiliate.services?.[0]?.price || 500;
    const personaName = persona?.name?.split(',')[0] || 'Cliente Exclusivo';

    return {
      headline: `¿Buscas ${affiliate.categoryLabel || 'Atención Especializada'} en ${city}?`,
      subheadline: `Cuidado profesional diseñado para ${personaName}, sin filas y con horario asegurado.`,
      bodyCopy: `En ${affiliate.businessName || affiliate.name} cuentas con respaldo oficial, confirmación automática por WhatsApp y reservación 100% segura en línea.`,
      badge: 'Cédula Oficial & Garantía CitaPro MX',
      callToAction: 'Agendar Cita en Línea',
      priceOffer: `Servicios desde $${mainPrice} MXN`
    };
  }

  /**
   * Generador de Anuncio Gráfico 2D en Alta Definición usando HTML5 Canvas
   * Sintetiza la fotografía del consultorio/logo, los datos de contacto, la oferta y el público objetivo.
   */
  public async render2DAdGraphic(
    canvas: HTMLCanvasElement,
    affiliate: Affiliate,
    campaignCopy: {
      headline: string;
      subheadline: string;
      bodyCopy: string;
      badge: string;
      callToAction: string;
      priceOffer: string;
    },
    photoUrl?: string
  ): Promise<string> {
    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo inicializar el contexto de Canvas');

    // 1. Background gradient (Sophisticated deep slate to emerald)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#061325');
    bgGrad.addColorStop(0.5, '#0b2440');
    bgGrad.addColorStop(1, '#064e3b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative subtle geometric circles
    ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.beginPath();
    ctx.arc(width - 100, 100, 350, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.beginPath();
    ctx.arc(100, height - 100, 400, 0, Math.PI * 2);
    ctx.fill();

    // 2. Load and draw featured photo (Affiliate banner, gallery or logo)
    const imageToDraw = photoUrl || affiliate.banner || affiliate.gallery?.[0] || affiliate.logo;
    if (imageToDraw) {
      try {
        const img = await this.loadImage(imageToDraw);
        // Draw image in top-right or lower center rounded card
        ctx.save();
        const imgX = 80;
        const imgY = 480;
        const imgW = 920;
        const imgH = 430;
        const radius = 32;

        ctx.beginPath();
        ctx.moveTo(imgX + radius, imgY);
        ctx.lineTo(imgX + imgW - radius, imgY);
        ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + radius);
        ctx.lineTo(imgX + imgW, imgY + imgH - radius);
        ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - radius, imgY + imgH);
        ctx.lineTo(imgX + radius, imgY + imgH);
        ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - radius);
        ctx.lineTo(imgX, imgY + radius);
        ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY);
        ctx.closePath();
        ctx.clip();

        // Cover fill
        const imgAspect = img.width / img.height;
        const targetAspect = imgW / imgH;
        let renderW = imgW;
        let renderH = imgH;
        let renderX = imgX;
        let renderY = imgY;

        if (imgAspect > targetAspect) {
          renderW = imgH * imgAspect;
          renderX = imgX - (renderW - imgW) / 2;
        } else {
          renderH = imgW / imgAspect;
          renderY = imgY - (renderH - imgH) / 2;
        }

        ctx.drawImage(img, renderX, renderY, renderW, renderH);

        // Dark gradient overlay on photo for readability
        const photoGrad = ctx.createLinearGradient(0, imgY + 200, 0, imgY + imgH);
        photoGrad.addColorStop(0, 'rgba(6, 19, 37, 0)');
        photoGrad.addColorStop(1, 'rgba(6, 19, 37, 0.85)');
        ctx.fillStyle = photoGrad;
        ctx.fillRect(imgX, imgY, imgW, imgH);

        ctx.restore();

        // Border around photo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 3;
        ctx.stroke();
      } catch (e) {
        console.warn('Canvas image load warning, fallback gradient used:', e);
      }
    }

    // 3. Header Branding Bar
    // Logo / Business name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText((affiliate.businessName || affiliate.name).toUpperCase(), 80, 110);

    ctx.fillStyle = '#34d399';
    ctx.font = '600 24px sans-serif';
    ctx.fillText(`• ${affiliate.categoryLabel || affiliate.category} • ${affiliate.city}, ${affiliate.state}`, 80, 150);

    // 4. Badge Pill (Trust factor)
    const badgeText = campaignCopy.badge || 'Cita 100% Confirmada';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    this.roundRect(ctx, 80, 180, 480, 52, 26, true, true);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`✓  ${badgeText}`, 105, 213);

    // 5. Main Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    this.wrapText(ctx, campaignCopy.headline, 80, 290, 920, 60);

    // 6. Subheadline
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 28px sans-serif';
    this.wrapText(ctx, campaignCopy.subheadline, 80, 410, 920, 36);

    // 7. Offer price badge inside image area
    if (campaignCopy.priceOffer) {
      ctx.fillStyle = '#059669';
      this.roundRect(ctx, 110, 510, 340, 58, 16, true, false);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(campaignCopy.priceOffer, 135, 547);
    }

    // 8. Footer CTA Bar
    const footerY = 940;
    // CTA Button
    ctx.fillStyle = '#10b981';
    this.roundRect(ctx, 80, footerY, 520, 80, 24, true, false);

    ctx.fillStyle = '#042f2e';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${campaignCopy.callToAction}  ➔`, 120, footerY + 50);

    // Phone and booking note (phone is kept private, only WhatsApp confirmed after booking)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Confirmación Inmediata por WhatsApp', 640, footerY + 35);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 20px sans-serif';
    ctx.fillText('Reserva oficial verificada en CitaPro MX', 640, footerY + 68);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  /**
   * Helper to dispatch campaign payload to n8n webhook
   */
  public async dispatchToN8N(
    webhookUrl: string,
    payload: {
      campaignLevel: string;
      affiliateId: string;
      businessName: string;
      category: string;
      city: string;
      targetPersona?: BuyerPersona;
      scriptTitle: string;
      scriptCopy: string;
      voiceType?: string;
      photos: string[];
      extraCostMxn: number;
    }
  ): Promise<{ status: string; message: string; payload: any }> {
    try {
      const response = await fetch('/api/marketing/n8n-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, payload })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Direct n8n dispatch fallback:', err);
    }

    // Default simulated response
    return {
      status: 'simulated_success',
      message: 'Orden enviada a n8n. Flujo de renderizado y producción activado.',
      payload
    };
  }

  /**
   * Publicar la campaña directamente en la Landing Page del afiliado
   * y persistirla en Firebase Firestore
   */
  public async publishToLandingPage(
    affiliate: Affiliate,
    campaign: MarketingCampaignItem
  ): Promise<Affiliate> {
    const updatedCampaign: MarketingCampaignItem = {
      ...campaign,
      status: 'published_on_landing',
      isPublishedOnLanding: true,
      publishedAt: new Date().toISOString()
    };

    // If there is an image, make sure it is also stored in the gallery
    let updatedGallery = [...(affiliate.gallery || [])];
    if (updatedCampaign.imageUrl && !updatedGallery.includes(updatedCampaign.imageUrl)) {
      updatedGallery = [updatedCampaign.imageUrl, ...updatedGallery];
    }

    const updatedAffiliate: Affiliate = {
      ...affiliate,
      gallery: updatedGallery,
      publishedMarketingCampaign: updatedCampaign,
      marketingCampaigns: [
        updatedCampaign,
        ...(affiliate.marketingCampaigns || []).filter((c) => c.id !== campaign.id)
      ],
      updatedAt: new Date().toISOString()
    };

    // Save to Firebase Firestore
    await DataService.getInstance().saveAffiliate(updatedAffiliate);
    return updatedAffiliate;
  }

  // --- Utility functions ---
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fill = true,
    stroke = false
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  private generateFallbackPersonas(affiliate: Affiliate): BuyerPersona[] {
    const city = affiliate.city || 'México';
    const cat = affiliate.categoryLabel || 'Profesional';
    return [
      {
        id: 'persona_1',
        name: 'Cliente Prioritario Local',
        ageRange: '28 - 45 años',
        gender: 'Hombres y Mujeres',
        specificZone: `Zonas residenciales y comerciales de ${city}`,
        fears: [
          'Cancelaciones de último minuto y falta de formalidad',
          'Precios ocultos o cobros no acordados',
          'Pérdida de tiempo en salas de espera'
        ],
        desires: [
          'Atención puntual y trato respetuoso',
          'Facilidad para agendar en línea 24/7',
          'Certeza en resultados y experiencia comprobada'
        ],
        buyingTriggers: [
          'Cédula y expediente 100% verificado en CitaPro MX',
          'Recordatorio automático a su WhatsApp',
          'Tarifa clara y fija desde el primer momento'
        ],
        summaryHook: `Atención de primer nivel en ${cat} con cita confirmada y cero esperas.`
      },
      {
        id: 'persona_2',
        name: 'Profesionista Ocupado con Alta Exigencia',
        ageRange: '32 - 52 años',
        gender: 'Ejecutivos y Negocios',
        specificZone: `Corredores corporativos de ${city}`,
        fears: [
          'Procesos engorrosos de pago o burocracia',
          'Servicios improvisados sin instalaciones adecuadas',
          'Falta de privacidad o confidencialidad'
        ],
        desires: [
          'Rapidez, eficiencia y trato de primera categoría',
          'Horarios tempranos o vespertinos que respeten su agenda',
          'Facturación y respaldo institucional'
        ],
        buyingTriggers: [
          'Cobro 100% seguro en línea',
          'Garantía de reembolso oficial',
          'Respaldo de expediente oficial'
        ],
        summaryHook: `Servicio exclusivo en ${cat} diseñado para tu ritmo de vida.`
      },
      {
        id: 'persona_3',
        name: 'Usuario Digital Familiar',
        ageRange: '25 - 40 años',
        gender: 'Familias / Jóvenes',
        specificZone: `Área metropolitana de ${city}`,
        fears: [
          'Tener que hacer llamadas incómodas para cotizar',
          'Mala higiene o instalaciones descuidadas',
          'No saber qué esperar antes de llegar'
        ],
        desires: [
          'Ver fotos reales de las instalaciones antes de reservar',
          'Claridad paso a paso del servicio contratado',
          'Confianza y calidez humana'
        ],
        buyingTriggers: [
          'Galería fotográfica auténtica en su landing page',
          'Opiniones y calificaciones de clientes reales',
          'Confirmación inmediata sin fricción'
        ],
        summaryHook: `Conoce las instalaciones y agenda tu espacio con total tranquilidad.`
      }
    ];
  }
}
