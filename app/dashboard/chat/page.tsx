"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  MessageSquare,
  Loader2,
  RefreshCcw
} from "lucide-react"

interface Profile {
  full_name: string | null
  age: number | null
  education_level: string | null
  current_grade: string | null
  interests: string[] | null
  skills: string[] | null
}

interface AssessmentResult {
  scores: Record<string, number>
  career_matches: Array<{ career: string; matchScore: number }>
}

const suggestedQuestions = [
  "What career paths match my assessment results?",
  "How do I become a software engineer in India?",
  "What skills should I develop for the future job market?",
  "Can you explain different engineering branches?",
  "What are the best colleges for computer science in India?",
  "How do I prepare for competitive exams like JEE or NEET?",
]

export default function ChatPage() {
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult | null>(null)
  const [input, setInput] = useState("")
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Create transport without custom body - we'll pass data via sendMessage
  const transport = useMemo(() => new DefaultChatTransport({
    api: "/api/chat",
  }), [])

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
  })

  useEffect(() => {
    loadUserData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const [profileRes, assessmentRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("assessment_results").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(1).single()
      ])

      if (profileRes.data) {
        setUserProfile(profileRes.data)
      }
      if (assessmentRes.data) {
        setAssessmentResults(assessmentRes.data)
      }
    }
    setIsDataLoaded(true)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = () => {
    if (!input.trim()) return
    // Pass dynamic data via sendMessage body option
    sendMessage({ text: input }, { body: { userProfile, assessmentResults } })
    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    sendMessage({ text: question }, { body: { userProfile, assessmentResults } })
  }

  const handleNewChat = () => {
    setMessages([])
  }

  const isLoading = status === "streaming" || status === "submitted"

  if (!isDataLoaded) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading AI Advisor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="flex-row items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">AI Career Advisor</CardTitle>
              <p className="text-xs text-muted-foreground">
                {assessmentResults ? "Personalized guidance based on your assessment" : "Ask me anything about careers"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNewChat}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">Start a Conversation</h3>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                  I&apos;m your AI career advisor. Ask me anything about career paths, skills, education, 
                  or get personalized advice based on your assessment results.
                </p>
                <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
                  {suggestedQuestions.slice(0, 4).map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      size="sm"
                      className="h-auto whitespace-normal text-left text-xs"
                      onClick={() => handleSuggestedQuestion(question)}
                    >
                      <MessageSquare className="mr-2 h-3 w-3 shrink-0" />
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    userName={userProfile?.full_name || "You"}
                  />
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about careers, skills, education paths..."
                className="min-h-[44px] max-h-32 resize-none"
                rows={1}
                disabled={isLoading}
              />
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-11 w-11 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              CareerCompass AI provides guidance based on your profile. Always verify important decisions with professionals.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ChatMessage({ message, userName }: { message: UIMessage; userName: string }) {
  const isUser = message.role === "user"
  
  // Extract text content from message parts
  const textContent = message.parts
    ?.filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("") || ""

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={isUser ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      }`}>
        <p className="text-sm font-medium mb-1">{isUser ? userName : "CareerCompass AI"}</p>
        <div className="text-sm whitespace-pre-wrap">{textContent}</div>
      </div>
    </div>
  )
}
