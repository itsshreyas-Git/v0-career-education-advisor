import { streamText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: Request) {
  const { messages, userProfile, assessmentResults } = await req.json()

  let systemContext = `You are CareerCompass, an expert AI career counselor and mentor designed to help Indian students (ages 13-30) discover and pursue their ideal career paths.
Your role is to:
- Provide personalized career guidance based on the student's profile, interests, and assessment results
- Explain various career options, required skills, educational paths, and job market trends in India
- Offer actionable advice on skill development, course selection, and career planning
- Be encouraging, supportive, and realistic about career prospects
- Consider the Indian education system, job market, and cultural context
- Suggest specific resources, courses, certifications, and institutions relevant to India

Communication style:
- Be warm, friendly, and approachable
- Use simple, clear language appropriate for students
- Break down complex career information into digestible insights
- Ask clarifying questions when needed to give better advice
- Celebrate the student's interests and strengths`

  if (userProfile) {
    systemContext += `
Student Profile:
- Name: ${userProfile.full_name || "Student"}
- Age: ${userProfile.age || "Not specified"}
- Education Level: ${userProfile.education_level || "Not specified"}
- Current Grade/Year: ${userProfile.current_grade || "Not specified"}
- Interests: ${userProfile.interests?.join(", ") || "Not specified yet"}
- Skills: ${userProfile.skills?.join(", ") || "Not specified yet"}`
  }

  if (assessmentResults) {
    const traits = Object.entries(assessmentResults.scores || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([trait, score]) => `${trait}: ${score}%`)
      .join(", ")

    const topCareers = (assessmentResults.career_matches || [])
      .slice(0, 3)
      .map((c: { career: string; matchScore: number }) => `${c.career} (${c.matchScore}% match)`)
      .join(", ")

    systemContext += `
Assessment Results:
- Top Traits: ${traits || "Not assessed yet"}
- Recommended Careers: ${topCareers || "Not assessed yet"}
Use this assessment data to provide personalized career recommendations and insights.`
  }

  // Extract plain text messages for Gemini
  const formattedMessages = messages.map((msg: any) => ({
    role: msg.role,
    content: msg.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("") || msg.content || "",
  }))

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: systemContext,
    messages: formattedMessages,
  })

  return result.toUIMessageStreamResponse()
}
