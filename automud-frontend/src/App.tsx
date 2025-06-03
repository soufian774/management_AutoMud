// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import RequestDetail from "@/pages/RequestDetail"
import ProtectedRoute from "@/components/ProtectedRoute"

function App() {
  return (
    <Routes>
      {/* Rotte pubbliche */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rotte protette */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/request/:requestId" 
        element={
          <ProtectedRoute>
            <RequestDetail />
          </ProtectedRoute>
        } 
      />
      
      {/* Redirect di default */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App