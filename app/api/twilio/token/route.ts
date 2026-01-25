import { NextResponse } from "next/server";
import twilio from "twilio";

/**
 * Generate a Twilio Access Token for the Voice SDK (Device).
 * Env: TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET, TWILIO_TWIML_APP_SID (optional)
 */
export async function POST() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error:
          "Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_API_KEY, TWILIO_API_SECRET.",
      },
      { status: 503 },
    );
  }

  const identity = "live-agent";

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: 3600,
  });

  const voiceGrant = new VoiceGrant({
    incomingAllow: true,
    outgoingApplicationSid: twimlAppSid || undefined,
  });
  token.addGrant(voiceGrant);

  return NextResponse.json({ token: token.toJwt(), identity });
}
