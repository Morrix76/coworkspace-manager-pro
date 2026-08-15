import { createSlice } from '@reduxjs/toolkit'

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [],
    loading: false,
    error: null,
  },
  reducers: {
    setBookings: (state, action) => {
      state.bookings = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    }
  }
})

export const { setBookings, setLoading } = bookingsSlice.actions
export default bookingsSlice.reducer