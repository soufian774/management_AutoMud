import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Share, Loader2, Edit, TrendingUp, History, DollarSign, FileText, Users, Calendar, MapPin, Phone, Mail, X, ZoomIn, Clock, LogOut } from 'lucide-react'
import { type CompleteRequestDetail, FuelTypeEnum, TransmissionTypeEnum, CarConditionEnum, EngineConditionEnum, RequestStatusEnum, getStatusColor} from '@/lib/types'
import { API_BASE_URL } from '@/lib/api'
import StatusSelector from '@/components/StatusSelector'
import NotesEditor from '@/components/NotesEditor'
import PricingEditor from '@/components/PricingEditor'
import RangeEditor from '@/components/RangeEditor'
import VehicleEditor from '@/components/VehicleEditor'

// ✅ NUOVO: Ora usa i parametri della rotta invece delle props
export default function RequestDetail() {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()

  // Stati per gestire i dati
  const [request, setRequest] = useState<CompleteRequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Stati per la galleria immagini
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  // Stati per il cambio stato
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false)

  // Stati per la modifica note
  const [isNotesEditorOpen, setIsNotesEditorOpen] = useState(false)

  // Stati per la modifica prezzi
  const [isPricingEditorOpen, setIsPricingEditorOpen] = useState(false)

  // Stati per la modifica range
  const [isRangeEditorOpen, setIsRangeEditorOpen] = useState(false)

  // Stati per la modifica veicolo
  const [isVehicleEditorOpen, setIsVehicleEditorOpen] = useState(false)

  // ✅ NUOVO: Verifica autenticazione e parametri
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

  // ✅ NUOVO: Gestione tasto indietro del browser
  const handleBack = () => {
    navigate('/dashboard')
  }

  // ✅ NUOVO: Funzione di logout
  const handleLogout = () => {
    console.log('🚪 Logout in corso...')
    localStorage.removeItem('automud_auth')
    navigate('/login')
  }

  // Funzioni per i colori dei badge con stili custom
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

  // Funzioni per i colori delle condizioni (adattate ai tuoi enum)
  const getCarConditionColor = (code: number) => {
    switch (code) {
      case 30: return 'default';      // 'Usato' = Verde (migliore)
      case 20: return 'secondary';    // 'Guasto' = Giallo (medio)  
      case 10: return 'destructive';  // 'Incidentato' = Rosso (peggiore)
      default: return 'outline';      // 'N/A'
    }
  }

  const getEngineConditionColor = (code: number) => {
    switch (code) {
      case 10: return 'default';      // 'Avvia e si muove' = Verde (migliore)
      case 20: return 'secondary';    // 'Avvia ma non si muove' = Giallo (medio)
      case 30: return 'destructive';  // 'Non avvia' = Rosso (peggiore)
      default: return 'outline';      // 'N/A'
    }
  }

  // Funzione per formattare la data (stessa del RequestCard)
  const formatDate = (date: string) =>
    new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  // Funzione per generare URL immagini (stessa del RequestCard)
  const getImageUrl = (id: string, name: string) =>
    `https://automudblobstorage.blob.core.windows.net/automudformimages/${id}/${name}`

  // Funzioni per gestire il modal immagini
  const openImageModal = () => setIsImageModalOpen(true)
  const closeImageModal = () => setIsImageModalOpen(false)

  // Handler per il cambio stato
  const handleStatusChanged = (newStatus: number, finalOutcome?: number, closeReason?: number) => {
    console.log('✅ Stato cambiato:', { newStatus, finalOutcome, closeReason })
    
    // Ricarica i dati completi per aggiornare tutto
    fetchRequest()
  }

  // Handler per l'aggiornamento note
  const handleNotesUpdated = (newNotes: string) => {
    console.log('✅ Note aggiornate:', newNotes)
    
    // Aggiorna solo le note localmente per una UX più fluida
    if (request?.Management) {
      setRequest(prev => prev ? {
        ...prev,
        Management: prev.Management ? {
          ...prev.Management,
          Notes: newNotes
        } : prev.Management
      } : null)
    }
  }

  // Handler per l'aggiornamento prezzi
  const handlePricingUpdated = (updatedManagement: any) => {
    console.log('✅ Prezzi aggiornati:', updatedManagement)
    
    // Aggiorna il management localmente
    setRequest(prev => prev ? {
      ...prev,
      Management: updatedManagement
    } : null)
  }

  // Handler per l'aggiornamento range
  const handleRangeUpdated = (updatedManagement: any) => {
    console.log('✅ Range aggiornato:', updatedManagement)
    
    // Aggiorna il management localmente
    setRequest(prev => prev ? {
      ...prev,
      Management: updatedManagement
    } : null)
  }

  // Handler per l'aggiornamento veicolo
  const handleVehicleUpdated = (updatedRequest: CompleteRequestDetail) => {
    console.log('✅ Informazioni veicolo aggiornate:', updatedRequest)
    
    // Aggiorna tutti i dati del veicolo localmente
    setRequest(updatedRequest)
  }

  // Gestione tasto ESC per chiudere modal e frecce per navigare
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isImageModalOpen) return
      
      switch (e.key) {
        case 'Escape':
          closeImageModal()
          break
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedImageIndex(prev => 
            prev === 0 ? (request?.Images.length || 1) - 1 : prev - 1
          )
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedImageIndex(prev => 
            prev === (request?.Images.length || 1) - 1 ? 0 : prev + 1
          )
          break
      }
    }
    
    if (isImageModalOpen) {
      document.addEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'hidden' // Blocca scroll background
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      document.body.style.overflow = 'unset'
    }
  }, [isImageModalOpen, request?.Images.length])

  // ✅ Funzione per caricare i dati della richiesta con API REALI
  const fetchRequest = async () => {
    if (!requestId) {
      console.error('❌ ID richiesta mancante')
      navigate('/dashboard')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Usa la stessa autenticazione del Dashboard
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        navigate('/login')
        return
      }
      
      console.log(`🔍 Caricamento richiesta completa: ${requestId}`)
      
      // ✅ USA API REALE - Ora ritorna dati completi dal backend aggiornato
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

  // Carica i dati quando il componente si monta o cambia l'ID
  useEffect(() => {
    if (requestId) {
      fetchRequest()
    }
  }, [requestId])

  // STATI DI CARICAMENTO E ERRORE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-slate-400">Caricamento richiesta...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <div className="space-x-4">
            <Button 
              onClick={fetchRequest}
              className="bg-orange-500 hover:bg-orange-600 text-white border-0"
            >
              Riprova
            </Button>
            <Button 
              onClick={handleBack} 
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Richiesta non trovata</p>
          <Button 
            onClick={handleBack} 
            className="bg-orange-500 hover:bg-orange-600 text-white border-0"
          >
            Torna al Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // PAGINA PRINCIPALE CON DATI COMPLETI - Dark Theme
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full px-2 sm:px-4 py-6">
        {/* Header con tasto indietro */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button 
              variant="outline" 
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500" 
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna al Dashboard
            </Button>

            {/* Pulsante Logout */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 hover:border-red-500 hover:text-red-300 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
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
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`font-medium ${getBadgeStyles(getStatusColor(request.CurrentStatus.Status))}`}
                    >
                      {RequestStatusEnum[request.CurrentStatus.Status]}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsStatusSelectorOpen(true)}
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Cambia Stato
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifica
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white border-0">
                <Share className="h-4 w-4 mr-2" />
                Condividi
              </Button>
            </div>
          </div>
        </div>

        {/* Layout principale */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* COLONNA 1 - Galleria Immagini */}
          <div className="xl:col-span-1">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Galleria Immagini ({request.Images.length})
              </h2>
              
              {/* Immagine principale */}
              <div className="w-full h-80 bg-slate-700/50 border border-slate-600 rounded-lg mb-4 overflow-hidden relative group">
                {request.Images.length > 0 ? (
                  <>
                    <img
                      src={getImageUrl(request.Id, request.Images[selectedImageIndex])}
                      alt={`${request.Make} ${request.Model} - Immagine ${selectedImageIndex + 1}`}
                      className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                      onClick={openImageModal}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    
                    <div 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center cursor-pointer"
                      onClick={openImageModal}
                    >
                      <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <div className="absolute inset-0 hidden items-center justify-center bg-slate-700/50">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <span className="text-slate-400 text-sm">Errore caricamento immagine</span>
                      </div>
                    </div>
                    
                    {request.Images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImageIndex(prev => 
                              prev === 0 ? request.Images.length - 1 : prev - 1
                            )
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors opacity-70 hover:opacity-100 z-10"
                        >
                          ‹
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedImageIndex(prev => 
                              prev === request.Images.length - 1 ? 0 : prev + 1
                            )
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors opacity-70 hover:opacity-100 z-10"
                        >
                          ›
                        </button>
                        
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-white text-sm">
                          {selectedImageIndex + 1} / {request.Images.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FileText className="h-16 w-16 text-slate-400 mx-auto mb-3" />
                      <span className="text-slate-400">Nessuna immagine disponibile</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              <div className="grid grid-cols-3 gap-2">
                {request.Images.slice(0, 6).map((imageName, index) => (
                  <div 
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-full h-20 bg-slate-700/50 border-2 rounded overflow-hidden cursor-pointer transition-all ${
                      selectedImageIndex === index 
                        ? 'border-orange-500 ring-2 ring-orange-500/30' 
                        : 'border-slate-600 hover:border-orange-400'
                    }`}
                  >
                    <img
                      src={getImageUrl(request.Id, imageName)}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full hidden items-center justify-center bg-slate-700/50">
                      <FileText className="h-6 w-6 text-slate-400" />
                    </div>
                  </div>
                ))}
                
                {request.Images.length > 6 && (
                  <div className="w-full h-20 bg-slate-700/50 border border-slate-600 rounded flex items-center justify-center">
                    <span className="text-slate-400 text-sm font-medium">
                      +{request.Images.length - 6}
                    </span>
                  </div>
                )}
                
                {request.Images.length > 0 && request.Images.length < 6 && 
                  Array.from({ length: 6 - request.Images.length }).map((_, index) => (
                    <div 
                      key={`placeholder-${index}`}
                      className="w-full h-20 bg-slate-700/30 border border-slate-600 rounded flex items-center justify-center"
                    >
                      <span className="text-slate-500 text-xs">+</span>
                    </div>
                  ))
                }
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
              >
                Gestisci Immagini
              </Button>
            </div>
          </div>

          {/* COLONNA 2 - Dettagli Veicolo */}
          <div className="xl:col-span-1">
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

                {/* Condizioni */}
                <div className="mt-6 pt-6 border-t border-slate-600">
                  <h3 className="font-semibold mb-3 text-white">Condizioni</h3>
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
                </div>
              </div>
            </div>
          </div>

          {/* COLONNA 3 - Management & Valutazioni */}
          <div className="xl:col-span-1">
            <div className="space-y-6">
              
              {/* Valutazione */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Valutazione
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                      Prezzo Desiderato Cliente
                    </label>
                    <div className="text-2xl font-bold text-green-400">
                      €{request.DesiredPrice.toLocaleString()}
                    </div>
                  </div>

                  {request.Management && (
                    <div>
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
                          Modifica
                        </Button>
                      </div>
                      <div className="text-lg font-semibold text-orange-400">
                        €{request.Management.RangeMin.toLocaleString()} - €{request.Management.RangeMax.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prezzi e Costi */}
              {request.Management && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Gestione Economica
                  </h2>
                  
                  <div className="space-y-4">
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

                    <div className="pt-4 border-t border-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Margine Stimato:</span>
                        <span className={`text-lg font-bold ${
                          (request.Management.SalePrice - request.Management.PurchasePrice - request.Management.RegistrationCost - request.Management.TransportCost) >= 0 
                            ? 'text-green-400' 
                            : 'text-red-400'
                        }`}>
                          €{(request.Management.SalePrice - request.Management.PurchasePrice - request.Management.RegistrationCost - request.Management.TransportCost).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Pulsante per modificare prezzi */}
                    <Button 
                      variant="outline"
                      onClick={() => setIsPricingEditorOpen(true)}
                      className="w-full mt-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Modifica Prezzi e Costi
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* COLONNA 4 - Offerte & Storico */}
          <div className="xl:col-span-1">
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
                  className="w-full mt-4 bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500"
                >
                  Aggiungi Offerta
                </Button>
              </div>

              {/* Storico Stati */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Storico Stati ({request.StatusHistory.length})
                </h2>
                
                <div className="space-y-3">
                  {request.StatusHistory.length > 0 ? (
                    request.StatusHistory.map((status) => (
                      <div key={status.Id} className="flex items-center justify-between py-2">
                        <Badge 
                          className={`text-xs ${getBadgeStyles(getStatusColor(status.Status))}`}
                        >
                          {RequestStatusEnum[status.Status]}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {formatDate(status.ChangeDate)}
                        </span>
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

              {/* Note */}
              {request.Management && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Note
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Note di gestione:</label>
                      <p className="text-white text-sm bg-slate-700/50 p-3 rounded">
                        {request.Management.Notes || 'Nessuna nota disponibile'}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Condizioni dettagliate:</label>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-slate-400">Interni: </span>
                          <span className="text-white">{request.InteriorConditions}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Esterni: </span>
                          <span className="text-white">{request.ExteriorConditions}</span>
                        </div>
                        {request.MechanicalConditions && (
                          <div>
                            <span className="text-slate-400">Meccaniche: </span>
                            <span className="text-white">{request.MechanicalConditions}</span>
                          </div>
                        )}
                      </div>
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

      {/* Modal per immagine ingrandita */}
      {isImageModalOpen && request && request.Images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95">
          <div 
            className="absolute inset-0" 
            onClick={closeImageModal}
          ></div>
          
          <div className="relative z-10 max-w-[95vw] max-h-[95vh] p-4">
            <button
              onClick={closeImageModal}
              className="absolute -top-6 -right-6 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3 rounded-full transition-all z-20 backdrop-blur-sm shadow-lg"
              title="Chiudi (ESC)"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="relative group">
              <img
                src={getImageUrl(request.Id, request.Images[selectedImageIndex])}
                alt={`${request.Make} ${request.Model} - Immagine ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              
              {request.Images.length > 1 && (
                <>
                  <div 
                    onClick={() => {
                      setSelectedImageIndex(prev => 
                        prev === 0 ? request.Images.length - 1 : prev - 1
                      )
                    }}
                    className="absolute left-0 top-0 w-1/4 h-full cursor-pointer z-10"
                    title="Immagine precedente (←)"
                  />
                  
                  <div 
                    onClick={() => {
                      setSelectedImageIndex(prev => 
                        prev === request.Images.length - 1 ? 0 : prev + 1
                      )
                    }}
                    className="absolute right-0 top-0 w-1/4 h-full cursor-pointer z-10"
                    title="Immagine successiva (→)"
                  />

                  <button
                    onClick={() => {
                      setSelectedImageIndex(prev => 
                        prev === 0 ? request.Images.length - 1 : prev - 1
                      )
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    title="Immagine precedente (←)"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedImageIndex(prev => 
                        prev === request.Images.length - 1 ? 0 : prev + 1
                      )
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-80 text-white p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    title="Immagine successiva (→)"
                  >
                    <ArrowLeft className="h-5 w-5 rotate-180" />
                  </button>
                  
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
                    {request.Images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === selectedImageIndex
                            ? 'bg-orange-500 scale-110'
                            : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                        }`}
                        title={`Vai all'immagine ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 px-6 py-2 rounded-full text-white text-center backdrop-blur-sm">
              <span className="text-sm font-medium">
                {selectedImageIndex + 1} / {request.Images.length} - {request.Make} {request.Model} ({request.RegistrationYear})
              </span>
            </div>
            
            {request.Images.length > 1 && (
              <div className="absolute top-6 left-6 bg-black bg-opacity-50 px-3 py-2 rounded-lg text-white text-xs backdrop-blur-sm">
                <div>← → per navigare</div>
                <div>ESC per chiudere</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ✅ StatusSelector Modal */}
      {request.CurrentStatus && (
        <StatusSelector
          isOpen={isStatusSelectorOpen}
          onClose={() => setIsStatusSelectorOpen(false)}
          currentStatus={request.CurrentStatus.Status}
          requestId={request.Id}
          onStatusChanged={handleStatusChanged}
        />
      )}

      {/* ✅ NotesEditor Modal */}
      {request.Management && (
        <NotesEditor
          isOpen={isNotesEditorOpen}
          onClose={() => setIsNotesEditorOpen(false)}
          requestId={request.Id}
          currentNotes={request.Management.Notes || ''}
          onNotesUpdated={handleNotesUpdated}
        />
      )}

      {/* ✅ PricingEditor Modal */}
      <PricingEditor
        isOpen={isPricingEditorOpen}
        onClose={() => setIsPricingEditorOpen(false)}
        requestId={request.Id}
        currentManagement={request.Management || null}
        onPricingUpdated={handlePricingUpdated}
      />

      {/* ✅ RangeEditor Modal */}
      <RangeEditor
        isOpen={isRangeEditorOpen}
        onClose={() => setIsRangeEditorOpen(false)}
        requestId={request.Id}
        currentManagement={request.Management || null}
        desiredPrice={request.DesiredPrice}
        onRangeUpdated={handleRangeUpdated}
      />

      {/* ✅ VehicleEditor Modal */}
      <VehicleEditor
        isOpen={isVehicleEditorOpen}
        onClose={() => setIsVehicleEditorOpen(false)}
        request={request}
        onVehicleUpdated={handleVehicleUpdated}
      />
    </div>
  )
}