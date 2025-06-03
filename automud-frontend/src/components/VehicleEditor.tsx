import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Car, Loader2, Save, X, Settings, Fuel, Wrench } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api'
import { 
  type CompleteRequestDetail, 
  FuelTypeEnum, 
  TransmissionTypeEnum, 
  CarConditionEnum, 
  EngineConditionEnum 
} from '@/lib/types'

interface VehicleEditorProps {
  isOpen: boolean
  onClose: () => void
  request: CompleteRequestDetail
  onVehicleUpdated: (updatedRequest: CompleteRequestDetail) => void
}

export default function VehicleEditor({ 
  isOpen, 
  onClose, 
  request, 
  onVehicleUpdated 
}: VehicleEditorProps) {
  
  // Stati per i dati del veicolo
  const [licensePlate, setLicensePlate] = useState(request.LicensePlate)
  const [km, setKm] = useState(request.Km)
  const [registrationYear, setRegistrationYear] = useState(request.RegistrationYear)
  const [engineSize, setEngineSize] = useState(request.EngineSize)
  const [fuelType, setFuelType] = useState(request.FuelType)
  const [transmissionType, setTransmissionType] = useState(request.TransmissionType)
  const [carCondition, setCarCondition] = useState(request.CarCondition)
  const [engineCondition, setEngineCondition] = useState(request.EngineCondition)
  const [interiorConditions, setInteriorConditions] = useState(request.InteriorConditions)
  const [exteriorConditions, setExteriorConditions] = useState(request.ExteriorConditions)
  const [mechanicalConditions, setMechanicalConditions] = useState(request.MechanicalConditions || '')
  
  const [isLoading, setIsLoading] = useState(false)

  // Reset valori quando si apre il modal
  const handleOpen = (open: boolean) => {
    if (open) {
      setLicensePlate(request.LicensePlate)
      setKm(request.Km)
      setRegistrationYear(request.RegistrationYear)
      setEngineSize(request.EngineSize)
      setFuelType(request.FuelType)
      setTransmissionType(request.TransmissionType)
      setCarCondition(request.CarCondition)
      setEngineCondition(request.EngineCondition)
      setInteriorConditions(request.InteriorConditions)
      setExteriorConditions(request.ExteriorConditions)
      setMechanicalConditions(request.MechanicalConditions || '')
    } else {
      onClose()
    }
  }

  // Verifica se ci sono modifiche
  const hasChanges = () => {
    return (
      licensePlate !== request.LicensePlate ||
      km !== request.Km ||
      registrationYear !== request.RegistrationYear ||
      engineSize !== request.EngineSize ||
      fuelType !== request.FuelType ||
      transmissionType !== request.TransmissionType ||
      carCondition !== request.CarCondition ||
      engineCondition !== request.EngineCondition ||
      interiorConditions !== request.InteriorConditions ||
      exteriorConditions !== request.ExteriorConditions ||
      mechanicalConditions !== (request.MechanicalConditions || '')
    )
  }

  // Salvataggio informazioni veicolo
  const handleSave = async () => {
    setIsLoading(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) {
        throw new Error('Utente non autenticato')
      }

      console.log('🚗 Aggiornamento informazioni veicolo per richiesta:', request.Id)

      const response = await fetch(`${API_BASE_URL}/api/request/${request.Id}/vehicle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          licensePlate,
          km: Number(km),
          registrationYear: Number(registrationYear),
          engineSize: Number(engineSize),
          fuelType: Number(fuelType),
          transmissionType: Number(transmissionType),
          carCondition: Number(carCondition),
          engineCondition: Number(engineCondition),
          interiorConditions,
          exteriorConditions,
          mechanicalConditions: mechanicalConditions || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Errore ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Informazioni veicolo aggiornate con successo:', result)
      
      // Aggiorna i valori locali con quelli salvati sul server
      const updatedRequest = result.request
      setLicensePlate(updatedRequest.LicensePlate)
      setKm(updatedRequest.Km)
      setRegistrationYear(updatedRequest.RegistrationYear)
      setEngineSize(updatedRequest.EngineSize)
      setFuelType(updatedRequest.FuelType)
      setTransmissionType(updatedRequest.TransmissionType)
      setCarCondition(updatedRequest.CarCondition)
      setEngineCondition(updatedRequest.EngineCondition)
      setInteriorConditions(updatedRequest.InteriorConditions)
      setExteriorConditions(updatedRequest.ExteriorConditions)
      setMechanicalConditions(updatedRequest.MechanicalConditions || '')
      
      // Callback al parent per aggiornare l'UI principale
      onVehicleUpdated({
        ...request,
        ...updatedRequest
      })
      
      // Chiudi modal
      onClose()
    } catch (error) {
      console.error('❌ Errore nell\'aggiornamento informazioni veicolo:', error)
      alert(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-500" />
            Modifica Informazioni Veicolo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info richiesta */}
          <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
            <p className="text-sm text-slate-400">
              <span className="font-medium">Richiesta:</span> {request.Id} - {request.Make} {request.Model}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DATI TECNICI */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="h-4 w-4 text-blue-400" />
                <h3 className="font-semibold text-blue-400">Dati Tecnici</h3>
              </div>

              {/* Targa */}
              <div className="space-y-2">
                <Label htmlFor="licensePlate" className="text-slate-200">Targa</Label>
                <Input
                  id="licensePlate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="AB123CD"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {/* Chilometraggio */}
              <div className="space-y-2">
                <Label htmlFor="km" className="text-slate-200">Chilometraggio (km)</Label>
                <Input
                  id="km"
                  type="number"
                  value={km === 0 ? '' : km}
                  onChange={(e) => setKm(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {/* Anno */}
              <div className="space-y-2">
                <Label htmlFor="registrationYear" className="text-slate-200">Anno di Immatricolazione</Label>
                <Input
                  id="registrationYear"
                  type="number"
                  value={registrationYear === 0 ? '' : registrationYear}
                  onChange={(e) => setRegistrationYear(parseInt(e.target.value) || 0)}
                  placeholder="2020"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>

              {/* Cilindrata */}
              <div className="space-y-2">
                <Label htmlFor="engineSize" className="text-slate-200">Cilindrata (cc)</Label>
                <Input
                  id="engineSize"
                  type="number"
                  value={engineSize === 0 ? '' : engineSize}
                  onChange={(e) => setEngineSize(parseInt(e.target.value) || 0)}
                  placeholder="1600"
                  min="0"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* CARBURANTE E CONDIZIONI */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Fuel className="h-4 w-4 text-green-400" />
                <h3 className="font-semibold text-green-400">Carburante e Condizioni</h3>
              </div>

              {/* Carburante */}
              <div className="space-y-2">
                <Label htmlFor="fuelType" className="text-slate-200">Tipo di Carburante</Label>
                <Select value={fuelType.toString()} onValueChange={(value) => setFuelType(parseInt(value))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Object.entries(FuelTypeEnum)
                      .filter(([key]) => parseInt(key) !== 0)
                      .map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-slate-600">
                          {value}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Cambio */}
              <div className="space-y-2">
                <Label htmlFor="transmissionType" className="text-slate-200">Tipo di Cambio</Label>
                <Select value={transmissionType.toString()} onValueChange={(value) => setTransmissionType(parseInt(value))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Object.entries(TransmissionTypeEnum)
                      .filter(([key]) => parseInt(key) !== 0)
                      .map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-slate-600">
                          {value}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Condizione Generale */}
              <div className="space-y-2">
                <Label htmlFor="carCondition" className="text-slate-200">Condizione Generale</Label>
                <Select value={carCondition.toString()} onValueChange={(value) => setCarCondition(parseInt(value))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Object.entries(CarConditionEnum)
                      .filter(([key]) => parseInt(key) !== 0)
                      .map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-slate-600">
                          {value}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Condizione Motore */}
              <div className="space-y-2">
                <Label htmlFor="engineCondition" className="text-slate-200">Condizione Motore</Label>
                <Select value={engineCondition.toString()} onValueChange={(value) => setEngineCondition(parseInt(value))}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {Object.entries(EngineConditionEnum)
                      .filter(([key]) => parseInt(key) !== 0)
                      .map(([key, value]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-slate-600">
                          {value}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* CONDIZIONI DETTAGLIATE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-yellow-400" />
              <h3 className="font-semibold text-yellow-400">Condizioni Dettagliate</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Condizioni Interni */}
              <div className="space-y-2">
                <Label htmlFor="interiorConditions" className="text-slate-200">Condizioni Interni</Label>
                <Textarea
                  id="interiorConditions"
                  value={interiorConditions}
                  onChange={(e) => setInteriorConditions(e.target.value)}
                  placeholder="Descrivi lo stato degli interni..."
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none focus:border-yellow-500 focus:ring-yellow-500/20"
                  rows={3}
                />
              </div>

              {/* Condizioni Esterni */}
              <div className="space-y-2">
                <Label htmlFor="exteriorConditions" className="text-slate-200">Condizioni Esterni</Label>
                <Textarea
                  id="exteriorConditions"
                  value={exteriorConditions}
                  onChange={(e) => setExteriorConditions(e.target.value)}
                  placeholder="Descrivi lo stato degli esterni..."
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none focus:border-yellow-500 focus:ring-yellow-500/20"
                  rows={3}
                />
              </div>
            </div>

            {/* Condizioni Meccaniche */}
            <div className="space-y-2">
              <Label htmlFor="mechanicalConditions" className="text-slate-200">Condizioni Meccaniche (opzionale)</Label>
              <Textarea
                id="mechanicalConditions"
                value={mechanicalConditions}
                onChange={(e) => setMechanicalConditions(e.target.value)}
                placeholder="Descrivi eventuali problemi meccanici..."
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 resize-none focus:border-yellow-500 focus:ring-yellow-500/20"
                rows={3}
              />
            </div>
          </div>

          {/* Anteprima cambiamenti */}
          {hasChanges() && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Car className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-400">Modifiche in sospeso</p>
                  <p className="text-sm text-blue-200">
                    Le informazioni del veicolo sono state modificate. Clicca "Salva" per confermare i cambiamenti.
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
                Salva Informazioni
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}