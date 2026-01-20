import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwIn0",
      payload: "eyJkb21haW4iOiJhcm1pbmEuYXBwIn0",
      signature: "MHg...",
    },
    frame: {
      version: "next",
      name: "Armina - Arisan Mini App",
      iconUrl: `${baseUrl}/logo.png`,
      homeUrl: baseUrl,
      imageUrl: `${baseUrl}/og-image.png`,
      buttonTitle: "Open Armina",
      splashImageUrl: `${baseUrl}/logo.png`,
      splashBackgroundColor: "#1e2a4a",
      webhookUrl: `${baseUrl}/api/webhook`,
    },
  };

  return NextResponse.json(manifest);
}
