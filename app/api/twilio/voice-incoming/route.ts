import { NextRequest, NextResponse } from "next/server";

/**
 * Twilio webhook for incoming calls to your Twilio number.
 * Configure your number's "A CALL COMES IN" → Webhook → POST to:
 *   https://your-domain.com/api/twilio/voice-incoming
 *
 * Returns TwiML to dial the client "live-agent" (browser). When the agent
 * is online and answers, the call connects. Caller ID is in the "From" param.
 */

const IDENTITY = "live-agent";

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => new URLSearchParams());
  const from = (form.get("From") as string) || "";

  // callerId on Dial is what the Client (browser) sees as the calling number
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial${from ? ` callerId="${from}"` : ""}>
    <Client>${IDENTITY}</Client>
  </Dial>
  <Say>The agent is not available. Please try again later.</Say>
  <Hangup/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
