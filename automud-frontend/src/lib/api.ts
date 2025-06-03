// src/lib/api.ts
export const API_BASE_URL = "http://localhost:3000"

export const testAuth = async (username: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/request/count`, {
      headers: {
        Authorization: "Basic " + btoa(`${username}:${password}`)
      }
    })

    return res.ok
  } catch (error) {
    console.error("Errore durante la richiesta:", error)
    return false
  }
}