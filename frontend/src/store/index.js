import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import spacesSlice from './slices/spacesSlice'
import bookingsSlice from './slices/bookingsSlice'
import clientsSlice from './slices/clientsSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    spaces: spacesSlice,
    bookings: bookingsSlice,
    clients: clientsSlice,
  }
})