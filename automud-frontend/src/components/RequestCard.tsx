// src/components/RequestCard.tsx - Con Gallery Swipeable
import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Eye, Fuel, Image as ImageIcon, Settings2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type AutoRequest, FuelTypeEnum, TransmissionTypeEnum, CarConditionEnum, EngineConditionEnum } from '@/lib/types';

interface Props {
  request: AutoRequest;
  onView: (req: AutoRequest) => void;
}

// 🚀 HOOK PER SWIPE GESTURES
const useSwipeGesture = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const minSwipeDistance = 50
  const maxVerticalDistance = 100 // Previene swipe verticali accidentali

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = Math.abs(touchStart.y - touchEnd.y)
    
    // Ignora se movimento troppo verticale
    if (distanceY > maxVerticalDistance) return
    
    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance

    if (isLeftSwipe) onSwipeLeft()
    if (isRightSwipe) onSwipeRight()
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}

// 🎯 LAZY IMAGE PER CARDS
const LazyCardImage: React.FC<{
  src: string
  alt: string
  className?: string
  priority?: boolean
}> = ({ src, alt, className, priority = false }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (priority || isInView) return

    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(img)
    return () => observer.disconnect()
  }, [priority, isInView])

  return (
    <div ref={imgRef} className={`relative ${className || ''}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-700/50 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 bg-slate-600 rounded" />
        </div>
      )}

      {(isInView || priority) && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`${className || ''} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading={priority ? "eager" : "lazy"}
        />
      )}

      {hasError && (
        <div className="absolute inset-0 bg-slate-700/50 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-slate-400" />
        </div>
      )}
    </div>
  )
}

// 🖼️ GALLERY SWIPEABLE COMPONENT
const SwipeableGallery: React.FC<{
  images: string[]
  requestId: string
  getImageUrl: (id: string, name: string) => string
  className?: string
}> = ({ images, requestId, getImageUrl, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)

  // Navigation functions
  const goToPrevious = useCallback(() => {
    if (isNavigating) return
    setIsNavigating(true)
    setCurrentIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
    setTimeout(() => setIsNavigating(false), 300)
  }, [images.length, isNavigating])

  const goToNext = useCallback(() => {
    if (isNavigating) return
    setIsNavigating(true)
    setCurrentIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
    setTimeout(() => setIsNavigating(false), 300)
  }, [images.length, isNavigating])

  // Swipe gesture hook
  const swipeHandlers = useSwipeGesture(goToNext, goToPrevious)

  if (images.length === 0) {
    return (
      <div className={`relative bg-slate-700/50 flex items-center justify-center ${className}`}>
        <ImageIcon className="text-slate-400 w-8 sm:w-12 h-8 sm:h-12" />
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <LazyCardImage
          src={getImageUrl(requestId, images[0])}
          alt="Immagine veicolo"
          className="w-full h-full object-cover object-center"
          priority={true}
        />
      </div>
    )
  }

  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      {...swipeHandlers}
    >
      {/* Immagine corrente */}
      <LazyCardImage
        src={getImageUrl(requestId, images[currentIndex])}
        alt={`Immagine ${currentIndex + 1}`}
        className="w-full h-full object-cover object-center transition-transform duration-300 hover:scale-105"
        priority={currentIndex === 0}
      />

      {/* Overlay gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

      {/* Controlli navigazione - Visibili solo su hover/touch */}
      <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToPrevious()
          }}
          className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors touch-manipulation z-10"
          disabled={isNavigating}
          aria-label="Immagine precedente"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToNext()
          }}
          className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors touch-manipulation z-10"
          disabled={isNavigating}
          aria-label="Immagine successiva"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Indicatori dots - Mobile friendly */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex(index)
            }}
            className={`w-1.5 h-1.5 rounded-full transition-all touch-manipulation ${
              index === currentIndex
                ? 'bg-white scale-110'
                : 'bg-white/60 hover:bg-white/80'
            }`}
            aria-label={`Vai all'immagine ${index + 1}`}
          />
        ))}
        {images.length > 5 && (
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">+</span>
          </div>
        )}
      </div>

      {/* Contatore immagini - Top right */}
      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium">
        {currentIndex + 1}/{images.length}
      </div>

      {/* Indicatore swipe per mobile - Solo se touch device */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-xs hidden touch:block">
        ← Swipe →
      </div>
    </div>
  )
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

  return (
    <div className="rounded-lg overflow-hidden bg-slate-800/90 border border-slate-700/50 hover:border-orange-500/70 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 backdrop-blur-sm">
      
      {/* Gallery Swipeable - Responsive aspect ratio */}
      <div className="relative">
        <SwipeableGallery
          images={request.Images}
          requestId={request.Id}
          getImageUrl={getImageUrl}
          className="aspect-[4/3] sm:aspect-[4/3] lg:aspect-[4/3]"
        />

        {/* Badge ID richiesta - Mobile friendly */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20">
          <Badge variant="secondary" className="bg-orange-500/90 backdrop-blur-sm text-white border-0 font-semibold shadow-lg text-xs sm:text-sm">
            {request.Id}
          </Badge>
        </div>

        {/* Badge prezzo - Mobile responsive */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-20">
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