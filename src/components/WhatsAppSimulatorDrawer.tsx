import React from 'react';
import { WhatsAppMessageAudit } from '../types.ts';
import { getWhatsAppDirectUrl } from '../utils/twilioWhatsApp.ts';
import { CheckCheck, MessageSquare, ExternalLink, X, Phone, ShieldCheck } from 'lucide-react';

interface Props {
  messages: WhatsAppMessageAudit[];
  targetPhone?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppSimulatorDrawer: React.FC<Props> = ({
  messages,
  targetPhone = '+52 55 0000 0000',
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const latestMessage = messages[0];

  return (
    <div id="whatsapp-simulator-container" className="fixed bottom-4 right-4 z-50 max-w-md w-full sm:w-96 shadow-2xl rounded-2xl overflow-hidden border border-emerald-300 bg-white transition-all animate-in fade-in slide-in-from-bottom-5">
      {/* WhatsApp Header */}
      <div className="bg-[#075e54] text-white p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white border border-emerald-400">
            <MessageSquare className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-semibold text-sm leading-none">Citas Más Asistente WhatsApp</h4>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 inline" />
            </div>
            <p className="text-[11px] text-emerald-100 mt-0.5">Notificaciones Oficiales WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-mono">
            En línea
          </span>
          <button
            id="close-whatsapp-simulator-btn"
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded hover:bg-emerald-800 transition-colors"
            title="Cerrar vista previa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Target recipient banner */}
      <div className="bg-emerald-50 px-3.5 py-1.5 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-800">
        <div className="flex items-center space-x-1.5 truncate">
          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium">Destino: {targetPhone}</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-700 font-semibold uppercase">Enviado</span>
      </div>

      {/* Messages list */}
      <div className="p-4 bg-[#efeae2] max-h-80 overflow-y-auto space-y-3 bg-[radial-gradient(#d1d7db_1px,transparent_1px)] [background-size:16px_16px]">
        {messages.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-xs">
            No hay mensajes registrados aún en esta sesión.
          </div>
        ) : (
          messages.slice(0, 5).map((msg) => (
            <div
              key={msg.id}
              className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 text-xs text-gray-800 relative space-y-1.5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-1 text-[11px] text-emerald-700 font-semibold">
                <span>{msg.title}</span>
                <span className="text-[10px] text-gray-600">{msg.sentAt}</span>
              </div>
              <p className="whitespace-pre-line text-gray-700 leading-relaxed text-[12px] font-sans">
                {msg.content}
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-gray-50 text-[10px] text-gray-600">
                <span className="font-mono text-emerald-700 font-medium">
                  {msg.twilioSid ? `Folio: ${msg.twilioSid.slice(0, 10)}...` : 'Notificación'}
                </span>
                <span className="flex items-center space-x-1 text-emerald-600">
                  <span>Entregado</span>
                  <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Action */}
      {latestMessage && (
        <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="text-[11px] text-gray-500 truncate">
            Notificaciones instantáneas para México (+52)
          </div>
          <a
            id="open-real-whatsapp-link"
            href={getWhatsAppDirectUrl(targetPhone, latestMessage.content)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 bg-[#25d366] hover:bg-[#20bd5a] text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
          >
            <span>Abrir en WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
};
