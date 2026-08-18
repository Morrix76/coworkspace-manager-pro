import axios from 'axios'
import { handleDemoRestriction } from '../utils/demoError'

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    handleDemoRestriction(error)
    return Promise.reject(error)
  }
)
