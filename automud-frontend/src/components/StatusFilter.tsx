// src/components/StatusFilter.tsx - STILE MIGLIORATO ispirato alla reference

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, FileText, Target, RotateCcw, Filter } from 'lucide-react'

export interface StatusFilterState {
  all: boolean;
  dChiamare: boolean;
  inCorso: boolean;
  pratiRitiro: boolean;
  esitoFinale: boolean;
}

export interface StatusCounts {
  all: number;
  dChiamare: number;
  inCorso: number;
  pratiRitiro: number;
  esitoFinale: number;
}

interface StatusFilterProps {
  filters: StatusFilterState;
  counts: StatusCounts;
  onFilterChange: (filters: StatusFilterState) => void;
  isLoading?: boolean;
}

export default function StatusFilter({ 
  filters, 
  counts, 
  onFilterChange, 
  isLoading = false 
}: StatusFilterProps) {

  const handleFilterClick = (filterName: keyof StatusFilterState) => {
    if (filterName === 'all') {
      onFilterChange({
        all: true,
        dChiamare: false,
        inCorso: false,
        pratiRitiro: false,
        esitoFinale: false
      });
    } else {
      const newFilters = {
        ...filters,
        all: false,
        [filterName]: !filters[filterName]
      };
      
      const hasActiveFilter = newFilters.dChiamare || newFilters.inCorso || 
                             newFilters.pratiRitiro || newFilters.esitoFinale;
      
      if (!hasActiveFilter) {
        newFilters.all = true;
      }
      
      onFilterChange(newFilters);
    }
  };

  const resetFilters = () => {
    onFilterChange({
      all: true,
      dChiamare: false,
      inCorso: false,
      pratiRitiro: false,
      esitoFinale: false
    });
  };

  const getFilterCount = (filterName: keyof StatusCounts): number => {
    return counts[filterName] || 0;
  };

  // 🎨 NUOVI STILI - Ispirati alla reference ma adattati al dark theme
  const getButtonStyles = (isActive: boolean, variant: 'all' | 'primary' | 'warning' | 'info' | 'success') => {
    const baseStyle = "transition-all duration-200 cursor-pointer touch-manipulation font-medium text-sm border rounded-lg px-4 py-2.5 flex items-center gap-2 min-h-[44px]";
    
    if (isActive) {
      switch (variant) {
        case 'all':
          return `${baseStyle} bg-slate-600 hover:bg-slate-500 text-white border-slate-500 shadow-md`;
        case 'primary':
          return `${baseStyle} bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md`;
        case 'warning':
          return `${baseStyle} bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-md`;
        case 'info':
          return `${baseStyle} bg-purple-600 hover:bg-purple-500 text-white border-purple-500 shadow-md`;
        case 'success':
          return `${baseStyle} bg-green-600 hover:bg-green-500 text-white border-green-500 shadow-md`;
      }
    } else {
      return `${baseStyle} bg-slate-800/50 hover:bg-slate-700/70 text-slate-300 border-slate-600 hover:border-slate-500 hover:text-white`;
    }
  };

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-700/50 rounded-lg">
            <Filter className="h-4 w-4 text-slate-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Filtra per Stato</h3>
            <p className="text-xs sm:text-sm text-slate-400">Seleziona uno o più stati per filtrare</p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          disabled={isLoading || filters.all}
          className="text-slate-400 hover:text-white hover:bg-slate-700/50 text-xs h-8 px-3"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* 🎯 NUOVI BUTTON STILE REFERENCE - Desktop Layout */}
      <div className="hidden lg:flex items-center gap-3 flex-wrap">
        
        {/* Tutti */}
        <button
          onClick={() => handleFilterClick('all')}
          className={getButtonStyles(filters.all, 'all')}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="font-medium">Tutti</span>
            <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
              {getFilterCount('all')}
            </div>
          </div>
        </button>

        {/* Da chiamare */}
        <button
          onClick={() => handleFilterClick('dChiamare')}
          className={getButtonStyles(filters.dChiamare, 'primary')}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Da chiamare</span>
            <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
              {getFilterCount('dChiamare')}
            </div>
          </div>
        </button>

        {/* In corso */}
        <button
          onClick={() => handleFilterClick('inCorso')}
          className={getButtonStyles(filters.inCorso, 'warning')}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="font-medium">In corso</span>
            <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
              {getFilterCount('inCorso')}
            </div>
          </div>
        </button>

        {/* Prati-ritiro */}
        <button
          onClick={() => handleFilterClick('pratiRitiro')}
          className={getButtonStyles(filters.pratiRitiro, 'info')}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Prati-ritiro</span>
            <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
              {getFilterCount('pratiRitiro')}
            </div>
          </div>
        </button>

        {/* Esito finale */}
        <button
          onClick={() => handleFilterClick('esitoFinale')}
          className={getButtonStyles(filters.esitoFinale, 'success')}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="font-medium">Esito finale</span>
            <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
              {getFilterCount('esitoFinale')}
            </div>
          </div>
        </button>
      </div>

      {/* 📱 MOBILE LAYOUT - Grid compatto */}
      <div className="lg:hidden grid grid-cols-2 gap-3">
        
        {/* Tutti - Mobile */}
        <button
          onClick={() => handleFilterClick('all')}
          className={`${getButtonStyles(filters.all, 'all')} flex-col text-center min-h-[60px]`}
          disabled={isLoading}
        >
          <div className="flex items-center gap-1 mb-1">
            <Target className="h-3 w-3" />
            <span className="text-xs font-medium">Tutti</span>
          </div>
          <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {getFilterCount('all')}
          </div>
        </button>

        {/* Da chiamare - Mobile */}
        <button
          onClick={() => handleFilterClick('dChiamare')}
          className={`${getButtonStyles(filters.dChiamare, 'primary')} flex-col text-center min-h-[60px]`}
          disabled={isLoading}
        >
          <div className="flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs font-medium">Da chiamare</span>
          </div>
          <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {getFilterCount('dChiamare')}
          </div>
        </button>

        {/* In corso - Mobile */}
        <button
          onClick={() => handleFilterClick('inCorso')}
          className={`${getButtonStyles(filters.inCorso, 'warning')} flex-col text-center min-h-[60px]`}
          disabled={isLoading}
        >
          <div className="flex items-center gap-1 mb-1">
            <RotateCcw className="h-3 w-3" />
            <span className="text-xs font-medium">In corso</span>
          </div>
          <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {getFilterCount('inCorso')}
          </div>
        </button>

        {/* Prati-ritiro - Mobile */}
        <button
          onClick={() => handleFilterClick('pratiRitiro')}
          className={`${getButtonStyles(filters.pratiRitiro, 'info')} flex-col text-center min-h-[60px]`}
          disabled={isLoading}
        >
          <div className="flex items-center gap-1 mb-1">
            <FileText className="h-3 w-3" />
            <span className="text-xs font-medium">Prati-ritiro</span>
          </div>
          <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
            {getFilterCount('pratiRitiro')}
          </div>
        </button>

        {/* Esito finale - Mobile Span 2 colonne */}
        <div className="col-span-2">
          <button
            onClick={() => handleFilterClick('esitoFinale')}
            className={`${getButtonStyles(filters.esitoFinale, 'success')} w-full justify-center`}
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Esito finale</span>
              <div className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                {getFilterCount('esitoFinale')}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-slate-300">Caricamento...</span>
          </div>
        </div>
      )}

      {/* Info sui filtri attivi */}
      {!filters.all && (
        <div className="mt-4 pt-4 border-t border-slate-600/50">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="h-3 w-3" />
            <span>
              {[filters.dChiamare && 'Da chiamare', filters.inCorso && 'In corso', 
                filters.pratiRitiro && 'Prati-ritiro', filters.esitoFinale && 'Esito finale']
                .filter(Boolean).join(', ')} attivi
            </span>
          </div>
        </div>
      )}
    </div>
  )
}