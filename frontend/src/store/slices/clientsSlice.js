import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

// Async Thunks
export const fetchClients = createAsyncThunk(
  'clients/fetchClients',
  async ({ page = 1, search = '', segment = '' } = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams()
      
      if (page > 1) params.append('page', page)
      if (search) params.append('search', search)
      if (segment) params.append('segment', segment)
      
      const response = await axios.get(`${API_URL}/clients?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Errore nel caricamento clienti')
    }
  }
)

export const createClient = createAsyncThunk(
  'clients/createClient',
  async (clientData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/clients`, clientData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Errore nella creazione cliente')
    }
  }
)

export const updateClient = createAsyncThunk(
  'clients/updateClient',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`${API_URL}/clients/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Errore nell\'aggiornamento cliente')
    }
  }
)

export const deleteClient = createAsyncThunk(
  'clients/deleteClient',
  async (clientId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return clientId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Errore nell\'eliminazione cliente')
    }
  }
)

export const getClientDetails = createAsyncThunk(
  'clients/getClientDetails',
  async (clientId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      
      // Chiamate parallele per tutti i dati del cliente
      const [clientRes, bookingsRes, contractsRes, invoicesRes] = await Promise.all([
        axios.get(`${API_URL}/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/clients/${clientId}/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/clients/${clientId}/contracts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/clients/${clientId}/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      return {
        client: clientRes.data,
        bookings: bookingsRes.data,
        contracts: contractsRes.data,
        invoices: invoicesRes.data
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Errore nel caricamento dettagli cliente')
    }
  }
)

export const searchClients = createAsyncThunk(
  'clients/searchClients',
  async (searchTerm, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/clients/search?q=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Errore nella ricerca')
    }
  }
)

export const importClients = createAsyncThunk(
  'clients/importClients',
  async (csvFile, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', csvFile)
      
      const response = await axios.post(`${API_URL}/clients/import`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Errore nell\'importazione')
    }
  }
)

export const exportClients = createAsyncThunk(
  'clients/exportClients',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams(filters)
      
      const response = await axios.get(`${API_URL}/clients/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      
      // Crea e scarica il file
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `clienti_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      return 'Export completato'
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Errore nell\'esportazione')
    }
  }
)

const initialState = {
  items: [],
  currentClient: null,
  clientDetails: {
    client: null,
    bookings: [],
    contracts: [],
    invoices: []
  },
  searchResults: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  },
  filters: {
    search: '',
    segment: '',
    sortBy: 'name',
    sortOrder: 'asc'
  },
  loading: {
    list: false,
    details: false,
    create: false,
    update: false,
    delete: false,
    search: false,
    import: false,
    export: false
  },
  error: null,
  success: null
}

const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearSuccess: (state) => {
      state.success = null
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearCurrentClient: (state) => {
      state.currentClient = null
    },
    clearClientDetails: (state) => {
      state.clientDetails = {
        client: null,
        bookings: [],
        contracts: [],
        invoices: []
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Clients
      .addCase(fetchClients.pending, (state) => {
        state.loading.list = true
        state.error = null
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.loading.list = false
        
        if (action.payload.data) {
          // Risposta paginata
          state.items = action.payload.data
          state.pagination = {
            currentPage: action.payload.page || 1,
            totalPages: action.payload.totalPages || 1,
            totalItems: action.payload.total || action.payload.data.length,
            itemsPerPage: action.payload.limit || 20
          }
        } else {
          // Risposta semplice
          state.items = action.payload
        }
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.loading.list = false
        state.error = action.payload
      })

      // Create Client
      .addCase(createClient.pending, (state) => {
        state.loading.create = true
        state.error = null
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.loading.create = false
        state.items.unshift(action.payload)
        state.success = 'Cliente creato con successo'
      })
      .addCase(createClient.rejected, (state, action) => {
        state.loading.create = false
        state.error = action.payload
      })

      // Update Client
      .addCase(updateClient.pending, (state) => {
        state.loading.update = true
        state.error = null
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.loading.update = false
        const index = state.items.findIndex(client => client.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
        state.success = 'Cliente aggiornato con successo'
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.loading.update = false
        state.error = action.payload
      })

      // Delete Client
      .addCase(deleteClient.pending, (state) => {
        state.loading.delete = true
        state.error = null
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.loading.delete = false
        state.items = state.items.filter(client => client.id !== action.payload)
        state.success = 'Cliente eliminato con successo'
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.loading.delete = false
        state.error = action.payload
      })

      // Get Client Details
      .addCase(getClientDetails.pending, (state) => {
        state.loading.details = true
        state.error = null
      })
      .addCase(getClientDetails.fulfilled, (state, action) => {
        state.loading.details = false
        state.clientDetails = action.payload
        state.currentClient = action.payload.client
      })
      .addCase(getClientDetails.rejected, (state, action) => {
        state.loading.details = false
        state.error = action.payload
      })

      // Search Clients
      .addCase(searchClients.pending, (state) => {
        state.loading.search = true
      })
      .addCase(searchClients.fulfilled, (state, action) => {
        state.loading.search = false
        state.searchResults = action.payload
      })
      .addCase(searchClients.rejected, (state, action) => {
        state.loading.search = false
        state.error = action.payload
      })

      // Import Clients
      .addCase(importClients.pending, (state) => {
        state.loading.import = true
        state.error = null
      })
      .addCase(importClients.fulfilled, (state, action) => {
        state.loading.import = false
        state.success = `Importati ${action.payload.imported} clienti`
      })
      .addCase(importClients.rejected, (state, action) => {
        state.loading.import = false
        state.error = action.payload
      })

      // Export Clients
      .addCase(exportClients.pending, (state) => {
        state.loading.export = true
        state.error = null
      })
      .addCase(exportClients.fulfilled, (state, action) => {
        state.loading.export = false
        state.success = action.payload
      })
      .addCase(exportClients.rejected, (state, action) => {
        state.loading.export = false
        state.error = action.payload
      })
  }
})

export const { 
  clearError, 
  clearSuccess, 
  setFilters, 
  clearCurrentClient, 
  clearClientDetails,
  clearSearchResults 
} = clientsSlice.actions

export default clientsSlice.reducer