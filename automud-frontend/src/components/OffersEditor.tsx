import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Loader2, Save, X, Plus, Edit, Trash2, Calendar, AlertTriangle } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { type RequestOffer } from '@/lib/types'

interface OffersEditorProps {
  isOpen: boolean
  onClose: () => void
  requestId: string
  currentOffers: RequestOffer[]
  onOffersUpdated: (updatedOffers: RequestOffer[]) => void
}

interface OfferFormData {
  offerDescription: string
  offerPrice: number
}

export default function OffersEditor({ 
  isOpen, 
  onClose, 
  requestId, 
  currentOffers, 
  onOffersUpdated 
}: OffersEditorProps) {
  
  // Stati per la gestione delle offerte
  const [offers, setOffers] = useState<RequestOffer[]>(currentOffers)
  const [isLoading, setIsLoading] = useState(false)
  
  // Stati per il form di aggiunta/modifica
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<RequestOffer | null>(null)
  const [formData, setFormData] = useState<OfferFormData>({
    offerDescription: '',
    offerPrice: 0
  })

  // Reset quando si apre il modal
  const handleOpen = (open: boolean) => {
    if (open) {
      setOffers(currentOffers)
      resetForm()
    } else {
      onClose()
    }
  }

  // Reset del form
  const resetForm = () => {
    setFormData({ offerDescription: '', offerPrice: 0 })
    setEditingOffer(null)
    setIsFormOpen(false)
  }

  // Formattazione data
  const formatDate = (date: string) =>
    new Date(date).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  // Apertura form per nuova offerta
  const handleAddOffer = () => {
    resetForm()
    setIsFormOpen(true)
  }

  // Apertura form per modifica offerta
  const handleEditOffer = (offer: RequestOffer) => {
    setEditingOffer(offer)
    setFormData({
      offerDescription: offer.OfferDescription,
      offerPrice: offer.OfferPrice
    })
    setIsFormOpen(true)
  }

  // Validazione form
  const isFormValid = () => {
    return formData.offerDescription.trim() && formData.offerPrice > 0
  }

  // Verifica se ci sono modifiche nel form
  const hasFormChanges = () => {
    if (!editingOffer) return true // Nuova offerta
    return (
      formData.offerDescription !== editingOffer.OfferDescription ||
      formData.offerPrice !== editingOffer.OfferPrice
    )
  }

  // Salvataggio offerta (aggiunta o modifica)
  const handleSaveOffer = async () => {
    if (!isFormValid()) return

    setIsLoading(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      if (editingOffer) {
        // MODIFICA offerta esistente
        console.log('✏️ Modifica offerta:', editingOffer.Id)

        const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/offers/${editingOffer.Id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            offerDescription: formData.offerDescription.trim(),
            offerPrice: Number(formData.offerPrice)
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Errore ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Offerta modificata:', result.offer)

        // Aggiorna la lista locale
        const updatedOffers = offers.map(offer => 
          offer.Id === editingOffer.Id ? result.offer : offer
        )
        setOffers(updatedOffers)
        onOffersUpdated(updatedOffers)

      } else {
        // AGGIUNGI nuova offerta
        console.log('➕ Aggiunta nuova offerta')

        const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/offers`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            offerDescription: formData.offerDescription.trim(),
            offerPrice: Number(formData.offerPrice)
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Errore ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Offerta aggiunta:', result.offer)

        // Aggiorna la lista locale
        const updatedOffers = [result.offer, ...offers]
        setOffers(updatedOffers)
        onOffersUpdated(updatedOffers)
      }

      resetForm()
    } catch (error) {
      console.error('❌ Errore nel salvataggio offerta:', error)
      alert(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  // Eliminazione offerta
  const handleDeleteOffer = async (offer: RequestOffer) => {
    if (!confirm(`Sei sicuro di voler eliminare l'offerta "${offer.OfferDescription}"?`)) {
      return
    }

    setIsLoading(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      console.log('🗑️ Eliminazione offerta:', offer.Id)

      const response = await fetch(`${API_BASE_URL}/api/request/${requestId}/offers/${offer.Id}`, {
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

      console.log('✅ Offerta eliminata con successo')

      // Rimuovi dalla lista locale
      const updatedOffers = offers.filter(o => o.Id !== offer.Id)
      setOffers(updatedOffers)
      onOffersUpdated(updatedOffers)

    } catch (error) {
      console.error('❌ Errore nell\'eliminazione offerta:', error)
      alert(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  // Calcolo statistiche offerte
  const getOffersStats = () => {
    if (offers.length === 0) return null
    
    const prices = offers.map(o => Number(o.OfferPrice))
    const maxPrice = Math.max(...prices)
    const minPrice = Math.min(...prices)
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
    
    return { maxPrice, minPrice, avgPrice: Math.round(avgPrice), count: offers.length }
  }

  const stats = getOffersStats()

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Gestione Offerte Partner ({offers.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info richiesta */}
          <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400">
              <span className="font-medium">Richiesta:</span> {requestId}
            </p>
          </div>

          {/* Statistiche offerte */}
          {stats && (
            <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Statistiche Offerte
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">Totale:</p>
                  <p className="font-medium text-white">{stats.count}</p>
                </div>
                <div>
                  <p className="text-slate-400">Massima:</p>
                  <p className="font-medium text-green-400">€{stats.maxPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Minima:</p>
                  <p className="font-medium text-red-400">€{stats.minPrice.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-slate-400">Media:</p>
                  <p className="font-medium text-blue-400">€{stats.avgPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pulsante aggiungi offerta */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Elenco Offerte</h3>
            <Button
              onClick={handleAddOffer}
              disabled={isLoading || isFormOpen}
              className="bg-green-500 hover:bg-green-600 text-white border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Offerta
            </Button>
          </div>

          {/* Form aggiunta/modifica offerta */}
          {isFormOpen && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
                {editingOffer ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingOffer ? 'Modifica Offerta' : 'Nuova Offerta'}
              </h4>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Descrizione */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="offerDescription" className="text-slate-200">
                      Descrizione Offerta *
                    </Label>
                    <Textarea
                      id="offerDescription"
                      value={formData.offerDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, offerDescription: e.target.value }))}
                      placeholder="es. Offerta Autodealer Milano - Valutazione completa..."
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none focus:border-blue-500 focus:ring-blue-500/20"
                      rows={3}
                    />
                  </div>

                  {/* Prezzo */}
                  <div className="space-y-2">
                    <Label htmlFor="offerPrice" className="text-slate-200">
                      Prezzo Offerto (€) *
                    </Label>
                    <Input
                      id="offerPrice"
                      type="number"
                      value={formData.offerPrice === 0 ? '' : formData.offerPrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, offerPrice: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                {/* Pulsanti form */}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isLoading}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annulla
                  </Button>
                  <Button
                    onClick={handleSaveOffer}
                    disabled={!isFormValid() || !hasFormChanges() || isLoading}
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
                        {editingOffer ? 'Aggiorna Offerta' : 'Aggiungi Offerta'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista offerte */}
          <div className="space-y-3">
            {offers.length > 0 ? (
              offers.map((offer) => (
                <div key={offer.Id} className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    {/* Info offerta */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-white text-sm leading-relaxed">
                            {offer.OfferDescription}
                          </h5>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(offer.OfferDate)}</span>
                            </div>
                            <Badge variant="outline" className="text-xs text-slate-300 border-slate-500">
                              ID: {offer.Id}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Prezzo in evidenza */}
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-400">
                            €{offer.OfferPrice.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Azioni */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOffer(offer)}
                        disabled={isLoading || isFormOpen}
                        className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Modifica
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer)}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 border-red-500"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Elimina
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Nessuna offerta ancora presente
                </h3>
                <p className="text-slate-400 mb-4">
                  Aggiungi la prima offerta per iniziare a gestire le proposte dei partner
                </p>
                <Button
                  onClick={handleAddOffer}
                  disabled={isLoading || isFormOpen}
                  className="bg-green-500 hover:bg-green-600 text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Prima Offerta
                </Button>
              </div>
            )}
          </div>

          {/* Warning se form aperto */}
          {isFormOpen && (
            <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-orange-400">Modifica in corso</p>
                  <p className="text-sm text-orange-200">
                    Completa o annulla la modifica dell'offerta prima di chiudere il modal.
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
            disabled={isLoading || isFormOpen}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            <X className="h-4 w-4 mr-2" />
            {isFormOpen ? 'Annulla modifica prima di chiudere' : 'Chiudi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}