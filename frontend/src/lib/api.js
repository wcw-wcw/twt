export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"

export const getToken = () => localStorage.getItem("token")

export const getAuthHeaders = (includeJson = false) => {
  const headers = {}

  if (includeJson) {
    headers["Content-Type"] = "application/json"
  }

  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}