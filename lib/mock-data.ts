export type CallStatus = "processing" | "ready" | "needs_attention" | "completed"
export type ConfidenceLevel = "high" | "medium" | "low"

export interface Call {
  id: string
  agentName: string
  agentAvatar?: string
  customerName: string
  date: string
  duration: string
  status: CallStatus
  overallScore: number
  flaggedItems: number
  categories: ScoreCategory[]
  transcript: TranscriptEntry[]
  summary: string
  keyMoments: KeyMoment[]
  sentiment: SentimentData
}

export interface ScoreCategory {
  id: string
  name: string
  score: number
  maxScore: number
  confidence: ConfidenceLevel
  justification: string
  timestamp?: string
  flagged: boolean
  qaOverride?: number
  qaNote?: string
}

export interface TranscriptEntry {
  id: string
  speaker: "agent" | "customer"
  text: string
  timestamp: string
  flagged: boolean
  relatedCategory?: string
  sentiment?: "positive" | "neutral" | "negative"
}

export interface KeyMoment {
  id: string
  title: string
  timestamp: string
  description: string
  type: "positive" | "negative" | "neutral"
}

export interface SentimentData {
  overall: "positive" | "neutral" | "negative"
  agentTone: number
  customerSatisfaction: number
  escalationRisk: "low" | "medium" | "high"
}

