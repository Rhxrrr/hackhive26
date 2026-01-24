const SONIOX_BASE = "https://api.soniox.com/v1";

export async function GET(req: Request) {
  const apiKey = process.env.SONIOX_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: "SONIOX_API_KEY is not set",
        message:
          "Add SONIOX_API_KEY to your .env.local. Get a key at https://console.soniox.com",
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint") || "models";

  const allowed = ["models", "transcriptions"];
  if (!allowed.includes(endpoint)) {
    return Response.json(
      { error: "Invalid endpoint", allowed: ["models", "transcriptions"] },
      { status: 400 }
    );
  }

  const url = `${SONIOX_BASE}/${endpoint}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return Response.json(
      { error: "Soniox API error", status: res.status, ...data },
      { status: res.status }
    );
  }

  return Response.json(data);
}
