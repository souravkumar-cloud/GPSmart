import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

const statusMessages = {
  pending: {
    title: 'Order Received',
    description: 'Your order has been received and is being processed.',
  },
  packed: {
    title: 'Order Packed',
    description: 'Your order has been packed and is ready for shipment.',
  },
  'picked up': {
    title: 'Order Picked Up',
    description: 'Your order has been picked up by the courier.',
  },
  'in transit': {
    title: 'Order In Transit',
    description: 'Your order is on its way to you.',
  },
  'out for delivery': {
    title: 'Out For Delivery',
    description: 'Your order is out for delivery today.',
  },
  delivered: {
    title: 'Order Delivered',
    description: 'Your order has been successfully delivered.',
  },
  cancelled: {
    title: 'Order Cancelled',
    description: 'Your order has been cancelled.',
  },
};

const statusColors = {
  pending: '#FFC107',
  packed: '#2196F3',
  'picked up': '#9C27B0',
  'in transit': '#3F51B5',
  'out for delivery': '#FF9800',
  delivered: '#4CAF50',
  cancelled: '#F44336',
};

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request) {
  try {
    console.log('📧 Email API called');
    
    const body = await request.json();
    const { orderId, userEmail, orderData, status } = body;

    console.log('📧 Request data:', { orderId, userEmail, status, hasOrderData: !!orderData });

    // Validation
    if (!orderId || !userEmail || !status) {
      console.error('❌ Missing required fields:', { orderId: !!orderId, userEmail: !!userEmail, status: !!status });
      return NextResponse.json(
        { error: 'Missing orderId, userEmail, or status' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(userEmail)) {
      console.error('❌ Invalid email format:', userEmail);
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if RESEND_API_KEY is set
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not set in environment variables');
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY in .env.local' },
        { status: 500 }
      );
    }

    const statusInfo = statusMessages[status] || statusMessages.pending;

    const orderAmount = orderData?.total_amount || 0;
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(orderAmount);

    console.log('📧 Sending email via Resend...');

    // Use environment variable or default to Resend's onboarding domain
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: userEmail,
      subject: `Order #${orderId.slice(0, 8).toUpperCase()} - ${statusInfo.title}`,
      html: generateStatusEmail(
        orderId,
        status,
        statusInfo,
        statusColors[status],
        orderAmount,
        formattedAmount,
        orderData
      ),
    });

    console.log('📧 Resend response:', emailResponse);

    if (emailResponse.error) {
      console.error('❌ Resend error:', emailResponse.error);
      return NextResponse.json(
        { 
          error: 'Failed to send email', 
          details: emailResponse.error.message || emailResponse.error 
        },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully. ID:', emailResponse.data?.id);
    return NextResponse.json(
      { message: 'Status email sent successfully', data: emailResponse.data },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Email API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

function generateStatusEmail(
  orderId,
  status,
  statusInfo,
  statusColor,
  orderAmount,
  formattedAmount,
  orderData
) {
  const shortOrderId = orderId.slice(0, 8).toUpperCase();
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let statusSpecificContent = '';
  if (status === 'cancelled') {
    statusSpecificContent = `
      <div class="refund-info">
        <strong>Refund Information</strong>
        Your refund of <strong>${formattedAmount}</strong> will be credited to your original payment method within 5-7 business days.
      </div>
    `;
  } else if (status === 'delivered') {
    statusSpecificContent = `
      <div class="delivery-info">
        <strong>Delivery Complete</strong>
        Thank you for your purchase! We hope you enjoy your order. If you have any questions about your order, please don't hesitate to contact us.
      </div>
    `;
  } else if (status === 'out for delivery') {
    statusSpecificContent = `
      <div class="delivery-info">
        <strong>Track Your Package</strong>
        Your package is on its way! Keep an eye on your phone for delivery updates.
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f9f9f9;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }
            .content {
                padding: 30px;
            }
            .status-box {
                background-color: ${statusColor}20;
                border-left: 4px solid ${statusColor};
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .status-box strong {
                color: ${statusColor};
                display: block;
                margin-bottom: 5px;
            }
            .order-details {
                background-color: #f5f5f5;
                padding: 20px;
                border-radius: 6px;
                margin-bottom: 20px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #ddd;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #555;
            }
            .detail-value {
                color: #333;
            }
            .status-badge {
                display: inline-block;
                background-color: ${statusColor};
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .refund-info,
            .delivery-info {
                background-color: #e8f5e9;
                border-left: 4px solid #4caf50;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .refund-info strong,
            .delivery-info strong {
                color: #2e7d32;
                display: block;
                margin-bottom: 5px;
            }
            .cta-button {
                display: inline-block;
                background-color: #667eea;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
            }
            .cta-button:hover {
                background-color: #5568d3;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #999;
                border-top: 1px solid #ddd;
            }
            .footer a {
                color: #667eea;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${statusInfo.title}</h1>
            </div>

            <div class="content">
                <p>Dear Valued Customer,</p>

                <div class="status-box">
                    <strong>${statusInfo.title}</strong>
                    ${statusInfo.description}
                </div>

                <h2 style="font-size: 18px; margin-top: 25px; margin-bottom: 15px;">Order Details</h2>
                <div class="order-details">
                    <div class="detail-row">
                        <span class="detail-label">Order ID:</span>
                        <span class="detail-value">#${shortOrderId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Order Amount:</span>
                        <span class="detail-value" style="font-weight: 600;">${formattedAmount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status Update:</span>
                        <span class="detail-value"><span class="status-badge">${status.toUpperCase()}</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Updated On:</span>
                        <span class="detail-value">${currentDate}</span>
                    </div>
                </div>

                ${statusSpecificContent}

                <p style="margin-top: 25px; margin-bottom: 10px;"><strong>Questions?</strong></p>
                <p>If you have any questions about your order, please don't hesitate to contact us:</p>
                <a href="mailto:support@yourdomain.com" class="cta-button">Contact Support</a>

                <p style="margin-top: 30px; color: #999; font-size: 14px;">
                    Thank you for your order!
                </p>
            </div>

            <div class="footer">
                <p style="margin: 0;">
                    © ${new Date().getFullYear()} Your Store. All rights reserved.
                </p>
                <p style="margin: 10px 0 0 0;">
                    <a href="#">View Order</a> | <a href="#">Contact Support</a> | <a href="#">FAQ</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}