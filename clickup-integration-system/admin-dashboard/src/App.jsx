import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Notifications from './pages/Notifications'
import CronJobs from './pages/CronJobs'
import WhatsApp from './pages/WhatsApp'
import SystemMonitor from './pages/SystemMonitor'
import AuditLog from './pages/AuditLog'
import Layout from './components/Layout'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="cron-jobs" element={<CronJobs />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="monitor" element={<SystemMonitor />} />
        <Route path="audit-log" element={<AuditLog />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <AppRoutes />
      </Box>
    </AuthProvider>
  )
}

export default App
