import { NextResponse } from "next/server";
import { getStatuses } from "@/lib/providers";

export const revalidate = 60;

export async function GET() {
  const data = await getStatuses();
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
