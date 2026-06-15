'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/app/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/app/types'

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = useCallback(async (u: User) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', u.id)
      .single()
    setProfile(data)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u)
      if (u) fetchProfile(u)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user)
      else setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [fetchProfile, supabase.auth])

  const signInWithGoogle = useCallback(() =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback/google` },
    }), [supabase])

  const signOut = useCallback(() => supabase.auth.signOut(), [supabase])

  return { user, profile, loading, isAdmin: profile?.is_admin ?? false, signInWithGoogle, signOut }
}
