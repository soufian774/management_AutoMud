// src/components/ProtectedRoute.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()

  useEffect(() => {
    const auth = localStorage.getItem('automud_auth')
    if (!auth) {
      console.log('🔒 Utente non autenticato, redirect a login')
      navigate('/login', { replace: true })
    }
  }, [navigate])

  // Se non c'è autenticazione, non renderizza nulla (il redirect è già in corso)
  const auth = localStorage.getItem('automud_auth')
  if (!auth) {
    return null
  }

  return <>{children}</>
}