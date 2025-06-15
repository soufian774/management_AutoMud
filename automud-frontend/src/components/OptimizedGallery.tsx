// src/components/OptimizedGallery.tsx - AGGIORNATO con swipe touch
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Camera, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react'

// 🚀 LAZY IMAGE SUPER OTTIMIZZATA
interface LazyImageProps {
  src: string
  alt: string
  className?: string
  onClick?: () => void
  fallbackIcon?: React.ReactNode
  priority?: boolean
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className, 
  onClick, 
  fallbackIcon, 
  priority = false 
}) => {
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
      { 
        threshold: 0.01,
        rootMargin: '50px'
      }
    )

    observer.observe(img)
    return () => observer.disconnect()
  }, [priority, isInView])

  return (
    <div ref={imgRef} className={`relative ${className || ''}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-700/30 animate-pulse flex items-center justify-center">
          {fallbackIcon || <div className="w-6 h-6 bg-slate-600 rounded" />}
        </div>
      )}

      {(isInView || priority) && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`${className || ''} transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClick}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading={priority ? "eager" : "lazy"}
        />
      )}

      {hasError && (
        <div className="absolute inset-0 bg-slate-700/50 flex items-center justify-center">
          {fallbackIcon || <FileText className="h-6 w-6 text-slate-400" />}
        </div>
      )}
    </div>
  )
}

// 🎯 HOOK PER SWIPE GESTURES AVANZATO
interface SwipeConfig {
  minSwipeDistance?: number
  maxVerticalDistance?: number
  minVelocity?: number
  timeThreshold?: number
}

interface TouchPoint {
  x: number
  y: number
  time: number
}

const useAdvancedSwipe = (
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  config: SwipeConfig = {}
) => {
  const defaultConfig = {
    minSwipeDistance: 50,
    maxVerticalDistance: 100,
    minVelocity: 0.3,
    timeThreshold: 300,
    ...config
  }

  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null)
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null)
  const isSwipingRef = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    setTouchEnd(null)
    isSwipingRef.current = false
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    })
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return
    
    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    }
    
    setTouchEnd(currentTouch)
    
    // Calcola distanza per feedback visivo
    const distanceX = Math.abs(touchStart.x - currentTouch.x)
    const distanceY = Math.abs(touchStart.y - currentTouch.y)
    
    // Inizia swipe se movimento orizzontale predominante
    if (distanceX > 20 && distanceX > distanceY && !isSwipingRef.current) {
      isSwipingRef.current = true
      // Previeni scroll della pagina durante swipe
      e.preventDefault()
    }
  }, [touchStart])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = Math.abs(touchStart.y - touchEnd.y)
    const timeElapsed = touchEnd.time - touchStart.time
    
    // Calcola velocità (pixel/ms)
    const velocity = Math.abs(distanceX) / timeElapsed
    
    // Verifica condizioni per swipe valido
    const isValidSwipe = 
      Math.abs(distanceX) > defaultConfig.minSwipeDistance &&
      distanceY < defaultConfig.maxVerticalDistance &&
      velocity > defaultConfig.minVelocity &&
      timeElapsed < defaultConfig.timeThreshold
    
    if (isValidSwipe) {
      const isLeftSwipe = distanceX > 0
      const isRightSwipe = distanceX < 0
      
      if (isLeftSwipe) onSwipeLeft()
      if (isRightSwipe) onSwipeRight()
    }
    
    isSwipingRef.current = false
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, defaultConfig])

  return { 
    onTouchStart, 
    onTouchMove, 
    onTouchEnd,
    isSwipingRef: isSwipingRef.current
  }
}

