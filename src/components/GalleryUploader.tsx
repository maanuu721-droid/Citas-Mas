import React, { useState, useRef } from 'react';
import { Upload, Trash2, Plus, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { optimizeAndConvertImage } from '../utils/imageUpload.ts';

interface Props {
  id: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const GalleryUploader: React.FC<Props> = ({
  id,
  images = [],
  onChange,
  maxImages = 8
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFiles = async (files: FileList | File[]) => {
    setErrorMessage('');
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));

    if (fileArray.length === 0) {
      setErrorMessage('Por favor selecciona archivos de imagen válidos.');
      return;
    }

    if (images.length + fileArray.length > maxImages) {
      setErrorMessage(`El límite máximo es de ${maxImages} fotos en la galería.`);
      return;
    }

    try {
      setIsProcessing(true);
      const convertedList: string[] = [];
      for (const file of fileArray) {
        const base64 = await optimizeAndConvertImage(file, 900, 700, 0.82);
        convertedList.push(base64);
      }
      onChange([...images, ...convertedList]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar las imágenes.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="block font-semibold text-slate-800 text-xs">
            Galería de Fotos (Instalaciones, Consultorio o Equipo)
          </label>
          <p className="text-[11px] text-slate-500">
            Sube fotos reales de tu espacio. Se mostrarán en tu landing pública para dar confianza a los clientes.
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-500 font-medium">
          {images.length} / {maxImages} fotos
        </span>
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        multiple
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Grid of images + add button */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {images.map((imgUrl, idx) => (
          <div
            key={idx}
            className="relative h-28 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 group shadow-xs"
          >
            <img
              src={imgUrl}
              alt={`Foto ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                id={`gallery-remove-btn-${idx}`}
                onClick={() => handleRemove(idx)}
                className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs shadow-md transition-transform hover:scale-110"
                title="Eliminar foto"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <span className="absolute bottom-1.5 left-1.5 bg-slate-950/70 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
              #{idx + 1}
            </span>
          </div>
        ))}

        {/* Upload more card */}
        {images.length < maxImages && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-28 rounded-xl border-2 border-dashed transition-all p-3 flex flex-col items-center justify-center cursor-pointer text-center ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/70'
                : 'border-slate-300 bg-slate-50/80 hover:bg-slate-100 hover:border-emerald-400'
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center space-y-1 text-slate-600">
                <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                <span className="text-[10px] font-semibold">Subiendo...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Subir Imágenes</span>
                <span className="text-[10px] text-slate-500">Haz clic o arrastra</span>
              </div>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center space-x-1.5 text-rose-700 text-xs bg-rose-50 p-2 rounded-xl border border-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
