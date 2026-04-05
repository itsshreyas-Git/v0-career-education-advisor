"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

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
    console.error("[v0] Sign up error:", err)
    return { error: "Unable to connect to authentication service. Please try again later." }
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
    console.error("[v0] Sign in error:", err)
    return { error: "Unable to connect to authentication service. Please try again later." }
  }

  redirect("/dashboard")
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (err) {
    console.error("[v0] Sign out error:", err)
  }
  redirect("/")
}
