import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Refreshes the Supabase auth session on every request. Called from proxy.ts. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Degrade to "no session refresh" instead of a hard 500 when Supabase env vars
  // aren't configured yet (e.g. before the project is connected) or the service
  // is briefly unreachable — the app should still be able to serve pages.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Required: this call refreshes the session and must not be removed.
    await supabase.auth.getUser();
  } catch (err) {
    console.error('updateSession failed:', err);
  }

  return response;
}
