// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RequestCard } from '@/components/RequestCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LogOut, ArrowLeft, ArrowRight, Search, Menu, X } from 'lucide-react'
import { type AutoRequest } from '@/lib/types'
import { API_BASE_URL } from '@/lib/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [requests, setRequests] = useState<AutoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  //Inizializza page dal parametro URL se presente
  const [page, setPage] = useState(() => {
    const urlPage = searchParams.get('page')
    return urlPage ? parseInt(urlPage, 10) : 1
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [pageInput, setPageInput] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Debounce per la ricerca
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const limit = 12

  // 🔧 ANTI-ZOOM REFRESH: Prevenzione refresh accidentale
  useEffect(() => {
    let lastTouchY = 0
    let preventPullToRefresh = false

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent
      if (touchEvent.touches.length !== 1) return
      lastTouchY = touchEvent.touches[0].clientY
      
      // Previeni pull-to-refresh se siamo in cima e stiamo scrollando verso il basso
      preventPullToRefresh = window.scrollY === 0
    }

    const handleTouchMove = (e: Event) => {
      const touchEvent = e as TouchEvent
      if (touchEvent.touches.length !== 1) return
      
      const touchY = touchEvent.touches[0].clientY
      const touchYDelta = touchY - lastTouchY
      lastTouchY = touchY

      if (preventPullToRefresh) {
        // Previeni il pull-to-refresh se stiamo scrollando verso il basso dalla cima
        if (touchYDelta > 0) {
          e.preventDefault()
          return false
        }
      }
    }

    const handleTouchEnd = () => {
      preventPullToRefresh = false
    }

    // Previeni zoom accidentale con doppio tap su iOS
    const handleTouchStartAntiZoom = (e: Event) => {
      const touchEvent = e as TouchEvent
      if (touchEvent.touches.length > 1) {
        e.preventDefault()
      }
    }

    // Aggiungi listener solo su dispositivi mobili
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false })
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd, { passive: true })
      
      // Anti-zoom solo su elementi non interattivi
      const nonInteractiveElements = document.querySelectorAll('div:not([role]), span, p, h1, h2, h3, h4, h5, h6')
      nonInteractiveElements.forEach(el => {
        el.addEventListener('touchstart', handleTouchStartAntiZoom, { passive: false })
      })
    }

    return () => {
      if ('ontouchstart' in window) {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        
        const nonInteractiveElements = document.querySelectorAll('div:not([role]), span, p, h1, h2, h3, h4, h5, h6')
        nonInteractiveElements.forEach(el => {
          el.removeEventListener('touchstart', handleTouchStartAntiZoom)
        })
      }
    }
  }, [])

  // Verifica autenticazione al mount
  useEffect(() => {
    const auth = localStorage.getItem('automud_auth')
    if (!auth) {
      navigate('/login')
      return
    }
  }, [navigate])

  // Debounce effect per evitare troppe chiamate API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      if (searchTerm !== debouncedSearchTerm) {
        setPage(1) // Reset pagina quando cambia la ricerca
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearchTerm])

  const fetchData = async () => {
    const auth = localStorage.getItem('automud_auth')
    if (!auth) {
      navigate('/login')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim())
      }

      const url = `${API_BASE_URL}/api/request?${params}`
      console.log('🌐 Fetching:', url)
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('automud_auth')
          navigate('/login')
          return
        }
        const errorText = await res.text()
        throw new Error(`Errore HTTP ${res.status}: ${errorText}`)
      }

      const data = await res.json()
      console.log('📦 Response:', data)
      
      setRequests(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalResults(data.pagination?.total || 0)
    } catch (err) {
      console.error('❌ Fetch error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto'
      setError(`Errore: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch quando cambiano pagina o ricerca
  useEffect(() => {
    fetchData()
  }, [page, debouncedSearchTerm])

  const handleView = (req: AutoRequest) => {
    console.log('📖 Navigando a dettaglio richiesta:', req.Id)
    //Aggiungi la pagina corrente come parametro URL
    navigate(`/request/${req.Id}?page=${page}`)
  }

  const handleLogout = () => {
    console.log('🚪 Logout in corso...')
    localStorage.removeItem('automud_auth')
    navigate('/login')
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 🔧 INLINE STYLES per prevenire zoom indesiderato */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media screen and (max-width: 768px) {
            html {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            
            body {
              -webkit-touch-callout: none;
              -webkit-user-select: none;
              -khtml-user-select: none;
              -moz-user-select: none;
              -ms-user-select: none;
              user-select: none;
              -webkit-tap-highlight-color: transparent;
            }
            
            /* Elementi interattivi mantengono la selezione */
            input, textarea, button, [role="button"], a {
              -webkit-user-select: auto !important;
              -moz-user-select: auto !important;
              -ms-user-select: auto !important;
              user-select: auto !important;
              -webkit-touch-callout: default !important;
            }
          }
        `
      }} />
      
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6">
        {/* Mobile Header */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-between">
            <div className="select-none">
              <h1 className="text-xl sm:text-2xl font-bold text-white">AutoMud</h1>
              <p className="text-sm text-slate-400">
                {totalResults} richieste
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="mt-4 p-4 bg-slate-800/90 border border-slate-700 rounded-lg backdrop-blur-sm">
              {/* Search Mobile */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Cerca richieste..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
                {searchTerm && (
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                  >
                    Cancella ricerca
                  </Button>
                )}
              </div>

              {/* Logout Mobile */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 touch-manipulation"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="select-none">
            <h1 className="text-3xl font-bold text-white">Dashboard Richieste</h1>
            <p className="text-slate-400">
              {totalResults} risultati • pagina {page} / {totalPages}
              {debouncedSearchTerm && <span className="text-orange-400"> • Ricerca: "{debouncedSearchTerm}"</span>}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Search Desktop */}
            <div className="flex gap-2 max-w-md w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cerca per: ID, targa, cliente, marca/modello..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20"
                />
              </div>
              {searchTerm && (
                <Button
                  onClick={clearSearch}
                  variant="outline"
                  size="icon"
                  className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
                >
                  ×
                </Button>
              )}
            </div>

            {/* Logout Desktop */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30 hover:border-red-500 hover:text-red-300 transition-colors whitespace-nowrap"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Loading/Error */}
        {loading ? (
          <div className="text-center text-slate-400 py-12 sm:py-24">
            <div className="text-sm sm:text-base select-none">Caricamento...</div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-12 sm:py-24">
            <div className="text-sm sm:text-base px-4 select-none">{error}</div>
          </div>
        ) : (
          <>
            {/* Grid - Responsive with touch optimization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {requests.map((req) => (
                <RequestCard key={req.Id} request={req} onView={handleView} />
              ))}
            </div>

            {/* Mobile Pagination - Simplified with touch optimization */}
            <div className="flex flex-col items-center gap-4 mt-8 lg:hidden">
              <div className="text-center select-none">
                <p className="text-slate-400 text-sm">
                  Pagina {page} di {totalPages}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                size="sm"
                onClick={() => {
                  const newPage = Math.max(page - 1, 1)
                  setPage(newPage)
                  setSearchParams({ page: newPage.toString() })
                }}
                disabled={page === 1}
                className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
                
                <div className="flex items-center gap-2 px-3">
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(pageInput);
                        if (val >= 1 && val <= totalPages) {
                          setPage(val);
                          setSearchParams({ page: val.toString() });
                          setPageInput('');
                        }
                      }
                    }}
                    placeholder={page.toString()}
                    className="w-16 h-8 text-center bg-slate-700/50 border-slate-600 text-white text-sm"
                  />
                </div>
                
                <Button
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(page + 1, totalPages)
                    setPage(newPage)
                    setSearchParams({ page: newPage.toString() })
                  }}
                  disabled={page === totalPages}
                  className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Pagination - Full */}
            <div className="hidden lg:flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setPage(1)
                    setSearchParams({ page: '1' })
                  }}
                  disabled={page === 1}
                  className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                >
                  ««
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(page - 1, 1)
                    setPage(newPage)
                    setSearchParams({ page: newPage.toString() })
                  }}
                  disabled={page === 1}
                  className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const start = Math.max(1, page - 2);
                    const end = Math.min(totalPages, page + 2);
                    
                    // First page
                    if (start > 1) {
                      pages.push(
                        <Button
                          key={1}
                          size="sm"
                          onClick={() => {
                            setPage(1)
                            setSearchParams({ page: '1' })
                          }}                          
                          className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 w-8"
                        >
                          1
                        </Button>
                      );
                      if (start > 2) {
                        pages.push(<span key="dots1" className="text-slate-400 px-1 select-none">...</span>);
                      }
                    }
                    
                    // Middle pages
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <Button
                          key={i}
                          size="sm"
                          onClick={() => {
                            setPage(i)
                            setSearchParams({ page: i.toString() })
                          }}                          
                          className={`w-8 ${
                            i === page 
                              ? "bg-orange-500 border-orange-500 text-white hover:bg-orange-600" 
                              : "bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                          }`}
                        >
                          {i}
                        </Button>
                      );
                    }
                    
                    // Last page
                    if (end < totalPages) {
                      if (end < totalPages - 1) {
                        pages.push(<span key="dots2" className="text-slate-400 px-1 select-none">...</span>);
                      }
                      pages.push(
                        <Button
                          size="sm"
                          onClick={() => {
                            setPage(totalPages)
                            setSearchParams({ page: totalPages.toString() })
                          }}
                          disabled={page === totalPages}
                          className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                        >
                          »»
                        </Button>
                      );
                    }
                    
                    return pages;
                  })()}
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(page + 1, totalPages)
                    setPage(newPage)
                    setSearchParams({ page: newPage.toString() })
                  }}
                  disabled={page === totalPages}
                  className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setPage(totalPages)
                    setSearchParams({ page: totalPages.toString() })
                  }}
                  disabled={page === totalPages}
                  className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                >
                  »»
                </Button>
              </div>

              {/* Direct page input */}
              <div className="flex items-center gap-2">
                <span className="text-slate-300 text-sm select-none">Vai a pagina:</span>
                <Input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(pageInput);
                      if (val >= 1 && val <= totalPages) {
                        setPage(val);
                        setSearchParams({ page: val.toString() });
                        setPageInput('');
                      }
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(pageInput);
                    if (val >= 1 && val <= totalPages) {
                      setPage(val);
                      setSearchParams({ page: val.toString() });
                    }
                    setPageInput('');
                  }}
                  placeholder={page.toString()}
                  className="w-20 h-8 text-center bg-slate-700/50 border-slate-600 text-white text-sm"
                />
                <span className="text-slate-400 text-sm select-none">di {totalPages}</span>
              </div>
            </div>
          </>
        )}

        {/* No Results */}
        {!loading && requests.length === 0 && !error && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2 select-none">
              Nessuna richiesta trovata
            </h3>
            <p className="text-slate-400 text-sm sm:text-base px-4 select-none">
              {debouncedSearchTerm ? `Nessun risultato per "${debouncedSearchTerm}"` : 'Non ci sono richieste da visualizzare'}
            </p>
            {searchTerm && (
              <Button
                onClick={clearSearch}
                variant="outline"
                className="mt-4 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
              >
                Cancella ricerca
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard