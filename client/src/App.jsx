import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { NewObservation } from './pages/NewObservation'
import { RSMHistory } from './pages/RSMHistory'
import { Admin } from './pages/Admin'
import { ResetPassword } from './pages/ResetPassword'
import { ChangePassword } from './pages/ChangePassword'
import { AdminUsers } from './pages/AdminUsers'
import { LoginStats } from './pages/LoginStats'

// Create a client with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
      cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { fontFamily: 'inherit', fontSize: '14px' },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/observations/new"
            element={
              <ProtectedRoute>
                <NewObservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/observations/:id/continue"
            element={
              <ProtectedRoute>
                <NewObservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rsms/:id/history"
            element={
              <ProtectedRoute>
                <RSMHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/login-stats"
            element={
              <ProtectedRoute requireAdmin>
                <LoginStats />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
