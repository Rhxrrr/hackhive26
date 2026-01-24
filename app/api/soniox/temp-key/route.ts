export async function POST() {
  const apiKey = process.env.SONIOX_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "SONIOX_API_KEY is not set" },
      { status: 500 }
    );
  }

  const res = await fetch(
    "https://api.soniox.com/v1/auth/temporary-api-key",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        usage_type: "transcribe_websocket",
        expires_in_seconds: 3600,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return Response.json(
      { error: "Soniox API error", ...data },
      { status: res.status }
    );
  }

  return Response.json({ api_key: data.api_key, expires_at: data.expires_at });
}
