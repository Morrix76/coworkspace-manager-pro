import React from 'react'
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Typography,
  Box
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Business as SpacesIcon,
  Event as BookingsIcon,
  People as ClientsIcon,
  Description as ContractsIcon,
  Payment as BillingIcon,
  Analytics as ReportsIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const menuItems = [
    { text: t('nav.dashboard'), icon: <DashboardIcon />, path: '/dashboard' },
    { text: t('nav.spaces'), icon: <SpacesIcon />, path: '/spaces' },
    { text: t('nav.bookings'), icon: <BookingsIcon />, path: '/bookings' },
    { text: t('nav.clients'), icon: <ClientsIcon />, path: '/clients' },
    { text: t('nav.contracts'), icon: <ContractsIcon />, path: '/contracts' },
    { text: t('nav.billing'), icon: <BillingIcon />, path: '/billing' },
    { text: t('nav.reports'), icon: <ReportsIcon />, path: '/reports' },
  ]

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" noWrap>
          {t('sidebar.brand')}
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}

export default Sidebar
