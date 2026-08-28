import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import CreateFile from './pages/CreateFile'
import FileDetail from './pages/FileDetail'
import Movement from './pages/Movement'
import Users from './pages/Users'
import Viewer from './pages/Viewer'
import Scan from './pages/Scan'

function ProtectedLayout({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedLayout allowedRoles={['admin', 'officer', 'peon', 'viewer']}><Dashboard /></ProtectedLayout>} />
      <Route path="/files" element={<ProtectedLayout allowedRoles={['admin', 'officer', 'peon', 'viewer']}><Files /></ProtectedLayout>} />
      <Route path="/file/:id" element={<ProtectedLayout allowedRoles={['admin', 'officer', 'peon', 'viewer']}><FileDetail /></ProtectedLayout>} />
      <Route path="/create-file" element={<ProtectedLayout allowedRoles={['admin', 'officer', 'peon']}><CreateFile /></ProtectedLayout>} />
      <Route path="/scan" element={<ProtectedLayout allowedRoles={['admin', 'officer', 'peon']}><Scan /></ProtectedLayout>} />
      <Route path="/movements" element={<ProtectedLayout allowedRoles={['admin', 'officer', 'peon']}><Movement /></ProtectedLayout>} />
      <Route path="/users" element={<ProtectedLayout allowedRoles={['admin']}><Users /></ProtectedLayout>} />
      <Route path="/viewer" element={<ProtectedLayout allowedRoles={['admin', 'officer', 'peon', 'viewer']}><Viewer /></ProtectedLayout>} />

      <Route path="*" element={<Login />} />
    </Routes>
  )
}