export const mockCalls: Call[] = [
  {
    id: "call-001",
    agentName: "Marcus Chen",
    customerName: "Sarah Williams",
    date: "2026-01-24",
    duration: "12:34",
    status: "needs_attention",
    overallScore: 78,
    flaggedItems: 3,
    summary: "Customer called regarding a billing discrepancy on their monthly statement. Agent identified an overcharge of $45.99 due to a system error. The issue was resolved with a credit applied to the next billing cycle. Customer expressed initial frustration but was satisfied with the resolution.",
    sentiment: {
      overall: "positive",
      agentTone: 82,
      customerSatisfaction: 75,
      escalationRisk: "low"
    },
    keyMoments: [
      { id: "km-1", title: "Issue Identified", timestamp: "02:15", description: "Agent correctly identified billing error", type: "positive" },
      { id: "km-2", title: "Customer Frustration", timestamp: "04:30", description: "Customer expressed frustration about recurring issues", type: "negative" },
      { id: "km-3", title: "Resolution Offered", timestamp: "08:45", description: "Credit applied and explanation provided", type: "positive" },
    ],
    categories: [
      { id: "cat-1", name: "Greeting & Introduction", score: 9, maxScore: 10, confidence: "high", justification: "Agent properly introduced themselves and the company, verified customer identity efficiently.", flagged: false },
      { id: "cat-2", name: "Active Listening", score: 7, maxScore: 10, confidence: "medium", justification: "Agent acknowledged customer concerns but interrupted twice during the explanation. Timestamp 04:30 shows overlapping speech.", flagged: true, timestamp: "04:30" },
      { id: "cat-3", name: "Problem Resolution", score: 8, maxScore: 10, confidence: "high", justification: "Issue was resolved effectively with appropriate compensation offered.", flagged: false },
      { id: "cat-4", name: "Product Knowledge", score: 9, maxScore: 10, confidence: "high", justification: "Agent demonstrated strong understanding of billing system and policies.", flagged: false },
      { id: "cat-5", name: "Empathy & Rapport", score: 6, maxScore: 10, confidence: "low", justification: "Limited empathy shown during customer's initial frustration. Consider more acknowledgment of customer feelings at 03:15.", flagged: true, timestamp: "03:15" },
      { id: "cat-6", name: "Call Closure", score: 7, maxScore: 10, confidence: "medium", justification: "Proper summary provided but could have confirmed customer satisfaction more explicitly.", flagged: true, timestamp: "11:50" },
    ],
    transcript: [
      { id: "t-1", speaker: "agent", text: "Thank you for calling TechSupport, my name is Marcus. How can I help you today?", timestamp: "00:05", flagged: false, sentiment: "neutral" },
      { id: "t-2", speaker: "customer", text: "Hi Marcus, I'm calling about my bill. I was charged way more than usual this month and I don't understand why.", timestamp: "00:12", flagged: false, sentiment: "negative" },
      { id: "t-3", speaker: "agent", text: "I'm sorry to hear that. Let me pull up your account right away. Can you please verify your account number?", timestamp: "00:25", flagged: false, sentiment: "neutral" },
      { id: "t-4", speaker: "customer", text: "Yes, it's 4521-8899. I've been a customer for 3 years and this has never happened before.", timestamp: "00:35", flagged: false, sentiment: "negative" },
      { id: "t-5", speaker: "agent", text: "I can see your account now, Mrs. Williams. Let me review your recent charges.", timestamp: "00:50", flagged: false, sentiment: "neutral" },
      { id: "t-6", speaker: "customer", text: "This is really frustrating because I specifically asked about my plan last month and was told nothing would change.", timestamp: "03:15", flagged: true, relatedCategory: "cat-5", sentiment: "negative" },
      { id: "t-7", speaker: "agent", text: "I understand. Looking at your bill, I can see there's an additional charge of $45.99 that appears to be incorrect.", timestamp: "03:30", flagged: false, sentiment: "neutral" },
      { id: "t-8", speaker: "customer", text: "So it is a mistake? I knew something was wrong—", timestamp: "04:25", flagged: false, sentiment: "neutral" },
      { id: "t-9", speaker: "agent", text: "Yes, this looks like a system error on our end. I apologize for the inconvenience.", timestamp: "04:30", flagged: true, relatedCategory: "cat-2", sentiment: "neutral" },
      { id: "t-10", speaker: "customer", text: "Okay, so what happens now?", timestamp: "04:45", flagged: false, sentiment: "neutral" },
      { id: "t-11", speaker: "agent", text: "I'm going to credit your account $45.99 right now. This will be reflected in your next billing cycle.", timestamp: "05:00", flagged: false, sentiment: "positive" },
      { id: "t-12", speaker: "customer", text: "That sounds good. Thank you for handling this quickly.", timestamp: "05:15", flagged: false, sentiment: "positive" },
    ]
  },
  {
    id: "call-002",
    agentName: "Emily Rodriguez",
    customerName: "Michael Thompson",
    date: "2026-01-24",
    duration: "08:22",
    status: "ready",
    overallScore: 92,
    flaggedItems: 1,
    summary: "Technical support call for internet connectivity issues. Agent efficiently diagnosed the problem as a modem configuration issue and walked customer through reset procedure successfully.",
    sentiment: {
      overall: "positive",
      agentTone: 90,
      customerSatisfaction: 88,
      escalationRisk: "low"
    },
    keyMoments: [
      { id: "km-1", title: "Quick Diagnosis", timestamp: "01:45", description: "Agent identified modem issue quickly", type: "positive" },
      { id: "km-2", title: "Clear Instructions", timestamp: "03:20", description: "Step-by-step walkthrough provided", type: "positive" },
    ],
    categories: [
      { id: "cat-1", name: "Greeting & Introduction", score: 10, maxScore: 10, confidence: "high", justification: "Perfect introduction with warm tone and clear identification.", flagged: false },
      { id: "cat-2", name: "Active Listening", score: 9, maxScore: 10, confidence: "high", justification: "Excellent attention to customer's description of the issue.", flagged: false },
      { id: "cat-3", name: "Problem Resolution", score: 9, maxScore: 10, confidence: "high", justification: "Efficient troubleshooting with successful resolution.", flagged: false },
      { id: "cat-4", name: "Product Knowledge", score: 10, maxScore: 10, confidence: "high", justification: "Demonstrated expert knowledge of technical procedures.", flagged: false },
      { id: "cat-5", name: "Empathy & Rapport", score: 8, maxScore: 10, confidence: "medium", justification: "Good rapport building, could have acknowledged frustration more.", flagged: true, timestamp: "02:10" },
      { id: "cat-6", name: "Call Closure", score: 9, maxScore: 10, confidence: "high", justification: "Proper summary and follow-up information provided.", flagged: false },
    ],
    transcript: []
  },
  {
    id: "call-003",
    agentName: "David Park",
    customerName: "Jennifer Lee",
    date: "2026-01-23",
    duration: "15:47",
    status: "completed",
    overallScore: 85,
    flaggedItems: 0,
    summary: "Account upgrade request handled professionally. Agent explained all plan options and successfully upgraded customer to premium tier.",
    sentiment: {
      overall: "positive",
      agentTone: 88,
      customerSatisfaction: 92,
      escalationRisk: "low"
    },
    keyMoments: [],
    categories: [],
    transcript: []
  },
  {
    id: "call-004",
    agentName: "Lisa Wang",
    customerName: "Robert Martinez",
    date: "2026-01-23",
    duration: "06:15",
    status: "processing",
    overallScore: 0,
    flaggedItems: 0,
    summary: "",
    sentiment: {
      overall: "neutral",
      agentTone: 0,
      customerSatisfaction: 0,
      escalationRisk: "low"
    },
    keyMoments: [],
    categories: [],
    transcript: []
  },
  {
    id: "call-005",
    agentName: "Marcus Chen",
    customerName: "Amanda Foster",
    date: "2026-01-22",
    duration: "18:30",
    status: "needs_attention",
    overallScore: 65,
    flaggedItems: 5,
    summary: "Escalated complaint regarding service outage. Customer demanded compensation. Agent struggled to de-escalate but eventually offered appropriate resolution.",
    sentiment: {
      overall: "negative",
      agentTone: 70,
      customerSatisfaction: 55,
      escalationRisk: "high"
    },
    keyMoments: [
      { id: "km-1", title: "Escalation Point", timestamp: "05:30", description: "Customer became increasingly frustrated", type: "negative" },
      { id: "km-2", title: "Manager Request", timestamp: "10:15", description: "Customer requested to speak with manager", type: "negative" },
    ],
    categories: [],
    transcript: []
  },
]

