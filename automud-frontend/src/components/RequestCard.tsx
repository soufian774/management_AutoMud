// src/components/RequestCard.tsx
import { Calendar, Eye, Fuel, Image, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { type AutoRequest, FuelTypeEnum, TransmissionTypeEnum, CarConditionEnum, EngineConditionEnum } from '@/lib/types';

interface Props {
  request: AutoRequest;
  onView: (req: AutoRequest) => void;
}

export function RequestCard({ request, onView }: Props) {
  const getImageUrl = (id: string, name: string) =>
    `https://automudblobstorage.blob.core.windows.net/automudformimages/${id}/${name}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  // Funzioni per i colori corrette (adattate ai tuoi enum)
  const getCarConditionColor = (code: number) => {
    switch (code) {
      case 30: return 'default';      // 'Usato' = Verde (migliore)
      case 20: return 'secondary';    // 'Guasto' = Giallo (medio)  
      case 10: return 'destructive';  // 'Incidentato' = Rosso (peggiore)
      default: return 'outline';      // 'N/A'
    }
  };

  const getEngineConditionColor = (code: number) => {
    switch (code) {
      case 10: return 'default';      // 'Avvia e si muove' = Verde (migliore)
      case 20: return 'secondary';    // 'Avvia ma non si muove' = Giallo (medio)
      case 30: return 'destructive';  // 'Non avvia' = Rosso (peggiore)
      default: return 'outline';      // 'N/A'
    }
  };

  const mainImage = request.Images[0] ? getImageUrl(request.Id, request.Images[0]) : null;

  return (
    <div className="rounded-lg overflow-hidden bg-slate-800/90 border border-slate-700/50 hover:border-orange-500/70 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 backdrop-blur-sm">
      {/* Immagine principale - Responsive aspect ratio */}
      <div className="relative aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/3] bg-slate-700/50 overflow-hidden">
        {mainImage ? (
          <img
            src={mainImage}
            alt={`${request.Make} ${request.Model}`}
            className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Fallback per immagine mancante */}
        <div className={`absolute inset-0 flex justify-center items-center bg-slate-700/50 ${mainImage ? 'hidden' : 'flex'}`}>
          <Image className="text-slate-400 w-8 sm:w-12 h-8 sm:h-12" />
        </div>

        {/* Overlay gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/30" />
        
        {/* Badge ID richiesta - Mobile friendly */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          <Badge variant="secondary" className="bg-orange-500/90 backdrop-blur-sm text-white border-0 font-semibold shadow-lg text-xs sm:text-sm">
            {request.Id}
          </Badge>
        </div>
        
        {/* Badge numero immagini - Mobile friendly */}
        {request.Images.length > 0 && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <Badge variant="outline" className="text-white bg-slate-900/80 border-slate-600/50 backdrop-blur-sm shadow-lg text-xs">
              📷 {request.Images.length}
            </Badge>
          </div>
        )}

        {/* Badge prezzo - Mobile responsive */}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
          <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 font-bold text-xs sm:text-sm shadow-lg">
            € {request.DesiredPrice.toLocaleString('it-IT')}
          </Badge>
        </div>
      </div>

      {/* Contenuto card - Mobile optimized */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* Titolo veicolo - Mobile responsive */}
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
            {request.Make} {request.Model}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Anno {request.RegistrationYear} • {request.Km.toLocaleString()} km
          </p>
        </div>

        {/* Dettagli tecnici - Mobile stack vertically */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-1">
            <Fuel className="w-3 sm:w-4 h-3 sm:h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{FuelTypeEnum[request.FuelType]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings2 className="w-3 sm:w-4 h-3 sm:h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">{TransmissionTypeEnum[request.TransmissionType]}</span>
          </div>
        </div>

        {/* Condizioni - Mobile friendly badges */}
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          <Badge variant={getCarConditionColor(request.CarCondition)} className="text-xs">
            {CarConditionEnum[request.CarCondition]}
          </Badge>
          <Badge variant={getEngineConditionColor(request.EngineCondition)} className="text-xs">
            {EngineConditionEnum[request.EngineCondition]}
          </Badge>
        </div>

        {/* Informazioni di contesto - Mobile compact */}
        <div className="space-y-1 text-xs sm:text-sm">
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
            <span className="truncate">{formatDate(request.DateTime)}</span>
          </div>
          <p className="text-slate-400 truncate">📍 {request.City}</p>
          <p className="text-slate-200 font-medium truncate">
            {request.FirstName} {request.LastName}
          </p>
        </div>

        {/* Bottone azione - Mobile full width */}
        <Button
          className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold transition-colors duration-200 text-sm sm:text-base py-2 sm:py-2.5"
          onClick={() => onView(request)}
        >
          <Eye className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
          Visualizza Dettagli
        </Button>
      </div>
    </div>
  );
}