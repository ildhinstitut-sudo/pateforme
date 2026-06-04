import { Admin } from './pages/Admin'
import { Home } from './pages/Home'
import { StudentForm } from './pages/StudentForm'
import './styles.css'

export default function App() {
  const path = window.location.pathname
  if (path.startsWith('/admin')) return <Admin />
  if (path.startsWith('/formulaire')) return <StudentForm />
  return <Home />
}
