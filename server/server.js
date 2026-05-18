import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import OpenAI from 'openai'

//laadt de .env file in zodat we API keys kunnen gebruiken
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

//checkt of er echt een OpenAI API key aanwezig is
const hasApiKey = Boolean(
  process.env.OPENAI_API_KEY &&
  !process.env.OPENAI_API_KEY.includes('your_api_key')
)

//wulter wordt gebruikt om afbeeldingen tijdelijk in het geheugen te zetten
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    //max 5 MB upload 
    fileSize: 5 * 1024 * 1024,
  },
})

//Maakt enkel een OpenAI client als er een API key is
const client = hasApiKey
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

//Laat frontend en backend met elkaar praten
app.use(cors())

//zorgt dat de server JSON-data kan lezen(limit1mb)
app.use(express.json({ limit: '1mb' }))

// Simpele route om te testen of de server werkt
app.get('/', (req, res) => {
  res.json({
    name: 'PortfoliAI Coach API',
    status: 'running',
    aiMode: hasApiKey ? 'OpenAI' : 'local demo fallback',
  })
})

// route om portfolio-tekst te analyseren
app.post('/api/analyze-text', async (req, res) => {
  try {
    // Maakt de input proper en veilig korter
    const portfolio = normalizePortfolioInput(req.body)

    // zonder API key gebruikt hij demo-feedback
    if (!hasApiKey) {
      return res.json(localTextAnalysis(portfolio))
    }

    // Stuurt de portfolio-info naar OpenAI
    const response = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
Je bent PortfoliAI Coach, een AI-coach voor studenten en junior designers/developers.
Je analyseert portfolio-teksten kritisch maar behulpzaam.
Je houdt rekening met privacy, plagiaat, bias en eerlijkheid: de gebruiker mag geen prestaties verzinnen.
Geef feedback als suggestie, niet als absolute waarheid.
Focus op: duidelijke projectcontext, eigen rol, gebruikte tools, proces, eindresultaat, professionele maar persoonlijke toon.
Antwoord altijd in geldig JSON-formaat.
          `.trim(),
        },
        {
          role: 'user',
          content: `
Analyseer deze portfolio-input.

Projectnaam: ${portfolio.projectName}
Context: ${portfolio.context}
Mijn rol: ${portfolio.role}
Tools: ${portfolio.tools}
Proces: ${portfolio.process}
Resultaat: ${portfolio.result}
Huidige tekst: ${portfolio.currentText}
Gewenste toon: ${portfolio.tone}
Doelcontext: ${portfolio.target}
Contextscore frontend: ${portfolio.contextScore}%

Geef JSON terug met exact deze structuur:
{
  "score": number,
  "status": string,
  "message": string,
  "strengths": string[],
  "missingParts": string[],
  "problems": string[],
  "suggestions": string[],
  "priorityFixes": string[],
  "improvedText": string
}
          `.trim(),
        },
      ],
    })

    // Zet het AI-antwoord om naar JSON
    res.json(parseJsonResponse(response, localTextAnalysis(portfolio)))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Er ging iets mis bij de tekstanalyse.' })
  }
})

// Route om bestaande portfolio-tekst te herwerken
app.post('/api/rewrite-text', async (req, res) => {
  try {
    const portfolio = normalizePortfolioInput(req.body)

    // Checkt of er genoeg input is om te herwerken
    if (!portfolio.currentText && !portfolio.context) {
      return res.status(400).json({
        error: 'Vul eerst een bestaande tekst of projectcontext in.',
      })
    }

    // Zonder API key wordt een lokale demo-versie gebruikt
    if (!hasApiKey) {
      return res.json(localRewrite(portfolio))
    }

    // vraagt aan OpenAI om de tekst te herschrijven
    const response = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
Je bent PortfoliAI Coach. Herwerk portfolio-teksten zonder prestaties te verzinnen.
Behoud de persoonlijke stijl van de gebruiker en maak duidelijk welke info ontbreekt.
Antwoord altijd in geldig JSON-formaat.
          `.trim(),
        },
        {
          role: 'user',
          content: `
Herwerk deze portfolio-tekst voor ${portfolio.target}.
Toon: ${portfolio.tone}
Lengte: ${portfolio.length}

Projectnaam: ${portfolio.projectName}
Context: ${portfolio.context}
Mijn rol: ${portfolio.role}
Tools: ${portfolio.tools}
Proces: ${portfolio.process}
Resultaat: ${portfolio.result}
Huidige tekst: ${portfolio.currentText}

Geef JSON terug met exact deze structuur:
{
  "score": number,
  "status": string,
  "strengths": string[],
  "missingParts": string[],
  "suggestions": string[],
  "improvedText": string
}
          `.trim(),
        },
      ],
    })

    res.json(parseJsonResponse(response, localRewrite(portfolio)))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Er ging iets mis bij het herwerken van de tekst.' })
  }
})

