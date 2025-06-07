import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Clock, FileText, Mail, Loader2 } from 'lucide-react'
import { 
  RequestStatusEnum, 
  FinalOutcomeEnum, 
  CloseReasonEnum, 
  AutomaticActionsMap,
  getStatusColor,
  type StatusChangeRequest 
} from '@/lib/types'
import { API_BASE_URL } from '@/lib/api'

interface StatusSelectorProps {
  isOpen: boolean
  onClose: () => void
  currentStatus: number
  requestId: string
  onStatusChanged: (newStatus: number, finalOutcome?: number, closeReason?: number) => void
}

export default function StatusSelector({ 
  isOpen, 
  onClose, 
  currentStatus, 
  requestId, 
  onStatusChanged 
}: StatusSelectorProps) {
  
  // Stati del form
  const [selectedStatus, setSelectedStatus] = useState<number>(currentStatus)
  const [selectedOutcome, setSelectedOutcome] = useState<number>(0)
  const [selectedReason, setSelectedReason] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  // Helper per ottenere gli stati disponibili (esclude lo stato attuale)
  const getAvailableStatuses = () => {
    return Object.entries(RequestStatusEnum)
      .filter(([key]) => parseInt(key) !== 0 && parseInt(key) !== currentStatus)
      .map(([key, value]) => ({ key: parseInt(key), value }))
  }

  // Helper per verificare se lo stato selezionato richiede esito finale
  const requiresFinalOutcome = () => selectedStatus === 40

  // Helper per verificare se l'esito selezionato richiede motivazione
  const requiresCloseReason = () => selectedOutcome === 30

  // Helper per ottenere l'azione automatica per la motivazione selezionata
  const getAutomaticAction = () => {
    if (selectedReason > 0 && AutomaticActionsMap[selectedReason]) {
      return AutomaticActionsMap[selectedReason]
    }
    return null
  }

  // Validazione del form
  const isFormValid = () => {
    if (selectedStatus === 0) return false
    if (requiresFinalOutcome() && selectedOutcome === 0) return false
    if (requiresCloseReason() && selectedReason === 0) return false
    return true
  }

  // Reset del form quando si chiude
  const handleClose = () => {
    setSelectedStatus(currentStatus)
    setSelectedOutcome(0)
    setSelectedReason(0)
    setNotes('')
    setIsLoading(false)
    onClose()
  }

  // Reset dei campi dipendenti quando cambia lo stato principale
  const handleStatusChange = (newStatus: number) => {
    setSelectedStatus(newStatus)
    setSelectedOutcome(0)
    setSelectedReason(0)
  }

  // Reset motivazione quando cambia l'esito
  const handleOutcomeChange = (newOutcome: number) => {
    setSelectedOutcome(newOutcome)
    setSelectedReason(0)
  }

  // Salvataggio
  const handleSave = async () => {
    if (!isFormValid()) return

    setIsLoading(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      const statusChangeData: StatusChangeRequest = {
        RequestId: requestId,
        NewStatus: selectedStatus,
        FinalOutcome: selectedOutcome || undefined,
        CloseReason: selectedReason || undefined,
        Notes: notes || undefined
      }

      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusChangeData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Errore ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Stato cambiato con successo:', result)
      
      // Callback al parent
      onStatusChanged(selectedStatus, selectedOutcome || undefined, selectedReason || undefined)
      
      // Chiudi modal
      handleClose()
    } catch (error) {
      console.error('❌ Errore nel cambio stato:', error)
      alert(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper per il badge styles
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-orange-500" />
            Cambia Stato Richiesta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Stato attuale - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-slate-700/50 rounded-lg">
            <div className="flex-1">
              <Label className="text-sm text-slate-400">Stato attuale:</Label>
              <Badge className={`ml-2 text-xs sm:text-sm ${getBadgeStyles(getStatusColor(currentStatus))}`}>
                {RequestStatusEnum[currentStatus]}
              </Badge>
            </div>
          </div>

          {/* Selezione nuovo stato - Mobile Responsive */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm sm:text-base">Nuovo Stato *</Label>
            <Select 
              value={selectedStatus.toString()} 
              onValueChange={(value) => handleStatusChange(parseInt(value))}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-11 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="Seleziona nuovo stato..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {getAvailableStatuses().map(({ key, value }) => (
                  <SelectItem 
                    key={key} 
                    value={key.toString()}
                    className="text-white hover:bg-slate-600 py-3 sm:py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getBadgeStyles(getStatusColor(key))}`}>
                        {value}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selezione esito finale - Mobile Responsive */}
          {requiresFinalOutcome() && (
            <div className="space-y-2 p-3 sm:p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <Label htmlFor="outcome" className="flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle className="h-3 sm:h-4 w-3 sm:w-4 text-blue-400" />
                Esito Finale *
              </Label>
              <Select 
                value={selectedOutcome.toString()} 
                onValueChange={(value) => handleOutcomeChange(parseInt(value))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-11 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Seleziona esito finale..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {Object.entries(FinalOutcomeEnum)
                    .filter(([key]) => parseInt(key) !== 0)
                    .map(([key, value]) => (
                      <SelectItem 
                        key={key} 
                        value={key}
                        className="text-white hover:bg-slate-600 py-3 sm:py-2 text-sm sm:text-base"
                      >
                        {value}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selezione motivazione - Mobile Responsive */}
          {requiresCloseReason() && (
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
              <Label htmlFor="reason" className="flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle className="h-3 sm:h-4 w-3 sm:w-4 text-red-400" />
                Motivazione Non Acquistata *
              </Label>
              <Select 
                value={selectedReason.toString()} 
                onValueChange={(value) => setSelectedReason(parseInt(value))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-11 sm:h-10 text-sm sm:text-base">
                  <SelectValue placeholder="Seleziona motivazione..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {Object.entries(CloseReasonEnum)
                    .filter(([key]) => parseInt(key) !== 0)
                    .map(([key, value]) => (
                      <SelectItem 
                        key={key} 
                        value={key}
                        className="text-white hover:bg-slate-600 py-3 sm:py-2 text-sm sm:text-base"
                      >
                        {value}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Azione automatica - Mobile Responsive */}
              {getAutomaticAction() && (
                <div className="mt-3 p-3 bg-orange-900/30 border border-orange-700/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Mail className="h-3 sm:h-4 w-3 sm:w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-orange-400">Azione Automatica</p>
                      <p className="text-xs sm:text-sm text-orange-200 break-words">{getAutomaticAction()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Note opzionali - Mobile Responsive */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2 text-sm sm:text-base">
              <FileText className="h-3 sm:h-4 w-3 sm:w-4 text-slate-400" />
              Note aggiuntive (opzionale)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Aggiungi note sul cambio di stato..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none text-sm sm:text-base min-h-[80px] sm:min-h-[60px]"
              rows={3}
            />
            <p className="text-xs text-slate-500">{notes.length} caratteri</p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 w-full sm:w-auto order-2 sm:order-1 touch-manipulation"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid() || isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 w-full sm:w-auto order-1 sm:order-2 touch-manipulation"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              'Conferma Cambio Stato'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}