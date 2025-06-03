// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RequestCard } from '@/components/RequestCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LogOut, ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { type AutoRequest } from '@/lib/types'
import { API_BASE_URL } from '@/lib/api'

const Dashboard = () => {
  const navigate = useNavigate()
  
  const [requests, setRequests] = useState<AutoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [pageInput, setPageInput] = useState('')
  
  // Debounce per la ricerca
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const limit = 12

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

  // ✅ NUOVO: Navigazione tramite React Router
  const handleView = (req: AutoRequest) => {
    console.log('📖 Navigando a dettaglio richiesta:', req.Id)
    navigate(`/request/${req.Id}`)
  }

  // ✅ NUOVO: Funzione di logout
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

  // ✅ RIMOSSO: Tutto il codice per gestire lo stato interno di navigazione

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full px-2 sm:px-4 py-6">
        {/* Topbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard Richieste</h1>
            <p className="text-slate-400">
              {totalResults} risultati • pagina {page} / {totalPages}
              {debouncedSearchTerm && <span className="text-orange-400"> • Ricerca: "{debouncedSearchTerm}"</span>}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Ricerca rapida */}
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

            {/* Pulsante Logout */}
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
          <div className="text-center text-slate-400 py-24">Caricamento...</div>
        ) : error ? (
          <div className="text-center text-red-400 py-24">{error}</div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {requests.map((req) => (
                <RequestCard key={req.Id} request={req} onView={handleView} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10">
              {/* Navigation buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                >
                  ««
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
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
                          onClick={() => setPage(1)}
                          className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 w-8"
                        >
                          1
                        </Button>
                      );
                      if (start > 2) {
                        pages.push(<span key="dots1" className="text-slate-400 px-1">...</span>);
                      }
                    }
                    
                    // Middle pages
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <Button
                          key={i}
                          size="sm"
                          onClick={() => setPage(i)}
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
                        pages.push(<span key="dots2" className="text-slate-400 px-1">...</span>);
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          size="sm"
                          onClick={() => setPage(totalPages)}
                          className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600 w-8"
                        >
                          {totalPages}
                        </Button>
                      );
                    }
                    
                    return pages;
                  })()}
                </div>

                <Button
                  size="sm"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="bg-slate-700 border border-slate-600 text-white hover:bg-slate-600"
                >
                  »»
                </Button>
              </div>

              {/* Direct page input */}
              <div className="flex items-center gap-2">
                <span className="text-slate-300 text-sm">Vai a pagina:</span>
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
                        setPageInput('');
                      }
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(pageInput);
                    if (val >= 1 && val <= totalPages) {
                      setPage(val);
                    }
                    setPageInput('');
                  }}
                  placeholder={page.toString()}
                  className="w-20 h-8 text-center bg-slate-700/50 border-slate-600 text-white text-sm"
                />
                <span className="text-slate-400 text-sm">di {totalPages}</span>
              </div>
            </div>
          </>
        )}

        {/* Messaggio quando non ci sono risultati */}
        {!loading && requests.length === 0 && !error && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nessuna richiesta trovata
            </h3>
            <p className="text-slate-400">
              {debouncedSearchTerm ? `Nessun risultato per "${debouncedSearchTerm}"` : 'Non ci sono richieste da visualizzare'}
            </p>
            {searchTerm && (
              <Button
                onClick={clearSearch}
                variant="outline"
                className="mt-4 bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600"
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