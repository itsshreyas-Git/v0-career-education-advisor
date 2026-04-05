import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DemoBanner } from "@/components/dashboard/demo-banner"

// Demo user data for preview mode
const demoUser = {
  id: "demo-user-id",
  email: "demo@careercompass.com",
}

const demoProfile = {
  id: "demo-user-id",
  full_name: "Demo User",
  age: 17,
  education_level: "12th Grade",
  current_grade: "12th",
  interests: ["Technology", "Science", "Design"],
  skills: ["Problem Solving", "Coding", "Communication"],
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isDemoMode = cookieStore.get("demo_mode")?.value === "true"

  let user = demoUser
  let profile = demoProfile

  if (!isDemoMode) {
    try {
      const supabase = await createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        user = authUser as typeof demoUser
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()
        
        if (userProfile) {
          profile = userProfile
        }
      }
    } catch (err) {
      // If Supabase is unreachable, use demo data
    }
  }

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} profile={profile} />
      <SidebarInset>
        {isDemoMode && <DemoBanner />}
        <DashboardHeader user={user} profile={profile} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
