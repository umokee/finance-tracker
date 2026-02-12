import axios from 'axios'
import { API_URL } from '../../config'

const client = axios.create({
  baseURL: API_URL
})

client.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey')
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('apiKey')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default client