export const rubricCategories = [
  "Greeting & Introduction",
  "Active Listening",
  "Problem Resolution",
  "Product Knowledge",
  "Empathy & Rapport",
  "Call Closure",
]

export function getStatusColor(status: CallStatus) {
  switch (status) {
    case "processing":
      return "bg-info/20 text-info"
    case "ready":
      return "bg-success/20 text-success"
    case "needs_attention":
      return "bg-warning/20 text-warning"
    case "completed":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function getStatusLabel(status: CallStatus) {
  switch (status) {
    case "processing":
      return "Processing"
    case "ready":
      return "Ready for Review"
    case "needs_attention":
      return "Needs Attention"
    case "completed":
      return "Completed"
    default:
      return status
  }
}

export function getConfidenceColor(confidence: ConfidenceLevel) {
  switch (confidence) {
    case "high":
      return "bg-confidence-high/20 text-confidence-high"
    case "medium":
      return "bg-confidence-medium/20 text-confidence-medium"
    case "low":
      return "bg-confidence-low/20 text-confidence-low"
    default:
      return "bg-muted text-muted-foreground"
  }
}

// Agent Analytics Types and Data
export interface AgentProfile {
  id: string
  name: string
  avatar?: string
  role: string
  team: string
  startDate: string
}

export interface MonthlyScore {
  month: string
  overallScore: number
  callsReviewed: number
  categoryScores: { [categoryName: string]: number }
}

export interface AgentAnalytics {
  agent: AgentProfile
  currentScore: number
  previousMonthScore: number
  trend: "up" | "down" | "stable"
  trendPercentage: number
  totalCallsReviewed: number
  monthlyHistory: MonthlyScore[]
  currentRubricBreakdown: {
    category: string
    score: number
    maxScore: number
    avgConfidence: number
  }[]
  aiConfidenceMetrics: {
    highConfidence: number
    mediumConfidence: number
    lowConfidence: number
    totalFlagged: number
    flaggedPercentage: number
  }
  recentCalls: {
    id: string
    date: string
    customerName: string
    score: number
    flagged: boolean
    status: CallStatus
  }[]
}

export const mockAgents: AgentProfile[] = [
  { id: "agent-001", name: "Marcus Chen", role: "Senior Support Agent", team: "Tier 2 Support", startDate: "2023-06-15" },
  { id: "agent-002", name: "Emily Rodriguez", role: "Support Agent", team: "Tier 1 Support", startDate: "2024-01-10" },
  { id: "agent-003", name: "David Park", role: "Support Agent", team: "Tier 1 Support", startDate: "2024-03-22" },
  { id: "agent-004", name: "Lisa Wang", role: "Support Specialist", team: "Tier 2 Support", startDate: "2023-11-01" },
]

export const mockAgentAnalytics: AgentAnalytics[] = [
  {
    agent: mockAgents[0],
    currentScore: 78,
    previousMonthScore: 72,
    trend: "up",
    trendPercentage: 8.3,
    totalCallsReviewed: 156,
    monthlyHistory: [
      { month: "Aug 2025", overallScore: 68, callsReviewed: 24, categoryScores: { "Greeting & Introduction": 85, "Active Listening": 65, "Problem Resolution": 70, "Product Knowledge": 75, "Empathy & Rapport": 60, "Call Closure": 68 } },
      { month: "Sep 2025", overallScore: 70, callsReviewed: 28, categoryScores: { "Greeting & Introduction": 88, "Active Listening": 68, "Problem Resolution": 72, "Product Knowledge": 78, "Empathy & Rapport": 62, "Call Closure": 70 } },
      { month: "Oct 2025", overallScore: 71, callsReviewed: 26, categoryScores: { "Greeting & Introduction": 90, "Active Listening": 70, "Problem Resolution": 74, "Product Knowledge": 80, "Empathy & Rapport": 64, "Call Closure": 72 } },
      { month: "Nov 2025", overallScore: 74, callsReviewed: 30, categoryScores: { "Greeting & Introduction": 92, "Active Listening": 72, "Problem Resolution": 76, "Product Knowledge": 82, "Empathy & Rapport": 66, "Call Closure": 74 } },
      { month: "Dec 2025", overallScore: 72, callsReviewed: 22, categoryScores: { "Greeting & Introduction": 90, "Active Listening": 70, "Problem Resolution": 74, "Product Knowledge": 80, "Empathy & Rapport": 65, "Call Closure": 72 } },
      { month: "Jan 2026", overallScore: 78, callsReviewed: 26, categoryScores: { "Greeting & Introduction": 92, "Active Listening": 75, "Problem Resolution": 80, "Product Knowledge": 85, "Empathy & Rapport": 70, "Call Closure": 78 } },
    ],
    currentRubricBreakdown: [
      { category: "Greeting & Introduction", score: 92, maxScore: 100, avgConfidence: 95 },
      { category: "Active Listening", score: 75, maxScore: 100, avgConfidence: 72 },
      { category: "Problem Resolution", score: 80, maxScore: 100, avgConfidence: 88 },
      { category: "Product Knowledge", score: 85, maxScore: 100, avgConfidence: 92 },
      { category: "Empathy & Rapport", score: 70, maxScore: 100, avgConfidence: 58 },
      { category: "Call Closure", score: 78, maxScore: 100, avgConfidence: 75 },
    ],
    aiConfidenceMetrics: {
      highConfidence: 68,
      mediumConfidence: 22,
      lowConfidence: 10,
      totalFlagged: 18,
      flaggedPercentage: 11.5,
    },
    recentCalls: [
      { id: "call-001", date: "2026-01-24", customerName: "Sarah Williams", score: 78, flagged: true, status: "needs_attention" },
      { id: "call-005", date: "2026-01-22", customerName: "Amanda Foster", score: 65, flagged: true, status: "needs_attention" },
      { id: "call-010", date: "2026-01-20", customerName: "James Mitchell", score: 82, flagged: false, status: "completed" },
      { id: "call-015", date: "2026-01-18", customerName: "Rebecca Torres", score: 88, flagged: false, status: "completed" },
      { id: "call-020", date: "2026-01-16", customerName: "Daniel Kim", score: 75, flagged: true, status: "completed" },
      { id: "call-025", date: "2026-01-14", customerName: "Michelle Brown", score: 80, flagged: false, status: "completed" },
    ],
  },
  {
    agent: mockAgents[1],
    currentScore: 92,
    previousMonthScore: 89,
    trend: "up",
    trendPercentage: 3.4,
    totalCallsReviewed: 142,
    monthlyHistory: [
      { month: "Aug 2025", overallScore: 82, callsReviewed: 20, categoryScores: { "Greeting & Introduction": 90, "Active Listening": 80, "Problem Resolution": 82, "Product Knowledge": 85, "Empathy & Rapport": 78, "Call Closure": 82 } },
      { month: "Sep 2025", overallScore: 85, callsReviewed: 24, categoryScores: { "Greeting & Introduction": 92, "Active Listening": 83, "Problem Resolution": 85, "Product Knowledge": 88, "Empathy & Rapport": 82, "Call Closure": 85 } },
      { month: "Oct 2025", overallScore: 87, callsReviewed: 26, categoryScores: { "Greeting & Introduction": 94, "Active Listening": 85, "Problem Resolution": 87, "Product Knowledge": 90, "Empathy & Rapport": 84, "Call Closure": 87 } },
      { month: "Nov 2025", overallScore: 88, callsReviewed: 24, categoryScores: { "Greeting & Introduction": 95, "Active Listening": 86, "Problem Resolution": 88, "Product Knowledge": 91, "Empathy & Rapport": 85, "Call Closure": 88 } },
      { month: "Dec 2025", overallScore: 89, callsReviewed: 22, categoryScores: { "Greeting & Introduction": 96, "Active Listening": 87, "Problem Resolution": 89, "Product Knowledge": 92, "Empathy & Rapport": 86, "Call Closure": 89 } },
      { month: "Jan 2026", overallScore: 92, callsReviewed: 26, categoryScores: { "Greeting & Introduction": 98, "Active Listening": 90, "Problem Resolution": 92, "Product Knowledge": 95, "Empathy & Rapport": 88, "Call Closure": 92 } },
    ],
    currentRubricBreakdown: [
      { category: "Greeting & Introduction", score: 98, maxScore: 100, avgConfidence: 98 },
      { category: "Active Listening", score: 90, maxScore: 100, avgConfidence: 92 },
      { category: "Problem Resolution", score: 92, maxScore: 100, avgConfidence: 95 },
      { category: "Product Knowledge", score: 95, maxScore: 100, avgConfidence: 96 },
      { category: "Empathy & Rapport", score: 88, maxScore: 100, avgConfidence: 85 },
      { category: "Call Closure", score: 92, maxScore: 100, avgConfidence: 90 },
    ],
    aiConfidenceMetrics: {
      highConfidence: 85,
      mediumConfidence: 12,
      lowConfidence: 3,
      totalFlagged: 4,
      flaggedPercentage: 2.8,
    },
    recentCalls: [
      { id: "call-002", date: "2026-01-24", customerName: "Michael Thompson", score: 92, flagged: false, status: "ready" },
      { id: "call-008", date: "2026-01-21", customerName: "Karen White", score: 95, flagged: false, status: "completed" },
      { id: "call-012", date: "2026-01-19", customerName: "Steven Garcia", score: 88, flagged: true, status: "completed" },
      { id: "call-018", date: "2026-01-17", customerName: "Laura Martinez", score: 94, flagged: false, status: "completed" },
    ],
  },
]

export function getAgentAnalytics(agentId: string): AgentAnalytics | undefined {
  return mockAgentAnalytics.find((a) => a.agent.id === agentId)
}

export function getAllAgentAnalytics(): AgentAnalytics[] {
  return mockAgentAnalytics
}
