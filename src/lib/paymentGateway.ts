/**
 * Payment Gateway Integration
 * Support for multiple payment providers
 */

// Configuration for different payment gateways
export const PAYMENT_CONFIG = {
  // Midtrans Configuration
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
    // Prefer explicit MIDTRANS_ENV when available (sandbox|production)
    isProduction: (process.env.MIDTRANS_ENV || '').toLowerCase() === 'production' 
      ? true 
      : (process.env.MIDTRANS_ENV || '').toLowerCase() === 'sandbox' 
        ? false 
        : process.env.NODE_ENV === 'production',
  },
  
  // Xendit Configuration
  xendit: {
    secretKey: process.env.XENDIT_SECRET_KEY,
    publicKey: process.env.XENDIT_PUBLIC_KEY,
    callbackToken: process.env.XENDIT_CALLBACK_TOKEN,
  },
  
  // DANA Configuration
  dana: {
    merchantId: process.env.DANA_MERCHANT_ID,
    secretKey: process.env.DANA_SECRET_KEY,
  }
};

/**
 * Generate QRIS Code using different payment gateways
 */
export async function generateQRISCode(
  paymentId: string, 
  amount: number, 
  description: string,
  gateway: 'midtrans' | 'xendit' | 'dana' | 'custom' = 'custom'
): Promise<string> {
  
  switch (gateway) {
    case 'midtrans':
      return generateMidtransQRIS(paymentId, amount, description);
    
    case 'xendit':
      return generateXenditQRIS(paymentId, amount, description);
    
    case 'dana':
      return generateDANAQRIS(paymentId, amount, description);
    
    case 'custom':
    default:
      return generateCustomQRIS(paymentId, amount, description);
  }
}

/**
 * Custom QRIS Implementation
 * You can customize this to use your own QRIS provider
 */
async function generateCustomQRIS(
  paymentId: string, 
  amount: number, 
  description: string
): Promise<string> {
  
  // Option 1: Use a QR code generation library
  const qrData = {
    paymentId,
    amount,
    description,
    timestamp: Date.now(),
    merchantName: "Trading Platform",
    // Add your custom QRIS data here
  };
  
  // Example: Generate QR code using qrcode library
  // You need to install: npm install qrcode @types/qrcode
  try {
    const QRCode = require('qrcode');
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation failed:', error);
    // Fallback to static QR code
    return generateStaticQRCode(paymentId, amount);
  }
}

/**
 * Midtrans QRIS Implementation
 */
