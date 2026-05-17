import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const emptyTextForm = {
  projectName: '',
  context: '',
  role: '',
  tools: '',
  process: '',
  result: '',
  currentText: '',
}
const checklist = [
  'Eigen rol is duidelijk',
  'Gebruikte tools worden vermeld',
  'Proces en keuzes zijn zichtbaar',
  'Eindresultaat is concreet',
  'Tekst blijft persoonlijk en eerlijk',
]

function App() {
  const [activeTab, setActiveTab] = useState('text')
  const [textForm, setTextForm] = useState(emptyTextForm)
  const [tone, setTone] = useState('professioneel')
  const [target, setTarget] = useState('portfolio')
  const [length, setLength] = useState('middellang')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const contextScore = useMemo(() => {
    const required = ['context', 'role', 'tools', 'process', 'result']
    const filled = required.filter((field) => textForm[field].trim().length > 8)
    return Math.round((filled.length / required.length) * 100)
  }, [textForm])

  function updateField(field, value) {
    setTextForm((current) => ({ ...current, [field]: value }))
  }
function fillExample() {
    setTextForm({
      projectName: 'Basisschool Nieuwland website',
      context: 'Een nieuwe website voor een basisschool in Brussel die ouders sneller informatie laat vinden.',
      role: 'Ik werkte aan de frontend, navigatiestructuur, visuele stijl en responsive pagina’s.',
      tools: 'HTML, CSS, JavaScript, Figma en GitHub.',
      process: 'We onderzochten de noden van ouders en leerkrachten, maakten wireframes en bouwden daarna interactieve pagina’s.',
      result: 'Een duidelijke, warme en toegankelijke website met betere navigatie en overzichtelijke informatie.',
      currentText: 'Ik maakte met mijn team een website voor een basisschool. De website is duidelijk en werkt op verschillende schermen.',
    })
  }

  async function requestJson(endpoint, options) {
    const response = await fetch(`${API_URL}${endpoint}`, options)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Er ging iets mis.')
    return data
  }

  async function requestJson(endpoint, options) {
    const response = await fetch(`${API_URL}${endpoint}`, options)
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Er ging iets mis.')
    return data
  }

  async function analyzeText() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await requestJson('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...textForm, tone, target, contextScore }),
      })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
   async function rewriteText() {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await requestJson('/api/rewrite-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...textForm, tone, target, length }),
      })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


export default App