// 🎯 HOOK PER SMART PRELOAD
const useSmartPreload = (
  images: string[], 
  currentPage: number, 
  imagesPerPage: number, 
  requestId: string, 
  getImageUrl: (id: string, name: string) => string
) => {
  const preloadedImages = useRef(new Set<string>())

  const preloadPage = useCallback((pageIndex: number) => {
    const startIdx = pageIndex * imagesPerPage
    const endIdx = Math.min(startIdx + imagesPerPage, images.length)
    
    for (let i = startIdx; i < endIdx; i++) {
      const imageUrl = getImageUrl(requestId, images[i])
      
      if (!preloadedImages.current.has(imageUrl)) {
        const img = new Image()
        img.src = imageUrl
        preloadedImages.current.add(imageUrl)
      }
    }
  }, [images, imagesPerPage, requestId, getImageUrl])

  useEffect(() => {
    // Preload pagina corrente
    preloadPage(currentPage)
    
    // Preload pagina successiva
    const totalPages = Math.ceil(images.length / imagesPerPage)
    if (currentPage + 1 < totalPages) {
      setTimeout(() => preloadPage(currentPage + 1), 100)
    }
    
    // Preload pagina precedente se non è la prima
    if (currentPage > 0) {
      setTimeout(() => preloadPage(currentPage - 1), 200)
    }
  }, [currentPage, preloadPage])
}

// 🖼️ INTERFACE GALLERY
interface OptimizedGalleryProps {
  images: string[]
  requestId: string
  onImageClick?: (index: number) => void
  onManageClick?: () => void
  className?: string
  getImageUrl: (id: string, name: string) => string
  selectedImageIndex?: number
  onImageSelect?: (index: number) => void
}

