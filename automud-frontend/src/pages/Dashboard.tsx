// src/pages/Dashboard.tsx - AGGIORNATO con filtri stati + LOGO AUTOMUD

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RequestCard } from '@/components/RequestCard'
import ShareModal from '@/components/ShareModal'
import StatusFilter from '@/components/StatusFilter';
import type { StatusFilterState, StatusCounts } from '@/components/StatusFilter';import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LogOut, ArrowLeft, ArrowRight, Search, Menu, X, Filter, Bell, User, RotateCcw } from 'lucide-react'
import { type AutoRequest, type CompleteRequestDetail } from '@/lib/types'
import { API_BASE_URL } from '@/lib/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [requests, setRequests] = useState<AutoRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 🆕 STATI PER FILTRI
  const [statusFilters, setStatusFilters] = useState<StatusFilterState>({
    all: true,
    dChiamare: false,
    inCorso: false,
    pratiRitiro: false,
    esitoFinale: false
  })
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    dChiamare: 0,
    inCorso: 0,
    pratiRitiro: 0,
    esitoFinale: 0
  })
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)
  
  // Inizializza page dal parametro URL se presente
  const [page, setPage] = useState(() => {
    const urlPage = searchParams.get('page')
    return urlPage ? parseInt(urlPage, 10) : 1
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [pageInput, setPageInput] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false) // 🆕
  const [showUserMenu, setShowUserMenu] = useState(false) // 🆕 Per dropdown menu
  
  // Stati per ShareModal
  const [shareModalRequest, setShareModalRequest] = useState<CompleteRequestDetail | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  
  // Debounce per la ricerca
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const limit = 12

  // Cleanup body styles
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'unset'
        document.documentElement.style.overflow = 'unset'
      }
    }
  }, [])

  // Gestione modal aperto/chiuso
  useEffect(() => {
    if (isShareModalOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
      document.documentElement.style.overflow = 'unset'
    }
    
    return () => {
      if (!isShareModalOpen) {
        document.body.style.overflow = 'unset'
        document.documentElement.style.overflow = 'unset'
      }
    }
  }, [isShareModalOpen])

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

  // 🆕 FUNZIONE PER CARICARE CONTATORI STATI
  const fetchStatusCounts = async () => {
    setIsLoadingCounts(true)
    try {
      const auth = localStorage.getItem('automud_auth')
      if (!auth) return

      const params = new URLSearchParams()
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim())
      }

      const url = `${API_BASE_URL}/api/request/status-counts?${params}`
      console.log('📊 Fetching status counts:', url)
      
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`Errore HTTP ${res.status}`)
      }

      const data = await res.json()
      console.log('✅ Status counts received:', data.counts)
      
      setStatusCounts(data.counts)
    } catch (err) {
      console.error('❌ Errore caricamento contatori:', err)
    } finally {
      setIsLoadingCounts(false)
    }
  }

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

      // 🆕 AGGIUNGI FILTRI STATI AI PARAMETRI
      if (statusFilters.all) {
        params.append('all', 'true')
      } else {
        if (statusFilters.dChiamare) params.append('dChiamare', 'true')
        if (statusFilters.inCorso) params.append('inCorso', 'true') 
        if (statusFilters.pratiRitiro) params.append('pratiRitiro', 'true')
        if (statusFilters.esitoFinale) params.append('esitoFinale', 'true')
      }

      const url = `${API_BASE_URL}/api/request?${params}`
      console.log('🌐 Fetching with filters:', url)
      
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

  // Fetch quando cambiano pagina, ricerca o filtri
  useEffect(() => {
    fetchData()
  }, [page, debouncedSearchTerm, statusFilters])

  // Fetch contatori quando cambia la ricerca
  useEffect(() => {
    fetchStatusCounts()
  }, [debouncedSearchTerm])

  const handleView = (req: AutoRequest) => {
    console.log('📖 Navigando a dettaglio richiesta:', req.Id)
    navigate(`/request/${req.Id}?page=${page}`)
  }

  // 🆕 GESTIONE CAMBIO FILTRI
  const handleFilterChange = (newFilters: StatusFilterState) => {
    console.log('🎯 Cambio filtri:', newFilters)
    setStatusFilters(newFilters)
    setPage(1) // Reset pagina quando cambiano i filtri
  }

  const handleShare = (req: AutoRequest) => {
    console.log('🔗 Apertura modal condivisione per:', req.Id)
    
    const completeRequest: CompleteRequestDetail = {
      ...req,
      Management: undefined,  
      Offers: [],
      StatusHistory: [],
      CurrentStatus: undefined  
    }
    
    setShareModalRequest(completeRequest)
    setIsShareModalOpen(true)
    
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'hidden'
        document.documentElement.style.overflow = 'hidden'
      }
    }, 0)
  }

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false)
    setShareModalRequest(null)
    
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'unset'
        document.documentElement.style.overflow = 'unset'
        document.body.offsetHeight
      }
    }, 100)
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

  const handleRefresh = () => {
    setPage(1)
    fetchData()
    fetchStatusCounts()
  }

  // 🆕 CONTEGGIO FILTRI ATTIVI
  const getActiveFiltersCount = () => {
    if (statusFilters.all) return 0
    return [statusFilters.dChiamare, statusFilters.inCorso, statusFilters.pratiRitiro, statusFilters.esitoFinale]
      .filter(Boolean).length
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dashboard-page" style={{
      transform: isShareModalOpen ? 'translateZ(0)' : 'none',
      isolation: isShareModalOpen ? 'isolate' : 'auto'
    }}>
      
      {/* 🎯 HEADER CON LOGO AUTOMUD - DESKTOP E MOBILE */}
      <header className="bg-slate-800/50 border-b border-slate-700/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Spazio vuoto a sinistra per bilanciare il layout */}
            <div className="hidden lg:flex items-center gap-3 flex-1">
              {/* Vuoto intenzionalmente per centrare il logo */}
            </div>

            {/* Logo AUTOMUD - Centro */}
            <div className="flex-1 flex justify-center lg:flex-none">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Logo AutoMud - Identico al Login */}
                <div className="flex items-center gap-1">
                  <div className="w-1 h-6 sm:h-8 bg-orange-400 rounded-full"></div>
                  <div className="w-1 h-6 sm:h-8 bg-orange-400 rounded-full"></div>
                </div>
                <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                  AUTOMUD
                </span>
              </div>
            </div>

            {/* Actions Destra - Solo User Menu */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
              
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-700/50 h-8 w-8 p-0"
                title="Menu"
              >
                {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              {/* User Menu - Desktop e Mobile - PIÙ GRANDE */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="text-slate-300 hover:text-white hover:bg-slate-700/50 gap-2 px-4 h-10 sm:h-12"
                  title="Menu utente"
                >
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="hidden sm:inline text-sm font-medium">Admin</span>
                </Button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                    <div className="p-4 border-b border-slate-700">
                      <div className="text-base font-semibold text-white">Amministratore</div>
                      <div className="text-sm text-slate-400">Sistema AutoMud</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {statusCounts.dChiamare > 0 && `${statusCounts.dChiamare} richieste da gestire`}
                      </div>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3"
                      >
                        <LogOut className="h-4 w-4" />
                        Disconnetti
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Click outside per chiudere user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
      
      <div className="w-full px-3 sm:px-4 py-4 sm:py-6">
        
        {/* Mobile Header Content */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-between">
            <div className="select-none">
              <h1 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-slate-400">
                {totalResults} richieste {activeFiltersCount > 0 && `(${activeFiltersCount} filtri)`}
              </p>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="mt-4 p-4 bg-slate-800/90 border border-slate-700 rounded-lg backdrop-blur-sm space-y-4">
              {/* Search Mobile */}
              <div>
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

              {/* Filtri Mobile Toggle */}
              <Button
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
                variant="outline"
                className="w-full bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 touch-manipulation relative"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtri Stati
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Notifiche integrate nel menu mobile */}
              <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-300">Richieste da gestire</span>
                </div>
                {statusCounts.dChiamare > 0 ? (
                  <div className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                    {statusCounts.dChiamare}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Tutto aggiornato</div>
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

          {/* 🆕 FILTRI MOBILE - Pannello separato */}
          {isMobileFiltersOpen && (
            <div className="mt-4">
              <StatusFilter
                filters={statusFilters}
                counts={statusCounts}
                onFilterChange={handleFilterChange}
                isLoading={isLoadingCounts}
              />
            </div>
          )}
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="flex flex-col gap-6 mb-6">
            <div className="flex justify-between items-center">
              <div className="select-none">
                <h1 className="text-3xl font-bold text-white">Dashboard Richieste</h1>
                <p className="text-slate-400">
                  {totalResults} risultati • pagina {page} / {totalPages}
                  {debouncedSearchTerm && <span className="text-orange-400"> • Ricerca: "{debouncedSearchTerm}"</span>}
                  {activeFiltersCount > 0 && <span className="text-blue-400"> • {activeFiltersCount} filtri attivi</span>}
                </p>
              </div>
              
              <div className="flex gap-4 items-center">
                {/* Search Desktop */}
                <div className="flex gap-2 max-w-md">
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
              </div>
            </div>

            {/* 🆕 FILTRI DESKTOP */}
            <StatusFilter
              filters={statusFilters}
              counts={statusCounts}
              onFilterChange={handleFilterChange}
              isLoading={isLoadingCounts}
            />
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
                <RequestCard 
                  key={req.Id} 
                  request={req} 
                  onView={handleView}
                  onShare={handleShare}
                />
              ))}
            </div>

            {/* Mobile Pagination */}
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
                
                {/* Page numbers logic stays the same */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const start = Math.max(1, page - 2);
                    const end = Math.min(totalPages, page + 2);
                    
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
                    
                    if (end < totalPages) {
                      if (end < totalPages - 1) {
                        pages.push(<span key="dots2" className="text-slate-400 px-1 select-none">...</span>);
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          size="sm"
                          onClick={() => {
                            setPage(totalPages)
                            setSearchParams({ page: totalPages.toString() })
                          }}
                          disabled={page === totalPages}
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
              {debouncedSearchTerm || activeFiltersCount > 0 
                ? `Nessun risultato per i criteri selezionati` 
                : 'Non ci sono richieste da visualizzare'
              }
            </p>
            {(searchTerm || activeFiltersCount > 0) && (
              <div className="flex gap-2 justify-center mt-4">
                {searchTerm && (
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                    className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                  >
                    Cancella ricerca
                  </Button>
                )}
                {activeFiltersCount > 0 && (
                  <Button
                    onClick={() => handleFilterChange({
                      all: true,
                      dChiamare: false,
                      inCorso: false,
                      pratiRitiro: false,
                      esitoFinale: false
                    })}
                    variant="outline"
                    className="bg-slate-700/50 border-slate-600 text-white hover:bg-slate-600 touch-manipulation"
                  >
                    Reset filtri
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ShareModal */}
      {shareModalRequest && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          zIndex: 9999,
          isolation: 'isolate',
          touchAction: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={handleCloseShareModal}
            request={shareModalRequest}
          />
        </div>
      )}
    </div>
  )
}

export default Dashboard