import { NextRequest, NextResponse } from "next/server"
export const dynamic = "force-dynamic"
export async function POST(req: NextRequest) {
  const body = await req.json()
  return NextResponse.json({ error: "Use /api/generate instead" }, { status: 410 })
}
export async function GET() {
  return NextResponse.json({ error: "Use /api/generate instead" }, { status: 410 })
}
