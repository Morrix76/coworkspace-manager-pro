import axios from 'axios'
import { message } from 'antd'
import { handleDemoRestriction } from '../utils/demoError'
import { store } from '../store'
import { logout } from '../store/slices/authSlice'
import i18n from '../i18n'

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    handleDemoRestriction(error)

    const status = error.response?.status
    const requestUrl = error.config?.url || ''
    const isLoginRequest = requestUrl.includes('/auth/login')

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')
      store.dispatch(logout())
      message.warning(i18n.t('auth.sessionExpired'))
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)
