import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material'
import { fetchSpaces, createSpace, updateSpace } from '../store/slices/spacesSlice'

const spaceTypes = [
  { value: 'OFFICE', label: 'Ufficio' },
  { value: 'MEETING_ROOM', label: 'Sala Riunioni' },
  { value: 'COWORKING', label: 'Coworking' },
  { value: 'EVENT_SPACE', label: 'Spazio Eventi' }
]

function Spaces() {
  const dispatch = useDispatch()
  const { spaces, loading } = useSelector((state) => state.spaces)
  const [open, setOpen] = useState(false)
  const [editingSpace, setEditingSpace] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'OFFICE',
    capacity: 1,
    hourlyRate: 0,
    dailyRate: 0,
    monthlyRate: 0,
    description: '',
    amenities: []
  })

  useEffect(() => {
    dispatch(fetchSpaces())
  }, [dispatch])

  const handleOpen = (space = null) => {
    if (space) {
      setEditingSpace(space)
      setFormData(space)
    } else {
      setEditingSpace(null)
      setFormData({
        name: '',
        type: 'OFFICE',
        capacity: 1,
        hourlyRate: 0,
        dailyRate: 0,
        monthlyRate: 0,
        description: '',
        amenities: []
      })
    }
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditingSpace(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Rate') || name === 'capacity' ? Number(value) : value
    }))
  }

  const handleSubmit = () => {
    if (editingSpace) {
      dispatch(updateSpace({ id: editingSpace.id, data: formData }))
    } else {
      dispatch(createSpace(formData))
    }
    handleClose()
  }

  const getSpaceTypeLabel = (type) => {
    const spaceType = spaceTypes.find(t => t.value === type)
    return spaceType ? spaceType.label : type
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Spazi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Nuovo Spazio
        </Button>
      </Box>

      <Grid container spacing={3}>
        {spaces.map((space) => (
          <Grid item xs={12} md={6} lg={4} key={space.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {space.name}
                </Typography>
                <Chip 
                  label={getSpaceTypeLabel(space.type)} 
                  size="small" 
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Capacità: {space.capacity} persone
                </Typography>
                <Typography variant="body2" gutterBottom>
                  €{space.hourlyRate}/ora - €{space.dailyRate}/giorno
                </Typography>
                {space.description && (
                  <Typography variant="body2" color="text.secondary">
                    {space.description}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<EditIcon />}
                  onClick={() => handleOpen(space)}
                >
                  Modifica
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSpace ? 'Modifica Spazio' : 'Nuovo Spazio'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Tipo"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                {spaceTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacità"
                name="capacity"
                type="number"
                value={formData.capacity}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tariffa Oraria (€)"
                name="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tariffa Giornaliera (€)"
                name="dailyRate"
                type="number"
                step="0.01"
                value={formData.dailyRate}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tariffa Mensile (€)"
                name="monthlyRate"
                type="number"
                step="0.01"
                value={formData.monthlyRate}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrizione"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Annulla</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingSpace ? 'Aggiorna' : 'Crea'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Spaces