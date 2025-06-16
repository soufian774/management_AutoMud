import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Share, Copy, Check, Mail, Smartphone, X } from 'lucide-react'
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

  // Verifica se Web Share API è supportata
  const canUseNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  // Genera link condivisibile alla pagina specifica della richiesta
  const generateShareLink = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/request/${request.Id}`
  }

  // Genera riassunto testuale
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

🔗 Link: ${generateShareLink()}

⚠️ Nota: Il link richiede accesso al gestionale AutoMud`
  }

  // 🚀 CONDIVISIONE NATIVA - Mobile First!
  const handleNativeShare = async () => {
    const shareData = {
      title: `AutoMud - ${request.Make} ${request.Model} (${request.RegistrationYear})`,
      text: generateTextSummary(),
      url: generateShareLink()
    }

    try {
      if (canUseNativeShare) {
        await navigator.share(shareData)
        console.log('✅ Condivisione nativa completata')
        onClose() // Chiudi modal dopo condivisione
      } else {
        // Fallback per desktop - apri WhatsApp
        const text = encodeURIComponent(shareData.text)
        window.open(`https://wa.me/?text=${text}`)
      }
    } catch (error) {
      console.log('❌ Condivisione annullata o fallita:', error)
      // Non mostrare errore, l'utente potrebbe aver semplicemente annullato
    }
  }

  // 🔧 FIX: Copia link negli appunti - Versione che FUNZIONA DAVVERO
  const copyLink = async () => {
    const link = generateShareLink()
    console.log('🔗 Tentativo copia link:', link)
    
    // ✅ METODO 1: Clipboard API con controlli più rigidi
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        console.log('📋 Provo Clipboard API...')
        await navigator.clipboard.writeText(link)
        
        // ✅ VERIFICA che sia stato davvero copiato
        try {
          const clipboardContent = await navigator.clipboard.readText()
          if (clipboardContent === link) {
            console.log('✅ Clipboard API successo - VERIFICATO')
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
            return
          } else {
            throw new Error('Verification failed - clipboard content mismatch')
          }
        } catch (readError) {
          console.warn('⚠️ Non posso verificare clipboard, procedo con execCommand')
          // Non return, prova il metodo successivo
        }
      }
    } catch (clipboardError) {
      console.warn('⚠️ Clipboard API fallito:', clipboardError)
    }
    
    // ✅ METODO 2: execCommand POTENZIATO con event listener
    try {
      console.log('📋 Provo execCommand avanzato...')
      
      let copySuccess = false
      
      // Event listener per confermare la copia
      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault()
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', link)
          copySuccess = true
          console.log('✅ Copy event triggered successfully')
        }
      }
      
      document.addEventListener('copy', handleCopy)
      
      // Crea textarea ottimizzata
      const textArea = document.createElement('textarea')
      textArea.value = link
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '-9999px'
      textArea.style.width = '2em'
      textArea.style.height = '2em'
      textArea.style.padding = '0'
      textArea.style.border = 'none'
      textArea.style.outline = 'none'
      textArea.style.boxShadow = 'none'
      textArea.style.background = 'transparent'
      textArea.setAttribute('readonly', '')
      textArea.setAttribute('tabindex', '-1')
      
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      textArea.setSelectionRange(0, link.length)
      
      const execResult = document.execCommand('copy')
      document.body.removeChild(textArea)
      document.removeEventListener('copy', handleCopy)
      
      if (execResult || copySuccess) {
        console.log('✅ execCommand successo')
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
        return
      } else {
        throw new Error('execCommand returned false')
      }
      
    } catch (execError) {
      console.warn('⚠️ execCommand fallito:', execError)
    }
    
    // ✅ METODO 3: Prompt immediato (più affidabile di input custom)
    console.log('📋 Mostro prompt per copia manuale...')
    
    try {
      // Usa prompt nativo che funziona sempre
      const userAction = prompt(
        'Il link è pronto per essere copiato. Premi Ctrl+C (o Cmd+C su Mac) per copiare, poi OK:', 
        link
      )
      
      // Se l'utente non ha premuto "Annulla", consideriamo successo
      if (userAction !== null) {
        console.log('✅ Prompt completato, assumiamo successo')
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
        return
      }
    } catch (promptError) {
      console.warn('⚠️ Prompt fallito:', promptError)
    }
    
    // ✅ METODO 4: Fallback finale - Alert con istruzioni
    console.log('📋 Fallback finale - Alert con link')
    
    alert(`Copia manualmente questo link:\n\n${link}\n\nIl link è stato preparato per te.`)
    
    // Feedback visivo anche per il fallback
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)
  }

  // Condivisione via email (fallback)
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`AutoMud - ${request.Make} ${request.Model} (${request.RegistrationYear})`)
    const body = encodeURIComponent(generateTextSummary())
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`
    
    // Apri client email
    window.location.href = mailtoLink
  }

  const shareLink = generateShareLink()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white w-[95vw] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Share className="h-5 w-5 text-blue-500" />
            Condividi Richiesta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info richiesta compatta */}
          <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
            <h3 className="font-semibold text-white text-base">
              {request.Make} {request.Model} ({request.RegistrationYear})
            </h3>
            <p className="text-slate-400 text-sm mt-1 break-words">
              ID: {request.Id} • {request.City} • {request.FirstName} {request.LastName}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-600 text-white text-xs">
                €{request.DesiredPrice.toLocaleString()}
              </Badge>
              <Badge variant="outline" className="text-slate-300 border-slate-500 text-xs">
                {request.Offers.length} offerte
              </Badge>
            </div>
          </div>

          {/* 🆕 LINK PREVIEW per debug - Solo in development */}
          {import.meta.env.DEV && (
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
              <p className="text-xs text-blue-300 font-mono break-all">
                {shareLink}
              </p>
            </div>
          )}

          {/* 🚀 CONDIVISIONE NATIVA - Bottone principale */}
          <Button
            onClick={handleNativeShare}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white border-0 font-semibold h-12 text-base touch-manipulation"
          >
            <Smartphone className="h-5 w-5 mr-2" />
            {canUseNativeShare ? 'Condividi' : 'Condividi via WhatsApp'}
          </Button>

          {/* Opzioni alternative compatte */}
          <div className="space-y-3">
            <div className="text-sm text-slate-400 text-center">Oppure:</div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                disabled={copiedLink}
                className={`${
                  copiedLink 
                    ? 'bg-green-600 border-green-500 text-white' 
                    : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                } touch-manipulation transition-all duration-200`}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copiato!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copia Link
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={shareViaEmail}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 w-full touch-manipulation"
          >
            <X className="h-4 w-4 mr-2" />
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}