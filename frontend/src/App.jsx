import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntApp } from 'antd';
import itIT from 'antd/locale/it_IT';
import { store } from './store';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Spaces from './pages/Spaces';
import SpaceForm from './pages/SpaceForm';
import Clients from './pages/Clients';
import Bookings from './pages/Bookings';
import Contracts from './pages/Contracts';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import ProtectedRoute from './components/common/ProtectedRoute';
import 'antd/dist/reset.css';
import dayjs from 'dayjs';

// Tema e stili globali (invariati)
const futuristicTheme = {
  token: { colorPrimary: '#4F46E5', borderRadius: 12 },
  components: { Card: { borderRadius: 16 }, Button: { borderRadius: 10 } }
};
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
  body { font-family: 'Inter', sans-serif; }
`;

// --- DATI MOCK CENTRALI ---
const initialMockSpaces = [
    { id: 1, name: 'The Hub', type: 'COWORKING', isActive: true, capacity: 50, hourlyRate: 15, dailyRate: 100, amenities: 'WiFi, Coffee/Kitchen', _count: { bookings: 45 } },
    { id: 2, name: 'Boardroom A', type: 'MEETING_ROOM', isActive: true, capacity: 12, hourlyRate: 75, dailyRate: 500, amenities: 'WiFi, Projector/Screen, Whiteboard', _count: { bookings: 12 } },
    { id: 3, name: 'Quiet Pod 3', type: 'PHONE_BOOTH', isActive: false, capacity: 1, hourlyRate: 25, dailyRate: 150, amenities: 'WiFi, Power Outlets', _count: { bookings: 21 } }
];

function App() {
  // --- STATO CENTRALE PER GLI SPAZI ---
  const [spaces, setSpaces] = useState(initialMockSpaces);

  // Funzione per aggiungere un nuovo spazio alla lista centrale
  const handleAddSpace = (newSpaceData) => {
    const spaceToAdd = {
      ...newSpaceData,
      id: Date.now(), // ID temporaneo per la demo
      _count: { bookings: 0 }
    };
    setSpaces(prevSpaces => [...prevSpaces, spaceToAdd]);
  };
  
  // Funzione per modificare uno spazio esistente
  const handleUpdateSpace = (spaceId, updatedData) => {
    setSpaces(prevSpaces => prevSpaces.map(space => 
      space.id === spaceId ? { ...space, ...updatedData } : space
    ));
  };

  React.useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = globalStyles;
    document.head.appendChild(styleElement);
    return () => { document.head.removeChild(styleElement) };
  }, []);

  return (
    <Provider store={store}>
      <ConfigProvider locale={itIT} theme={futuristicTheme}>
        <AntApp>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* --- PASSAGGIO DATI E FUNZIONI ALLE PAGINE --- */}
              <Route path="spaces" element={<Spaces spacesData={spaces} />} />
              <Route path="spaces/new" element={<SpaceForm onSave={handleAddSpace} />} />
              <Route path="spaces/edit/:spaceId" element={<SpaceForm spacesData={spaces} onSave={handleUpdateSpace} />} />

              <Route path="clients" element={<Clients />} />
              <Route path="bookings" element={<Bookings />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="billing" element={<Billing />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
        </AntApp>
      </ConfigProvider>
    </Provider>
  );
}

export default App;