//route om een portfolio-screenshot te analyseren
app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    //checkt of er wel een bestand is geüpload
    if (!req.file) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen.' })
    }

    //checkt of het bestand echt een afbeelding is
    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Upload een geldig afbeeldingsbestand.' })
    }

    //zonder API key geeft hij demo-feedback
    if (!hasApiKey) {
      return res.json(localImageAnalysis(req.file))
    }

    //zet de afbeelding om naar base64 zodat OpenAI ze kan lezen
    const base64Image = req.file.buffer.toString('base64')
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`

    //stuurt de screenshot naar OpenAI voor visuele analyse
    const response = await client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
Je bent PortfoliAI Coach, een AI-coach die portfolio-screenshots analyseert.
Geef concrete UX- en designfeedback voor studenten en junior makers.
Let op visuele hiërarchie, layout, typografie, contrast, leesbaarheid, projectpresentatie, call-to-action, professionaliteit en ontbrekende info.
Vermeld dat feedback een suggestie is en geen absolute beoordeling.
Antwoord altijd in geldig JSON-formaat.
          `.trim(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `
Analyseer deze portfolio-screenshot voor context: ${req.body.target || 'portfolio'}.
Gewenste toon: ${req.body.tone || 'professioneel'}.

Geef JSON terug met exact deze structuur:
{
  "score": number,
  "firstImpression": string,
  "strengths": string[],
  "designProblems": string[],
  "missingParts": string[],
  "suggestions": string[],
  "priorityFixes": string[]
}
              `.trim(),
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    })

    res.json(parseJsonResponse(response, localImageAnalysis(req.file)))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Er ging iets mis bij de beeldanalyse.' })
  }
})

//Error handler voor multer, bijvoorbeeld als bestand te groot is
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'De afbeelding is te groot. Gebruik maximaal 5 MB.',
    })
  }

  next(error)
})

//start de server op de juiste poort
app.listen(PORT, () => {
  console.log(`PortfoliAI Coach API running on http://localhost:${PORT}`)
})

//Maakt alle input proper en geeft standaardwaarden
function normalizePortfolioInput(body) {
  return {
    projectName: clean(body.projectName),
    context: clean(body.context),
    role: clean(body.role),
    tools: clean(body.tools),
    process: clean(body.process),
    result: clean(body.result),
    currentText: clean(body.currentText),
    tone: clean(body.tone || 'professioneel'),
    target: clean(body.target || 'portfolio'),
    length: clean(body.length || 'middellang'),
    contextScore: Number(body.contextScore || 0),
  }
}

//Zet input om naar tekst, verwijdert spaties en beperkt de lengte
function clean(value) {
  return String(value || '').trim().slice(0, 4000)
}

//probeert het AI-antwoord als JSON te lezen
function parseJsonResponse(response, fallback) {
  try {
    const content = response.choices?.[0]?.message?.content
    const parsed = JSON.parse(content)

    return normalizeApiResult(parsed, fallback)
  } catch (error) {
    // Als JSON fout is, gebruikt hij de demo-feedback
    console.error('Kon JSON niet parsen, fallback wordt gebruikt.', error)
    return fallback
  }
}

//controleert of het AI-resultaat bruikbaar is== json
function normalizeApiResult(result, fallback) {
  if (!result || typeof result !== 'object') {
    return fallback
  }

  const normalizedScore = normalizeScore(result.score)

  return {
    ...result,
    score: normalizedScore ?? fallback.score,
  }
}

// Zet verschillende score-formaten om naar een score op 100
function normalizeScore(rawScore) {
  if (typeof rawScore === 'number' && Number.isFinite(rawScore)) {
    // Als score op 10 is, wordt die omgezet naar 100
    if (rawScore >= 0 && rawScore <= 10) {
      return Math.round(rawScore * 10)
    }

    return clamp(Math.round(rawScore), 0, 100)
  }

  if (typeof rawScore === 'string') {
    const trimmed = rawScore.trim()
    const fractionMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*(10|100)$/)

    // Herkent scores zoals "8/10" of "75/100"
    if (fractionMatch) {
      const value = Number(fractionMatch[1])
      const scale = Number(fractionMatch[2])
//clamp = kan niet onder 0 of boven 100, als score op 10 is naar 100 en etc.
      if (Number.isFinite(value)) {
        return scale === 10
          ? clamp(Math.round(value * 10), 0, 100)
          : clamp(Math.round(value), 0, 100)
      }
    }

    // Probeert een gewone tekstscore naar een nummer om te zetten
    const numericValue = Number(trimmed.replace(',', '.'))

    if (Number.isFinite(numericValue)) {
      return normalizeScore(numericValue)
    }
  }

  return null
}

