interface SpamRule {
  name: string
  score: number
  test: (html: string, text: string, subject: string) => boolean
}

interface SpamCheckResult {
  score: number
  max_score: number
  passed: boolean
  rules: { name: string; triggered: boolean; score: number }[]
}

const MAX_SPAM_SCORE = 10

const RULES: SpamRule[] = [
  {
    name: "Excessive capitalization",
    score: 1,
    test: (_html, _text, subject) => {
      const upper = (subject || "").replace(/[^A-Z]/g, "").length
      const total = (subject || "").replace(/[^A-Za-z]/g, "").length
      return total > 0 && upper / total > 0.5
    },
  },
  {
    name: "Multiple exclamation marks",
    score: 1,
    test: (_html, _text, subject) => /!{2,}/.test(subject || ""),
  },
  {
    name: "Money-related words",
    score: 1.5,
    test: (html, text) => {
      const content = `${html} ${text}`.toLowerCase()
      return /\b(free|win|winner|cash|prize|earn|discount|limited time|act now|buy now)\b/.test(content)
    },
  },
  {
    name: "Suspicious links",
    score: 1.5,
    test: (html) => {
      const suspiciousPatterns = /bit\.ly|tinyurl|shorturl|shorte\.st|short\.link|click here|subscribe now/i
      return suspiciousPatterns.test(html || "")
    },
  },
  {
    name: "Excessive use of bold/red",
    score: 1,
    test: (html) => {
      const boldCount = (html || "").match(/<strong>/gi)?.length || 0
      const redCount = (html || "").match(/color\s*=\s*["']?#?ff0000["']?/gi)?.length || 0
      return boldCount > 3 || redCount > 2
    },
  },
  {
    name: "All-caps words",
    score: 0.5,
    test: (_html, text) => {
      const words = (text || "").split(/\s+/)
      const capsWords = words.filter((w) => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w))
      return capsWords.length > 3
    },
  },
  {
    name: "Low text-to-HTML ratio",
    score: 1,
    test: (html, text) => {
      if (!html || !text) return false
      return text.length < 50 && html.length > 500
    },
  },
  {
    name: "Too many images, too little text",
    score: 1,
    test: (html, text) => {
      if (!html) return false
      const imgCount = (html.match(/<img/gi) || []).length
      return imgCount > 3 && (text || "").length < 100
    },
  },
  {
    name: "Urgency language",
    score: 1,
    test: (_html, _text, subject) => {
      const urgencyWords = /\b(urgent|immediate|limited|expires|last chance|don't miss|hurry|ending soon)\b/i
      return urgencyWords.test(subject || "")
    },
  },
  {
    name: "Excessive use of different font sizes/colors",
    score: 0.5,
    test: (html) => {
      if (!html) return false
      const fontTags = (html.match(/<font[^>]*>/gi) || []).length
      const styleWithSize = (html.match(/font-size\s*:/gi) || []).length
      return fontTags > 3 || styleWithSize > 5
    },
  },
]

export function checkSpam(html: string, text: string, subject: string): SpamCheckResult {
  const triggered = RULES.map((rule) => {
    const triggered = rule.test(html, text, subject)
    return { name: rule.name, triggered, score: triggered ? rule.score : 0 }
  })

  const score = triggered.reduce((sum, r) => sum + r.score, 0)

  return {
    score,
    max_score: MAX_SPAM_SCORE,
    passed: score < 5,
    rules: triggered,
  }
}
