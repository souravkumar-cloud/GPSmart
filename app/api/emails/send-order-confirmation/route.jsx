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

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { orderId, userEmail, orderData, orderItems = [] } = body;

    if (!orderId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing orderId or userEmail' },
        { status: 400 }
      );
    }

    if (!isValidEmail(userEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    const resendClient = getResendClient();
    if (!resendClient) {
      return NextResponse.json(
        { error: 'Failed to initialize email service' },
        { status: 500 }
      );
    }

    const orderAmount = orderData?.total_amount || 0;
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(orderAmount);

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const shortOrderId = orderId.slice(0, 8).toUpperCase();

    const emailResponse = await resendClient.emails.send({
      from: fromEmail,
      to: userEmail,
      subject: `Order Confirmed #${shortOrderId} - Thank You!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .order-details { background: #f5f5f5; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .total { font-size: 20px; font-weight: bold; color: #4CAF50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Order Confirmed!</h1>
            </div>
            <div class="content">
              <p>Dear Customer,</p>
              <p>Thank you for your order! We've received it and will process it shortly.</p>
              <div class="order-details">
                <p><strong>Order ID:</strong> #${shortOrderId}</p>
                <p><strong>Total Amount:</strong> <span class="total">${formattedAmount}</span></p>
              </div>
              <p>We'll send you tracking information once your order ships.</p>
              <p>Thank you for shopping with us!</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse.error) {
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResponse.error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Email sent successfully', data: emailResponse.data },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}