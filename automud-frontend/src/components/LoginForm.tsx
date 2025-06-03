// src/components/LoginForm.tsx
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void
  error: string | null
}

export function LoginForm({ onSubmit, error }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(username, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Login AutoMud 🔐</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" className="w-full">Login</Button>
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </form>
      </div>
    </div>
  )
}
