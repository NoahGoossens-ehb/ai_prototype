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
 async function analyzeImage() {
    if (!image) {
      setError('Upload eerst een screenshot van je portfolio.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('tone', tone)
      formData.append('target', target)

      const data = await requestJson('/api/analyze-image', {
        method: 'POST',
        body: formData,
      })
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0]
    setImage(file || null)
    setResult(null)
    setError('')

    if (file) {
      setImagePreview(URL.createObjectURL(file))
    } else {
      setImagePreview('')
    }
  }
   return (
    <main className="app-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">AI Portfolio Coach</p>
          <h1>Maak je portfolio duidelijker, eerlijker en professioneler.</h1>
          <p className="hero-text">
            PortfoliAI Coach analyseert portfolio-teksten en screenshots. De tool geeft feedback op
            structuur, eigen rol, gebruikte tools, proces, resultaat en visuele presentatie.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={fillExample}>Vul voorbeeld in</button>
            <a className="ghost-button" href="#workspace">Start analyse</a>
          </div>
        </div>

        <div className="hero-card" aria-label="Quick scan samenvatting">
          <span className="card-label">Quick scan verwerkt</span>
          <h2>Coach, geen vervanger</h2>
          <p>
            De AI geeft suggesties, bewaart geen input in dit prototype en waarschuwt tegen plagiaat,
            privacyrisico’s en overdreven claims.
          </p>
          <div className="warm-glow" />
        </div>
      </section>

      <section className="notice-grid">
        <article className="notice-card">
          <strong>Privacy</strong>
          <span>Upload geen gevoelige data. Input wordt enkel gebruikt voor deze analyse.</span>
        </article>
        <article className="notice-card">
          <strong>Eerlijk gebruik</strong>
          <span>Gebruik alleen eigen werk of werk waarvoor je toestemming hebt.</span>
        </article>
        <article className="notice-card">
          <strong>Duurzaam</strong>
          <span>De tool analyseert pas na je klik, zodat er geen onnodige AI-aanvragen gebeuren.</span>
        </article>
      </section>

      <section id="workspace" className="workspace">
        <div className="tabs" role="tablist" aria-label="Analyse opties">
          <button className={activeTab === 'text' ? 'active' : ''} onClick={() => setActiveTab('text')}>Tekst analyseren</button>
          <button className={activeTab === 'rewrite' ? 'active' : ''} onClick={() => setActiveTab('rewrite')}>Tekst herwerken</button>
          <button className={activeTab === 'image' ? 'active' : ''} onClick={() => setActiveTab('image')}>Screenshot analyseren</button>
        </div>

        <div className="tool-layout">
          <section className="panel input-panel">
            <div className="panel-heading">
              <p className="eyebrow">Input</p>
              <h2>{activeTab === 'image' ? 'Upload je portfolio-screenshot' : 'Geef genoeg context mee'}</h2>
            </div>

            <div className="settings-row">
              <label>
                Tone of voice
                <select value={tone} onChange={(event) => setTone(event.target.value)}>
                  <option value="professioneel">Professioneel</option>
                  <option value="creatief">Creatief</option>
                  <option value="kort en direct">Kort en direct</option>
                  <option value="persoonlijk">Persoonlijk</option>
                </select>
              </label>
              <label>
                Context
                <select value={target} onChange={(event) => setTarget(event.target.value)}>
                  <option value="portfolio">Portfolio</option>
                  <option value="stage">Stage</option>
                  <option value="sollicitatie">Sollicitatie</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="GitHub README">GitHub README</option>
                </select>
              </label>
              {activeTab === 'rewrite' && (
                <label>
                  Lengte
                  <select value={length} onChange={(event) => setLength(event.target.value)}>
                    <option value="kort">Kort</option>
                    <option value="middellang">Middellang</option>
                    <option value="uitgebreid">Uitgebreid</option>
                  </select>
                </label>
              )}
            </div>

            {activeTab !== 'image' ? (
              <>
                <label>
                  Projectnaam
                  <input value={textForm.projectName} onChange={(event) => updateField('projectName', event.target.value)} placeholder="Bijvoorbeeld: Portfolio website" />
                </label>
                <label>
                  Projectcontext
                  <textarea value={textForm.context} onChange={(event) => updateField('context', event.target.value)} placeholder="Wat was het project en voor wie was het bedoeld?" />
                </label>
                <label>
                  Mijn rol
                  <textarea value={textForm.role} onChange={(event) => updateField('role', event.target.value)} placeholder="Wat heb jij zelf gedaan?" />
                </label>
                <label>
                  Tools en technologieën
                  <input value={textForm.tools} onChange={(event) => updateField('tools', event.target.value)} placeholder="React, Figma, CSS, JavaScript..." />
                </label>
                <label>
                  Proces
                  <textarea value={textForm.process} onChange={(event) => updateField('process', event.target.value)} placeholder="Welke stappen heb je gevolgd?" />
                </label>
                <label>
                  Eindresultaat
                  <textarea value={textForm.result} onChange={(event) => updateField('result', event.target.value)} placeholder="Wat was het concrete resultaat?" />
                </label>
                <label>
                  Bestaande portfolio-tekst
                  <textarea className="large-textarea" value={textForm.currentText} onChange={(event) => updateField('currentText', event.target.value)} placeholder="Plak hier je huidige tekst of eerste versie." />
                </label>

                <div className="score-box">
                  <div>
                    <strong>Contextscore</strong>
                    <span>{contextScore}% ingevuld</span>
                  </div>
                  <progress value={contextScore} max="100" />
                </div>

                <button className="primary-button full" disabled={loading} onClick={activeTab === 'rewrite' ? rewriteText : analyzeText}>
                  {loading ? 'AI analyseert...' : activeTab === 'rewrite' ? 'Herwerk tekst' : 'Analyseer tekst'}
                </button>
              </>
            ) : (
              <>
                <label className="upload-box">
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageChange} />
                  <span>{image ? image.name : 'Kies een screenshot van je portfolio'}</span>
                </label>

                {imagePreview && <img className="preview-image" src={imagePreview} alt="Voorbeeld van geüploade portfolio screenshot" />}

                <ul className="checklist">
                  {checklist.map((item) => <li key={item}>{item}</li>)}
                </ul>

                <button className="primary-button full" disabled={loading} onClick={analyzeImage}>
                  {loading ? 'Screenshot wordt geanalyseerd...' : 'Analyseer screenshot'}
                </button>
              </>
            )}

            {error && <p className="error-message">{error}</p>}
          </section>

          <ResultPanel result={result} loading={loading} />
        </div>
      </section>
    </main>
  )
}
function ResultPanel({ result, loading }) {
  if (loading) {
    return (
      <section className="panel result-panel loading-panel">
        <div className="loader" />
        <h2>Feedback wordt opgebouwd</h2>
        <p>De AI controleert inhoud, structuur, eerlijkheid, ontbrekende context en bruikbaarheid.</p>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="panel result-panel empty-state">
        <p className="eyebrow">Output</p>
        <h2>Je feedback verschijnt hier.</h2>
        <p>
          De output wordt bewust opgesplitst in score, sterktes, problemen, ontbrekende info en
          prioritaire verbeteringen. Zo blijft de feedback bruikbaar en niet te algemeen.
        </p>
      </section>
    )
  }


export default App
