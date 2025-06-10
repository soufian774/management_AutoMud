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
  
  // Stati per statistiche (migliorato)
  const [stats, setStats] = useState({
    totalImages: 0,
    totalSize: 0,
    realTotalSize: 0, // 🆕 Dimensione reale tracciata
    lastUpload: null as string | null
  })

  // 🆕 LIMITI E COSTANTI
  const MAX_TOTAL_SIZE = 10 * 1024 * 1024 // 10MB in bytes
  const MAX_FILES_PER_UPLOAD = 10
  const COMPRESSION_QUALITY = 0.2
  const MAX_DIMENSION = 3000

  // 🆕 Funzione di compressione delle immagini
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: COMPRESSION_QUALITY,
        maxHeight: MAX_DIMENSION,
        maxWidth: MAX_DIMENSION,
        mimeType: 'image/jpeg', // Forza JPEG per migliore compressione
        success: (result) => {
          resolve(new File([result], file.name.replace(/\.[^/.]+$/, '.jpg'), { 
            type: 'image/jpeg',
            lastModified: file.lastModified 
          }))
        },
        error: (error) => reject(error),
      })
    })
  }

  // 🆕 Calcola dimensione totale attuale (migliorato)
  const getCurrentTotalSize = async (): Promise<number> => {
    try {
      // Invece di stimare, prova a calcolare la dimensione reale
      let totalSize = 0;
      
      // Per le immagini esistenti, stima più conservativa basata sul numero
      // Le immagini compresse sono tipicamente 50-200KB
      const estimatedSizePerImage = 150 * 1024; // 150KB stima media
      totalSize = images.length * estimatedSizePerImage;
      
      console.log(`📊 Dimensione stimata attuale: ${images.length} immagini × ${estimatedSizePerImage/1024}KB = ${formatFileSize(totalSize)}`);
      
      return totalSize;
    } catch (error) {
      console.error('Errore calcolo dimensione:', error);
      // Fallback sicuro
      return images.length * 100 * 1024; // 100KB per immagine
    }
  }

  // 🆕 Utility per formattare dimensioni file
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

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
      const currentTotalSize = await getCurrentTotalSize()
      setStats({
        totalImages: result.images?.length || 0,
        totalSize: currentTotalSize,
        realTotalSize: currentTotalSize, // Per ora usa la stima
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
      setCompressionStats(null)
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

  // 🆕 Validazione file migliorata con controllo dimensione totale
  const validateFiles = async (files: File[]) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSingleFileSize = 50 * 1024 * 1024 // 50MB per file singolo prima della compressione
    
    const validFiles: File[] = []
    const errors: string[] = []

    // Controllo numero massimo file
    if (files.length > MAX_FILES_PER_UPLOAD) {
      errors.push(`Massimo ${MAX_FILES_PER_UPLOAD} file per volta. Selezionati: ${files.length}`)
      return { validFiles: [], errors }
    }

    // Controllo dimensione totale attuale
    const currentTotalSize = await getCurrentTotalSize()
    console.log(`📊 Dimensione attuale: ${formatFileSize(currentTotalSize)}`)

    if (currentTotalSize >= MAX_TOTAL_SIZE) {
      errors.push(`Limite totale di ${formatFileSize(MAX_TOTAL_SIZE)} già raggiunto. Elimina alcune immagini prima di caricarne altre.`)
      return { validFiles: [], errors }
    }

    // Stima dimensioni post-compressione (circa 10-20% della dimensione originale)
    let estimatedCompressedSize = 0
    
    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Formato non supportato. Usa JPEG, PNG, GIF o WebP.`)
      } else if (file.size > maxSingleFileSize) {
        errors.push(`${file.name}: File troppo grande (${formatFileSize(file.size)}). Massimo 50MB per file.`)
      } else {
        validFiles.push(file)
        // Stima conservativa: 15% della dimensione originale dopo compressione
        estimatedCompressedSize += file.size * 0.15
      }
    })

    // Controllo se l'aggiunta supererebbe il limite
    if (currentTotalSize + estimatedCompressedSize > MAX_TOTAL_SIZE) {
      const availableSpace = MAX_TOTAL_SIZE - currentTotalSize
      errors.push(
        `Spazio disponibile: ${formatFileSize(availableSpace)}. ` +
        `Dimensione stimata file da caricare: ${formatFileSize(estimatedCompressedSize)}. ` +
        `Riduci il numero di file o elimina immagini esistenti.`
      )
    }

    return { validFiles, errors }
  }

  // 🆕 Upload con compressione
  const handleUpload = async (files: File[]) => {
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
  }

  // 🆕 Funzione di upload con compressione
  const performUpload = async (validFiles: File[]) => {
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

      // FASE 1: Compressione
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
          console.log(`🗜️ Compressione ${file.name} (${formatFileSize(file.size)})`)
          
          const compressedFile = await compressImage(file)
          compressedFiles.push(compressedFile)
          totalCompressedSize += compressedFile.size

          console.log(`✅ ${file.name} compresso: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)} (${Math.round((1 - compressedFile.size/file.size) * 100)}% riduzione)`)

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

      // Aggiorna statistiche compressione
      const compressionRatio = totalOriginalSize > 0 ? (totalOriginalSize - totalCompressedSize) / totalOriginalSize : 0
      setCompressionStats({
        totalOriginalSize,
        totalCompressedSize,
        compressionRatio,
        filesProcessed: compressedFiles.length
      })

      // Controllo finale dimensione
      const currentSize = await getCurrentTotalSize()
      if (currentSize + totalCompressedSize > MAX_TOTAL_SIZE) {
        throw new Error(`Anche dopo la compressione, le immagini supererebbero il limite di ${formatFileSize(MAX_TOTAL_SIZE)}`)
      }

      console.log(`📤 Inizio upload di ${compressedFiles.length} immagini compresse (${formatFileSize(totalCompressedSize)})`)

      // FASE 2: Upload
      const formData = new FormData()
      compressedFiles.forEach(file => {
        formData.append('images', file)
      })

      // Simula progress upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev.map(p => 
          p.status === 'uploading' && p.progress < 90 
            ? { ...p, progress: Math.min(p.progress + 10, 90) }
            : p
        ))
      }, 300)

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
        
        // 🆕 Aggiorna la dimensione reale con i file appena caricati
        setStats(prev => ({
          ...prev,
          realTotalSize: prev.realTotalSize + totalCompressedSize
        }))
        
        // Notifica al parent component
        const newImageNames = [...currentImages, ...result.uploaded.map((img: any) => img.name)]
        onImagesUpdated(newImageNames)

        // Clear progress dopo successo
        setTimeout(() => {
          setUploadProgress([])
          setCompressionStats(null)
        }, 3000)
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
            totalImages: updatedImages.length,
            realTotalSize: Math.max(0, prev.realTotalSize - 150 * 1024) // Sottrai stima per immagine eliminata
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
            realTotalSize: 0,
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
            {/* 🆕 Info limiti e compressione - Mobile Responsive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-700/30 p-3 sm:p-4 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-3 sm:h-4 w-3 sm:w-4 text-slate-400" />
                  <span className="font-medium text-slate-200 text-sm">Limiti Sistema</span>
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="text-slate-400">
                    <span className="font-medium">Limite totale:</span> {formatFileSize(MAX_TOTAL_SIZE)}
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium">Spazio utilizzato:</span> {formatFileSize(stats.realTotalSize || stats.totalSize)}
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium">Spazio disponibile:</span> {formatFileSize(Math.max(0, MAX_TOTAL_SIZE - (stats.realTotalSize || stats.totalSize)))}
                  </p>
                </div>
              </div>

              <div className="bg-purple-900/20 p-3 sm:p-4 rounded-lg border border-purple-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <Minimize2 className="h-3 sm:h-4 w-3 sm:w-4 text-purple-400" />
                  <span className="font-medium text-purple-400 text-sm">Compressione Automatica</span>
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="text-purple-200">
                    <span className="font-medium">Qualità:</span> {(COMPRESSION_QUALITY * 100).toFixed(0)}%
                  </p>
                  <p className="text-purple-200">
                    <span className="font-medium">Risoluzione max:</span> {MAX_DIMENSION}px
                  </p>
                  <p className="text-purple-200">
                    <span className="font-medium">Formato:</span> JPEG ottimizzato
                  </p>
                </div>
              </div>
            </div>

            {/* 🆕 Statistiche compressione - Mobile Responsive */}
            {compressionStats && (
              <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Minimize2 className="h-3 sm:h-4 w-3 sm:w-4" />
                  Risultati Compressione
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
                  <div className="text-center sm:text-left">
                    <p className="text-slate-400">File processati:</p>
                    <p className="font-medium text-white">{compressionStats.filesProcessed}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-slate-400">Dimensione originale:</p>
                    <p className="font-medium text-red-400">{formatFileSize(compressionStats.totalOriginalSize)}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-slate-400">Dimensione compressa:</p>
                    <p className="font-medium text-green-400">{formatFileSize(compressionStats.totalCompressedSize)}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-slate-400">Risparmio spazio:</p>
                    <p className="font-medium text-green-400">{(compressionStats.compressionRatio * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* 🆕 Upload Progress migliorato - Mobile Responsive */}
            {uploadProgress.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 sm:p-4">
                <h3 className="font-semibold text-blue-400 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="h-3 sm:h-4 w-3 sm:w-4" />
                  Elaborazione in Corso
                </h3>
                <div className="space-y-3">
                  {uploadProgress.map((progress, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-white truncate max-w-xs">
                          {progress.filename}
                        </span>
                        <div className="flex items-center gap-2">
                          {progress.status === 'success' && <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-green-400" />}
                          {progress.status === 'error' && <AlertTriangle className="h-3 sm:h-4 w-3 sm:w-4 text-red-400" />}
                          {progress.status === 'compressing' && <Minimize2 className="h-3 sm:h-4 w-3 sm:w-4 animate-pulse text-purple-400" />}
                          {progress.status === 'uploading' && <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 animate-spin text-blue-400" />}
                          <span className="text-xs text-slate-400">{progress.progress}%</span>
                        </div>
                      </div>
                      
                      {/* Barra progresso */}
                      <div className="w-full bg-slate-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            progress.status === 'success' ? 'bg-green-500' :
                            progress.status === 'error' ? 'bg-red-500' :
                            progress.status === 'compressing' ? 'bg-purple-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>

                      {/* Info dimensioni */}
                      {progress.originalSize > 0 && (
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Originale: {formatFileSize(progress.originalSize)}</span>
                          {progress.compressedSize > 0 && (
                            <span>Compressa: {formatFileSize(progress.compressedSize)}</span>
                          )}
                        </div>
                      )}

                      {/* Status message */}
                      <div className="text-xs text-slate-400">
                        {progress.status === 'compressing' && 'Compressione in corso...'}
                        {progress.status === 'uploading' && 'Upload in corso...'}
                        {progress.status === 'success' && 'Completato con successo'}
                        {progress.error && <span className="text-red-400">{progress.error}</span>}
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
                  <p className="text-slate-400 mb-2 text-sm">
                    Trascina le immagini qui o clicca per selezionare
                  </p>
                  <div className="space-y-1 text-xs text-slate-500 mb-4">
                    <p>🗜️ Compressione automatica attiva</p>
                    <p>📏 Limite totale: {formatFileSize(MAX_TOTAL_SIZE)} • Spazio libero: {formatFileSize(Math.max(0, MAX_TOTAL_SIZE - stats.totalSize))}</p>
                    <p>📁 Massimo {MAX_FILES_PER_UPLOAD} file per volta • JPEG, PNG, GIF, WebP</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || (stats.realTotalSize || stats.totalSize) >= MAX_TOTAL_SIZE}
                      className="bg-green-500 hover:bg-green-600 text-white border-0 text-sm sm:text-base"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-3 sm:h-4 w-3 sm:w-4 mr-2 animate-spin" />
                          Elaborazione...
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

                  {/* 🆕 Warning se spazio insufficiente */}
                  {(stats.realTotalSize || stats.totalSize) >= MAX_TOTAL_SIZE * 0.9 && (
                    <div className="mt-4 p-3 bg-orange-900/30 border border-orange-700/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-orange-400">Spazio quasi esaurito</p>
                          <p className="text-sm text-orange-200">
                            Hai utilizzato {(((stats.realTotalSize || stats.totalSize) / MAX_TOTAL_SIZE) * 100).toFixed(1)}% dello spazio disponibile. 
                            Considera di eliminare alcune immagini prima di caricarne altre.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
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
                    {images.length} immagini • {formatFileSize(stats.realTotalSize || stats.totalSize)}
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
                        className="w-full h-full object-cover"
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

                      {/* Overlay con pulsante elimina */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          size="sm"
                          onClick={() => handleDeleteImage(image.id, image.name)}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 shadow-lg p-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Numero immagine */}
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black/70 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                        {index + 1}
                      </div>

                      {/* 🆕 Badge compressione */}
                      <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-purple-600/80 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Minimize2 className="h-2 w-2" />
                        <span>JPEG</span>
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
                <div className="space-y-2">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="bg-green-500 hover:bg-green-600 text-white border-0"
                  >
                    <Camera className="h-3 sm:h-4 w-3 sm:w-4 mr-2" />
                    Carica Prima Immagine
                  </Button>
                  <p className="text-xs text-slate-500">
                    Le immagini saranno automaticamente compresse per ottimizzare lo spazio
                  </p>
                </div>
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

      {/* Componente di conferma elegante */}
      <ConfirmationComponent />
    </>
  )
}