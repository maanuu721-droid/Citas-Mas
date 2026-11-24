import React, { useState } from 'react';
import { Affiliate } from '../types.ts';
import { Share2, Copy, CheckCircle2, Download, ExternalLink } from 'lucide-react';

interface Props {
  affiliate: Affiliate;
  onPreviewLanding?: (affiliate: Affiliate) => void;
}

export const ShareQuickPanel: React.FC<Props> = ({ affiliate, onPreviewLanding }) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://citasmas.com/agenda/${affiliate.id}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareUrl)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
          <Share2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Tu Link y QR de Agenda Rápida</h3>
          <p className="text-xs text-gray-500">Comparte tu calendario con todos tus servicios y horarios disponibles</p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
        <span className="text-sm text-blue-600 font-medium flex-1 truncate">{shareUrl}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-colors"
        >
          {copied ? <><CheckCircle2 className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col items-center gap-3 bg-gray-50 rounded-xl p-4">
          <img src={qrApiUrl} alt="QR Code Agenda CitasMás" className="w-32 h-32 rounded-lg bg-white p-1 border border-gray-200" />
          <a
            href={qrApiUrl}
            download={`citasmas-qr-${affiliate.id}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Download className="w-3 h-3" /> Descargar QR
          </a>
        </div>

        <div className="flex-1 flex flex-col gap-2 text-sm text-gray-600">
          <p className="text-xs font-semibold text-gray-800 uppercase tracking-wide">¿Qué ve tu cliente?</p>
          <ul className="text-xs space-y-1.5">
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Tu nombre y perfil profesional</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Todos tus servicios y precios</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Calendario con horarios disponibles</li>
            <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Botón de agendar cita directo</li>
          </ul>
          {onPreviewLanding ? (
            <button
              onClick={() => onPreviewLanding(affiliate)}
              className="mt-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              <ExternalLink className="w-3 h-3" /> Abrir vista previa del calendario
            </button>
          ) : (
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-bold"
            >
              <ExternalLink className="w-3 h-3" /> Ver mi página pública
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
