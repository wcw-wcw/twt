export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")

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

const parseJson = async (res) => {
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || "Request failed")
  }

  return data
}

export const repostPost = async (postId) => {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/repost`, {
    method: "POST",
    headers: getAuthHeaders()
  })

  return parseJson(res)
}

export const unrepostPost = async (postId) => {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/repost`, {
    method: "DELETE",
    headers: getAuthHeaders()
  })

  return parseJson(res)
}