async function generateMidtransQRIS(
  paymentId: string, 
  amount: number, 
  description: string
): Promise<string> {
  
  const { serverKey, isProduction } = PAYMENT_CONFIG.midtrans;
  
  if (!serverKey) {
    throw new Error('Midtrans server key not configured');
  }
  
  try {
    const response = await fetch('https://api.midtrans.com/v2/qris', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(serverKey + ':').toString('base64')}`
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: paymentId,
          gross_amount: amount
        },
        item_details: [{
          id: 'premium-subscription',
          price: amount,
          quantity: 1,
          name: description
        }],
        qris: {
          acquirer: 'gopay'
        }
      })
    });
    
    const data = await response.json();
    
    if (data.status_code === '201') {
      return data.qr_string; // This is the QR code data
    } else {
      throw new Error(`Midtrans error: ${data.status_message}`);
    }
    
  } catch (error) {
    console.error('Midtrans QRIS generation failed:', error);
    return generateStaticQRCode(paymentId, amount);
  }
}

/**
 * Xendit QRIS Implementation
 */
async function generateXenditQRIS(
  paymentId: string, 
  amount: number, 
  description: string
): Promise<string> {
  
  const { secretKey } = PAYMENT_CONFIG.xendit;
  
  if (!secretKey) {
    throw new Error('Xendit secret key not configured');
  }
  
  try {
    const response = await fetch('https://api.xendit.co/qr_codes', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reference_id: paymentId,
        type: 'DYNAMIC',
        currency: 'IDR',
        amount: amount,
        description: description
      })
    });
    
    const data = await response.json();
    
    if (data.id) {
      return data.qr_string; // This is the QR code data
    } else {
      throw new Error(`Xendit error: ${data.message}`);
    }
    
  } catch (error) {
    console.error('Xendit QRIS generation failed:', error);
    return generateStaticQRCode(paymentId, amount);
  }
}

/**
 * DANA QRIS Implementation
 */
async function generateDANAQRIS(
  paymentId: string, 
  amount: number, 
  description: string
): Promise<string> {
  
  const { merchantId, secretKey } = PAYMENT_CONFIG.dana;
  
  if (!merchantId || !secretKey) {
    throw new Error('DANA credentials not configured');
  }
  
  // DANA API implementation would go here
  // This is a placeholder - you need to implement according to DANA's API docs
  
  return generateStaticQRCode(paymentId, amount);
}

/**
 * Fallback static QR code generator
 */
function generateStaticQRCode(paymentId: string, amount: number): string {
  // This creates a simple static QR code as fallback
  const qrData = `QRIS|${paymentId}|${amount}|Trading Platform|Premium Subscription`;
  
  // For now, return a placeholder image
  // In production, you should use a real QR code generation library
  return `data:image/svg+xml;base64,${Buffer.from(`
    <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="white"/>
      <text x="128" y="128" text-anchor="middle" font-family="monospace" font-size="12">
        QRIS Payment
        ${paymentId}
        Rp ${amount.toLocaleString()}
      </text>
    </svg>
  `).toString('base64')}`;
}

/**
 * Verify payment status with payment gateway
 */
export async function verifyPayment(
  paymentId: string,
  gateway: 'midtrans' | 'xendit' | 'dana' | 'custom' = 'midtrans'
): Promise<{ status: 'paid' | 'pending' | 'failed'; transactionId?: string }> {
  
  switch (gateway) {
    case 'midtrans':
      return verifyMidtransPayment(paymentId);
    
    case 'xendit':
      return verifyXenditPayment(paymentId);
    
    case 'dana':
      return verifyDANAPayment(paymentId);
    
    default:
      // For demo purposes, simulate payment verification
      return simulatePaymentVerification(paymentId);
  }
}

async function verifyMidtransPayment(paymentId: string): Promise<{ status: 'paid' | 'pending' | 'failed'; transactionId?: string }> {
  const { serverKey, isProduction } = PAYMENT_CONFIG.midtrans;
  
  try {
    const base = isProduction ? 'https://api.midtrans.com' : 'https://api.sandbox.midtrans.com';
    const response = await fetch(`${base}/v2/${paymentId}/status`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(serverKey + ':').toString('base64')}`
      }
    });
    
    const data = await response.json();
    
    if (data.transaction_status === 'settlement' || data.transaction_status === 'capture') {
      return { status: 'paid', transactionId: String(data.transaction_id || '') };
    } else if (data.transaction_status === 'pending') {
      return { status: 'pending' };
    } else {
      return { status: 'failed' };
    }
    
  } catch (error) {
    console.error('Midtrans verification failed:', error);
    return { status: 'failed' };
  }
}

async function verifyXenditPayment(paymentId: string): Promise<{ status: 'paid' | 'pending' | 'failed'; transactionId?: string }> {
  const { secretKey } = PAYMENT_CONFIG.xendit;
  
  try {
    const response = await fetch(`https://api.xendit.co/qr_codes/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'COMPLETED') {
      return { status: 'paid', transactionId: String(data.id || '') };
    } else if (data.status === 'PENDING') {
      return { status: 'pending' };
    } else {
      return { status: 'failed' };
    }
    
  } catch (error) {
    console.error('Xendit verification failed:', error);
    return { status: 'failed' };
  }
}

async function verifyDANAPayment(paymentId: string): Promise<{ status: 'paid' | 'pending' | 'failed'; transactionId?: string }> {
  // DANA verification implementation
  return simulatePaymentVerification(paymentId);
}

async function simulatePaymentVerification(paymentId: string): Promise<{ status: 'paid' | 'pending' | 'failed'; transactionId?: string }> {
  // Simulate random payment success for demo
  const shouldSucceed = Math.random() > 0.7; // 30% chance
  
  if (shouldSucceed) {
    return { status: 'paid', transactionId: `TXN_${Date.now()}` };
  } else {
    return { status: 'pending' };
  }
}


