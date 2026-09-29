import React, { useState, useMemo } from 'react';
import {
  CATEGORIES_CATALOG,
  ALL_SUBCATEGORIES,
  SubCategoryItem,
  resolveCategory
} from '../data/categoriesData.ts';
import {
  HeartPulse,
  Sparkles,
  Briefcase,
  GraduationCap,
  Dumbbell,
  Wrench,
  Car,
  Dog,
  Layers,
  Search,
  Check,
  Tag
} from 'lucide-react';

const MAIN_CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  salud_bienestar: HeartPulse,
  belleza_cuidado: Sparkles,
  servicios_profesionales: Briefcase,
  educacion_formacion: GraduationCap,
  fitness_deporte: Dumbbell,
  hogar_tecnicos: Wrench,
  automocion_movilidad: Car,
  mascotas: Dog,
  otros_servicios: Layers
};

interface CategorySelectorProps {
  value: string;
  onChange: (subcategoryId: string, label: string, mainCategoryId: string, mainCategoryName: string) => void;
  id?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onChange,
  id = 'category-selector',
  label = 'Especialidad / Giro Comercial *',
  required = true,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Resolved current subcategory item
  const currentItem = useMemo(() => {
    return resolveCategory(value) || ALL_SUBCATEGORIES[0];
  }, [value]);

  // Filtered subcategories if user searches
  const filteredSubcategories = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return ALL_SUBCATEGORIES.filter((sub) => {
      const matchLabel = sub.label.toLowerCase().includes(term);
      const matchMain = sub.mainCategoryName.toLowerCase().includes(term);
      const matchKeywords = sub.keywords?.some((k) => k.toLowerCase().includes(term));
      return matchLabel || matchMain || matchKeywords;
    });
  }, [searchTerm]);

  const handleSelectSubcategory = (item: SubCategoryItem) => {
    onChange(item.id, item.label, item.mainCategoryId, item.mainCategoryName);
    setIsSearchActive(false);
    setSearchTerm('');
  };

  const CurrentIcon = MAIN_CATEGORY_ICONS[currentItem.mainCategoryId] || Tag;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-bold text-slate-800">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setIsSearchActive(!isSearchActive)}
          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 cursor-pointer"
        >
          <Search className="w-3 h-3" />
          <span>{isSearchActive ? 'Ver listado por grupos' : 'Buscar por palabra clave'}</span>
        </button>
      </div>

      {isSearchActive ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Ej. dentista, psicólogo, fotógrafo, plomero, uñas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {searchTerm.trim() && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-xs divide-y divide-slate-100">
              {filteredSubcategories.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  No se encontraron categorías con "{searchTerm}". Usa el selector desplegable abajo.
                </div>
              ) : (
                filteredSubcategories.map((sub) => {
                  const isSelected = sub.id === currentItem.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubcategory(sub)}
                      className={`w-full text-left p-2.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-emerald-50 font-bold text-emerald-900' : 'text-slate-800'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{sub.label}</p>
                        <p className="text-[10px] text-slate-500">{sub.mainCategoryName}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Select Dropdown with 9 OptGroups */}
      <div className="relative">
        <select
          id={id}
          value={currentItem.id}
          onChange={(e) => {
            const found = ALL_SUBCATEGORIES.find((s) => s.id === e.target.value);
            if (found) {
              handleSelectSubcategory(found);
            }
          }}
          required={required}
          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
        >
          {CATEGORIES_CATALOG.map((group) => (
            <optgroup key={group.id} label={group.name} className="font-bold text-slate-900 bg-slate-100">
              {group.subcategories.map((sub) => (
                <option key={sub.id} value={sub.id} className="font-normal text-slate-800 bg-white py-1">
                  {sub.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Active Category Information Badge */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-start space-x-2.5 text-xs">
        <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
          <CurrentIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              {currentItem.mainCategoryName}
            </span>
          </div>
          <p className="font-bold text-slate-900 text-xs mt-1 leading-snug truncate">
            {currentItem.label}
          </p>
        </div>
      </div>
    </div>
  );
};
