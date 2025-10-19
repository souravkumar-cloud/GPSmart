import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request) {
  try {
    console.log('📧 Order Confirmation Email API called');
    
    const body = await request.json();
    const { orderId, userEmail, orderData, orderItems = [] } = body;

    console.log('📧 Request data:', { 
      orderId, 
      userEmail, 
      hasOrderData: !!orderData,
      itemsCount: orderItems.length 
    });

    // Validation
    if (!orderId || !userEmail) {
      console.error('❌ Missing required fields:', { orderId: !!orderId, userEmail: !!userEmail });
      return NextResponse.json(
        { error: 'Missing orderId or userEmail' },
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

    const orderAmount = orderData?.total_amount || 0;
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(orderAmount);

    console.log('📧 Sending order confirmation email via Resend...');

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: userEmail,
      subject: `Order Confirmed #${orderId.slice(0, 8).toUpperCase()} - Thank You!`,
      html: generateOrderConfirmationEmail(
        orderId,
        orderAmount,
        formattedAmount,
        orderData,
        orderItems
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

    console.log('✅ Order confirmation email sent successfully. ID:', emailResponse.data?.id);
    return NextResponse.json(
      { message: 'Order confirmation email sent successfully', data: emailResponse.data },
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

function generateOrderConfirmationEmail(
  orderId,
  orderAmount,
  formattedAmount,
  orderData,
  orderItems
) {
  const shortOrderId = orderId.slice(0, 8).toUpperCase();
  const currentDate = new Date().toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Generate order items HTML
  let orderItemsHTML = '';
  if (orderItems && orderItems.length > 0) {
    orderItemsHTML = `
      <h2 style="font-size: 18px; margin-top: 25px; margin-bottom: 15px;">Order Items</h2>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        ${orderItems.map(item => `
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #ddd;">
            <div>
              <div style="font-weight: 600; color: #333;">${item.name || item.product_name || 'Product'}</div>
              <div style="color: #666; font-size: 14px;">Quantity: ${item.quantity}</div>
            </div>
            <div style="font-weight: 600; color: #333;">
              ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price || 0)}
            </div>
          </div>
        `).join('')}
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
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 600;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.95;
            }
            .content {
                padding: 30px;
            }
            .success-box {
                background-color: #e8f5e9;
                border-left: 4px solid #4CAF50;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 4px;
            }
            .success-box strong {
                color: #2e7d32;
                display: block;
                margin-bottom: 5px;
                font-size: 16px;
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
                padding-top: 15px;
                margin-top: 10px;
                border-top: 2px solid #4CAF50;
            }
            .detail-label {
                font-weight: 600;
                color: #555;
            }
            .detail-value {
                color: #333;
            }
            .total-amount {
                font-size: 20px;
                font-weight: 700;
                color: #4CAF50;
            }
            .order-badge {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            .info-box {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .info-box strong {
                color: #856404;
                display: block;
                margin-bottom: 5px;
            }
            .cta-button {
                display: inline-block;
                background-color: #4CAF50;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                font-weight: 600;
            }
            .cta-button:hover {
                background-color: #45a049;
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
                color: #4CAF50;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Order Confirmed!</h1>
                <p>Thank you for your purchase</p>
            </div>

            <div class="content">
                <p>Dear Valued Customer,</p>

                <div class="success-box">
                    <strong>Your order has been received! ✓</strong>
                    We're preparing your items and will notify you once they're ready to ship.
                </div>

                <h2 style="font-size: 18px; margin-top: 25px; margin-bottom: 15px;">Order Summary</h2>
                <div class="order-details">
                    <div class="detail-row">
                        <span class="detail-label">Order ID:</span>
                        <span class="detail-value"><strong>#${shortOrderId}</strong></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Order Date:</span>
                        <span class="detail-value">${currentDate}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value"><span class="order-badge">Confirmed</span></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Total Amount:</span>
                        <span class="detail-value total-amount">${formattedAmount}</span>
                    </div>
                </div>

                ${orderItemsHTML}

                <div class="info-box">
                    <strong>What's Next?</strong>
                    <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                        <li>We'll process your order within 24 hours</li>
                        <li>You'll receive tracking information once shipped</li>
                        <li>Expected delivery: 3-5 business days</li>
                    </ul>
                </div>

                <p style="margin-top: 25px; margin-bottom: 10px;"><strong>Need Help?</strong></p>
                <p>If you have any questions about your order, our support team is here to help:</p>
                <a href="mailto:support@yourdomain.com" class="cta-button">Contact Support</a>

                <p style="margin-top: 30px; color: #999; font-size: 14px;">
                    Thank you for shopping with us! 🙏
                </p>
            </div>

            <div class="footer">
                <p style="margin: 0;">
                    © ${new Date().getFullYear()} Your Store. All rights reserved.
                </p>
                <p style="margin: 10px 0 0 0;">
                    <a href="#">Track Order</a> | <a href="#">Contact Support</a> | <a href="#">FAQ</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}