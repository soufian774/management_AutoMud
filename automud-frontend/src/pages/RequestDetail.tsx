import { useState, useEffect} from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Share, 
  Loader2, 
  Edit, 
  TrendingUp, 
  History, 
  DollarSign, 
  FileText, 
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  X,  
  Clock, 
  LogOut, 
  Plus,
  Camera,
  Menu,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react'
import { type CompleteRequestDetail, type RequestOffer, FuelTypeEnum, TransmissionTypeEnum, CarConditionEnum, EngineConditionEnum, RequestStatusEnum, getStatusColor, FinalOutcomeEnum, CloseReasonEnum} from '@/lib/types'
import { API_BASE_URL } from '@/lib/api'
import { useAdvancedSwipe } from '@/lib/touchGestureUtils'
import StatusSelector from '@/components/StatusSelector'
import NotesEditor from '@/components/NotesEditor'
import PricingEditor from '@/components/PricingEditor'
import RangeEditor from '@/components/RangeEditor'
import VehicleEditor from '@/components/VehicleEditor'
import OffersEditor from '@/components/OffersEditor'
import ShareModal from '@/components/ShareModal'
import ImageManager from '@/components/ImageManager'
import { OptimizedGallery } from '@/components/OptimizedGallery'

export default function RequestDetail() {
  const { requestId } = useParams<{ requestId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Stati per gestire i dati
  const [request, setRequest] = useState<CompleteRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Stati per la galleria immagini - OTTIMIZZATI
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Stati per i modal
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false)
  const [isNotesEditorOpen, setIsNotesEditorOpen] = useState(false)
  const [isPricingEditorOpen, setIsPricingEditorOpen] = useState(false)
  const [isRangeEditorOpen, setIsRangeEditorOpen] = useState(false)
  const [isVehicleEditorOpen, setIsVehicleEditorOpen] = useState(false)
  const [isOffersEditorOpen, setIsOffersEditorOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false)

  // Stati per mobile UI
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    gallery: true,
    vehicle: false,
    economic: false,
    offers: false,
    management:false,
    notes: false
  })
  const [showAllStates, setShowAllStates] = useState(false)

  // 🆕 SWIPE HANDLERS per modal immagine zoomata
  const modalSwipeHandlers = useAdvancedSwipe(
    // onSwipeLeft (next image)
    () => {
      if (request?.Images.length && request.Images.length > 1) {
        setSelectedImageIndex(prev => 
          prev === request.Images.length - 1 ? 0 : prev + 1
        )
      }
    },
    // onSwipeRight (previous image)
    () => {
      if (request?.Images.length && request.Images.length > 1) {
        setSelectedImageIndex(prev => 
          prev === 0 ? request.Images.length - 1 : prev - 1
        )
      }
    },
    {
      minSwipeDistance: 50,
      maxVerticalDistance: 150,
      minVelocity: 0.3,
      timeThreshold: 400
    }
  )

  // Verifica autenticazione e parametri
  useEffect(() => {
    const auth = localStorage.getItem('automud_auth')
    if (!auth) {
      navigate('/login')
      return
    }
    
    if (!requestId) {
      console.error('❌ ID richiesta mancante nei parametri della rotta')
      navigate('/dashboard')
      return
    }
  }, [requestId, navigate])

  // Gestione tasto indietro
  const handleBack = () => {
    const returnPage = searchParams.get('page')
    
    if (returnPage) {
      navigate(`/dashboard?page=${returnPage}`)
    } else {
      navigate('/dashboard')
    }
  }

  // Funzione di logout
  const handleLogout = () => {
    console.log('🚪 Logout in corso...')
    localStorage.removeItem('automud_auth')
    navigate('/login')
  }

  // Toggle sezioni mobile
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Funzioni per i colori dei badge
  const getBadgeStyles = (variant: string) => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-500'
      case 'secondary':
        return 'bg-yellow-600 hover:bg-yellow-700 text-black border-yellow-500'
      case 'default':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-500'
      default:
        return 'bg-slate-600 hover:bg-slate-700 text-white border-slate-500'
    }
  }

  const getCarConditionColor = (code: number) => {
    switch (code) {
      case 30: return 'default'
      case 20: return 'secondary'
      case 10: return 'destructive'
      default: return 'outline'
    }
  }

  const getEngineConditionColor = (code: number) => {
    switch (code) {
      case 10: return 'default'
      case 20: return 'secondary'
      case 30: return 'destructive'
      default: return 'outline'
    }
  }

  // Funzioni per formattare dati
  const formatDate = (date: string) =>
    new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  const getImageUrl = (id: string, name: string) =>
    `https://automudblobstorage.blob.core.windows.net/automudformimages/${id}/${name}`

  // Gestione modal immagini - OTTIMIZZATA
  const openImageModal = (imageIndex?: number) => {
    if (imageIndex !== undefined) {
      setSelectedImageIndex(imageIndex)
    }
    setIsImageModalOpen(true)
  }
  
  const closeImageModal = () => setIsImageModalOpen(false)

  // Handler per eventi
  const handleStatusChanged = (newStatus: number, finalOutcome?: number, closeReason?: number) => {
    console.log('✅ Stato cambiato:', { newStatus, finalOutcome, closeReason })
    fetchRequest()
  }

  const handleOffersUpdated = (updatedOffers: RequestOffer[]) => {
    console.log('✅ Offerte aggiornate:', updatedOffers)
    setRequest(prev => prev ? { ...prev, Offers: updatedOffers } : null)
  }

  const handleNotesUpdated = (newNotes: string) => {
    console.log('✅ Note aggiornate:', newNotes)
    if (request?.Management) {
      setRequest(prev => prev ? {
        ...prev,
        Management: prev.Management ? { ...prev.Management, Notes: newNotes } : prev.Management
      } : null)
    }
  }

  const handlePricingUpdated = (updatedManagement: any) => {
    console.log('✅ Prezzi aggiornati:', updatedManagement)
    setRequest(prev => prev ? { ...prev, Management: updatedManagement } : null)
  }

  const handleRangeUpdated = (updatedManagement: any) => {
    console.log('✅ Range aggiornato:', updatedManagement)
    setRequest(prev => prev ? { ...prev, Management: updatedManagement } : null)
  }

  const handleVehicleUpdated = (updatedRequest: CompleteRequestDetail) => {
    console.log('✅ Informazioni veicolo aggiornate:', updatedRequest)
    setRequest(updatedRequest)
  }

  const handleImagesUpdated = (updatedImages: string[]) => {
    console.log('✅ Immagini aggiornate:', updatedImages)
    setRequest(prev => prev ? { ...prev, Images: updatedImages } : null)
  }


  // Gestione tasti per modal immagini - OTTIMIZZATA
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isImageModalOpen || !request?.Images.length) return
      
      switch (e.key) {
        case 'Escape':
          closeImageModal()
          break
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedImageIndex(prev => 
            prev === 0 ? request.Images.length - 1 : prev - 1
          )
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedImageIndex(prev => 
            prev === request.Images.length - 1 ? 0 : prev + 1
          )
          break
      }
    }
    
    if (isImageModalOpen) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'unset'
    }
  }, [isImageModalOpen, request?.Images.length])

  // Funzione per caricare i dati della richiesta
  const fetchRequest = async () => {
    if (!requestId) {
      console.error('❌ ID richiesta mancante')
      navigate('/dashboard')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        navigate('/login')
        return
      }
      
      console.log(`🔍 Caricamento richiesta completa: ${requestId}`)
      
      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('automud_auth')
          navigate('/login')
          return
        }
        if (response.status === 404) {
          throw new Error('Richiesta non trovata')
        }
        throw new Error(`Errore ${response.status}: ${response.statusText}`)
      }
      
      const completeData = await response.json()
      
      console.log('✅ Richiesta completa caricata:', completeData)
      setRequest(completeData)
      
    } catch (err) {
      console.error('❌ Errore caricamento:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(`Errore nel caricamento: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Carica i dati quando il componente si monta
  useEffect(() => {
    if (requestId) {
      fetchRequest()
    }
  }, [requestId])

  // STATI DI CARICAMENTO E ERRORE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-6 sm:h-8 w-6 sm:w-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-slate-400 text-sm sm:text-base">Caricamento richiesta...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4 text-sm sm:text-base px-4">{error}</p>
          <div className="space-y-2 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row">
            <Button 
              onClick={fetchRequest}
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 touch-manipulation"
            >
              Riprova
            </Button>
            <Button 
              onClick={handleBack} 
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 touch-manipulation"
            >
              Torna al Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4 text-sm sm:text-base">Richiesta non trovata</p>
          <Button 
            onClick={handleBack} 
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 touch-manipulation"
          >
            Torna al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // PAGINA PRINCIPALE
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation" 
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                >
                  <Menu className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 touch-manipulation"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Vehicle Title Mobile */}
            <div className="mb-4">
              <h1 className="text-xl font-bold text-white break-words">
                {request.RegistrationYear} {request.Make} {request.Model}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-slate-400 text-sm">ID: {request.Id}</span>
                {request.CurrentStatus && (
                  <button
                    onClick={() => setIsStatusSelectorOpen(true)}
                    className="transition-all hover:scale-105 touch-manipulation"
                    title="Clicca per cambiare stato"
                  >
                    <Badge 
                      className={`font-medium text-xs cursor-pointer ${getBadgeStyles(getStatusColor(request.CurrentStatus.Status))} hover:brightness-110 active:scale-95`}
                    >
                      {RequestStatusEnum[request.CurrentStatus.Status]}
                    </Badge>
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="mb-4 p-3 bg-slate-800/90 border border-slate-700 rounded-lg backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsShareModalOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                  >
                    <Share className="h-3 w-3 mr-1" />
                    Condividi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsVehicleEditorOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Veicolo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsImageManagerOpen(true)
                      setIsMobileMenuOpen(false)
                    }}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    Foto
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="outline" 
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500" 
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Torna al Dashboard
              </Button>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {request.RegistrationYear} {request.Make} {request.Model}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-slate-400">ID: {request.Id}</p>
                  {request.CurrentStatus && (
                    <button
                      onClick={() => setIsStatusSelectorOpen(true)}
                      className="transition-all hover:scale-105"
                      title="Clicca per cambiare stato"
                    >
                      <Badge 
                        className={`font-medium cursor-pointer ${getBadgeStyles(getStatusColor(request.CurrentStatus.Status))} hover:brightness-110 hover:shadow-lg active:scale-95`}
                      >
                        {RequestStatusEnum[request.CurrentStatus.Status]}
                      </Badge>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0"
                >
                  <Share className="h-4 w-4 mr-2" />
                  Condividi
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 hover:border-red-500 hover:text-red-300 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Layout principale */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-6">
          
          {/* MOBILE: Sezioni collassabili - Solo su mobile */}
          <div className="lg:hidden space-y-4">
            
            {/* Galleria Mobile - OTTIMIZZATA CON SWIPE */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg">
              <button
                onClick={() => toggleSection('gallery')}
                className="w-full p-4 flex items-center justify-between text-white hover:bg-slate-700/30 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  <span className="font-semibold">Galleria ({request.Images.length})</span>
                </div>
                {expandedSections.gallery ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.gallery && (
                <div className="p-4 pt-0">
                  <OptimizedGallery
                    images={request.Images}
                    requestId={request.Id}
                    onImageClick={openImageModal}
                    onManageClick={() => setIsImageManagerOpen(true)}
                    getImageUrl={getImageUrl}
                    selectedImageIndex={selectedImageIndex}
                    onImageSelect={setSelectedImageIndex}
                    className="mobile-gallery gallery-container"
                  />
                </div>
              )}
            </div>

            {/* Info Cliente & Veicolo Mobile */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg">
              <button
                onClick={() => toggleSection('vehicle')}
                className="w-full p-4 flex items-center justify-between text-white hover:bg-slate-700/30 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-semibold">Cliente & Veicolo</span>
                </div>
                {expandedSections.vehicle ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.vehicle && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Cliente */}
                  <div>
                    <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      Cliente
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-slate-400" />
                        <span className="text-white">{request.FirstName} {request.LastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <a href={`tel:${request.Phone}`} className="text-blue-400 hover:text-blue-300">{request.Phone}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <a href={`mailto:${request.Email}`} className="text-blue-400 hover:text-blue-300 break-all text-xs">{request.Email}</a>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span className="text-white">{request.City} ({request.Cap})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span className="text-white text-xs">{formatDate(request.DateTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-slate-400" />
                        <span className="font-semibold text-green-400">
                          €{request.DesiredPrice.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500">(prezzo desiderato)</span>
                      </div>
                    </div>
                  </div>

                  {/* Dettagli Veicolo */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Edit className="h-4 w-4 text-green-400" />
                        Dettagli Veicolo
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsVehicleEditorOpen(true)}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs touch-manipulation"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Modifica
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <span className="text-slate-400">Targa:</span>
                        <div className="font-medium text-white">{request.LicensePlate}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Anno:</span>
                        <div className="font-medium text-white">{request.RegistrationYear}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Km:</span>
                        <div className="font-medium text-white">{request.Km.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Cilindrata:</span>
                        <div className="font-medium text-white">{request.EngineSize} cc</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Carburante:</span>
                        <div className="font-medium text-white text-xs">{FuelTypeEnum[request.FuelType]}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Cambio:</span>
                        <div className="font-medium text-white text-xs">{TransmissionTypeEnum[request.TransmissionType]}</div>
                      </div>
                    </div>

                    {/* Condizioni Generali - Mobile */}
                    <div className="mb-4 pt-4 border-t border-slate-600">
                      <h4 className="font-semibold mb-2 text-white text-sm">Condizioni Generali</h4>
                      <div className="flex gap-2">
                        <Badge 
                          className={`font-medium text-xs ${getBadgeStyles(getCarConditionColor(request.CarCondition))}`}
                        >
                          {CarConditionEnum[request.CarCondition]}
                        </Badge>
                        <Badge 
                          className={`font-medium text-xs ${getBadgeStyles(getEngineConditionColor(request.EngineCondition))}`}
                        >
                          {EngineConditionEnum[request.EngineCondition]}
                        </Badge>
                      </div>
                    </div>

                    {/* Condizioni Dettagliate */}
                    <div className="pt-4 border-t border-slate-600">
                      <h4 className="font-semibold mb-3 text-white text-sm">Condizioni Dettagliate</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-slate-400 font-medium">Interni:</span>
                          <p className="text-white mt-1 text-xs leading-relaxed bg-slate-700/30 p-2 rounded">
                            {request.InteriorConditions}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Esterni:</span>
                          <p className="text-white mt-1 text-xs leading-relaxed bg-slate-700/30 p-2 rounded">
                            {request.ExteriorConditions}
                          </p>
                        </div>
                        {request.MechanicalConditions && (
                          <div>
                            <span className="text-slate-400 font-medium">Meccaniche:</span>
                            <p className="text-white mt-1 text-xs leading-relaxed bg-slate-700/30 p-2 rounded">
                              {request.MechanicalConditions}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 🔄 OFFERTE MOBILE*/}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg">
              <button
                onClick={() => toggleSection('offers')}
                className="w-full p-4 flex items-center justify-between text-white hover:bg-slate-700/30 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">Offerte ({request.Offers.length})</span>
                </div>
                {expandedSections.offers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.offers && (
                <div className="p-4 pt-0">
                  <div className="space-y-3 mb-4">
                    {request.Offers.length > 0 ? (
                      request.Offers.map((offer) => (
                        <div key={offer.Id} className="bg-slate-700/50 p-3 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-white text-sm leading-tight">{offer.OfferDescription}</h4>
                            <span className="text-lg font-bold text-green-400 ml-2">
                              €{offer.OfferPrice.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{formatDate(offer.OfferDate)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <DollarSign className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Nessuna offerta ancora disponibile</p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setIsOffersEditorOpen(true)}
                    className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Gestisci Offerte
                  </Button>
                </div>
              )}
            </div>

            {/* 🔄 GESTIONE ECONOMICA MOBILE*/}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg">
              <button
                onClick={() => toggleSection('economic')}
                className="w-full p-4 flex items-center justify-between text-white hover:bg-slate-700/30 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">Gestione Economica</span>
                </div>
                  {expandedSections.economic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.economic && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Range Valutazione */}
                  {request.Management && (
                    <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsRangeEditorOpen(true)}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs touch-manipulation"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Range
                        </Button>
                      </div>
                      <div className="text-lg font-semibold text-orange-400">
                        €{request.Management.RangeMin.toLocaleString()} - €{request.Management.RangeMax.toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Prezzi e Costi */}
                  {request.Management && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPricingEditorOpen(true)}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs touch-manipulation"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Modifica
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Acquisto:</span>
                          <div className="font-medium text-white">€{request.Management.PurchasePrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Vendita:</span>
                          <div className="font-medium text-white">€{request.Management.SalePrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Pratica:</span>
                          <div className="font-medium text-white">€{request.Management.RegistrationCost.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Trasporto:</span>
                          <div className="font-medium text-white">€{request.Management.TransportCost.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-600">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Margine:</span>
                          <span className={`text-lg font-bold ${
                            (request.Management.SalePrice - request.Management.PurchasePrice - request.Management.RegistrationCost - request.Management.TransportCost) >= 0 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            €{(request.Management.SalePrice - request.Management.PurchasePrice - request.Management.RegistrationCost - request.Management.TransportCost).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Note e Storico Mobile */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg">
              <button
                onClick={() => toggleSection('notes')}
                className="w-full p-4 flex items-center justify-between text-white hover:bg-slate-700/30 transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">Stato, Note & Storico</span>
                </div>
                {expandedSections.notes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              
              {expandedSections.notes && (
                <div className="p-4 pt-0 space-y-4">
                  {/* Stato attuale e cambio stato */}
                  <div className="bg-slate-700/50 p-3 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-400">Stato Attuale:</span>
                      {request.CurrentStatus && (
                        <Badge className={`font-medium text-xs ${getBadgeStyles(getStatusColor(request.CurrentStatus.Status))}`}>
                          {RequestStatusEnum[request.CurrentStatus.Status]}
                        </Badge>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setIsStatusSelectorOpen(true)}
                      className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Cambia Stato Richiesta
                    </Button>
                  </div>
                  {/* Note di Gestione */}
                  {request.Management && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-white flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-400" />
                          Note di Gestione
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsNotesEditorOpen(true)}
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs touch-manipulation"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Modifica
                        </Button>
                      </div>
                      
                      <div>
                        <p className="text-white text-sm bg-slate-700/50 p-3 rounded">
                          {request.Management.Notes || 'Nessuna nota disponibile'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Storico Stati */}
                  <div>
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <History className="h-4 w-4 text-purple-400" />
                      Storico Stati ({request.StatusHistory.length})
                    </h4>
                    
                    <div className="space-y-2">
                      {request.StatusHistory.length > 0 ? (
                        <>
                          {(showAllStates 
                            ? [...request.StatusHistory].reverse() 
                            : [...request.StatusHistory].reverse().slice(0, 3)
                          ).map((status) => (
                            <div key={status.Id} className="bg-slate-700/30 rounded p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  className={`text-xs ${getBadgeStyles(getStatusColor(status.Status))}`}
                                >
                                  {RequestStatusEnum[status.Status]}
                                </Badge>
                                <span className="text-xs text-slate-400">
                                  {formatDate(status.ChangeDate)}
                                </span>
                              </div>
                              
                              {status.Status === 40 && status.FinalOutcome && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Esito:</span>
                                    <Badge 
                                      className={`text-xs ${
                                        status.FinalOutcome === 10 ? 'bg-green-600 text-white' :
                                        status.FinalOutcome === 20 ? 'bg-orange-600 text-white' :
                                        'bg-red-600 text-white'
                                      }`}
                                    >
                                      {FinalOutcomeEnum[status.FinalOutcome]}
                                    </Badge>
                                  </div>
                                  
                                  {status.FinalOutcome === 30 && status.CloseReason && (
                                    <div className="space-y-1">
                                      <span className="text-xs text-slate-400 block">Motivo:</span>
                                      <div className="flex items-start gap-2">
                                        <Badge className="bg-red-700 text-white text-xs leading-tight">
                                          {CloseReasonEnum[status.CloseReason]}
                                        </Badge>
                                        {status.CloseReason === 20 && (
                                          <div className="flex items-center gap-1">
                                            <Mail className="h-3 w-3 text-orange-400" />
                                            <span className="text-xs text-orange-400">Email auto</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {status.Notes && (
                                <div className="pt-2 border-t border-slate-600">
                                  <span className="text-xs text-slate-400 block mb-1">Note cambio stato:</span>
                                  <p className="text-xs text-white bg-slate-600/30 p-2 rounded leading-relaxed break-words">
                                    {status.Notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {request.StatusHistory.length > 3 && (
                            <div className="mt-3">
                              {!showAllStates && (
                                <div className="text-center mb-2">
                                  <span className="text-xs text-slate-500">
                                    +{request.StatusHistory.length - 3} altri stati
                                  </span>
                                </div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAllStates(!showAllStates)}
                                className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-xs touch-manipulation"
                              >
                                <History className="h-3 w-3 mr-1" />
                                {showAllStates ? 'Mostra Meno' : `Vedi Tutti (${request.StatusHistory.length})`}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <History className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">Nessun storico disponibile</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DESKTOP: Layout originale a 4 colonne - Solo su desktop */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="grid grid-cols-4 gap-6">
            
            {/* COLONNA 1 - Galleria Immagini - OTTIMIZZATA CON SWIPE */}
            <div className="col-span-1">
              <OptimizedGallery
                images={request.Images}
                requestId={request.Id}
                onImageClick={openImageModal}
                onManageClick={() => setIsImageManagerOpen(true)}
                getImageUrl={getImageUrl}
                selectedImageIndex={selectedImageIndex}
                onImageSelect={setSelectedImageIndex}
                className="h-fit gallery-container"
              />
            </div>

            {/* COLONNA 2 - Dettagli Veicolo */}
            <div className="col-span-1">
              <div className="space-y-6">
                
                {/* Dettagli tecnici */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Dettagli Veicolo</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsVehicleEditorOpen(true)}
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Modifica
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Targa:</span>
                      <span className="font-medium text-white">{request.LicensePlate}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Chilometraggio:</span>
                      <span className="font-medium text-white">{request.Km.toLocaleString()} km</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Anno:</span>
                      <span className="font-medium text-white">{request.RegistrationYear}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cilindrata:</span>
                      <span className="font-medium text-white">{request.EngineSize} cc</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Carburante:</span>
                      <span className="font-medium text-white">{FuelTypeEnum[request.FuelType]}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-400">Cambio:</span>
                      <span className="font-medium text-white">{TransmissionTypeEnum[request.TransmissionType]}</span>
                    </div>
                  </div>

                  {/* Condizioni Generali */}
                  <div className="mt-6 pt-6 border-t border-slate-600">
                    <h3 className="font-semibold mb-3 text-white">Condizioni Generali</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Generali:</span>
                        <Badge 
                          className={`font-medium ${getBadgeStyles(getCarConditionColor(request.CarCondition))}`}
                        >
                          {CarConditionEnum[request.CarCondition]}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Motore:</span>
                        <Badge 
                          className={`font-medium ${getBadgeStyles(getEngineConditionColor(request.EngineCondition))}`}
                        >
                          {EngineConditionEnum[request.EngineCondition]}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Condizioni Dettagliate */}
                  <div className="mt-6 pt-6 border-t border-slate-600">
                    <h3 className="font-semibold mb-4 text-white">Condizioni Dettagliate</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Interni:</label>
                        <p className="text-white text-sm bg-slate-700/30 p-3 rounded leading-relaxed">
                          {request.InteriorConditions}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Esterni:</label>
                        <p className="text-white text-sm bg-slate-700/30 p-3 rounded leading-relaxed">
                          {request.ExteriorConditions}
                        </p>
                      </div>
                      
                      {request.MechanicalConditions && (
                        <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Meccaniche:</label>
                          <p className="text-white text-sm bg-slate-700/30 p-3 rounded leading-relaxed">
                            {request.MechanicalConditions}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info cliente */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Cliente
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-white">{request.FirstName} {request.LastName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-white">{request.Email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-white">{request.Phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-white">{request.City} ({request.Cap})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-white">{formatDate(request.DateTime)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-green-400">
                        €{request.DesiredPrice.toLocaleString()}
                      </span>
                      <span className="text-sm text-slate-500">(prezzo desiderato)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🔄 COLONNA 3 - OFFERTE & STORICO (era colonna 4) */}
            <div className="col-span-1">
              <div className="space-y-6">
                
                {/* Storico Offerte */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Offerte Partner ({request.Offers.length})
                  </h2>
                  
                  <div className="space-y-3">
                    {request.Offers.length > 0 ? (
                      request.Offers.map((offer) => (
                        <div key={offer.Id} className="bg-slate-700/50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-white text-sm">{offer.OfferDescription}</h4>
                            <span className="text-lg font-bold text-green-400">
                              €{offer.OfferPrice.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{formatDate(offer.OfferDate)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <DollarSign className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-400">Nessuna offerta ancora disponibile</p>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setIsOffersEditorOpen(true)}
                    className="w-full mt-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Gestisci Offerte
                  </Button>
                </div>

                {/* Storico Stati */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Stato & Storico ({request.StatusHistory.length})
                  </h2>

                  {/* Stato attuale e cambio stato */}
                  <div className="bg-slate-700/50 p-4 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-300">Stato Attuale:</span>
                      {request.CurrentStatus && (
                        <Badge className={`font-medium ${getBadgeStyles(getStatusColor(request.CurrentStatus.Status))}`}>
                          {RequestStatusEnum[request.CurrentStatus.Status]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      Ultimo aggiornamento: {request.CurrentStatus ? formatDate(request.CurrentStatus.ChangeDate) : 'N/A'}
                    </p>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setIsStatusSelectorOpen(true)}
                      className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Cambia Stato Richiesta
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {request.StatusHistory.length > 0 ? (
                      [...request.StatusHistory].reverse().map((status) => (
                        <div key={status.Id} className="bg-slate-700/30 rounded p-4 space-y-3">
                          {/* Header stato */}
                          <div className="flex items-center justify-between">
                            <Badge 
                              className={`text-sm ${getBadgeStyles(getStatusColor(status.Status))}`}
                            >
                              {RequestStatusEnum[status.Status]}
                            </Badge>
                            <span className="text-sm text-slate-400">
                              {formatDate(status.ChangeDate)}
                            </span>
                          </div>
                          
                          {/* Dettagli Esito Finale */}
                          {status.Status === 40 && status.FinalOutcome && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-slate-400">Esito:</span>
                                <Badge 
                                  className={`text-sm ${
                                    status.FinalOutcome === 10 ? 'bg-green-600 text-white' :
                                    status.FinalOutcome === 20 ? 'bg-orange-600 text-white' :
                                    'bg-red-600 text-white'
                                  }`}
                                >
                                  {FinalOutcomeEnum[status.FinalOutcome]}
                                </Badge>
                              </div>
                              
                              {/* Motivo se Non Acquistata */}
                              {status.FinalOutcome === 30 && status.CloseReason && (
                                <div className="space-y-2">
                                  <span className="text-sm text-slate-400 block">Motivo:</span>
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-red-700 text-white text-sm">
                                      {CloseReasonEnum[status.CloseReason]}
                                    </Badge>
                                    {/* Icona email se automazione */}
                                    {status.CloseReason === 20 && (
                                      <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-orange-400" />
                                        <span className="text-sm text-orange-400">Email automatica inviata</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Note cambio stato */}
                          {status.Notes && (
                            <div className="pt-3 border-t border-slate-600">
                              <span className="text-sm text-slate-400 block mb-2">Note cambio stato:</span>
                              <p className="text-sm text-white bg-slate-600/30 p-3 rounded leading-relaxed">
                                {status.Notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-slate-400">Nessun storico stati disponibile</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* 🔄 COLONNA 4 - GESTIONE ECONOMICA (era colonna 3) */}
            <div className="col-span-1">
              <div className="space-y-6">
                
                {/* Valutazione */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                 <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Gestione Economica
                </h2>
                {request.Management && (                  
                  <div className="space-y-4">
                  {/* Range Valutazione */}
                  <div className="bg-slate-700/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-slate-400">
                        Range Valutazione
                      </label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRangeEditorOpen(true)}
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 text-xs"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Modifica Range
                      </Button>
                    </div>
                    <div className="text-xl font-semibold text-orange-400">
                      €{request.Management.RangeMin.toLocaleString()} - €{request.Management.RangeMax.toLocaleString()}
                    </div>
                  </div>

                  {/* Prezzi */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400">Prezzo Acquisto</label>
                      <div className="text-lg font-medium text-white">
                        €{request.Management.PurchasePrice.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400">Prezzo Vendita</label>
                      <div className="text-lg font-medium text-white">
                        €{request.Management.SalePrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Costi */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400">Costi Pratica</label>
                      <div className="text-md text-white">
                        €{request.Management.RegistrationCost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400">Costi Trasporto</label>
                      <div className="text-md text-white">
                        €{request.Management.TransportCost.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Margine */}
                  <div className="pt-4 border-t border-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Margine Stimato:</span>
                      <span className={`text-xl font-bold ${
                        (request.Management.SalePrice - request.Management.PurchasePrice - request.Management.RegistrationCost - request.Management.TransportCost) >= 0 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`}>
                        €{(request.Management.SalePrice - request.Management.PurchasePrice - request.Management.RegistrationCost - request.Management.TransportCost).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Pulsante Modifica */}
                  <Button 
                    variant="outline"
                    onClick={() => setIsPricingEditorOpen(true)}
                    className="w-full mt-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Modifica Prezzi e Costi
                  </Button>
                </div>
                )}
                </div>

                {/* Note di Gestione */}
                {request.Management && (
                  <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Note di Gestione
                    </h2>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-white text-sm bg-slate-700/50 p-3 rounded">
                          {request.Management.Notes || 'Nessuna nota disponibile'}
                        </p>
                      </div>

                      <Button 
                        variant="outline"
                        onClick={() => setIsNotesEditorOpen(true)}
                        className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modifica Note
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL IMMAGINE PULITO - Contatore come overlay */}
      {isImageModalOpen && request && request.Images.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-95">
          <div 
            className="absolute inset-0" 
            onClick={closeImageModal}
          ></div>
          
          <div className="relative z-10 max-w-[95vw] max-h-[95vh] p-2 sm:p-4">
            {/* ✅ Pulsante chiudi X - in alto a destra */}
            <button
              onClick={closeImageModal}
              className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 sm:p-3 rounded-full transition-all z-30 backdrop-blur-sm shadow-lg touch-manipulation"
              title="Chiudi (ESC)"
            >
              <X className="h-4 sm:h-5 w-4 sm:w-5" />
            </button>
            
            {/* Container immagine con swipe */}
            <div 
              className="relative group image-modal-container"
              {...modalSwipeHandlers}
            >
              <img
                src={getImageUrl(request.Id, request.Images[selectedImageIndex])}
                alt={`${request.Make} ${request.Model} - Immagine ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl modal-image"
              />
              
              {/* ✅ Contatore immagine - OVERLAY sopra l'immagine */}
              <div className="absolute top-3 left-3 bg-black bg-opacity-70 px-3 py-1.5 rounded-lg text-white backdrop-blur-sm shadow-lg z-25">
                <div className="text-sm font-medium">
                  {selectedImageIndex + 1} / {request.Images.length}
                </div>
              </div>
              
              {/* Controlli navigazione */}
              {request.Images.length > 1 && (
                <>
                  {/* Zone cliccabili invisibili per navigazione touch */}
                  <div 
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === 0 ? request.Images.length - 1 : prev - 1
                    )}
                    className="absolute left-0 top-0 w-1/3 h-full cursor-pointer z-10 touch-zone"
                    title="Immagine precedente"
                  />
                  
                  <div 
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === request.Images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-0 top-0 w-1/3 h-full cursor-pointer z-10 touch-zone"
                    title="Immagine successiva"
                  />

                  {/* Pulsanti navigazione visibili solo su hover */}
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === 0 ? request.Images.length - 1 : prev - 1
                    )}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-80 text-white p-2 sm:p-3 rounded-full transition-all modal-controls opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-sm z-20 touch-manipulation modal-nav-button"
                    title="Immagine precedente"
                  >
                    <ArrowLeft className="h-4 sm:h-5 w-4 sm:w-5" />
                  </button>
                  
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === request.Images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-80 text-white p-2 sm:p-3 rounded-full transition-all modal-controls opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-sm z-20 touch-manipulation modal-nav-button"
                    title="Immagine successiva"
                  >
                    <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5" />
                  </button>
                  
                  {/* Indicatori dots - in basso */}
                  <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2">
                    {request.Images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full transition-all touch-manipulation gallery-dot ${
                          index === selectedImageIndex
                            ? 'bg-white scale-110'
                            : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                        }`}
                        title={`Vai all'immagine ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tutti i Modal Components */}
      {request.CurrentStatus && (
        <StatusSelector
          isOpen={isStatusSelectorOpen}
          onClose={() => setIsStatusSelectorOpen(false)}
          currentStatus={request.CurrentStatus.Status}
          requestId={request.Id}
          onStatusChanged={handleStatusChanged}
        />
      )}

      {request.Management && (
        <NotesEditor
          isOpen={isNotesEditorOpen}
          onClose={() => setIsNotesEditorOpen(false)}
          requestId={request.Id}
          currentNotes={request.Management.Notes || ''}
          onNotesUpdated={handleNotesUpdated}
        />
      )}

      <PricingEditor
        isOpen={isPricingEditorOpen}
        onClose={() => setIsPricingEditorOpen(false)}
        requestId={request.Id}
        currentManagement={request.Management || null}
        onPricingUpdated={handlePricingUpdated}
      />

      <RangeEditor
        isOpen={isRangeEditorOpen}
        onClose={() => setIsRangeEditorOpen(false)}
        requestId={request.Id}
        currentManagement={request.Management || null}
        desiredPrice={request.DesiredPrice}
        onRangeUpdated={handleRangeUpdated}
      />

      <VehicleEditor
        isOpen={isVehicleEditorOpen}
        onClose={() => setIsVehicleEditorOpen(false)}
        request={request}
        onVehicleUpdated={handleVehicleUpdated}
      />

      <OffersEditor
        isOpen={isOffersEditorOpen}
        onClose={() => setIsOffersEditorOpen(false)}
        requestId={request.Id}
        currentOffers={request.Offers}
        onOffersUpdated={handleOffersUpdated}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        request={request}
      />

      <ImageManager
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        requestId={request.Id}
        currentImages={request.Images}
        onImagesUpdated={handleImagesUpdated}
      />
    </div>
  )
}