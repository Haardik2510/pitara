export const dynamic = 'force-dynamic'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/app/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cs: { name: string; value: string; options: CookieOptions }[]) {
            try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
            catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const admin = createAdminClient()
      await admin.from('user_profiles').upsert({
        id:         data.user.id,
        email:      data.user.email ?? '',
        name:       data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? '',
        avatar_url: data.user.user_metadata?.avatar_url ?? null,
        is_admin:   false,
      }, { onConflict: 'id', ignoreDuplicates: false })

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}
