import { Resend } from 'resend';

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  const response = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: 'your-email@example.com',
    subject: 'Test Email',
    html: '<p>If you see this, Resend is working!</p>',
  });
  
  return Response.json(response);
}