// 🖼️ COMPONENTE GALLERY OTTIMIZZATO CON SWIPE
export const OptimizedGallery: React.FC<OptimizedGalleryProps> = ({ 
  images, 
  requestId, 
  onImageClick, 
  onManageClick,
  className = "",
  getImageUrl,
  selectedImageIndex: externalSelectedIndex,
  onImageSelect
}) => {
  const IMAGES_PER_PAGE = 4 // Solo 4 immagini per volta
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0)
  
  // Usa selectedImageIndex esterno se fornito, altrimenti interno
  const selectedImageIndex = externalSelectedIndex !== undefined ? externalSelectedIndex : internalSelectedIndex
  const setSelectedImageIndex = onImageSelect || setInternalSelectedIndex
  
  const [currentPage, setCurrentPage] = useState(0)
  
  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE)
  
  // 📱 Calcola immagini della pagina corrente
  const currentPageImages = useMemo(() => {
    const startIdx = currentPage * IMAGES_PER_PAGE
    const endIdx = Math.min(startIdx + IMAGES_PER_PAGE, images.length)
    return images.slice(startIdx, endIdx).map((imageName, index) => ({
      name: imageName,
      index: startIdx + index,
      url: getImageUrl(requestId, imageName)
    }))
  }, [images, currentPage, IMAGES_PER_PAGE, requestId, getImageUrl])

  // 🚀 Smart preload hook
  useSmartPreload(images, currentPage, IMAGES_PER_PAGE, requestId, getImageUrl)

  // 🎯 Aggiorna pagina quando cambia selectedImageIndex
  useEffect(() => {
    const targetPage = Math.floor(selectedImageIndex / IMAGES_PER_PAGE)
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage)
    }
  }, [selectedImageIndex, currentPage, IMAGES_PER_PAGE])

  // 🎯 Navigazione pagine
  const goToPrevious = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1)
      setSelectedImageIndex((currentPage - 1) * IMAGES_PER_PAGE)
    }
  }, [currentPage, IMAGES_PER_PAGE, setSelectedImageIndex])

  const goToNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1)
      setSelectedImageIndex((currentPage + 1) * IMAGES_PER_PAGE)
    }
  }, [currentPage, totalPages, IMAGES_PER_PAGE, setSelectedImageIndex])

  // 📱 Navigazione immagini singole
  const selectPreviousImage = useCallback(() => {
    if (selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1
      const targetPage = Math.floor(newIndex / IMAGES_PER_PAGE)
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage)
      }
      setSelectedImageIndex(newIndex)
    }
  }, [selectedImageIndex, currentPage, IMAGES_PER_PAGE, setSelectedImageIndex])

  const selectNextImage = useCallback(() => {
    if (selectedImageIndex < images.length - 1) {
      const newIndex = selectedImageIndex + 1
      const targetPage = Math.floor(newIndex / IMAGES_PER_PAGE)
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage)
      }
      setSelectedImageIndex(newIndex)
    }
  }, [selectedImageIndex, images.length, currentPage, IMAGES_PER_PAGE, setSelectedImageIndex])

  // 🎯 SWIPE GESTURE per immagine principale
  const mainImageSwipeHandlers = useAdvancedSwipe(
    selectNextImage,  // Swipe left = next image
    selectPreviousImage,  // Swipe right = previous image
    {
      minSwipeDistance: 30,
      maxVerticalDistance: 150,
      minVelocity: 0.2,
      timeThreshold: 500
    }
  )

  // 🎯 SWIPE GESTURE per griglia thumbnails (cambia pagina)
  const thumbnailSwipeHandlers = useAdvancedSwipe(
    goToNext,    // Swipe left = next page
    goToPrevious, // Swipe right = previous page
    {
      minSwipeDistance: 50,
      maxVerticalDistance: 100,
      minVelocity: 0.3,
      timeThreshold: 400
    }
  )

  if (images.length === 0) {
    return (
      <div className={`bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg ${className}`}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Galleria Immagini (0)
          </h2>
          
          <div className="w-full h-80 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-16 w-16 text-slate-400 mx-auto mb-3" />
              <span className="text-slate-400">Nessuna immagine disponibile</span>
            </div>
          </div>
          
          <Button 
            onClick={onManageClick}
            variant="outline" 
            className="w-full mt-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <Camera className="h-4 w-4 mr-2" />
            Aggiungi Prime Immagini
          </Button>
        </div>
      </div>
    )
  }

  const selectedImage = images[selectedImageIndex]
  const selectedImageInCurrentPage = currentPageImages.find(img => img.index === selectedImageIndex)

  return (
    <div className={`bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg ${className}`}>
      <div className="p-3 lg:p-6">
        <h2 className="text-lg lg:text-xl font-semibold mb-4 text-white flex items-center">
          <Camera className="h-4 lg:h-5 w-4 lg:w-5 mr-2" />
          Galleria Immagini ({images.length})
        </h2>
        
        {/* 🖼️ IMMAGINE PRINCIPALE CON SWIPE */}
        <div 
          className="w-full h-60 lg:h-80 bg-slate-700/50 border border-slate-600 rounded-lg mb-4 overflow-hidden relative group cursor-pointer"
          {...mainImageSwipeHandlers}
        >
          <LazyImage
            src={getImageUrl(requestId, selectedImage)}
            alt={`Immagine ${selectedImageIndex + 1}`}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            onClick={() => onImageClick && onImageClick(selectedImageIndex)}
            fallbackIcon={<FileText className="h-8 lg:h-12 w-8 lg:w-12 text-slate-400" />}
            priority={true}
          />
          
          {/* Overlay zoom */}
          <div 
            className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center"
            onClick={() => onImageClick && onImageClick(selectedImageIndex)}
          >
            <ZoomIn className="h-6 lg:h-8 w-6 lg:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          
          {/* Controlli navigazione immagine singola */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  selectPreviousImage()
                }}
                disabled={selectedImageIndex === 0}
                className="absolute left-2 lg:left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 lg:p-2 rounded-full transition-colors opacity-70 hover:opacity-100 z-10 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Immagine precedente"
              >
                <ChevronLeft className="h-4 lg:h-5 w-4 lg:w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  selectNextImage()
                }}
                disabled={selectedImageIndex === images.length - 1}
                className="absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 lg:p-2 rounded-full transition-colors opacity-70 hover:opacity-100 z-10 touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Immagine successiva"
              >
                <ChevronRight className="h-4 lg:h-5 w-4 lg:w-5" />
              </button>
              
              {/* Indicatore posizione */}
              <div className="absolute bottom-2 lg:bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-2 lg:px-3 py-1 rounded-full text-white text-xs lg:text-sm">
                {selectedImageIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
        
        {/* 📱 THUMBNAILS PAGINATI CON SWIPE */}
        <div className="space-y-3">
          {/* Thumbnails della pagina corrente CON SWIPE */}
          <div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-2 relative"
            {...thumbnailSwipeHandlers}
          >
            {currentPageImages.map((image) => (
              <div 
                key={image.index}
                onClick={() => setSelectedImageIndex(image.index)}
                className={`w-full h-16 lg:h-20 bg-slate-700/50 border-2 rounded overflow-hidden cursor-pointer transition-all touch-manipulation ${
                  selectedImageIndex === image.index
                    ? 'border-orange-500 ring-2 ring-orange-500/30 shadow-lg' 
                    : 'border-slate-600 hover:border-orange-400'
                }`}
              >
                <LazyImage
                  src={image.url}
                  alt={`Thumbnail ${image.index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  fallbackIcon={<FileText className="h-4 lg:h-6 w-4 lg:w-6 text-slate-400" />}
                  priority={selectedImageInCurrentPage?.index === image.index}
                />
              </div>
            ))}
            
            {/* Placeholder per completare la griglia */}
            {currentPageImages.length < IMAGES_PER_PAGE && 
              Array.from({ length: IMAGES_PER_PAGE - currentPageImages.length }).map((_, index) => (
                <div 
                  key={`placeholder-${index}`}
                  className="w-full h-16 lg:h-20 bg-slate-700/20 border border-slate-600 rounded flex items-center justify-center"
                >
                  <span className="text-slate-500 text-xs">+</span>
                </div>
              ))
            }
          </div>
          
          {/* 🎯 CONTROLLI PAGINAZIONE */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-slate-700/30 p-2 lg:p-3 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevious}
                disabled={currentPage === 0}
                className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500 disabled:opacity-50 touch-manipulation"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden lg:inline ml-1">Prec</span>
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-medium">
                  Pagina {currentPage + 1} di {totalPages}
                </span>
                
                {/* Indicatori pagina per desktop */}
                <div className="hidden lg:flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageIndex: number
                    if (totalPages <= 5) {
                      pageIndex = i
                    } else if (currentPage <= 2) {
                      pageIndex = i
                    } else if (currentPage >= totalPages - 3) {
                      pageIndex = totalPages - 5 + i
                    } else {
                      pageIndex = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageIndex}
                        onClick={() => {
                          setCurrentPage(pageIndex)
                          setSelectedImageIndex(pageIndex * IMAGES_PER_PAGE)
                        }}
                        className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                          currentPage === pageIndex
                            ? 'bg-orange-500 text-white'
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        {pageIndex + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNext}
                disabled={currentPage === totalPages - 1}
                className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500 disabled:opacity-50 touch-manipulation"
              >
                <span className="hidden lg:inline mr-1">Succ</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Info e statistiche */}
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>
              Mostrando {currentPageImages.length} di {images.length} immagini
            </span>
            {totalPages > 1 && (
              <span>
                Img {(currentPage * IMAGES_PER_PAGE) + 1}-{Math.min((currentPage + 1) * IMAGES_PER_PAGE, images.length)}
              </span>
            )}
          </div>
        </div>
        
        {/* Pulsante gestione */}
        <Button 
          onClick={onManageClick}
          variant="outline" 
          className="w-full mt-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
        >
          <Camera className="h-4 w-4 mr-2" />
          Gestisci Immagini
        </Button>
      </div>
    </div>
  )
}