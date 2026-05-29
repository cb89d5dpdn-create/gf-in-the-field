import { useQuery } from '@tanstack/react-query'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { SkeletonList } from '../components/Skeleton'

export function LoginStats() {
  const { profile, session } = useAuth()
  
  // Only Ben can access (check user_id)
  const BEN_USER_ID = 'bb125db8-e6e7-4f32-af66-523186c2d47e'
  const isBen = session?.user?.id === BEN_USER_ID
  
  const { data, isLoading } = useQuery({
    queryKey: ['login-stats'],
    queryFn: async () => {
      const result = await api.get('/api/login-tracking/stats')
      return result
    },
    enabled: isBen, // Only fetch if Ben
  })

  const stats = data?.stats || []
  const totalEvents = data?.total_events || 0

  // Access denied if not Ben
  if (profile && !isBen) {
    return (
      <Layout title="Access Denied">
        <div className="text-center py-12">
          <p className="text-gray-500">You do not have access to this page.</p>
        </div>
      </Layout>
    )
  }

  if (isLoading) {
    return (
      <Layout title="Login Activity">
        <SkeletonList count={8} />
      </Layout>
    )
  }

  return (
    <Layout title="Login Activity">
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gf-light/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-gf-dark">{stats.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-gf-light/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-gf-dark">{totalEvents}</div>
              <div className="text-sm text-gray-600">Total Logins</div>
            </div>
            <div className="bg-gf-light/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-gf-dark">
                {stats.filter(s => s.logins_this_week > 0).length}
              </div>
              <div className="text-sm text-gray-600">Active This Week</div>
            </div>
          </div>
        </div>

        {/* User Stats Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">User Login Activity</h2>
          </div>
          
          {stats.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No login activity recorded yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Login events will appear here once users start signing in.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Logins</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">This Week</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">This Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.map((user) => (
                    <tr key={user.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.state || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {user.total_logins}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {user.logins_this_week}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600">
                        {user.logins_this_month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleString('en-AU', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Never'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Engagement Insights */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Engagement Insights</h2>
          <div className="space-y-3">
            {stats.filter(s => s.logins_this_week === 0 && s.total_logins > 0).length > 0 && (
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="text-yellow-600">⚠️</div>
                <div>
                  <div className="font-medium text-sm text-yellow-900">Inactive Users</div>
                  <div className="text-sm text-yellow-700">
                    {stats.filter(s => s.logins_this_week === 0 && s.total_logins > 0).length} user(s) 
                    haven't logged in this week
                  </div>
                </div>
              </div>
            )}
            
            {stats.some(s => s.total_logins > 10) && (
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                <div className="text-green-600">✅</div>
                <div>
                  <div className="font-medium text-sm text-green-900">Power Users</div>
                  <div className="text-sm text-green-700">
                    {stats.filter(s => s.total_logins > 10).map(s => s.name).join(', ')} — 
                    High engagement (10+ logins)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
