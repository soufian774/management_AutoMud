import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Loader2, 
  X, 
  Trash2, 
  RefreshCw, 
  Image as ImageIcon,
  Plus,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileImage,
  Download,
  Info,
  Zap,
  Camera,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { useConfirmation } from './ConfirmationDialog'

interface ImageManagerProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
  currentImages: string[]
  onImagesUpdated: (updatedImages: string[]) => void
}

interface RequestImage {
  id: number
  name: string
  url: string
}

interface UploadProgress {
  filename: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function ImageManager({ 
  isOpen, 
  onClose, 
  requestId, 
  currentImages, 
  onImagesUpdated 
}: ImageManagerProps) {
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
  // Hook per la conferma
  const { showConfirmation, ConfirmationComponent } = useConfirmation()
  
  // Stati principali
  const [images, setImages] = useState<RequestImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Stati per visualizzazione immagini
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  
  // Stati per upload
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Stati per statistiche
  const [stats, setStats] = useState({
    totalImages: 0,
    totalSize: 0,
    lastUpload: null as string | null
  })

  // Carica immagini dettagliate quando si apre il modal
  const fetchImages = useCallback(async () => {
    if (!isOpen) return

    setIsLoading(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      console.log(`📋 Caricamento immagini per richiesta ${requestId}`)

      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/images`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Errore ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Immagini caricate:', result)
      
      setImages(result.images || [])
      
      // Aggiorna statistiche
      setStats({
        totalImages: result.images?.length || 0,
        totalSize: 0,
        lastUpload: result.images?.length > 0 ? new Date().toISOString() : null
      })
      
    } catch (error) {
      console.error('❌ Errore caricamento immagini:', error)
      setImages([])
    } finally {
      setIsLoading(false)
    }
  }, [isOpen, requestId])

  // Effetto per caricare immagini quando si apre
  useEffect(() => {
    if (isOpen) {
      fetchImages()
      setUploadProgress([])
    }
  }, [isOpen, fetchImages])

  // Gestione drag & drop
  useEffect(() => {
    const dropZone = dropZoneRef.current
    if (!dropZone) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      
      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length > 0) {
        handleUpload(files)
      }
    }

    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('drop', handleDrop)

    return () => {
      dropZone.removeEventListener('dragover', handleDragOver)
      dropZone.removeEventListener('dragleave', handleDragLeave)
      dropZone.removeEventListener('drop', handleDrop)
    }
  }, [isOpen])

  // Gestione selezione file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleUpload(files)
    }
  }

  // 🔧 AGGIORNATO: Validazione file con limite 20MB
  const validateFiles = (files: File[]) => {
    const maxSize = 20 * 1024 * 1024 // 🚨 CAMBIATO: 20MB invece di 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    
    const validFiles: File[] = []
    const errors: string[] = []

    // 📏 Utility per formattare dimensioni file
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Formato non supportato. Usa JPEG, PNG, GIF o WebP.`)
      } else if (file.size > maxSize) {
        // 🚨 AGGIORNATO: Messaggio di errore con dimensione file e limite 20MB
        errors.push(`${file.name}: File troppo grande (${formatFileSize(file.size)}). Massimo 20MB consentiti.`)
      } else {
        validFiles.push(file)
      }
    })

