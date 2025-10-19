import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// Initialize Resend only when the API is called, not during build
let resend = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// ... rest of your existing code, but change:
// const resend = new Resend(process.env.RESEND_API_KEY);
// TO:
// const resendClient = getResendClient();
// And use resendClient.emails.send() instead of resend.emails.send()