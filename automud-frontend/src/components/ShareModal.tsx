import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Share, Copy, Check, Mail, MessageCircle, Link2, X, ExternalLink } from 'lucide-react'
import { type CompleteRequestDetail } from '@/lib/types'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  request: CompleteRequestDetail
}

export default function ShareModal({ 
  isOpen, 
  onClose, 
  request 
}: ShareModalProps) {
  
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedSummary, setCopiedSummary] = useState(false)

  // Genera link condivisibile (per utenti autenticati)
  const generateShareLink = () => {
    return window.location.href
  }

  // Genera riassunto testuale della richiesta
  const generateTextSummary = () => {
    const margin = request.Management 
      ? (request.Management.SalePrice - request.Management.PurchasePrice - request.Management.RegistrationCost - request.Management.TransportCost)
      : 0

    return `🚗 ${request.Make} ${request.Model} (${request.RegistrationYear})
📋 ID: ${request.Id}
📍 ${request.City}
👤 ${request.FirstName} ${request.LastName}
📞 ${request.Phone}
📧 ${request.Email}
🏷️ Prezzo desiderato: €${request.DesiredPrice.toLocaleString()}
${request.Management ? `💰 Range valutazione: €${request.Management.RangeMin.toLocaleString()} - €${request.Management.RangeMax.toLocaleString()}` : ''}
${request.Management ? `📊 Margine stimato: €${margin.toLocaleString()}` : ''}
🎯 Offerte ricevute: ${request.Offers.length}

🔗 Link per colleghi: ${generateShareLink()}

⚠️ Nota: Il link richiede accesso al gestionale AutoMud`
  }

  // Copia testo negli appunti
  const copyToClipboard = async (text: string, type: 'link' | 'summary') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'link') {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } else {
        setCopiedSummary(true)
        setTimeout(() => setCopiedSummary(false), 2000)
      }
    } catch (error) {
      console.error('Errore nella copia:', error)
      // Fallback per browser che non supportano clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (type === 'link') {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } else {
        setCopiedSummary(true)
        setTimeout(() => setCopiedSummary(false), 2000)
      }
    }
  }

  // Condivisione via email
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`AutoMud - ${request.Make} ${request.Model} (${request.RegistrationYear})`)
    const body = encodeURIComponent(generateTextSummary())
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  // Condivisione via WhatsApp
  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(generateTextSummary())
    window.open(`https://wa.me/?text=${text}`)
  }

  // Apertura link in nuova finestra
  const openInNewWindow = () => {
    window.open(generateShareLink(), '_blank')
  }

  const shareLink = generateShareLink()
  const textSummary = generateTextSummary()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Share className="h-5 w-5 text-blue-500" />
            Condividi Richiesta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info richiesta */}
          <div className="bg-slate-700/30 p-4 rounded-lg border border-slate-600">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">
                  {request.Make} {request.Model} ({request.RegistrationYear})
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  ID: {request.Id} • {request.City} • {request.FirstName} {request.LastName}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-600 text-white">
                    €{request.DesiredPrice.toLocaleString()}
                  </Badge>
                  <Badge variant="outline" className="text-slate-300 border-slate-500">
                    {request.Offers.length} offerte
                  </Badge>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewWindow}
                className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Apri
              </Button>
            </div>
          </div>

          {/* Link condivisibile */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Link2 className="h-4 w-4 text-blue-400" />
              Link per Colleghi
            </h4>
            
            <div className="space-y-2">
              <Label className="text-slate-300 text-sm">Link diretto (richiede accesso al gestionale)</Label>
              <div className="flex gap-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="bg-slate-700 border-slate-600 text-white text-sm font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(shareLink, 'link')}
                  className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500 whitespace-nowrap"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copia
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Riassunto testuale */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Riassunto Testuale</h4>
            <div className="space-y-2">
              <div className="bg-slate-700/50 p-3 rounded border border-slate-600 max-h-32 overflow-y-auto">
                <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans">
                  {textSummary}
                </pre>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(textSummary, 'summary')}
                className="bg-slate-600 border-slate-500 text-white hover:bg-slate-500 w-full"
              >
                {copiedSummary ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Riassunto Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copia Riassunto
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Opzioni condivisione rapida */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Condivisione Rapida</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={shareViaEmail}
                className="bg-blue-600/20 border-blue-500/50 text-blue-300 hover:bg-blue-600/30 hover:border-blue-500"
              >
                <Mail className="h-4 w-4 mr-2" />
                Condividi via Email
              </Button>
              <Button
                variant="outline"
                onClick={shareViaWhatsApp}
                className="bg-green-600/20 border-green-500/50 text-green-300 hover:bg-green-600/30 hover:border-green-500"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Condividi via WhatsApp
              </Button>
            </div>
          </div>

          {/* Note di sicurezza */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Share className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-400">Gestionale Interno</p>
                <p className="text-sm text-blue-200">
                  Il link condiviso funziona solo per utenti con accesso al gestionale AutoMud. 
                  Per condividere informazioni con clienti, usa il riassunto testuale.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
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
  )
}