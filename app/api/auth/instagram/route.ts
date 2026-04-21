import { NextResponse } from 'next/server'
import { getOAuthURL } from '@/lib/instagram'

export async function GET() {
  const state = Math.random().toString(36).substring(2) // CSRF token
  const url   = getOAuthURL(state)
  return NextResponse.redirect(url)
}
