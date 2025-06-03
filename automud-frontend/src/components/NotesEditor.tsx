import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileText, Loader2, Save, X } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'

interface NotesEditorProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
  currentNotes: string
  onNotesUpdated: (newNotes: string) => void
}

export default function NotesEditor({ 
  isOpen, 
  onClose, 
  requestId, 
  currentNotes, 
  onNotesUpdated 
}: NotesEditorProps) {
  
  const [notes, setNotes] = useState(currentNotes)
  const [isLoading, setIsLoading] = useState(false)

  // Reset notes quando si apre il modal
  const handleOpen = (open: boolean) => {
    if (open) {
      setNotes(currentNotes)
    } else {
      onClose()
    }
  }

  // Salvataggio note
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      console.log('💾 Aggiornamento note per richiesta:', requestId)

      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/notes`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Errore ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Note aggiornate con successo:', result)
      
      // Callback al parent per aggiornare l'UI
      onNotesUpdated(notes)
      
      // Chiudi modal
      onClose()
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento note:', error)
      alert(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  // Verifica se le note sono cambiate
  const hasChanges = notes !== currentNotes

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Modifica Note di Gestione
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info richiesta */}
          <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400">
              <span className="font-medium">Richiesta:</span> {requestId}
            </p>
          </div>

          {/* Editor note */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-200">
              Note di gestione
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Inserisci note di gestione per questa richiesta..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none min-h-[120px] focus:border-blue-500 focus:ring-blue-500/20"
              rows={6}
            />
            <p className="text-xs text-slate-400">
              {notes.length} caratteri
            </p>
          </div>

          {/* Anteprima cambiamenti */}
          {hasChanges && (
            <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-400">Modifiche in sospeso</p>
                  <p className="text-sm text-orange-200">
                    Le note sono state modificate. Clicca "Salva" per confermare i cambiamenti.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white border-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Note
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}