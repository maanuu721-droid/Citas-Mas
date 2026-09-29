import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { optimizeAndConvertImage } from '../utils/imageUpload.ts';

interface Props {
  id: string;
  label: string;
  description?: string;
  currentValue?: string;
  placeholderText?: string;
  aspectRatio?: 'square' | 'banner' | 'video';
  maxWidth?: number;
  maxHeight?: number;
  onChange: (base64Url: string) => void;
  onRemove?: () => void;
}

export const ImageUploader: React.FC<Props> = ({
  id,
  label,
  description,
  currentValue,
  placeholderText = 'Arrastra una imagen o haz clic en Subir',
  aspectRatio = 'square',
  maxWidth = 1200,
  maxHeight = 1200,
  onChange,
  onRemove
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMessage('');
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    // Limit original file size to 15MB to prevent browser crash before canvas resize
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('La imagen es demasiado pesada. El límite máximo es de 15MB.');
      return;
    }

    try {
      setIsProcessing(true);
      const base64 = await optimizeAndConvertImage(file, maxWidth, maxHeight, 0.85);
      onChange(base64);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar y subir la imagen.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input value so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Aspect ratio classes for preview
  const containerAspectClass =
    aspectRatio === 'banner'
      ? 'h-40 sm:h-48 w-full'
      : aspectRatio === 'video'
      ? 'aspect-video w-full'
      : 'w-28 h-28 sm:w-32 sm:h-32';

  const isBase64 = currentValue?.startsWith('data:image/');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block font-semibold text-slate-800 text-xs">
          {label}
        </label>
        {currentValue && (
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{isBase64 ? 'Imagen lista en sistema' : 'Imagen activa'}</span>
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-slate-500">{description}</p>}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/png, image/jpeg, image/jpg, image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Zone / Preview Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 transition-all p-3 flex flex-col items-center justify-center ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/70 scale-[1.01]'
            : currentValue
            ? 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
            : 'border-dashed border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 hover:border-emerald-400'
        }`}
      >
        {isProcessing ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-600">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold">Procesando y optimizando imagen...</span>
            <span className="text-[10px] text-slate-600">Optimizando tamaño y formato</span>
          </div>
        ) : currentValue ? (
          <div className="w-full flex flex-col sm:flex-row items-center gap-4">
            {/* Image Preview */}
            <div
              className={`${containerAspectClass} shrink-0 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xs relative group`}
            >
              <img
                src={currentValue}
                alt={label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Actions for current image */}
            <div className="flex-1 text-center sm:text-left space-y-2 w-full">
              <div className="text-xs text-slate-700">
                <span className="font-semibold text-slate-900 block">Imagen cargada correctamente</span>
                <span className="text-[11px] text-slate-600">
                  {isBase64
                    ? 'Subida directamente desde tus archivos y lista para guardar.'
                    : 'Imagen vinculada en tu perfil.'}
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start space-x-2 pt-1">
                <button
                  type="button"
                  id={`${id}-upload-replace-btn`}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir otra imagen</span>
                </button>

                {onRemove && (
                  <button
                    type="button"
                    id={`${id}-remove-btn`}
                    onClick={onRemove}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty state: Call to action to upload */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-6 flex flex-col items-center justify-center cursor-pointer text-center space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">{placeholderText}</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                PNG, JPG o WebP. Se optimiza automáticamente para carga rápida.
              </p>
            </div>
            <button
              type="button"
              id={`${id}-upload-btn`}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Subir Imagen / Upload</span>
            </button>
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
