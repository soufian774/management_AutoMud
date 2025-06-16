// AutoScout24 Style RequestCard.tsx - LAYOUT OTTIMIZZATO
import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Heart, Share, MapPin, Phone, User, Camera } from 'lucide-react';
import { type AutoRequest, FuelTypeEnum, TransmissionTypeEnum, CarConditionEnum, EngineConditionEnum } from '@/lib/types';

interface Props {
  request: AutoRequest;
  onView: (req: AutoRequest) => void;
  onShare?: (req: AutoRequest) => void;
}

// 🚀 HOOK PER SWIPE GESTURES
const useSwipeGesture = (onSwipeLeft: () => void, onSwipeRight: () => void) => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const minSwipeDistance = 50
  const maxVerticalDistance = 100

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
    
    if (distanceY > maxVerticalDistance) return
    
    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance

    if (isLeftSwipe) onSwipeLeft()
    if (isRightSwipe) onSwipeRight()
  }

  return { onTouchStart, onTouchMove, onTouchEnd }
}

// 🎯 LAZY IMAGE COMPONENT - DARK THEME
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
          <div className="w-12 h-12 bg-slate-600 rounded-full" />
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
          <Camera className="h-12 w-12 text-slate-400" />
        </div>
      )}
    </div>
  )
}

