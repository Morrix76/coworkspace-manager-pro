import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // <-- 1. Importa BrowserRouter
import App from './App'
import 'antd/dist/reset.css'

const container = document.getElementById('root')
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- 2. Avvolgi l'intera App */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
