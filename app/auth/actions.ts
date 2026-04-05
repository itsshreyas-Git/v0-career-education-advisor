"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

// Demo mode for preview environment when Supabase is unreachable
export async function enterDemoMode() {
  const cookieStore = await cookies()
  cookieStore.set("demo_mode", "true", { 
    path: "/",
    maxAge: 60 * 60 * 24 // 24 hours
  })
  redirect("/dashboard")
}

export async function exitDemoMode() {
  const cookieStore = await cookies()
  cookieStore.delete("demo_mode")
  redirect("/")
}

export async function isDemoMode() {
  const cookieStore = await cookies()
  return cookieStore.get("demo_mode")?.value === "true"
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string

  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }
  } catch (err) {
    return { error: "network_error" }
  }

  redirect("/auth/sign-up-success")
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const supabase = await createClient()
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { error: error.message }
    }
  } catch (err) {
    return { error: "network_error" }
  }

  redirect("/dashboard")
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete("demo_mode")
  
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    // Ignore errors during sign out
  }
  redirect("/")
}
