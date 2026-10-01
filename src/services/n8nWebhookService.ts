import { Affiliate, BuyerPersona } from '../types';

export type MarketingToolType = 
  | 'audience_discovery' 
  | 'campaign_2d' 
  | 'video_pro' 
  | 'video_premium' 
  | 'retention_flow' 
  | 'reengagement_flash'
  | 'weekly_report';

export interface N8nWebhookPayload {
  toolType: MarketingToolType;
  affiliateId: string;
  businessName: string;
  contactPhone: string;
  contactEmail?: string;
  // Dynamic payload data based on tool
  toolData: any;
  timestamp: string;
}

export class N8nWebhookService {
  private static instance: N8nWebhookService;
  // This should ideally come from env, but hardcoding for now as requested
  private readonly BASE_WEBHOOK_URL = 'https://n8n.bahiago.tech/webhook/marketing-citas-mas';

  private constructor() {}

  public static getInstance(): N8nWebhookService {
    if (!N8nWebhookService.instance) {
      N8nWebhookService.instance = new N8nWebhookService();
    }
    return N8nWebhookService.instance;
  }

  /**
   * Dispatches a request to the n8n webhook.
   */
  public async dispatchMarketingTool(
    toolType: MarketingToolType, 
    affiliate: Affiliate, 
    toolData: any
  ): Promise<boolean> {
    const payload: N8nWebhookPayload = {
      toolType,
      affiliateId: affiliate.id,
      businessName: affiliate.businessName || affiliate.name,
      contactPhone: affiliate.phone,
      contactEmail: affiliate.email,
      toolData,
      timestamp: new Date().toISOString()
    };

    console.log(`[N8nWebhookService] Dispatching tool ${toolType} to n8n:`, payload);

    try {
      // 1. Try Express backend proxy first (preferred for server-side security)
      try {
        const response = await fetch('/api/marketing/n8n-dispatch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
             webhookUrl: this.BASE_WEBHOOK_URL,
             payload
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`[N8nWebhookService] Response from proxy:`, result);
          return result.status === 'success' || result.status === 'simulated_success';
        }
      } catch (proxyError) {
        console.warn('[N8nWebhookService] Proxy unreachable, attempting direct n8n webhook...', proxyError);
      }

      // 2. Direct fallback to n8n webhook
      console.log(`[N8nWebhookService] Dispatching directly to n8n:`, this.BASE_WEBHOOK_URL);
      const directResponse = await fetch(this.BASE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!directResponse.ok) {
        const errText = await directResponse.text().catch(() => '');
        console.error('[N8nWebhookService] Direct dispatch failed:', directResponse.status, errText);
        throw new Error(`Error en el webhook de n8n (${directResponse.status})`);
      }

      return true;
    } catch (error) {
      console.error(`[N8nWebhookService] Error dispatching ${toolType}:`, error);
      throw error;
    }
  }
}
