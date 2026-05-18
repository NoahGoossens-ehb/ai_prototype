import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import OpenAI from 'openai'


dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
const hasApiKey = Boolean(process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_api_key'))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

const client = hasApiKey
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/', (req, res) => {
  res.json({
    name: 'PortfoliAI Coach API',
    status: 'running',
    aiMode: hasApiKey ? 'OpenAI' : 'local demo fallback',
  })
})

app.post('/api/analyze-text', async (req, res) => {
  try {
    const portfolio = normalizePortfolioInput(req.body)

    if (!hasApiKey) {
      return res.json(localTextAnalysis(portfolio))
    }

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

    res.json(parseJsonResponse(response, localTextAnalysis(portfolio)))
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Er ging iets mis bij de tekstanalyse.' })
  }
})

app.post('/api/rewrite-text', async (req, res) => {
  try {
    const portfolio = normalizePortfolioInput(req.body)

    if (!portfolio.currentText && !portfolio.context) {
      return res.status(400).json({ error: 'Vul eerst een bestaande tekst of projectcontext in.' })
    }

    if (!hasApiKey) {
      return res.json(localRewrite(portfolio))
    }

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


app.post('/api/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Geen afbeelding ontvangen.' })
    }

    if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ error: 'Upload een geldig afbeeldingsbestand.' })
    }

    if (!hasApiKey) {
      return res.json(localImageAnalysis(req.file))
    }

    const base64Image = req.file.buffer.toString('base64')
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`

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