    return { validFiles, errors }
  }

  // Upload immagini con progress
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return

    const { validFiles, errors } = validateFiles(files)

    // Usa il dialog di conferma invece dell'alert
    if (errors.length > 0) {
      showConfirmation({
        title: 'Errori di Validazione',
        message: `Alcuni file non sono validi:\n\n${errors.join('\n')}\n\nVuoi procedere con i file validi?`,
        type: 'warning',
        confirmText: `Procedi con ${validFiles.length} file`,
        cancelText: 'Annulla',
        onConfirm: () => {
          if (validFiles.length > 0) {
            performUpload(validFiles)
          }
        }
      })
      return
    }

    if (validFiles.length === 0) return

    performUpload(validFiles)
  }

  // Funzione separata per l'upload effettivo
  const performUpload = async (validFiles: File[]) => {
    // Inizializza progress
    const initialProgress: UploadProgress[] = validFiles.map(file => ({
      filename: file.name,
      progress: 0,
      status: 'pending'
    }))
    setUploadProgress(initialProgress)
    setIsUploading(true)

    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      console.log(`📤 Upload di ${validFiles.length} immagini`)

      // Aggiorna status a "uploading"
      setUploadProgress(prev => prev.map(p => ({ ...p, status: 'uploading' as const, progress: 10 })))

      const formData = new FormData()
      validFiles.forEach(file => {
        formData.append('images', file)
      })

      // Simula progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev.map(p => 
          p.status === 'uploading' && p.progress < 90 
            ? { ...p, progress: Math.min(p.progress + 20, 90) }
            : p
        ))
      }, 500)

      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        body: formData
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Errore ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Upload completato:', result)

      // Aggiorna progress con successo
      setUploadProgress(prev => prev.map((p, index) => {
        const uploadResult = result.uploaded?.[index]
        if (uploadResult) {
          return { ...p, status: 'success' as const, progress: 100 }
        } else {
          const error = result.errors?.find((e: any) => e.filename === p.filename)
          return { 
            ...p, 
            status: 'error' as const, 
            progress: 0, 
            error: error?.error || 'Errore sconosciuto' 
          }
        }
      }))

      // Ricarica le immagini dopo upload
      setTimeout(async () => {
        await fetchImages()
        
        // Notifica al parent component
        const newImageNames = [...currentImages, ...result.uploaded.map((img: any) => img.name)]
        onImagesUpdated(newImageNames)

        // Clear progress dopo successo
        setTimeout(() => setUploadProgress([]), 2000)
      }, 1000)

    } catch (error) {
      console.error('❌ Errore upload:', error)
      
      // Aggiorna progress con errore
      setUploadProgress(prev => prev.map(p => ({
        ...p,
        status: 'error' as const,
        progress: 0,
        error: error instanceof Error ? error.message : 'Errore nell\'upload'
      })))
      
    } finally {
      setIsUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Elimina immagine con aggiornamento locale immediato
  const handleDeleteImage = async (imageId: number, imageName: string) => {
    showConfirmation({
      title: 'Elimina Immagine',
      message: `Sei sicuro di voler eliminare l'immagine "${imageName}"? Questa azione non può essere annullata.`,
      type: 'danger',
      confirmText: 'Elimina Immagine',
      cancelText: 'Mantieni',
      onConfirm: async () => {
        try {
          const auth = localStorage.getItem('automud_auth')
          if (!auth) {
            throw new Error('Utente non autenticato')
          }

          console.log(`🗑️ Eliminazione immagine ${imageId}`)

          const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/images/${imageId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Errore ${response.status}`)
          }

          console.log('✅ Immagine eliminata con successo')

          // Aggiorna solo localmente senza ricaricare
          const updatedImages = images.filter(img => img.id !== imageId)
          setImages(updatedImages)
          
          // Aggiorna le statistiche
          setStats(prev => ({
            ...prev,
            totalImages: updatedImages.length
          }))
          
          // Notifica al parent component
          const newImageNames = currentImages.filter(name => name !== imageName)
          onImagesUpdated(newImageNames)

        } catch (error) {
          console.error('❌ Errore eliminazione:', error)
          throw error
        }
      }
    })
  }

  // Elimina tutte le immagini con aggiornamento locale
  const handleDeleteAllImages = async () => {
    if (images.length === 0) return
    
    showConfirmation({
      title: 'Elimina Tutte le Immagini',
      message: `Sei sicuro di voler eliminare TUTTE le ${images.length} immagini? Questa operazione rimuoverà definitivamente tutte le foto associate a questa richiesta e non può essere annullata.`,
      type: 'danger',
      confirmText: `Elimina ${images.length} Immagini`,
      cancelText: 'Mantieni Tutto',
      onConfirm: async () => {
        try {
          const auth = localStorage.getItem('automud_auth')
          if (!auth) {
            throw new Error('Utente non autenticato')
          }

          console.log(`🗑️ Eliminazione di tutte le immagini`)

          const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/images`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Errore ${response.status}`)
          }

          console.log('✅ Tutte le immagini eliminate con successo')

          // Aggiorna solo localmente senza ricaricare
          setImages([])
          
          // Aggiorna le statistiche
          setStats({
            totalImages: 0,
            totalSize: 0,
            lastUpload: null
          })
          
          // Notifica al parent component
          onImagesUpdated([])

        } catch (error) {
          console.error('❌ Errore eliminazione tutte:', error)
          throw error
        }
      }
    })
  }

  // Apre modal immagine ingrandita
  const openImageModal = (index: number) => {
    setSelectedImageIndex(index)
    setIsImageModalOpen(true)
  }

  // Gestione tasti nel modal immagini
  useEffect(() => {
    if (!isImageModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsImageModalOpen(false)
          break
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isImageModalOpen, images.length])

  return (
    <>
      {/* Modal Principale - Mobile Responsive */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Camera className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
              Gestione Immagini ({images.length})
              {stats.totalImages > 0 && (
                <Badge className="bg-blue-600 text-white ml-2 text-xs">
                  {stats.totalImages} foto
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6 py-4">
            {/* Info richiesta e statistiche - Mobile Stack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/30 p-3 sm:p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-3 sm:h-4 w-3 sm:w-4 text-slate-400" />
                  <span className="font-medium text-slate-200 text-sm">Informazioni</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400">
                  <span className="font-medium">Richiesta:</span> {requestId}
                </p>
                <p className="text-xs sm:text-sm text-slate-400">
                  {/* 🚨 AGGIORNATO: Testo con limite 20MB */}
                  <span className="font-medium">Limite:</span> 20MB per file, formati JPEG/PNG/GIF/WebP
                </p>
              </div>

              {stats.totalImages > 0 && (
                <div className="bg-green-900/20 p-3 sm:p-4 rounded-lg border border-green-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-green-400" />
                    <span className="font-medium text-green-400 text-sm">Statistiche</span>
                  </div>
                  <p className="text-xs sm:text-sm text-green-200">
                    <span className="font-medium">{stats.totalImages}</span> immagini caricate
                  </p>
                  <p className="text-xs sm:text-sm text-green-200">
                    Storage: Azure Blob Container
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress - Mobile Responsive */}
            {uploadProgress.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="h-3 sm:h-4 w-3 sm:w-4" />
                  Upload in Corso
                </h3>
                <div className="space-y-2">
                  {uploadProgress.map((progress, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs sm:text-sm text-white truncate max-w-xs">
                            {progress.filename}
                          </span>
                          <div className="flex items-center gap-2">
                            {progress.status === 'success' && <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-green-400" />}
                            {progress.status === 'error' && <AlertTriangle className="h-3 sm:h-4 w-3 sm:w-4 text-red-400" />}
                            {progress.status === 'uploading' && <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 animate-spin text-blue-400" />}
                            <span className="text-xs text-slate-400">{progress.progress}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              progress.status === 'success' ? 'bg-green-500' :
                              progress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                        {progress.error && (
                          <p className="text-xs text-red-400 mt-1">{progress.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zona Upload - Mobile Responsive */}
            <div 
              ref={dropZoneRef}
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all duration-200 ${
                isDragOver 
                  ? 'border-blue-500 bg-blue-500/10' 
                  : 'border-slate-600 hover:border-slate-500'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <div className="relative">
                  <Upload className={`h-8 sm:h-12 w-8 sm:w-12 ${isDragOver ? 'text-blue-400' : 'text-slate-400'} transition-colors`} />
                  {isUploading && (
                    <Loader2 className="h-4 sm:h-6 w-4 sm:w-6 animate-spin text-blue-500 absolute -top-1 -right-1" />
                  )}
                </div>
                
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                    {isDragOver ? 'Rilascia qui le immagini' : 'Carica Nuove Immagini'}
                  </h3>
                  <p className="text-slate-400 mb-4 text-sm">
                    Trascina le immagini qui o clicca per selezionare
                  </p>
                  {/* 🚨 AGGIORNATO: Testo helper con 20MB */}
                  <p className="text-xs text-slate-500 mb-4">
                    Massimo 20MB per file • JPEG, PNG, GIF, WebP
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="bg-green-500 hover:bg-green-600 text-white border-0 text-sm sm:text-base"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 mr-2 animate-spin" />
                          Caricamento...
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
                          Seleziona File
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={fetchImages}
                      disabled={isLoading}
                      variant="outline"
                      className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-sm sm:text-base"
                    >
                      <RefreshCw className={`h-3 sm:h-4 w-3 sm:w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                      Ricarica
                    </Button>
                  </div>
                </div>
              </div>

              {/* Input nascosto per file */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Azioni di massa - Mobile Responsive */}
            {images.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-slate-700/30 p-3 sm:p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-3 sm:h-4 w-3 sm:w-4 text-slate-400" />
                  <span className="text-xs sm:text-sm text-slate-400">
                    {images.length} immagini caricate
                  </span>
                </div>
                
                <Button
                  onClick={handleDeleteAllImages}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Elimina Tutte
                </Button>
              </div>
            )}

            {/* Griglia Immagini - Mobile Responsive */}
            {isLoading ? (
              <div className="text-center py-12 sm:py-16">
                <Loader2 className="h-6 sm:h-8 w-6 sm:w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-slate-400 text-sm">Caricamento immagini...</p>
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {images.map((image, index) => (
                  <div key={image.id} className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden group hover:shadow-lg transition-all duration-200">
                    {/* Immagine */}
                    <div className="relative aspect-square">
                      <img
                        src={image.url}
                        alt={`Immagine ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
                        onClick={() => openImageModal(index)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      
                      {/* Fallback per errore caricamento */}
                      <div className="absolute inset-0 hidden items-center justify-center bg-slate-600">
                        <ImageIcon className="h-6 sm:h-8 w-6 sm:w-8 text-slate-400" />
                      </div>

                      {/* Overlay azioni - Mobile Friendly */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            onClick={() => openImageModal(index)}
                            className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg p-1.5 sm:p-2"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDeleteImage(image.id, image.name)}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 shadow-lg p-1.5 sm:p-2"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Numero immagine */}
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black/70 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                        {index + 1}
                      </div>
                    </div>

                    {/* Info immagine - Mobile Compact */}
                    <div className="p-2 sm:p-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs text-slate-300 border-slate-500">
                          ID: {image.id}
                        </Badge>
                        <span className="text-xs text-slate-400 truncate max-w-16 sm:max-w-20" title={image.name}>
                          {image.name.split('.')[0].substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <FileImage className="h-16 sm:h-20 w-16 sm:w-20 text-slate-400 mx-auto mb-4 sm:mb-6" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">
                  Nessuna immagine caricata
                </h3>
                <p className="text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">
                  Questa richiesta non ha ancora immagini associate. Carica le prime foto per iniziare.
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-green-500 hover:bg-green-600 text-white border-0"
                >
                  <Camera className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
                  Carica Prima Immagine
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 text-sm sm:text-base"
            >
              <X className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Immagine Ingrandita - Mobile Responsive */}
      {isImageModalOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-95">
          <div className="absolute inset-0" onClick={() => setIsImageModalOpen(false)}></div>
          
          <div className="relative z-10 max-w-[95vw] max-h-[95vh] p-2 sm:p-4">
            {/* Pulsante chiudi - Mobile Friendly */}
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 sm:p-3 rounded-full transition-all z-30 backdrop-blur-sm shadow-lg"
              title="Chiudi (ESC)"
            >
              <X className="h-4 sm:h-5 w-4 sm:w-5" />
            </button>
            
            <div className="relative group">
              <img
                src={images[selectedImageIndex]?.url}
                alt={`Immagine ${selectedImageIndex + 1} di ${images.length}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              
              {/* Controlli navigazione - Mobile Optimized */}
              {images.length > 1 && (
                <>
                  {/* Zone cliccabili invisibili per navigazione */}
                  <div 
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === 0 ? images.length - 1 : prev - 1
                    )}
                    className="absolute left-0 top-0 w-1/3 h-full cursor-pointer z-10"
                    title="Immagine precedente (←)"
                  />
                  
                  <div 
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-0 top-0 w-1/3 h-full cursor-pointer z-10"
                    title="Immagine successiva (→)"
                  />

                  {/* Pulsanti navigazione visibili - Mobile Responsive */}
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === 0 ? images.length - 1 : prev - 1
                    )}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-80 text-white p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-sm z-20"
                    title="Immagine precedente (←)"
                  >
                    <ArrowLeft className="h-4 sm:h-5 w-4 sm:w-5" />
                  </button>
                  
                  <button
                    onClick={() => setSelectedImageIndex(prev => 
                      prev === images.length - 1 ? 0 : prev + 1
                    )}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-80 text-white p-2 sm:p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-sm z-20"
                    title="Immagine successiva (→)"
                  >
                    <ArrowRight className="h-4 sm:h-5 w-4 sm:w-5" />
                  </button>
                  
                  {/* Indicatori numerici - Mobile Responsive */}
                  <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full transition-all ${
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
            
            {/* Info immagine corrente - Mobile Responsive */}
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 bg-black bg-opacity-50 px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-white text-center backdrop-blur-sm">
              <div className="text-xs sm:text-sm font-medium">
                Immagine {selectedImageIndex + 1} di {images.length}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                ID: {images[selectedImageIndex]?.id} • {images[selectedImageIndex]?.name}
              </div>
            </div>
            
            {/* Istruzioni controlli - Mobile Responsive */}
            {images.length > 1 && (
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6 bg-black bg-opacity-50 px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-white text-xs backdrop-blur-sm">
                <div>← → per navigare</div>
                <div>ESC per chiudere</div>
                <div className="hidden sm:block">Click sui lati per cambiare</div>
              </div>
            )}

            {/* Pulsante download - Mobile Responsive */}
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-black bg-opacity-50 rounded-lg backdrop-blur-sm">
              <a
                href={images[selectedImageIndex]?.url}
                download={images[selectedImageIndex]?.name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 text-white hover:bg-white hover:bg-opacity-20 transition-colors rounded-lg"
                title="Scarica immagine"
              >
                <Download className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="text-xs hidden sm:inline">Scarica</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Componente di conferma elegante */}
      <ConfirmationComponent />
    </>
  )
}