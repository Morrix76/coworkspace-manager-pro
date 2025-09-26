import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

class ClientsService {
  constructor() {
    this.baseURL = `${API_URL}/clients`
  }

  // Helper per ottenere header auth
  getAuthHeaders() {
    const token = localStorage.getItem('token')
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  // GET /clients - Lista clienti con filtri e paginazione
  async getClients(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.search) queryParams.append('search', params.search)
      if (params.segment) queryParams.append('segment', params.segment)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

      const response = await axios.get(`${this.baseURL}?${queryParams}`, {
        headers: this.getAuthHeaders()
      })
      
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // GET /clients/:id - Dettaglio cliente
  async getClient(id) {
    try {
      const response = await axios.get(`${this.baseURL}/${id}`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // GET /clients/:id/bookings - Storico prenotazioni cliente
  async getClientBookings(clientId, params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.status) queryParams.append('status', params.status)

      const response = await axios.get(`${this.baseURL}/${clientId}/bookings?${queryParams}`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // GET /clients/:id/contracts - Contratti cliente
  async getClientContracts(clientId) {
    try {
      const response = await axios.get(`${this.baseURL}/${clientId}/contracts`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // GET /clients/:id/invoices - Fatture cliente
  async getClientInvoices(clientId, params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.status) queryParams.append('status', params.status)

      const response = await axios.get(`${this.baseURL}/${clientId}/invoices?${queryParams}`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // GET /clients/:id/stats - Statistiche cliente
  async getClientStats(clientId) {
    try {
      const response = await axios.get(`${this.baseURL}/${clientId}/stats`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // POST /clients - Crea nuovo cliente
  async createClient(clientData) {
    try {
      const response = await axios.post(this.baseURL, clientData, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // PUT /clients/:id - Aggiorna cliente
  async updateClient(id, clientData) {
    try {
      const response = await axios.put(`${this.baseURL}/${id}`, clientData, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // DELETE /clients/:id - Elimina cliente (soft delete)
  async deleteClient(id) {
    try {
      const response = await axios.delete(`${this.baseURL}/${id}`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // GET /clients/search - Ricerca clienti
  async searchClients(query, filters = {}) {
    try {
      const params = new URLSearchParams()
      params.append('q', query)
      
      if (filters.segment) params.append('segment', filters.segment)
      if (filters.limit) params.append('limit', filters.limit)

      const response = await axios.get(`${this.baseURL}/search?${params}`, {
        headers: this.getAuthHeaders()
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // POST /clients/import - Importa clienti da CSV
  async importClients(file, options = {}) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      if (options.skipDuplicates) formData.append('skipDuplicates', 'true')
      if (options.updateExisting) formData.append('updateExisting', 'true')

      const response = await axios.post(`${this.baseURL}/import`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // GET /clients/export - Esporta clienti
  async exportClients(filters = {}, format = 'csv') {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.segment) params.append('segment', filters.segment)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      params.append('format', format)

      const response = await axios.get(`${this.baseURL}/export?${params}`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      })

      // Crea e scarica il file
      const filename = this.getFilenameFromResponse(response) || 
                     `clienti_export_${new Date().toISOString().split('T')[0]}.${format}`
      
      this.downloadFile(response.data, filename)
      
      return { success: true, filename }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // GET /clients/template - Download template CSV per import
  async getImportTemplate() {
    try {
      const response = await axios.get(`${this.baseURL}/template`, {
        headers: this.getAuthHeaders(),
        responseType: 'blob'
      })

      this.downloadFile(response.data, 'clienti_template.csv')
      
      return { success: true, filename: 'clienti_template.csv' }
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // Utility: Estrai filename dalla risposta
  getFilenameFromResponse(response) {
    const contentDisposition = response.headers['content-disposition']
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="(.+)"/)
      return match ? match[1] : null
    }
    return null
  }

  // Utility: Download file
  downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  // Utility: Gestione errori
  handleError(error) {
    if (error.response) {
      // Errore dal server
      const message = error.response.data?.message || 
                     error.response.data?.error ||
                     `Errore ${error.response.status}`
      
      return new Error(message)
    } else if (error.request) {
      // Errore di rete
      return new Error('Errore di connessione al server')
    } else {
      // Errore generico
      return new Error(error.message || 'Errore sconosciuto')
    }
  }

  // Metodi di validazione
  validateClientData(data) {
    const errors = []

    if (!data.name?.trim()) {
      errors.push('Nome è obbligatorio')
    }

    if (!data.email?.trim()) {
      errors.push('Email è obbligatoria')
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Email non valida')
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push('Numero di telefono non valido')
    }

    return errors
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{8,}$/
    return phoneRegex.test(phone)
  }

  // Utility: Formatta dati cliente per display
  formatClientForDisplay(client) {
    return {
      ...client,
      fullName: client.name,
      displaySegment: this.getSegmentLabel(client.segment),
      formattedPhone: this.formatPhone(client.phone),
      createdDate: new Date(client.createdAt).toLocaleDateString('it-IT'),
      updatedDate: new Date(client.updatedAt).toLocaleDateString('it-IT')
    }
  }

  getSegmentLabel(segment) {
    const labels = {
      VIP: 'VIP',
      BUSINESS: 'Business',
      OCCASIONALE: 'Occasionale'
    }
    return labels[segment] || segment
  }

  formatPhone(phone) {
    if (!phone) return ''
    // Formattazione base per numeri italiani
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
  }
}

export default new ClientsService()