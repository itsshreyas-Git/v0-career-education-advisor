import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { Brain, MessageSquare, Map, Network, ArrowRight, Target, TrendingUp, Award, Clock } from "lucide-react"

// Demo data for when Supabase is unavailable
const DEMO_PROFILE = {
  full_name: "Demo User",
  age: 17,
  education_level: "12th Grade",
  interests: ["Technology", "Science", "Arts"],
  skills: ["Problem Solving", "Critical Thinking"]
}

const DEMO_MILESTONES = [
  { id: "1", title: "Complete Career Assessment", completed: false, description: "Discover your strengths and interests" },
  { id: "2", title: "Explore 3 Career Paths", completed: false, description: "Research potential careers" },
  { id: "3", title: "Talk to AI Advisor", completed: false, description: "Get personalized guidance" },
]

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const isDemoMode = cookieStore.get("demo_mode")?.value === "true"
  
  let profile = DEMO_PROFILE
  let assessments: any[] = []
  let milestones = DEMO_MILESTONES
  
  // Only try to fetch from Supabase if not in demo mode
  if (!isDemoMode) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const [profileRes, assessmentsRes, milestonesRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("assessment_results").select("*").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(1),
          supabase.from("milestones").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5)
        ])

        if (profileRes.data) profile = profileRes.data
        if (assessmentsRes.data) assessments = assessmentsRes.data
        if (milestonesRes.data && milestonesRes.data.length > 0) milestones = milestonesRes.data
      }
    } catch (error) {
      // If Supabase is unreachable, use demo data
      console.log("[v0] Using demo data - Supabase unavailable")
    }
  }

  const hasAssessment = assessments && assessments.length > 0
  const completedMilestones = milestones?.filter(m => m.completed).length || 0
  const totalMilestones = milestones?.length || 0
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Student"}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            Continue your journey towards your dream career.
          </p>
        </div>
        {!hasAssessment && (
          <Button asChild>
            <Link href="/dashboard/assessment">
              Take Assessment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Assessment Status"
          value={hasAssessment ? "Completed" : "Pending"}
          description={hasAssessment ? "View your results" : "Take assessment to unlock insights"}
          icon={Brain}
          variant={hasAssessment ? "success" : "warning"}
        />
        <StatsCard
          title="Milestones"
          value={`${completedMilestones}/${totalMilestones}`}
          description="Goals completed"
          icon={Target}
          variant="default"
        />
        <StatsCard
          title="Career Matches"
          value={hasAssessment ? "5+" : "0"}
          description="Personalized recommendations"
          icon={TrendingUp}
          variant="default"
        />
        <StatsCard
          title="AI Sessions"
          value="Unlimited"
          description="Chat anytime for guidance"
          icon={MessageSquare}
          variant="primary"
        />
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Progress</CardTitle>
          <CardDescription>Track your career discovery journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <ProgressStep
                title="Take Assessment"
                completed={hasAssessment}
                description="Discover your strengths"
              />
              <ProgressStep
                title="Explore Careers"
                completed={false}
                description="Find matching paths"
              />
              <ProgressStep
                title="Set Milestones"
                completed={totalMilestones > 0}
                description="Plan your journey"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Psychometric Test"
          description="Discover your aptitudes and interests"
          href="/dashboard/assessment"
          icon={Brain}
        />
        <QuickActionCard
          title="AI Career Advisor"
          description="Get personalized guidance"
          href="/dashboard/chat"
          icon={MessageSquare}
        />
        <QuickActionCard
          title="Career Roadmap"
          description="Visualize your path to success"
          href="/dashboard/roadmap"
          icon={Map}
        />
        <QuickActionCard
          title="Knowledge Graph"
          description="Explore career connections"
          href="/dashboard/explore"
          icon={Network}
        />
      </div>

      {/* Recent Milestones */}
      {milestones && milestones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Milestones</CardTitle>
            <CardDescription>Your upcoming goals and achievements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center gap-4 rounded-lg border border-border p-3"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    milestone.completed ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {milestone.completed ? (
                      <Award className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${milestone.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {milestone.title}
                    </p>
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {milestone.description}
                      </p>
                    )}
                  </div>
                  {milestone.target_date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(milestone.target_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  variant = "default",
}: {
  title: string
  value: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  variant?: "default" | "primary" | "success" | "warning"
}) {
  const variantClasses = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-600",
    warning: "bg-amber-500/10 text-amber-600",
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${variantClasses[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ProgressStep({
  title,
  completed,
  description,
}: {
  title: string
  completed: boolean
  description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
        completed 
          ? "bg-primary text-primary-foreground" 
          : "border-2 border-muted-foreground/30 text-muted-foreground"
      }`}>
        {completed ? "✓" : ""}
      </div>
      <div>
        <p className={`text-sm font-medium ${completed ? "text-foreground" : "text-muted-foreground"}`}>
          {title}
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
}: {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Link href={href}>
      <Card className="group h-full cursor-pointer transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
        <CardContent className="flex h-full flex-col p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <div className="mt-auto pt-3 flex items-center text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Get started <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
