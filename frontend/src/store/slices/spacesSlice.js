import { createSlice } from '@reduxjs/toolkit'

const spacesSlice = createSlice({
  name: 'spaces',
  initialState: {
    spaces: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSpaces: (state, action) => {
      state.spaces = action.payload
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    }
  }
})

export const { setSpaces, setLoading } = spacesSlice.actions
export default spacesSlice.reducer