import React, { useState } from 'react';
import {
  Sparkles, Users, Image as ImageIcon, Video, Film,
  RefreshCw, MessageSquare, TrendingUp, Award, FileText, X, ArrowLeft, Zap
} from 'lucide-react';
import { Affiliate, BuyerPersona } from '../types';
import { N8nWebhookService, MarketingToolType } from '../services/n8nWebhookService';
import confetti from 'canvas-confetti';

interface Props {
  affiliate: Affiliate;
  onUpdateAffiliate: (updated: Affiliate) => void;
  onClose?: () => void;
  initialTab?: string;
  onNavigateToLanding?: () => void;
}

interface ToolDefinition {
  id: MarketingToolType;
  title: string;
  description: string;
  icon: React.ReactNode;
  cost: number; // 0 means free/included
  color: string;
}

const MARKETING_TOOLS: ToolDefinition[] = [
  {
    id: 'audience_discovery',
    title: 'Descubre tu Público Objetivo',
    description: 'Nuestra IA analiza tu negocio y define 3 perfiles de clientes ideales hiper-específicos.',
    icon: <Users className="w-6 h-6 text-blue-500" />,
    cost: 0,
    color: 'bg-blue-50 border-blue-100 hover:border-blue-300'
  },
  {
    id: 'campaign_2d',
    title: 'Campaña 2D Standard',
    description: 'Genera un flyer publicitario optimizado con copy persuasivo.',
    icon: <ImageIcon className="w-6 h-6 text-purple-500" />,
    cost: 0,
    color: 'bg-purple-50 border-purple-100 hover:border-purple-300'
  },
  {
    id: 'video_pro',
    title: 'Spot Radial / Video Pro',
    description: 'Video animado con locución de Inteligencia Artificial.',
    icon: <Video className="w-6 h-6 text-orange-500" />,
    cost: 550,
    color: 'bg-orange-50 border-orange-100 hover:border-orange-300'
  },
  {
    id: 'video_premium',
    title: 'Producción Cinema 4K',
    description: 'Video de alta gama con estética cinematográfica.',
    icon: <Film className="w-6 h-6 text-rose-500" />,
    cost: 1250,
    color: 'bg-rose-50 border-rose-100 hover:border-rose-300'
  },
  {
    id: 'retention_flow',
    title: 'Fidelización y Referidos',
    description: 'Activa flujos automatizados de WhatsApp para retención post-cita.',
    icon: <Award className="w-6 h-6 text-emerald-500" />,
    cost: 0,
    color: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300'
  },
  {
    id: 'reengagement_flash',
    title: 'Ofertas Flash IA',
    description: 'Reactiva clientes inactivos con ofertas por WhatsApp.',
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    cost: 0,
    color: 'bg-yellow-50 border-yellow-100 hover:border-yellow-300'
  }
];

export const MarketingToolsView: React.FC<Props> = ({
  affiliate,
  onUpdateAffiliate,
  onClose,
  initialTab
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Tool specific states
  const [voiceType, setVoiceType] = useState('female_warm');
  const [customInstructions, setCustomInstructions] = useState('');

  const handleSelectTool = (tool: ToolDefinition) => {
    setSelectedTool(tool);
    setStatusMessage('');
  };

  const handleBack = () => {
    setSelectedTool(null);
    setStatusMessage('');
    setIsProcessing(false);
  };

  const handleDispatchToN8n = async () => {
    if (!selectedTool) return;
    
    setIsProcessing(true);
    setStatusMessage('Procesando tu solicitud y conectando con los servidores...');

    try {
      const toolData = {
        voiceType: voiceType,
        customInstructions: customInstructions,
        // Add other dynamic fields here based on selected tool
      };

      const n8nService = N8nWebhookService.getInstance();
      await n8nService.dispatchMarketingTool(selectedTool.id, affiliate, toolData);

      setStatusMessage('¡Solicitud enviada exitosamente! Te notificaremos por WhatsApp cuando tu video/campaña esté lista.');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      
    } catch (error: any) {
      console.error("Error dispatching tool:", error);
      setStatusMessage(`Error: ${error.message || 'No se pudo conectar con el servidor.'}`);
    } finally {
      setIsProcessing(false);
    }
  };


  const renderToolDetails = () => {
    if (!selectedTool) return null;

    return (
      <div className="animate-fade-in space-y-6">
        <button onClick={handleBack} className="flex items-center text-gray-500 hover:text-gray-800">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al catálogo
        </button>

        <div className={`p-6 rounded-2xl border ${selectedTool.color}`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              {selectedTool.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedTool.title}</h2>
              <p className="text-gray-600">{selectedTool.description}</p>
            </div>
          </div>

          <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Configuración de la Campaña</h3>
            
            {/* Dynamic Configuration based on Tool ID */}
            {(selectedTool.id === 'video_pro' || selectedTool.id === 'video_premium') && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Voz IA</label>
                  <select 
                    value={voiceType}
                    onChange={(e) => setVoiceType(e.target.value)}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="female_warm">Femenina (Cálida y Empática)</option>
                    <option value="male_professional">Masculina (Profesional y Directa)</option>
                    <option value="cinematic_narrator">Narrador Cinematográfico (Grave)</option>
                  </select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones Adicionales (Opcional)</label>
                   <textarea
                     value={customInstructions}
                     onChange={(e) => setCustomInstructions(e.target.value)}
                     className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                     rows={3}
                     placeholder="Ej: Quiero que mencionen nuestra promoción de 2x1 los martes..."
                   />
                </div>
              </div>
            )}

            {selectedTool.cost > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 flex items-center justify-between">
                <span className="font-medium text-blue-900">Inversión requerida:</span>
                <span className="text-xl font-bold text-blue-700">${selectedTool.cost} MXN</span>
              </div>
            )}

            <button
              onClick={handleDispatchToN8n}
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold flex items-center justify-center transition-all ${
                isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black shadow-lg hover:shadow-xl'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generar con IA (N8N)
                </>
              )}
            </button>

            {statusMessage && (
              <div className={`mt-4 p-4 rounded-lg text-sm ${statusMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {statusMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50/50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="w-6 h-6 text-purple-600 mr-2" />
            Herramientas de Marketing Inteligente
          </h1>
          <p className="text-gray-500 mt-1">Automatiza tu crecimiento con IA y WhatsApp.</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full flex-1 overflow-y-auto">
        {!selectedTool ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETING_TOOLS.map((tool) => (
              <div 
                key={tool.id}
                onClick={() => handleSelectTool(tool)}
                className={`p-6 rounded-2xl border bg-white cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${tool.color}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    {tool.icon}
                  </div>
                  {tool.cost > 0 ? (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full">
                      ${tool.cost} MXN
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                      Incluido
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.title}</h3>
                <p className="text-gray-600 text-sm">{tool.description}</p>
              </div>
            ))}
          </div>
        ) : (
          renderToolDetails()
        )}
      </div>
    </div>
  );
};