//lokale demo-analyse als er geen API key is
function localTextAnalysis(portfolio) {
  const missingParts = getMissingParts(portfolio)
  const baseScore = 100 - missingParts.length * 13
  const textBonus = portfolio.currentText.length > 180 ? 8 : 0
  const score = clamp(baseScore + textBonus, 20, 88)

  return {
    score,
    status:
      score < 55
        ? 'Te weinig context'
        : score < 75
          ? 'Bruikbaar, maar nog te algemeen'
          : 'Sterke basis met verbeterpunten',
    message: hasApiKey
      ? 'Analyse afgerond.'
      : 'Demo-feedback: voeg een OPENAI_API_KEY toe voor echte AI-analyse.',
    strengths: [
      portfolio.projectName
        ? 'Het project heeft een duidelijke naam.'
        : 'De tool kan al basisfeedback geven op je input.',
      portfolio.context
        ? 'De projectcontext is aanwezig.'
        : 'De structuur maakt zichtbaar welke informatie ontbreekt.',
      portfolio.result
        ? 'Het eindresultaat wordt vermeld.'
        : 'De feedback helpt om concreter te worden.',
    ],
    missingParts,
    problems: [
      missingParts.length > 0
        ? 'De tekst mist nog belangrijke context en kan daardoor algemeen klinken.'
        : 'De informatie is aanwezig, maar kan nog sterker geformuleerd worden.',
      'Controleer of je eigen bijdrage eerlijk en concreet wordt beschreven.',
    ],
    suggestions: [
      'Beschrijf wat jij zelf hebt ontworpen, gebouwd of beslist.',
      'Vermeld tools en technologieën alleen als ze relevant zijn voor het project.',
      'Gebruik concrete resultaten in plaats van algemene woorden zoals “mooi” of “goed”.',
    ],
    priorityFixes: missingParts.slice(0, 3),
    improvedText: buildImprovedText(portfolio),
  }
}

// Lokale demo-herschrijving als er geen API key is
function localRewrite(portfolio) {
  const missingParts = getMissingParts(portfolio)

  return {
    score: clamp(82 - missingParts.length * 8, 35, 84),
    status: 'Herwerkte demo-versie',
    strengths: [
      'De tekst is herschreven met een duidelijkere structuur.',
      'De toon is aangepast aan de gekozen context.',
    ],
    missingParts,
    suggestions: [
      'Voeg ontbrekende informatie toe voor een persoonlijkere versie.',
      'Laat overdreven claims weg en blijf eerlijk over je rol.',
    ],
    improvedText: buildImprovedText(portfolio),
  }
}

// Lokale demo-feedback voor een afbeelding
function localImageAnalysis(file) {
  return {
    score: 68,
    firstImpression: `Demo-feedback voor ${file.originalname}: de screenshot werd ontvangen, maar zonder API-key kan de inhoud niet echt visueel geanalyseerd worden.`,
    strengths: [
      'De upload werkt en bestanden worden niet lokaal opgeslagen.',
      'De analyse focust op portfolio-criteria in plaats van algemene AI-output.',
    ],
    designProblems: [
      'Controleer of de visuele hiërarchie duidelijk is.',
      'Let op contrast, leesbaarheid en voldoende witruimte.',
      'Zorg dat projectkaarten niet alleen mooi zijn, maar ook inhoudelijk duidelijk.',
    ],
    missingParts: [
      'Eigen rol per project',
      'Gebruikte tools',
      'Duidelijke call-to-action',
      'Contactmogelijkheid',
    ],
    suggestions: [
      'Voeg per project een korte rolbeschrijving toe.',
      'Maak de belangrijkste knop visueel sterker.',
      'Gebruik consistente typografie en voldoende spacing.',
    ],
    priorityFixes: [
      'Maak je eigen bijdrage zichtbaar.',
      'Verbeter scanbaarheid.',
      'Voeg duidelijke contactactie toe.',
    ],
  }
}

//checkt welke belangrijke portfolio-info ontbreekt
function getMissingParts(portfolio) {
  const checks = [
    ['Projectcontext', portfolio.context],
    ['Eigen rol', portfolio.role],
    ['Gebruikte tools', portfolio.tools],
    ['Proces', portfolio.process],
    ['Eindresultaat', portfolio.result],
  ]

  //alles onder 12 tekens wordt gezien als te weinig info
  return checks
    .filter(([, value]) => value.length < 12)
    .map(([label]) => label)
}

//bouwt een verbeterde portfolio-tekst met de ingevulde info
function buildImprovedText(portfolio) {
  const name = portfolio.projectName || 'Dit project'
  const context =
    portfolio.context ||
    'werd ontwikkeld om een duidelijk probleem of doel aan te pakken'
  const role =
    portfolio.role ||
    'Mijn rol moet nog concreter beschreven worden'
  const tools =
    portfolio.tools ||
    'de gebruikte tools moeten nog worden toegevoegd'
  const process =
    portfolio.process ||
    'Het proces kan nog duidelijker uitgelegd worden'
  const result =
    portfolio.result ||
    'Het eindresultaat moet nog concreet gemaakt worden'

  return `${name} is een project dat ${context}. ${role}. Tijdens het project werkte ik met ${tools}. ${process}. Het resultaat is ${result}. Deze tekst kan sterker worden door meer persoonlijke keuzes, concrete resultaten en eerlijke details over mijn eigen bijdrage toe te voegen.`
}

// Zorgt dat een getal nooit lager of hoger gaat dan de limieten
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}