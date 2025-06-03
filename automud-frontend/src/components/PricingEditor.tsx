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

  // Reset valori quando si apre il modal - usa sempre i valori più aggiornati
  const handleOpen = (open: boolean) => {
    if (open) {
      // Resetta sempre con i valori attuali dal props
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
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Modifica Prezzi e Costi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info richiesta */}
          <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400">
              <span className="font-medium">Richiesta:</span> {requestId}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PREZZI */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <h3 className="font-semibold text-green-400">Prezzi</h3>
              </div>

              {/* Prezzo Acquisto */}
              <div className="space-y-2">
                <Label htmlFor="purchasePrice" className="text-slate-200">
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
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20"
                />
              </div>

              {/* Prezzo Vendita */}
              <div className="space-y-2">
                <Label htmlFor="salePrice" className="text-slate-200">
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
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-green-500 focus:ring-green-500/20"
                />
              </div>
            </div>

            {/* COSTI */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-4 w-4 text-orange-400" />
                <h3 className="font-semibold text-orange-400">Costi</h3>
              </div>

              {/* Costi Pratica */}
              <div className="space-y-2">
                <Label htmlFor="registrationCost" className="text-slate-200">
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
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>

              {/* Costi Trasporto */}
              <div className="space-y-2">
                <Label htmlFor="transportCost" className="text-slate-200">
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
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
            </div>
          </div>

          {/* Calcolo Margine in tempo reale */}
          <div className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-200">Calcolo Margine</h4>
                <p className="text-sm text-slate-400">
                  Vendita (€{Number(salePrice).toLocaleString()}) - Acquisto (€{Number(purchasePrice).toLocaleString()}) - Costi (€{totalCosts.toLocaleString()})
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${marginColor}`}>
                  €{margin.toLocaleString()}
                </div>
                <p className="text-xs text-slate-400">
                  {margin >= 0 ? 'Margine positivo' : 'Margine negativo'}
                </p>
              </div>
            </div>
          </div>

          {/* Anteprima cambiamenti */}
          {hasChanges() && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Modifiche in sospeso</p>
                  <p className="text-sm text-blue-200">
                    I prezzi e costi sono stati modificati. Clicca "Salva" per confermare i cambiamenti.
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
            disabled={!hasChanges() || isLoading}
            className="bg-green-500 hover:bg-green-600 text-white border-0"
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