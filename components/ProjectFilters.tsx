import React from 'react';
import { FilterState } from '../types';
import { Search, Filter, Building } from 'lucide-react';

interface ProjectFiltersProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  availableCategories: string[];
  availableSubcategories: string[];
  availableClientTypes: string[];
  yearStats: { min: number, max: number };
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ 
  filter, 
  setFilter, 
  availableCategories, 
  availableSubcategories,
  availableClientTypes,
  yearStats
}) => {
  const toggleCategory = (cat: string) => {
    setFilter(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const toggleSubcategory = (sub: string) => {
    setFilter(prev => ({
      ...prev,
      subcategories: prev.subcategories.includes(sub)
        ? prev.subcategories.filter(s => s !== sub)
        : [...prev.subcategories, sub]
    }));
  };

  const currentYearRange = filter.yearRange || [yearStats.min, yearStats.max];

  return (
    <div className="bg-white rounded border border-slate-200 overflow-hidden h-fit sticky top-6">
      <div className="bg-hb-navy p-4 flex items-center justify-between">
        <h3 className="font-bold text-white text-[10px] tracking-[0.2em] uppercase flex items-center gap-2">
          <Filter className="w-3.5 h-3.5" />
          Refine Results
        </h3>
        {(filter.search || filter.categories.length > 0 || filter.subcategories.length > 0 || filter.yearRange) && (
          <button 
            onClick={() => setFilter({ search: '', categories: [], subcategories: [], yearRange: undefined })}
            className="text-[9px] font-normal uppercase text-white/70 hover:text-white underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="p-6 space-y-8">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-hb-gray mb-3">Keyword Search</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-hb-gray/40" />
            <input
              type="text"
              placeholder="Search archive..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-[13px] text-slate-700 placeholder:text-slate-300"
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-hb-gray">Date Range</label>
            <span className="text-[11px] font-bold text-hb-navy">
              {currentYearRange[0]} — {currentYearRange[1]}
            </span>
          </div>
          <div className="px-1 space-y-3">
            <input
              type="range"
              min={yearStats.min}
              max={yearStats.max}
              value={currentYearRange[0]}
              onChange={(e) => setFilter(prev => ({ ...prev, yearRange: [parseInt(e.target.value), currentYearRange[1]] }))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-hb-navy"
            />
            <input
              type="range"
              min={yearStats.min}
              max={yearStats.max}
              value={currentYearRange[1]}
              onChange={(e) => setFilter(prev => ({ ...prev, yearRange: [currentYearRange[0], parseInt(e.target.value)] }))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-hb-navy"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-hb-gray mb-3">Category</label>
          <div className="space-y-1.5">
            {availableCategories.map(cat => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group py-0.5">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-hb-navy text-hb-navy cursor-pointer"
                  checked={filter.categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                <span className={`text-[12px] font-normal transition-colors ${filter.categories.includes(cat) ? 'text-hb-navy font-bold' : 'text-slate-600 group-hover:text-hb-navy'}`}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-hb-gray mb-3">Client Type</label>
          <div className="flex flex-wrap gap-1.5">
            {availableClientTypes.map(type => (
              <button
                key={type}
                onClick={() => setFilter(prev => ({ ...prev, search: type }))}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tight transition-all border ${
                  filter.search === type 
                    ? 'bg-hb-navy border-hb-navy text-white' 
                    : 'bg-slate-50 border-slate-200 text-hb-gray hover:border-hb-navy/30'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-[0.1em] text-hb-gray mb-3">
            Subcategory {filter.subcategories.length > 0 && `(${filter.subcategories.length} selected)`}
          </label>
          <div className="flex flex-col gap-1.5">
            {availableSubcategories.map(sub => (
              <button
                key={sub}
                onClick={() => toggleSubcategory(sub)}
                className={`text-left px-3 py-2 rounded text-[11px] font-normal transition-all border ${
                  filter.subcategories.includes(sub)
                    ? 'bg-hb-navy border-hb-navy text-white font-bold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-hb-navy/40 hover:bg-slate-50'
                }`}
              >
                {sub}
              </button>
            ))}
            {availableSubcategories.length === 0 && (
              <p className="text-[11px] text-slate-400 italic py-2 text-center">No matching subcategories</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectFilters;