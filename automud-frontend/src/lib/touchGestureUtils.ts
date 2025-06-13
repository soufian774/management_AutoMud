// src/lib/touchGestureUtils.ts
import { useState, useCallback, useRef } from 'react'

export interface SwipeConfig {
  minSwipeDistance?: number
  maxVerticalDistance?: number
  minVelocity?: number
  timeThreshold?: number
}

export interface TouchPoint {
  x: number
  y: number
  time: number
}

const defaultConfig: Required<SwipeConfig> = {
  minSwipeDistance: 50,
  maxVerticalDistance: 100,
  minVelocity: 0.3,
  timeThreshold: 300
}

// 🚀 ADVANCED SWIPE HOOK con velocity detection
export const useAdvancedSwipe = (
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  config: SwipeConfig = {}
) => {
  const finalConfig = { ...defaultConfig, ...config }
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
      Math.abs(distanceX) > finalConfig.minSwipeDistance &&
      distanceY < finalConfig.maxVerticalDistance &&
      velocity > finalConfig.minVelocity &&
      timeElapsed < finalConfig.timeThreshold
    
    if (isValidSwipe) {
      const isLeftSwipe = distanceX > 0
      const isRightSwipe = distanceX < 0
      
      if (isLeftSwipe) onSwipeLeft()
      if (isRightSwipe) onSwipeRight()
    }
    
    isSwipingRef.current = false
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, finalConfig])

  return { 
    onTouchStart, 
    onTouchMove, 
    onTouchEnd,
    isSwipingRef: isSwipingRef.current
  }
}

// 🎯 SIMPLE SWIPE HOOK (lightweight version)
export const useSimpleSwipe = (
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  minDistance: number = 50
) => {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minDistance
    const isRightSwipe = distance < -minDistance

    if (isLeftSwipe) onSwipeLeft()
    if (isRightSwipe) onSwipeRight()
  }, [touchStart, touchEnd, onSwipeLeft, onSwipeRight, minDistance])

  return { onTouchStart, onTouchMove, onTouchEnd }
}

// 🎪 TOUCH FEEDBACK UTILITIES
export const addTouchFeedback = (element: HTMLElement) => {
  let feedbackTimeout: number

  const addFeedback = () => {
    element.style.transform = 'scale(0.98)'
    element.style.opacity = '0.8'
    element.style.transition = 'all 0.1s ease-out'
  }

  const removeFeedback = () => {
    clearTimeout(feedbackTimeout)
    feedbackTimeout = window.setTimeout(() => {
      element.style.transform = 'scale(1)'
      element.style.opacity = '1'
      element.style.transition = 'all 0.2s ease-out'
    }, 100)
  }

  element.addEventListener('touchstart', addFeedback, { passive: true })
  element.addEventListener('touchend', removeFeedback, { passive: true })
  element.addEventListener('touchcancel', removeFeedback, { passive: true })

  return () => {
    element.removeEventListener('touchstart', addFeedback)
    element.removeEventListener('touchend', removeFeedback)
    element.removeEventListener('touchcancel', removeFeedback)
    window.clearTimeout(feedbackTimeout)
  }
}

// 📱 DEVICE DETECTION
export const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export const getDeviceType = () => {
  const userAgent = navigator.userAgent
  
  if (/iPad|iPhone|iPod/.test(userAgent)) return 'ios'
  if (/Android/.test(userAgent)) return 'android'
  if (isTouchDevice()) return 'touch'
  return 'desktop'
}

// ⚡ PERFORMANCE UTILITIES
export const preloadNextImages = (
  images: string[], 
  currentIndex: number, 
  getImageUrl: (id: string, name: string) => string,
  requestId: string
) => {
  const preloadIndexes = [currentIndex + 1, currentIndex - 1].filter(
    index => index >= 0 && index < images.length
  )
  
  preloadIndexes.forEach(index => {
    if (images[index]) {
      const img = new Image()
      img.src = getImageUrl(requestId, images[index])
    }
  })
}

// 🎨 VISUAL FEEDBACK
export const createSwipeIndicator = (direction: 'left' | 'right', strength: number) => {
  return {
    transform: `translateX(${direction === 'left' ? -strength : strength}px)`,
    opacity: Math.min(strength / 50, 0.8),
    transition: 'none'
  }
}