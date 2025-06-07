import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrendingUp, Loader2, Save, X, BarChart3, AlertTriangle } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { type RequestManagement } from '@/lib/types'

interface RangeEditorProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
  currentManagement: RequestManagement | null
  desiredPrice: number
  onRangeUpdated: (updatedManagement: RequestManagement) => void
}

export default function RangeEditor({ 
  isOpen, 
  onClose, 
  requestId, 
  currentManagement, 
  desiredPrice,
  onRangeUpdated 
}: RangeEditorProps) {
  
  const [rangeMin, setRangeMin] = useState(currentManagement?.RangeMin || 0)
  const [rangeMax, setRangeMax] = useState(currentManagement?.RangeMax || 0)
  const [isLoading, setIsLoading] = useState(false)

  // Reset valori quando si apre il modal
  const handleOpen = (open: boolean) => {
    if (open) {
      setRangeMin(currentManagement?.RangeMin || 0)
      setRangeMax(currentManagement?.RangeMax || 0)
    } else {
      onClose()
    }
  }

  // Verifica se ci sono modifiche
  const hasChanges = () => {
    if (!currentManagement) return true
    return (
      rangeMin !== currentManagement.RangeMin ||
      rangeMax !== currentManagement.RangeMax
    )
  }

  // Verifica validità del range
  const isRangeValid = () => {
    return rangeMin >= 0 && rangeMax >= 0 && rangeMin <= rangeMax
  }

  // Calcola differenza con prezzo desiderato
  const calculateComparison = () => {
    const avgRange = (rangeMin + rangeMax) / 2
    const difference = avgRange - desiredPrice
    const percentage = desiredPrice > 0 ? ((difference / desiredPrice) * 100) : 0
    return { difference, percentage, avgRange }
  }

  // Salvataggio range
  const handleSave = async () => {
    if (!isRangeValid()) {
      alert('Inserisci un range valido (min ≤ max)')
      return
    }

    setIsLoading(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      console.log('📊 Aggiornamento range per richiesta:', requestId)

      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/range`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rangeMin: Number(rangeMin),
          rangeMax: Number(rangeMax)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Errore ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Range aggiornato con successo:', result)
      
      // Aggiorna i valori locali con quelli salvati sul server
      setRangeMin(result.management.RangeMin)
      setRangeMax(result.management.RangeMax)
      
      // Callback al parent per aggiornare l'UI
      onRangeUpdated(result.management)
      
      // Chiudi modal
      onClose()
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento range:', error)
      alert(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  const comparison = calculateComparison()
  const isAboveDesired = comparison.difference > 0
  const comparisonColor = isAboveDesired ? 'text-green-400' : 'text-red-400'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 sm:h-5 w-4 sm:w-5 text-orange-500" />
            Modifica Range Valutazione
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Info richiesta - Mobile Responsive */}
          <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400 break-words">
              <span className="font-medium">Richiesta:</span> {requestId}
            </p>
            <p className="text-sm text-slate-400 mt-1 break-words">
              <span className="font-medium">Prezzo Desiderato Cliente:</span> €{desiredPrice.toLocaleString()}
            </p>
          </div>

          {/* Range Editor - Mobile Responsive */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 text-orange-400" />
              <h3 className="font-semibold text-orange-400 text-sm sm:text-base">Range di Valutazione</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Valore Minimo */}
              <div className="space-y-2">
                <Label htmlFor="rangeMin" className="text-slate-200 text-sm sm:text-base">
                  Valore Minimo (€)
                </Label>
                <Input
                  id="rangeMin"
                  type="number"
                  value={rangeMin === 0 ? '' : rangeMin}
                  onChange={(e) => setRangeMin(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              {/* Valore Massimo */}
              <div className="space-y-2">
                <Label htmlFor="rangeMax" className="text-slate-200 text-sm sm:text-base">
                  Valore Massimo (€)
                </Label>
                <Input
                  id="rangeMax"
                  type="number"
                  value={rangeMax === 0 ? '' : rangeMax}
                  onChange={(e) => setRangeMax(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
            </div>

            {/* Validazione Range - Mobile Responsive */}
            {!isRangeValid() && rangeMin > 0 && rangeMax > 0 && (
              <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 sm:h-4 w-3 sm:w-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-red-400">Range non valido</p>
                    <p className="text-sm text-red-200 break-words">
                      Il valore minimo (€{rangeMin.toLocaleString()}) non può essere maggiore del valore massimo (€{rangeMax.toLocaleString()})
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Analisi Range - Mobile Responsive */}
          {isRangeValid() && rangeMin > 0 && rangeMax > 0 && (
            <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg border border-slate-600">
              <h4 className="font-semibold text-slate-200 mb-3 text-sm sm:text-base">Analisi Range</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="text-center sm:text-left">
                  <p className="text-slate-400">Range:</p>
                  <p className="font-medium text-white text-sm break-words">
                    €{rangeMin.toLocaleString()} - €{rangeMax.toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center sm:text-left">
                  <p className="text-slate-400">Media Range:</p>
                  <p className="font-medium text-white text-sm">
                    €{comparison.avgRange.toLocaleString()}
                  </p>
                </div>
                
                <div className="text-center sm:text-left">
                  <p className="text-slate-400">Vs. Prezzo Desiderato:</p>
                  <p className={`font-medium ${comparisonColor} text-sm break-words`}>
                    {isAboveDesired ? '+' : ''}€{comparison.difference.toLocaleString()}
                    {' '}({isAboveDesired ? '+' : ''}{comparison.percentage.toFixed(1)}%)
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-600">
                <p className="text-xs text-slate-400 break-words">
                  {isAboveDesired 
                    ? '✅ La valutazione media è superiore al prezzo desiderato dal cliente' 
                    : '⚠️ La valutazione media è inferiore al prezzo desiderato dal cliente'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Riepilogo Mobile - Solo su schermi piccoli */}
          {isRangeValid() && rangeMin > 0 && rangeMax > 0 && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 sm:hidden">
              <h4 className="font-semibold text-blue-400 text-sm mb-2">Confronto Rapido</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente vuole:</span>
                  <span className="font-medium text-white">€{desiredPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tu valuti:</span>
                  <span className="font-medium text-white">€{comparison.avgRange.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Differenza:</span>
                  <span className={`font-medium ${comparisonColor}`}>
                    {isAboveDesired ? '+' : ''}€{comparison.difference.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Anteprima cambiamenti - Mobile Responsive */}
          {hasChanges() && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-3 sm:h-4 w-3 sm:w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-400">Modifiche in sospeso</p>
                  <p className="text-sm text-blue-200 break-words">
                    Il range di valutazione è stato modificato. Clicca "Salva" per confermare i cambiamenti.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 w-full sm:w-auto order-2 sm:order-1 touch-manipulation"
          >
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || !isRangeValid() || isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 w-full sm:w-auto order-1 sm:order-2 touch-manipulation"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Range
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}