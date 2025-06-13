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
  FileImage,
  Info,
  Zap,
  Camera,
  Minimize2
} from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { useConfirmation } from './ConfirmationDialog'
import Compressor from 'compressorjs'

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
  originalSize: number
  compressedSize: number
  progress: number
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error'
  error?: string
}

interface CompressionStats {
  totalOriginalSize: number
  totalCompressedSize: number
  compressionRatio: number
  filesProcessed: number
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
  
  // Stati per upload e compressione
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null)
  
  // 🆕 PAGINAZIONE SEMPLICE
  const [currentPage, setCurrentPage] = useState(1)
  const IMAGES_PER_PAGE = 8// Mostra solo 12 immagini per volta
  
  // Stati per statistiche
  const [stats, setStats] = useState({
    totalImages: 0,
    maxImages: 50,
    remainingSlots: 50
  })

  // Limiti
  const MAX_SINGLE_FILE_SIZE = 5 * 1024 * 1024 // 5MB per file DOPO compressione
  const MAX_FILES_PER_REQUEST = 50 // Massimo 50 foto per richiesta
  const MAX_FILES_PER_UPLOAD = 20 // 20 file per volta (per performance UI)
  const COMPRESSION_QUALITY = 0.2
  const MAX_DIMENSION = 3000

  // Utility per formattare dimensioni file
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // 🆕 CALCOLO IMMAGINI PAGINATE
  const totalPages = Math.ceil(images.length / IMAGES_PER_PAGE)
  const startIndex = (currentPage - 1) * IMAGES_PER_PAGE
  const endIndex = startIndex + IMAGES_PER_PAGE
  const currentImages_paginated = images.slice(startIndex, endIndex)

  // Reset paginazione quando cambia il numero di immagini
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // Funzione di compressione delle immagini
  const compressImage = useCallback((file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: COMPRESSION_QUALITY,
        maxHeight: MAX_DIMENSION,
        maxWidth: MAX_DIMENSION,
        mimeType: 'image/jpeg',
        success: (result) => {
          resolve(new File([result], file.name.replace(/\.[^/.]+$/, '.jpg'), { 
            type: 'image/jpeg',
            lastModified: file.lastModified 
          }))
        },
        error: (error) => reject(error),
      })
    })
  }, [])

  // ✅ NUOVA FUNZIONE - Validazione file compressi
  const validateCompressedFile = useCallback((originalFile: File, compressedFile: File): string | null => {
    // Controlla dimensione del file compresso
    if (compressedFile.size > MAX_SINGLE_FILE_SIZE) {
      return `${originalFile.name}: Anche dopo compressione il file è troppo grande (${formatFileSize(compressedFile.size)}). Massimo ${formatFileSize(MAX_SINGLE_FILE_SIZE)} per file.`
    }
    return null
  }, [formatFileSize])

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
      
      // Aggiorna statistiche con nuovi limiti
      setStats({
        totalImages: result.count || 0,
        maxImages: result.maxImages || 50,
        remainingSlots: result.remainingSlots || 50
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
      setCompressionStats(null)
      setCurrentPage(1) // Reset paginazione
    }
  }, [isOpen, fetchImages])

  // 🆕 Gestione drag & drop SEMPLIFICATA
  useEffect(() => {
    if (!isOpen) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      // Solo se usciamo completamente dalla finestra
      if (!e.relatedTarget) {
        setIsDragOver(false)
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      
      const files = Array.from(e.dataTransfer?.files || [])
      if (files.length > 0) {
        handleUpload(files)
      }
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [isOpen])

  // Gestione selezione file
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleUpload(files)
    }
  }, [])

  // ✅ VALIDAZIONE AGGIORNATA - Solo tipo, non dimensione originale
  const validateFiles = useCallback(async (files: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    
    const validFiles: File[] = []
    const errors: string[] = []

    // Controllo numero massimo file per upload singolo
    if (files.length > MAX_FILES_PER_UPLOAD) {
      errors.push(`Massimo ${MAX_FILES_PER_UPLOAD} file per volta. Selezionati: ${files.length}`)
      return { validFiles: [], errors }
    }

    // Controllo numero massimo immagini per richiesta
    if (stats.totalImages + files.length > MAX_FILES_PER_REQUEST) {
      const available = MAX_FILES_PER_REQUEST - stats.totalImages
      errors.push(`Spazio insufficiente. Hai ${stats.totalImages} immagini, stai aggiungendo ${files.length}. Massimo: ${MAX_FILES_PER_REQUEST}. Spazio disponibile: ${available}`)
      return { validFiles: [], errors }
    }

    // ✅ VALIDAZIONE SOLO TIPO - La dimensione sarà controllata dopo compressione
    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Formato non supportato. Usa JPEG, PNG, GIF o WebP.`)
      } else {
        validFiles.push(file)
      }
    })

    return { validFiles, errors }
  }, [stats.totalImages])

  // Upload con compressione
  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    const { validFiles, errors } = await validateFiles(files)

    if (errors.length > 0) {
      showConfirmation({
        title: 'Errori di Validazione',
        message: `${errors.join('\n\n')}${validFiles.length > 0 ? `\n\nVuoi procedere con i ${validFiles.length} file validi?` : ''}`,
        type: 'warning',
        confirmText: validFiles.length > 0 ? `Procedi con ${validFiles.length} file` : 'OK',
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
  }, [validateFiles, showConfirmation])

  // ✅ FUNZIONE DI UPLOAD AGGIORNATA con controllo post-compressione
  const performUpload = useCallback(async (validFiles: File[]) => {
    setIsUploading(true)
    
    // Inizializza progress per compressione
    const initialProgress: UploadProgress[] = validFiles.map(file => ({
      filename: file.name,
      originalSize: file.size,
      compressedSize: 0,
      progress: 0,
      status: 'pending'
    }))
    setUploadProgress(initialProgress)

    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      console.log(`🔄 Inizio compressione di ${validFiles.length} immagini`)

      // FASE 1: Compressione + Validazione dimensione
      const compressedFiles: File[] = []
      let totalOriginalSize = 0
      let totalCompressedSize = 0

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        totalOriginalSize += file.size

        // Aggiorna status a compressing
        setUploadProgress(prev => prev.map((p, index) => 
          index === i ? { ...p, status: 'compressing' as const, progress: 10 } : p
        ))

        try {
          const compressedFile = await compressImage(file)
          
          // ✅ CONTROLLO DIMENSIONE SU FILE COMPRESSO
          const sizeError = validateCompressedFile(file, compressedFile)
          if (sizeError) {
            console.error(`❌ ${sizeError}`)
            setUploadProgress(prev => prev.map((p, index) => 
              index === i ? { 
                ...p, 
                status: 'error' as const, 
                error: sizeError 
              } : p
            ))
            continue // Salta questo file ma continua con gli altri
          }

          compressedFiles.push(compressedFile)
          totalCompressedSize += compressedFile.size

          // Aggiorna progress compressione completata
          setUploadProgress(prev => prev.map((p, index) => 
            index === i ? { 
              ...p, 
              compressedSize: compressedFile.size,
              progress: 50,
              status: 'uploading' as const 
            } : p
          ))

        } catch (compressionError) {
          console.error(`❌ Errore compressione ${file.name}:`, compressionError)
          setUploadProgress(prev => prev.map((p, index) => 
            index === i ? { 
              ...p, 
              status: 'error' as const, 
              error: 'Errore durante la compressione' 
            } : p
          ))
        }
      }

      // ✅ CONTROLLO: Se nessun file è passato la validazione post-compressione
      if (compressedFiles.length === 0) {
        throw new Error('Nessun file valido dopo compressione e validazione dimensioni')
      }

      // Aggiorna statistiche compressione
      const compressionRatio = totalOriginalSize > 0 ? (totalOriginalSize - totalCompressedSize) / totalOriginalSize : 0
      setCompressionStats({
        totalOriginalSize,
        totalCompressedSize,
        compressionRatio,
        filesProcessed: compressedFiles.length
      })

      // FASE 2: Upload (solo file che hanno passato tutti i controlli)
      const formData = new FormData()
      compressedFiles.forEach(file => {
        formData.append('images', file)
      })

      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Errore ${response.status}`)
      }

      const result = await response.json()

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
        setTimeout(() => {
          setUploadProgress([])
          setCompressionStats(null)
        }, 2000)
      }, 500)

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
  }, [requestId, compressImage, validateCompressedFile, fetchImages, currentImages, onImagesUpdated])

  // Elimina immagine
  const handleDeleteImage = useCallback(async (imageId: number, imageName: string) => {
    showConfirmation({
      title: 'Elimina Immagine',
      message: `Sei sicuro di voler eliminare l'immagine "${imageName}"?`,
      type: 'danger',
      confirmText: 'Elimina',
      cancelText: 'Annulla',
      onConfirm: async () => {
        try {
          const auth = localStorage.getItem('automud_auth')
          if (!auth) {
            throw new Error('Utente non autenticato')
          }

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

          // Aggiorna solo localmente senza ricaricare
          const updatedImages = images.filter(img => img.id !== imageId)
          setImages(updatedImages)
          
          // Aggiorna le statistiche
          setStats(prev => ({
            ...prev,
            totalImages: updatedImages.length,
            remainingSlots: MAX_FILES_PER_REQUEST - updatedImages.length
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
  }, [images, requestId, currentImages, onImagesUpdated, showConfirmation])

  // Elimina tutte le immagini
  const handleDeleteAllImages = useCallback(async () => {
    if (images.length === 0) return
    
    showConfirmation({
      title: 'Elimina Tutte le Immagini',
      message: `Eliminare tutte le ${images.length} immagini?`,
      type: 'danger',
      confirmText: `Elimina ${images.length} Immagini`,
      cancelText: 'Annulla',
      onConfirm: async () => {
        try {
          const auth = localStorage.getItem('automud_auth')
          if (!auth) {
            throw new Error('Utente non autenticato')
          }

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

          // Reset tutto
          setImages([])
          setStats({
            totalImages: 0,
            maxImages: MAX_FILES_PER_REQUEST,
            remainingSlots: MAX_FILES_PER_REQUEST
          })
          setCurrentPage(1)
          onImagesUpdated([])

        } catch (error) {
          console.error('❌ Errore eliminazione tutte:', error)
          throw error
        }
      }
    })
  }, [images.length, requestId, onImagesUpdated, showConfirmation])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Camera className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500" />
              Gestione Immagini ({images.length})
              {stats.totalImages > 0 && (
                <Badge className="bg-blue-600 text-white ml-2 text-xs">
                  {stats.totalImages}/{stats.maxImages}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#475569 #1e293b'
          }}>
            <style dangerouslySetInnerHTML={{
              __html: `
                .flex-1::-webkit-scrollbar {
                  width: 8px;
                }
                .flex-1::-webkit-scrollbar-track {
                  background: #1e293b;
                  border-radius: 4px;
                }
                .flex-1::-webkit-scrollbar-thumb {
                  background: #475569;
                  border-radius: 4px;
                  border: 1px solid #334155;
                }
                .flex-1::-webkit-scrollbar-thumb:hover {
                  background: #64748b;
                }
              `
            }} />
            <div className="space-y-4 p-1">
              {/* Info limiti - Compatto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-200 text-sm">Limiti</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>Max per file: {formatFileSize(MAX_SINGLE_FILE_SIZE)} (dopo compressione)</p>
                    <p>Foto: {stats.totalImages}/{stats.maxImages} • Libere: {stats.remainingSlots}</p>
                  </div>
                </div>

                <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Minimize2 className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-400 text-sm">Compressione Auto</span>
                  </div>
                  <div className="text-xs text-purple-200 space-y-1">
                    <p>Qualità: {(COMPRESSION_QUALITY * 100).toFixed(0)}% • Max: {MAX_DIMENSION}px</p>
                    <p>Formato: JPEG ottimizzato</p>
                  </div>
                </div>
              </div>

              {/* Statistiche compressione */}
              {compressionStats && (
                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3">
                  <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2">
                    <Minimize2 className="h-4 w-4" />
                    Compressione Completata
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-slate-400">File:</p>
                      <p className="font-medium text-white">{compressionStats.filesProcessed}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">Originale:</p>
                      <p className="font-medium text-red-400">{formatFileSize(compressionStats.totalOriginalSize)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">Compressa:</p>
                      <p className="font-medium text-green-400">{formatFileSize(compressionStats.totalCompressedSize)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">Risparmio:</p>
                      <p className="font-medium text-green-400">{(compressionStats.compressionRatio * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Progress - Compatto */}
              {uploadProgress.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                  <h3 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Upload in Corso
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {uploadProgress.map((progress, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white truncate">{progress.filename}</span>
                            <span className="text-xs text-slate-400">{progress.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-700 rounded-full h-1">
                            <div 
                              className={`h-1 rounded-full transition-all ${
                                progress.status === 'success' ? 'bg-green-500' :
                                progress.status === 'error' ? 'bg-red-500' :
                                progress.status === 'compressing' ? 'bg-purple-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progress.progress}%` }}
                            />
                          </div>
                          {progress.error && (
                            <p className="text-xs text-red-400 mt-1 truncate">{progress.error}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {progress.status === 'success' && <CheckCircle className="h-4 w-4 text-green-400" />}
                          {progress.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                          {progress.status === 'compressing' && <Minimize2 className="h-4 w-4 animate-pulse text-purple-400" />}
                          {progress.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-blue-400" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Zona Upload */}
              <div 
                ref={dropZoneRef}
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-slate-600 hover:border-slate-500'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex flex-col items-center gap-3">
                  <Upload className={`h-8 w-8 ${isDragOver ? 'text-blue-400' : 'text-slate-400'}`} />
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {isDragOver ? 'Rilascia qui' : 'Carica Immagini'}
                    </h3>
                    <p className="text-slate-400 text-sm mb-3">
                      Trascina o clicca • Compressione automatica • Max {formatFileSize(MAX_SINGLE_FILE_SIZE)} dopo compressione
                    </p>
                    
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading || stats.remainingSlots === 0}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        size="sm"
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                        {isUploading ? 'Caricamento...' : 'Seleziona'}
                      </Button>
                      
                      <Button
                        onClick={fetchImages}
                        disabled={isLoading}
                        variant="outline"
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                        size="sm"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>

                    {stats.remainingSlots === 0 && (
                      <p className="text-red-400 text-xs mt-2">Limite raggiunto - Elimina foto per caricarne altre</p>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* 🆕 GRIGLIA IMMAGINI SEMPLICE CON PAGINAZIONE */}
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-slate-400 text-sm">Caricamento...</p>
                </div>
              ) : images.length > 0 ? (
                <>
                  {/* Azioni di massa */}
                  <div className="flex justify-between items-center bg-slate-700/30 p-3 rounded-lg">
                    <span className="text-sm text-slate-400">
                      {images.length} immagini totali
                    </span>
                    <Button
                      onClick={handleDeleteAllImages}
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Elimina Tutte
                    </Button>
                  </div>

                  {/* Griglia semplice */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {currentImages_paginated.map((image, index) => (
                      <div key={image.id} className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden group">
                        {/* Immagine */}
                        <div className="relative aspect-square">
                          <img
                            src={image.url}
                            alt={`Immagine ${startIndex + index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          
                          {/* Fallback */}
                          <div className="absolute inset-0 hidden items-center justify-center bg-slate-600">
                            <ImageIcon className="h-8 w-8 text-slate-400" />
                          </div>

                          {/* Overlay elimina */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Button
                              size="sm"
                              onClick={() => handleDeleteImage(image.id, image.name)}
                              variant="destructive"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Numero */}
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {startIndex + index + 1}
                          </div>

                          {/* Badge JPEG */}
                          <div className="absolute top-2 right-2 bg-purple-600/80 text-white text-xs px-2 py-1 rounded">
                            JPEG
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs text-slate-300 border-slate-500">
                              ID: {image.id}
                            </Badge>
                            <span className="text-xs text-slate-400 truncate max-w-16" title={image.name}>
                              {image.name.split('.')[0].substring(0, 6)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 🆕 PAGINAZIONE SEMPLICE */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        ‹ Precedente
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className={`w-8 h-8 p-0 text-xs ${
                                currentPage === pageNum 
                                  ? "bg-orange-500 border-orange-500 text-white" 
                                  : "bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                        className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                      >
                        Successiva ›
                      </Button>
                    </div>
                  )}

                  {/* Info paginazione */}
                  {totalPages > 1 && (
                    <div className="text-center text-xs text-slate-500">
                      Pagina {currentPage} di {totalPages} • 
                      Mostrando {currentImages_paginated.length} di {images.length} immagini
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <FileImage className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Nessuna immagine caricata
                  </h3>
                  <p className="text-slate-400 mb-4 text-sm">
                    Carica le prime foto per iniziare
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Carica Prima Immagine
                  </Button>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t border-slate-700">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <X className="h-4 w-4 mr-2" />
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationComponent />
    </>
  )
}