import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { GoodmanFielderLogo } from './GoodmanFielderLogo'

export function Layout({ children }) {
  const { profile, session, signOut } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'mobile'
  })
  
  // Ben's user ID for special features
  const BEN_USER_ID = 'bb125db8-e6e7-4f32-af66-523186c2d47e'
  const isBen = session?.user?.id === BEN_USER_ID

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode)
  }, [viewMode])

  const toggleViewMode = () => {
    setViewMode(viewMode === 'mobile' ? 'desktop' : 'mobile')
  }

  const maxWidth = viewMode === 'desktop' ? 'max-w-6xl' : 'max-w-2xl'

  const handleSignOut = async () => {
    await signOut()
    queryClient.clear() // Clear all cached queries on logout
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Side Menu */}
      <div className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 space-y-6">
          {/* User info */}
          {profile && (
            <div className="pb-4 border-b border-gray-200">
              <p className="font-semibold text-gray-900">{profile.name}</p>
              <p className="text-sm text-gray-500">{profile.role === 'admin' ? 'Admin' : profile.state}</p>
            </div>
          )}

          {/* Menu items */}
          <nav className="space-y-2">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Home
            </Link>

            <Link
              to="/change-password"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Change Password
            </Link>

            {profile?.role === 'admin' && (
              <>
                <Link
                  to="/admin/users"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Manage Users
                </Link>

                {isBen && (
                  <Link
                    to="/admin/login-stats"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    📊 Login Activity
                  </Link>
                )}

                <button
                  onClick={() => { toggleViewMode(); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  View: {viewMode === 'mobile' ? 'Mobile 📱' : 'Desktop 💻'}
                </button>
              </>
            )}

            <button
              onClick={() => { handleSignOut(); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </div>

      <header className="bg-gf-teal sticky top-0 z-30 shadow-md">
        <div className={`${maxWidth} mx-auto px-4 flex items-center justify-between h-16`}>
          <Link to="/" className="flex items-center gap-3 min-h-0">
            <GoodmanFielderLogo size="small" className="h-10" />
            <span className="font-semibold text-white text-sm hidden xs:block">
              In The Field
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>
      <main className={`flex-1 ${maxWidth} mx-auto w-full px-4 py-6`}>
        {children}
      </main>
    </div>
  )
}
