import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Loader2, Save, X, TrendingUp, Calculator } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { type RequestManagement } from '@/lib/types'

interface PricingEditorProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
  currentManagement: RequestManagement | null
  onPricingUpdated: (updatedManagement: RequestManagement) => void
}

export default function PricingEditor({ 
  isOpen, 
  onClose, 
  requestId, 
  currentManagement, 
  onPricingUpdated 
}: PricingEditorProps) {
  
  const [purchasePrice, setPurchasePrice] = useState(currentManagement?.PurchasePrice || 0)
  const [salePrice, setSalePrice] = useState(currentManagement?.SalePrice || 0)
  const [registrationCost, setRegistrationCost] = useState(currentManagement?.RegistrationCost || 0)
  const [transportCost, setTransportCost] = useState(currentManagement?.TransportCost || 0)
  const [isLoading, setIsLoading] = useState(false)

  // Reset valori quando si apre il modal
  const handleOpen = (open: boolean) => {
    if (open) {
      setPurchasePrice(currentManagement?.PurchasePrice || 0)
      setSalePrice(currentManagement?.SalePrice || 0)
      setRegistrationCost(currentManagement?.RegistrationCost || 0)
      setTransportCost(currentManagement?.TransportCost || 0)
    } else {
      onClose()
    }
  }

  // Calcola margine in tempo reale
  const calculateMargin = () => {
    const numSalePrice = Number(salePrice) || 0
    const numPurchasePrice = Number(purchasePrice) || 0
    const numRegistrationCost = Number(registrationCost) || 0
    const numTransportCost = Number(transportCost) || 0
    return numSalePrice - numPurchasePrice - numRegistrationCost - numTransportCost
  }

  // Calcola totale costi
  const calculateTotalCosts = () => {
    const numRegistrationCost = Number(registrationCost) || 0
    const numTransportCost = Number(transportCost) || 0
    return numRegistrationCost + numTransportCost
  }

  // Verifica se ci sono modifiche
  const hasChanges = () => {
    if (!currentManagement) return true
    return (
      purchasePrice !== currentManagement.PurchasePrice ||
      salePrice !== currentManagement.SalePrice ||
      registrationCost !== currentManagement.RegistrationCost ||
      transportCost !== currentManagement.TransportCost
    )
  }

  // Salvataggio prezzi
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      console.log('💰 Aggiornamento prezzi per richiesta:', requestId)

      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/pricing`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          purchasePrice: Number(purchasePrice),
          salePrice: Number(salePrice),
          registrationCost: Number(registrationCost),
          transportCost: Number(transportCost)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Errore ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Prezzi aggiornati con successo:', result)
      
      // Aggiorna i valori locali con quelli salvati sul server
      setPurchasePrice(result.management.PurchasePrice)
      setSalePrice(result.management.SalePrice)
      setRegistrationCost(result.management.RegistrationCost)
      setTransportCost(result.management.TransportCost)
      
      // Callback al parent per aggiornare l'UI
      onPricingUpdated(result.management)
      
      // Chiudi modal
      onClose()
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento prezzi:', error)
      alert(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  const margin = calculateMargin()
  const totalCosts = calculateTotalCosts()
  const marginColor = margin >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-4 sm:h-5 w-4 sm:w-5 text-green-500" />
            Modifica Prezzi e Costi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-4">
          {/* Info richiesta - Mobile Responsive */}
          <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400 break-words">
              <span className="font-medium">Richiesta:</span> {requestId}
            </p>
          </div>

          {/* Layout Mobile-First */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* PREZZI - Mobile Stack */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-3 sm:h-4 w-3 sm:w-4 text-green-400" />
                <h3 className="font-semibold text-green-400 text-sm sm:text-base">Prezzi</h3>
              </div>

              {/* Prezzo Acquisto */}
              <div className="space-y-2">
                <Label htmlFor="purchasePrice" className="text-slate-200 text-sm sm:text-base">
                  Prezzo di Acquisto (€)
                </Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  value={purchasePrice === 0 ? '' : purchasePrice}
                  onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              {/* Prezzo Vendita */}
              <div className="space-y-2">
                <Label htmlFor="salePrice" className="text-slate-200 text-sm sm:text-base">
                  Prezzo di Vendita (€)
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  value={salePrice === 0 ? '' : salePrice}
                  onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
            </div>

            {/* COSTI - Mobile Stack */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-3 sm:h-4 w-3 sm:w-4 text-orange-400" />
                <h3 className="font-semibold text-orange-400 text-sm sm:text-base">Costi</h3>
              </div>

              {/* Costi Pratica */}
              <div className="space-y-2">
                <Label htmlFor="registrationCost" className="text-slate-200 text-sm sm:text-base">
                  Costi di Pratica (€)
                </Label>
                <Input
                  id="registrationCost"
                  type="number"
                  value={registrationCost === 0 ? '' : registrationCost}
                  onChange={(e) => setRegistrationCost(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>

              {/* Costi Trasporto */}
              <div className="space-y-2">
                <Label htmlFor="transportCost" className="text-slate-200 text-sm sm:text-base">
                  Costi di Trasporto (€)
                </Label>
                <Input
                  id="transportCost"
                  type="number"
                  value={transportCost === 0 ? '' : transportCost}
                  onChange={(e) => setTransportCost(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20 h-11 sm:h-10 text-base sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Calcolo Margine - Mobile Responsive */}
          <div className="bg-slate-700/50 p-3 sm:p-4 rounded-lg border border-slate-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-slate-200 text-sm sm:text-base">Calcolo Margine</h4>
                <p className="text-xs sm:text-sm text-slate-400 break-words">
                  Vendita (€{Number(salePrice).toLocaleString()}) - Acquisto (€{Number(purchasePrice).toLocaleString()}) - Costi (€{totalCosts.toLocaleString()})
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className={`text-xl sm:text-2xl font-bold ${marginColor}`}>
                  €{margin.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">
                  {margin >= 0 ? 'Margine positivo' : 'Margine negativo'}
                </p>
              </div>
            </div>
          </div>

          {/* Riepilogo Mobile - Solo su schermi piccoli */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 sm:hidden">
            <h4 className="font-semibold text-blue-400 text-sm mb-2">Riepilogo</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Acquisto:</span>
                <div className="font-medium text-white">€{Number(purchasePrice).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-slate-400">Vendita:</span>
                <div className="font-medium text-white">€{Number(salePrice).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-slate-400">Pratica:</span>
                <div className="font-medium text-white">€{Number(registrationCost).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-slate-400">Trasporto:</span>
                <div className="font-medium text-white">€{Number(transportCost).toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Anteprima cambiamenti - Mobile Responsive */}
          {hasChanges() && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <DollarSign className="h-3 sm:h-4 w-3 sm:w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-blue-400">Modifiche in sospeso</p>
                  <p className="text-sm text-blue-200 break-words">
                    I prezzi e costi sono stati modificati. Clicca "Salva" per confermare i cambiamenti.
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
            disabled={!hasChanges() || isLoading}
            className="bg-green-500 hover:bg-green-600 text-white border-0 w-full sm:w-auto order-1 sm:order-2 touch-manipulation"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salva Prezzi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}