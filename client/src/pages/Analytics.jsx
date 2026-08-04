import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Layout } from '../components/Layout'
import { api } from '../lib/api'
import { SkeletonList } from '../components/Skeleton'

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = ['State Trends', 'RSM Drill-Down', 'Category Breakdown', 'Trend Summary']

const STATE_COLORS = {
  'NSW':   '#009b8d',
  'VIC':   '#3B82F6',
  'QLD':   '#8B5CF6',
  'WA':    '#F59E0B',
  'SA/NT': '#EF4444',
}

const DEFAULT_COLOR = '#6B7280'

function stateColor(state) {
  return STATE_COLORS[state] || DEFAULT_COLOR
}

function scoreColor(score) {
  if (score >= 4) return '#22C55E'
  if (score >= 3) return '#F59E0B'
  return '#EF4444'
}

function scoreBg(score) {
  if (score >= 4) return 'bg-green-50 text-green-700'
  if (score >= 3) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

function directionIcon(direction) {
  if (direction === 'improving') return '↑'
  if (direction === 'declining') return '↓'
  return '→'
}

function directionStyle(direction) {
  if (direction === 'improving') return 'text-green-600'
  if (direction === 'declining') return 'text-red-500'
  return 'text-gray-500'
}

function fmtWeek(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Score pill ──────────────────────────────────────────────────────────────

function ScorePill({ score }) {
  if (score == null) return <span className="text-gray-400">—</span>
  return (
    <span className={`inline-flex items-center justify-center w-12 h-6 rounded-full text-xs font-semibold ${scoreBg(score)}`}>
      {Number(score).toFixed(1)}
    </span>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ message = 'No data available yet.' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
      <p className="text-4xl mb-3">📊</p>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}

// ─── Chart error boundary helper ─────────────────────────────────────────────

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {title && <h3 className="text-sm font-semibold text-gray-700 mb-4">{title}</h3>}
      {children}
    </div>
  )
}

// ─── Tab 1: State Trends ─────────────────────────────────────────────────────

function StateTrendsTab({ data }) {
  const [stateFilter, setStateFilter] = useState('all')

  const states = useMemo(() => {
    const set = new Set((data || []).map((r) => r.state))
    return Array.from(set).sort()
  }, [data])

  // Pivot rows → { week: 'DD MMM', NSW: 3.5, VIC: 4.0, NSW_count: 3, ... }
  const pivotted = useMemo(() => {
    const map = {}
    ;(data || []).forEach((row) => {
      const key = row.week
      if (!map[key]) map[key] = { week: fmtWeek(row.week), _raw: row.week }
      map[key][row.state] = Number(row.avg_score)
      map[key][`${row.state}_count`] = Number(row.visit_count)
    })
    return Object.values(map).sort((a, b) => new Date(a._raw) - new Date(b._raw))
  }, [data])

  const visibleStates = stateFilter === 'all' ? states : [stateFilter]

  if (!data || data.length === 0) {
    return <EmptyState message="No completed observations found. Scores will appear once visits are submitted." />
  }

  return (
    <div className="space-y-4">
      {/* State selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-600">State</label>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gf-teal"
        >
          <option value="all">All States</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Line chart: avg score per week */}
      <ChartCard title="Avg Coaching Score by Week">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={pivotted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
              formatter={(value) => [Number(value).toFixed(2), '']}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {visibleStates.map((state) => (
              <Line
                key={state}
                type="monotone"
                dataKey={state}
                stroke={stateColor(state)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Bar chart: visit count per week */}
      <ChartCard title="Visit Count by Week">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={pivotted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {visibleStates.map((state) => (
              <Bar key={state} dataKey={`${state}_count`} name={state} fill={stateColor(state)} stackId="a" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

// ─── Tab 2: RSM Drill-Down ───────────────────────────────────────────────────

function RsmDrillDownTab() {
  const [stateFilter, setStateFilter] = useState('')
  const [selectedRsmId, setSelectedRsmId] = useState('')

  // Fetch all RSMs from existing admin endpoint
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/admin/users'),
    staleTime: 5 * 60 * 1000,
  })

  const rsms = useMemo(() => {
    const all = usersData?.rsms || []
    return stateFilter ? all.filter((r) => r.state === stateFilter) : all
  }, [usersData, stateFilter])

  const states = useMemo(() => {
    const set = new Set((usersData?.rsms || []).map((r) => r.state))
    return Array.from(set).sort()
  }, [usersData])

  // Fetch RSM trend when an RSM is selected
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['rsm-trend', selectedRsmId],
    queryFn: () => api.get(`/api/admin/analytics/rsm-trend/${selectedRsmId}`),
    enabled: !!selectedRsmId,
    staleTime: 5 * 60 * 1000,
  })

  const chartData = useMemo(() => {
    return (trendData?.visits || []).map((v) => ({
      ...v,
      date: fmtDate(v.visit_date),
      avg_score: Number(v.avg_score),
    }))
  }, [trendData])

  const CustomDot = (props) => {
    const { cx, cy } = props
    return <circle cx={cx} cy={cy} r={5} fill="#009b8d" stroke="#fff" strokeWidth={2} />
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow text-xs">
        <p className="font-semibold text-gray-800">{d?.date}</p>
        <p className="text-gray-600">FSM: {d?.fsm_name}</p>
        <p className="text-gf-teal font-bold">Score: {Number(d?.avg_score).toFixed(2)}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Filter by State</label>
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setSelectedRsmId('') }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gf-teal"
          >
            <option value="">All States</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Select RSM</label>
          {usersLoading ? (
            <div className="text-sm text-gray-400">Loading RSMs…</div>
          ) : (
            <select
              value={selectedRsmId}
              onChange={(e) => setSelectedRsmId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gf-teal"
            >
              <option value="">— Choose an RSM —</option>
              {rsms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.state})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Chart */}
      {!selectedRsmId && (
        <EmptyState message="Select an RSM above to see their coaching score trend." />
      )}

      {selectedRsmId && trendLoading && <SkeletonList count={4} />}

      {selectedRsmId && !trendLoading && chartData.length === 0 && (
        <EmptyState message="No completed observations for this RSM yet." />
      )}

      {selectedRsmId && !trendLoading && chartData.length > 0 && (
        <>
          <ChartCard title={`Trend for ${trendData?.rsm?.name || 'RSM'}`}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avg_score"
                  stroke="#009b8d"
                  strokeWidth={2}
                  dot={<CustomDot />}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Visit list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">Visit History</h3>
            {[...chartData].reverse().map((v) => (
              <div key={v.id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{v.date}</p>
                  <p className="text-xs text-gray-500">FSM: {v.fsm_name}</p>
                </div>
                <ScorePill score={v.avg_score} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Tab 3: Category Breakdown ───────────────────────────────────────────────

function CategoryBreakdownTab() {
  const [stateFilter, setStateFilter] = useState('')

  const queryParams = new URLSearchParams()
  if (stateFilter) queryParams.set('state', stateFilter)

  const { data, isLoading } = useQuery({
    queryKey: ['category-breakdown', stateFilter],
    queryFn: () => api.get(`/api/admin/analytics/category-breakdown?${queryParams}`),
    staleTime: 5 * 60 * 1000,
  })

  // Get distinct states from the data for the filter dropdown
  const states = useMemo(() => {
    const set = new Set((data?.breakdown || []).map((r) => r.state))
    return Array.from(set).sort()
  }, [data])

  // Aggregate rows by area_label (weighted average across states)
  const areaData = useMemo(() => {
    const breakdown = data?.breakdown || []
    const map = {}
    breakdown.forEach((row) => {
      if (!map[row.area_label]) {
        map[row.area_label] = {
          area_label: row.area_label,
          group_name: row.group_name,
          totalWeighted: 0,
          totalCount: 0,
        }
      }
      map[row.area_label].totalWeighted += Number(row.avg_score) * Number(row.score_count)
      map[row.area_label].totalCount += Number(row.score_count)
    })
    return Object.values(map)
      .map((a) => ({
        area_label: a.area_label,
        group_name: a.group_name,
        avg_score: a.totalCount > 0 ? Math.round((a.totalWeighted / a.totalCount) * 100) / 100 : 0,
      }))
      .sort((a, b) => {
        if (a.group_name !== b.group_name) return a.group_name.localeCompare(b.group_name)
        return a.area_label.localeCompare(b.area_label)
      })
  }, [data])

  // Group by group_name for rendering dividers
  const groups = useMemo(() => {
    const map = {}
    areaData.forEach((row) => {
      if (!map[row.group_name]) map[row.group_name] = []
      map[row.group_name].push(row)
    })
    return map
  }, [areaData])

  if (isLoading) return <SkeletonList count={5} />

  return (
    <div className="space-y-4">
      {/* State filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-xs font-medium text-gray-500 mb-1">Filter by State</label>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="w-full sm:w-48 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gf-teal"
        >
          <option value="">All States</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {areaData.length === 0 ? (
        <EmptyState message="No completed observations found." />
      ) : (
        Object.entries(groups).map(([groupName, rows]) => (
          <ChartCard key={groupName} title={groupName}>
            <ResponsiveContainer width="100%" height={rows.length * 48 + 20}>
              <BarChart
                layout="vertical"
                data={rows}
                margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis
                  type="category"
                  dataKey="area_label"
                  width={160}
                  tick={{ fontSize: 11, fill: '#374151' }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E5E7EB' }}
                  formatter={(value) => [Number(value).toFixed(2), 'Avg Score']}
                />
                <Bar dataKey="avg_score" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, formatter: (v) => Number(v).toFixed(1) }}>
                  {rows.map((entry) => (
                    <Cell key={entry.area_label} fill={scoreColor(entry.avg_score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Colour legend */}
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> ≥ 4.0 Strong</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 3.0–3.9 Developing</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt; 3.0 Needs work</span>
            </div>
          </ChartCard>
        ))
      )}
    </div>
  )
}

// ─── Tab 4: Trend Summary ────────────────────────────────────────────────────

function TrendSummaryTab({ data, isLoading }) {
  if (isLoading) return <SkeletonList count={6} />

  const states = data?.states || []
  const rsms   = data?.rsms   || []

  if (states.length === 0 && rsms.length === 0) {
    return <EmptyState message="Not enough data to calculate trends. At least a few weeks of observations are needed." />
  }

  return (
    <div className="space-y-4">
      {/* States */}
      {states.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">States</h3>
          <div className="space-y-2">
            {states.map((s) => (
              <div key={s.state} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stateColor(s.state) }}
                  />
                  <span className="text-sm font-medium text-gray-800">{s.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${directionStyle(s.direction)}`}>
                    {directionIcon(s.direction)}
                  </span>
                  <span className={`text-sm font-semibold capitalize ${directionStyle(s.direction)}`}>
                    {s.direction}
                  </span>
                  {s.delta != null && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({s.delta > 0 ? '+' : ''}{Number(s.delta).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RSMs */}
      {rsms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">RSMs</h3>
          <div className="space-y-2">
            {rsms.map((r) => (
              <div key={r.rsmId} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.obs_count} visit{r.obs_count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {r.obs_count < 3 && (
                    <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Low sample</span>
                  )}
                  <span className={`text-base font-bold ${directionStyle(r.direction)}`}>
                    {directionIcon(r.direction)}
                  </span>
                  <span className={`text-sm font-semibold capitalize ${directionStyle(r.direction)}`}>
                    {r.direction}
                  </span>
                  {r.delta != null && (
                    <span className="text-xs text-gray-400 ml-1">
                      ({r.delta > 0 ? '+' : ''}{Number(r.delta).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Analytics() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  // State trends (Tab 1)
  const { data: stateTrendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-state-trends'],
    queryFn: () => api.get('/api/admin/analytics/state-trends'),
    staleTime: 5 * 60 * 1000,
  })

  // Trend summary (Tab 4)
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-trend-summary'],
    queryFn: () => api.get('/api/admin/analytics/trend-summary'),
    staleTime: 5 * 60 * 1000,
  })

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-800 min-h-0"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">📈 Progress &amp; Trends</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-6 scrollbar-none">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === i
                ? 'bg-gf-teal text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 0 && (
          trendsLoading
            ? <SkeletonList count={5} />
            : <StateTrendsTab data={stateTrendsData?.trends} />
        )}
        {activeTab === 1 && <RsmDrillDownTab />}
        {activeTab === 2 && <CategoryBreakdownTab />}
        {activeTab === 3 && (
          <TrendSummaryTab data={summaryData} isLoading={summaryLoading} />
        )}
      </div>
    </Layout>
  )
}