// 🖼️ GALLERY SWIPEABLE COMPONENT - AutoScout24 Style + DARK THEME
const AutoScout24Gallery: React.FC<{
  images: string[]
  requestId: string
  getImageUrl: (id: string, name: string) => string
  className?: string
}> = ({ images, requestId, getImageUrl, className }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)

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

  const swipeHandlers = useSwipeGesture(goToNext, goToPrevious)

  if (images.length === 0) {
    return (
      <div className={`relative bg-slate-700/50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <Camera className="h-16 w-16 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Nessuna immagine</p>
        </div>
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <LazyCardImage
          src={getImageUrl(requestId, images[0])}
          alt="Immagine veicolo"
          className="w-full h-full object-cover"
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
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        priority={currentIndex === 0}
      />

      {/* Overlay gradiente scuro */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />

      {/* Controlli navigazione - DARK STYLE */}
      <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.stopPropagation()
            goToPrevious()
          }}
          className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition-all touch-manipulation z-10 backdrop-blur-sm"
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
          className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full shadow-lg transition-all touch-manipulation z-10 backdrop-blur-sm"
          disabled={isNavigating}
          aria-label="Immagine successiva"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Contatore immagini - DARK STYLE */}
      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium">
        {currentIndex + 1}/{images.length}
      </div>

      {/* Indicatori dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
        {images.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentIndex(index)
            }}
            className={`w-2 h-2 rounded-full transition-all touch-manipulation ${
              index === currentIndex
                ? 'bg-white scale-110'
                : 'bg-white/60 hover:bg-white/80'
            }`}
          />
        ))}
        {images.length > 5 && (
          <div className="w-2 h-2 rounded-full bg-white/40">
            <span className="sr-only">+{images.length - 5} altre</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function RequestCard({ request, onView, onShare }: Props) {
  const getImageUrl = (id: string, name: string) =>
    `https://automudblobstorage.blob.core.windows.net/automudformimages/${id}/${name}`;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const getConditionColor = (condition: number, type: 'car' | 'engine') => {
    if (type === 'car') {
      switch (condition) {
        case 30: return 'text-green-400'; // Usato
        case 20: return 'text-yellow-400'; // Guasto  
        case 10: return 'text-red-400'; // Incidentato
        default: return 'text-slate-400';
      }
    } else {
      switch (condition) {
        case 10: return 'text-green-400'; // Avvia e si muove
        case 20: return 'text-yellow-400'; // Avvia ma non si muove
        case 30: return 'text-red-400'; // Non avvia
        default: return 'text-slate-400';
      }
    }
  };

  return (
    <div 
      className="bg-slate-800/90 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-700/50 hover:border-orange-500/70 backdrop-blur-sm cursor-pointer hover:scale-[1.02]"
      onClick={() => onView(request)}
    >
      
      {/* Gallery - AutoScout24 Style + DARK */}
      <div className="relative">
        <AutoScout24Gallery
          images={request.Images}
          requestId={request.Id}
          getImageUrl={getImageUrl}
          className="aspect-[4/3] w-full"
        />
      </div>

      {/* Content - AutoScout24 Layout + DARK THEME + LAYOUT OTTIMIZZATO */}
      <div className="p-4 space-y-4">
        
        {/* Titolo principale con azioni - come AutoScout24 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white leading-tight">
              {request.Make} {request.Model}
            </h3>
            {/* 🆕 DATA E ORA RICHIESTA al posto di carburante/cambio/anno - Mobile responsive */}
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
              <p className="text-slate-400 text-sm truncate">
                <span className="hidden sm:inline">Richiesta: </span>{formatDateTime(request.DateTime)}
              </p>
            </div>
          </div>
          
          {/* Actions accanto al titolo */}
          <div className="flex gap-2 ml-3 flex-shrink-0">
            <button 
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg transition-all touch-manipulation border border-slate-600"
              onClick={(e) => {
                e.stopPropagation()
                window.location.href = `tel:${request.Phone}`
              }}
              title={`Chiama ${request.FirstName} ${request.LastName}`}
            >
              <Phone className="h-4 w-4" />
            </button>
            <button 
              className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-full shadow-lg transition-all touch-manipulation border border-slate-600"
              onClick={(e) => {
                e.stopPropagation()
                if (onShare) {
                  onShare(request)
                } else {
                  console.log('Condividi non configurato per:', request.Id)
                }
              }}
              title="Condividi richiesta"
            >
              <Share className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Prezzo prominente - stile AutoScout24 + GREEN */}
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold text-green-400">
              €{request.DesiredPrice.toLocaleString('it-IT')}
            </span>
            <span className="text-sm text-slate-500 ml-2">prezzo richiesto</span>
          </div>
        </div>

        {/* 🆕 DETTAGLI TECNICI OTTIMIZZATI - Layout mobile-friendly */}
        <div className="border-t border-slate-600 pt-3">
          {/* Desktop: griglia 2 colonne, Mobile: stack verticale */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 sm:gap-y-2 sm:gap-x-4 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Chilometraggio:</span>
              <span className="font-medium text-white">{request.Km.toLocaleString()} km</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Anno:</span>
              <span className="font-medium text-white">{request.RegistrationYear}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Cilindrata:</span>
              <span className="font-medium text-white">{request.EngineSize} cc</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Targa:</span>
              <span className="font-medium text-white">{request.LicensePlate}</span>
            </div>
            {/* 🆕 CARBURANTE E CAMBIO SPOSTATI QUI */}
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Carburante:</span>
              <span className="font-medium text-white text-sm">{FuelTypeEnum[request.FuelType]}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Cambio:</span>
              <span className="font-medium text-white text-sm">{TransmissionTypeEnum[request.TransmissionType]}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Condizioni:</span>
              <span className={`font-medium text-sm ${getConditionColor(request.CarCondition, 'car')}`}>
                {CarConditionEnum[request.CarCondition]}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Motore:</span>
              <span className={`font-medium text-sm ${getConditionColor(request.EngineCondition, 'engine')}`}>
                {EngineConditionEnum[request.EngineCondition]}
              </span>
            </div>
          </div>
        </div>

        {/* 🆕 INFO CLIENTE E LOCATION OTTIMIZZATE - Mobile responsive */}
        <div className="border-t border-slate-600 pt-3">
          {/* Mobile: Stack verticale, Desktop: Nome e città sulla stessa riga */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{request.FirstName} {request.LastName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{request.City}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}