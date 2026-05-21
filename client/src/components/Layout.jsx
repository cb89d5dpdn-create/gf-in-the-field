import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GoodmanFielderLogo } from './GoodmanFielderLogo'

export function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gf-teal sticky top-0 z-10 shadow-md">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 min-h-0">
            <GoodmanFielderLogo size="small" className="h-10" />
            <span className="font-semibold text-white text-sm hidden xs:block">
              In The Field
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-xs text-white/90 hidden sm:block">
                {profile.name} · {profile.state}
              </span>
            )}
            <Link
              to="/change-password"
              className="text-xs text-white/90 hover:text-white px-2 py-1 rounded min-h-0 transition-colors"
            >
              Change Password
            </Link>
            <button
              onClick={handleSignOut}
              className="text-xs text-white/90 hover:text-white px-2 py-1 rounded min-h-0 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>
    </div>
  )
}
