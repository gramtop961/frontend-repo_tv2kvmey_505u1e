import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img src="/flame-icon.svg" alt="Flames" className="w-14 h-14 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
          </div>
          <h1 className="text-3xl font-bold text-white">School Manager</h1>
          <p className="text-blue-200/80 text-sm">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const form = new URLSearchParams()
      form.append('username', email)
      form.append('password', password)
      const res = await fetch(`${API}/auth/login`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Invalid credentials')
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      nav('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout subtitle="Sign in to manage your school">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-blue-100 text-sm mb-1">Email</label>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-blue-100 text-sm mb-1">Password</label>
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-blue-200/60 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors">{loading ? 'Signing in...' : 'Sign In'}</button>
        <div className="flex justify-between text-sm text-blue-200/80">
          <Link to="/register" className="hover:text-white">Create account</Link>
          <Link to="/forgot" className="hover:text-white">Forgot password?</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

function Register() {
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error((await res.json()).detail || 'Failed to register')
      nav('/login')
    } catch (e) {
      setError(e.message)
    } finally { setLoading(false) }
  }
  return (
    <AuthLayout subtitle="Create an account">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-blue-100 text-sm mb-1">Full name</label>
          <input value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-blue-100 text-sm mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white" />
        </div>
        <div>
          <label className="block text-blue-100 text-sm mb-1">Password</label>
          <input type="password" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white" />
        </div>
        <div>
          <label className="block text-blue-100 text-sm mb-1">Role</label>
          <select value={form.role} onChange={(e)=>setForm({...form, role:e.target.value})} className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white">
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors">{loading ? 'Creating...' : 'Create account'}</button>
        <div className="text-sm text-blue-200/80 text-center">
          <Link to="/login" className="hover:text-white">Back to login</Link>
        </div>
      </form>
    </AuthLayout>
  )
}

function useAuth() {
  const token = localStorage.getItem('token')
  return { token, headers: token ? { Authorization: `Bearer ${token}` } : {} }
}

function Dashboard() {
  const nav = useNavigate()
  const { token, headers } = useAuth()
  const [me, setMe] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!token) { nav('/login'); return }
    ;(async() => {
      try {
        const annRes = await fetch(`${API}/announcements`, { headers })
        const ann = await annRes.json()
        setStats({ announcements: ann.items?.length || 0 })
      } catch {}
    })()
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="p-4 border-b border-white/10 flex items-center justify-between">
        <h1 className="font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link to="/students" className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Students</Link>
          <Link to="/attendance" className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Attendance</Link>
          <button onClick={()=>{localStorage.removeItem('token'); nav('/login')}} className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500">Logout</button>
        </div>
      </header>
      <main className="p-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-sm text-blue-200/80">Announcements</p>
            <p className="text-3xl font-bold">{stats?.announcements ?? 0}</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-sm text-blue-200/80">Students</p>
            <p className="text-3xl font-bold">—</p>
          </div>
          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-sm text-blue-200/80">Attendance</p>
            <p className="text-3xl font-bold">—</p>
          </div>
        </div>
      </main>
    </div>
  )
}

function StudentsPage() {
  const { headers } = useAuth()
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', grade: '' })

  const load = async () => {
    setLoading(true)
    const res = await fetch(`${API}/students?q=${encodeURIComponent(q)}`, { headers })
    const data = await res.json()
    setItems(data.items || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const add = async (e) => {
    e.preventDefault()
    await fetch(`${API}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(form) })
    setForm({ first_name: '', last_name: '', email: '', grade: '' })
    load()
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="p-4 border-b border-white/10 flex items-center justify-between">
        <Link to="/dashboard" className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Back</Link>
        <h1 className="font-semibold">Students</h1>
        <div />
      </header>
      <main className="p-6 space-y-6">
        <form onSubmit={add} className="bg-white/5 p-4 rounded-xl border border-white/10 grid sm:grid-cols-4 gap-3">
          <input value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})} placeholder="First name" className="px-3 py-2 rounded bg-white/10 border border-white/10" />
          <input value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})} placeholder="Last name" className="px-3 py-2 rounded bg-white/10 border border-white/10" />
          <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Email" className="px-3 py-2 rounded bg-white/10 border border-white/10" />
          <input value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})} placeholder="Grade" className="px-3 py-2 rounded bg-white/10 border border-white/10" />
          <button className="sm:col-span-4 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded">Add Student</button>
        </form>

        <div className="flex items-center gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search..." className="px-3 py-2 rounded bg-white/10 border border-white/10" />
          <button onClick={load} className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded">Search</button>
        </div>

        <div className="grid gap-3">
          {loading ? <p>Loading...</p> : items.map(s => (
            <div key={s.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between">
              <div>
                <p className="font-medium">{s.first_name} {s.last_name}</p>
                <p className="text-sm text-blue-200/80">{s.email || '—'} • Grade {s.grade || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function AttendancePage() {
  const { headers } = useAuth()
  const [students, setStudents] = useState([])
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0,10))
  const [records, setRecords] = useState({})
  useEffect(() => { (async() => {
    const res = await fetch(`${API}/students`, { headers })
    const data = await res.json()
    setStudents(data.items || [])
  })() }, [])

  const toggle = (id, status) => setRecords(r => ({ ...r, [id]: status }))

  const save = async () => {
    const payload = {
      date: dateStr,
      records: students.map(s => ({ student_id: s.id, status: records[s.id] || 'present' }))
    }
    await fetch(`${API}/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(payload) })
    alert('Attendance saved')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="p-4 border-b border-white/10 flex items-center justify-between">
        <Link to="/dashboard" className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">Back</Link>
        <h1 className="font-semibold">Attendance</h1>
        <div />
      </header>
      <main className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-blue-200/80">Date</label>
          <input type="date" value={dateStr} onChange={e=>setDateStr(e.target.value)} className="px-3 py-2 rounded bg-white/10 border border-white/10" />
          <button onClick={save} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">Save</button>
        </div>

        <div className="grid gap-3">
          {students.map(s => (
            <div key={s.id} className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <p className="font-medium">{s.first_name} {s.last_name}</p>
                <p className="text-sm text-blue-200/80">Grade {s.grade || '—'}</p>
              </div>
              <div className="flex gap-2">
                {['present','absent','late'].map(st => (
                  <button key={st} onClick={()=>toggle(s.id, st)} className={`px-3 py-1 rounded ${records[s.id]===st ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}>{st}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/dashboard" element={<Dashboard/>} />
        <Route path="/students" element={<StudentsPage/>} />
        <Route path="/attendance" element={<AttendancePage/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter
