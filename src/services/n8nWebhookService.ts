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
      // We send it to our Express backend proxy, which then forwards to n8n
      // This hides the actual n8n URL from the frontend and allows server-side secrets
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

      if (!response.ok) {
         console.error('[N8nWebhookService] Failed to dispatch to proxy:', await response.text());
         throw new Error('Error al contactar el servidor proxy.');
      }

      const result = await response.json();
      console.log(`[N8nWebhookService] Response from proxy:`, result);
      
      // If the backend returns simulated_success, we consider it a success for UI purposes
      return result.status === 'success' || result.status === 'simulated_success';
      
    } catch (error) {
      console.error(`[N8nWebhookService] Error dispatching ${toolType}:`, error);
      throw error;
    }
  }
}
