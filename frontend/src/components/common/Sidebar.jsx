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

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Spazi', icon: <SpacesIcon />, path: '/spaces' },
  { text: 'Prenotazioni', icon: <BookingsIcon />, path: '/bookings' },
  { text: 'Clienti', icon: <ClientsIcon />, path: '/clients' },
  { text: 'Contratti', icon: <ContractsIcon />, path: '/contracts' },
  { text: 'Fatturazione', icon: <BillingIcon />, path: '/billing' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

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
          Opus Center
        </Typography>
      </Box>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
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