import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect(new URL("/", process.env.BASE_URL));
  res.cookies.delete("te_session");
  return res;
}
