import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { AlertTriangle, Trash2, X, CheckCircle, Info, AlertCircle } from 'lucide-react'

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  isLoading = false
}: ConfirmationDialogProps) {

  // Configurazioni per tipo
  const typeConfig = {
    danger: {
      icon: AlertTriangle,
      bgColor: 'bg-red-900/20',
      borderColor: 'border-red-700/50',
      iconColor: 'text-red-400',
      titleColor: 'text-red-400',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white border-red-500',
      iconBgClass: 'bg-red-600/20'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-orange-900/20',
      borderColor: 'border-orange-700/50',
      iconColor: 'text-orange-400',
      titleColor: 'text-orange-400',
      confirmButtonClass: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-400',
      iconBgClass: 'bg-orange-600/20'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-700/50',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-400',
      confirmButtonClass: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-400',
      iconBgClass: 'bg-blue-600/20'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-700/50',
      iconColor: 'text-green-400',
      titleColor: 'text-green-400',
      confirmButtonClass: 'bg-green-500 hover:bg-green-600 text-white border-green-400',
      iconBgClass: 'bg-green-600/20'
    }
  }

  const config = typeConfig[type]
  const IconComponent = config.icon

  const handleConfirm = () => {
    onConfirm()
    // Non chiudiamo automaticamente il modal se è in loading
    // Sarà il parent component a gestire la chiusura
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md z-[70]">
        
        {/* Header personalizzato senza il DialogHeader standard */}
        <div className="flex items-start gap-4 p-6 pb-4">
          {/* Icona con sfondo colorato */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${config.iconBgClass} flex items-center justify-center`}>
            <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          
          {/* Titolo e messaggio */}
          <div className="flex-1 pt-1">
            <h3 className={`text-lg font-semibold ${config.titleColor} mb-2`}>
              {title}
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Alert box per evidenziare il messaggio */}
        <div className={`mx-6 p-4 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
          <div className="flex items-start gap-3">
            <IconComponent className={`h-4 w-4 ${config.iconColor} mt-0.5 flex-shrink-0`} />
            <div>
              <p className={`text-sm font-medium ${config.titleColor}`}>
                {type === 'danger' ? 'Azione Irreversibile' : 
                 type === 'warning' ? 'Attenzione Richiesta' :
                 type === 'info' ? 'Informazione' : 'Conferma Richiesta'}
              </p>
              <p className="text-sm text-slate-200 mt-1">
                {type === 'danger' 
                  ? 'Questa operazione non può essere annullata una volta completata.'
                  : 'Assicurati di voler procedere con questa operazione.'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Footer con pulsanti */}
        <DialogFooter className="flex gap-3 p-6 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 hover:border-slate-500 flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {cancelText}
          </Button>
          
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`${config.confirmButtonClass} flex-1 font-medium transition-all duration-200 shadow-lg`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Elaborazione...
              </>
            ) : (
              <>
                {type === 'danger' && <Trash2 className="h-4 w-4 mr-2" />}
                {type === 'warning' && <AlertCircle className="h-4 w-4 mr-2" />}
                {type === 'info' && <Info className="h-4 w-4 mr-2" />}
                {type === 'success' && <CheckCircle className="h-4 w-4 mr-2" />}
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook personalizzato per semplificare l'uso
export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [config, setConfig] = useState<{
    title: string
    message: string
    type: 'danger' | 'warning' | 'info' | 'success'
    confirmText: string
    cancelText: string
    onConfirm: () => void
  }>({
    title: '',
    message: '',
    type: 'danger',
    confirmText: 'Conferma',
    cancelText: 'Annulla',
    onConfirm: () => {}
  })
  const [isLoading, setIsLoading] = useState(false)

  const showConfirmation = (options: {
    title: string
    message: string
    type?: 'danger' | 'warning' | 'info' | 'success'
    confirmText?: string
    cancelText?: string
    onConfirm: () => void | Promise<void>
  }) => {
    setConfig({
      title: options.title,
      message: options.message,
      type: options.type || 'danger',
      confirmText: options.confirmText || 'Conferma',
      cancelText: options.cancelText || 'Annulla',
      onConfirm: async () => {
        setIsLoading(true)
        try {
          await options.onConfirm()
          setIsOpen(false)
        } catch (error) {
          console.error('Error in confirmation action:', error)
        } finally {
          setIsLoading(false)
        }
      }
    })
    setIsOpen(true)
  }

  const hideConfirmation = () => {
    if (!isLoading) {
      setIsOpen(false)
    }
  }

  const ConfirmationComponent = () => (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={hideConfirmation}
      onConfirm={config.onConfirm}
      title={config.title}
      message={config.message}
      type={config.type}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      isLoading={isLoading}
    />
  )

  return {
    showConfirmation,
    hideConfirmation,
    ConfirmationComponent,
    isLoading
  }
}