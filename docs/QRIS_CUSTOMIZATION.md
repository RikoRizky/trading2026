# QRIS Customization Guide

## 📍 Lokasi File QRIS

### 1. **Tampilan QRIS (Frontend)**
**File**: `src/app/(dashboard)/payment/page.tsx`
- **Baris 175-192**: Tampilan QR Code
- **Baris 181-187**: Image QR Code
- **Baris 188-190**: Payment ID display

### 2. **Generate QRIS (Backend)**
**File**: `src/app/api/payment/create/route.ts`
- **Baris 31**: Generate QR Code function call

### 3. **Payment Gateway Logic**
**File**: `src/lib/paymentGateway.ts`
- **Baris 30-40**: Gateway selection
- **Baris 45-70**: Custom QRIS implementation
- **Baris 75-120**: Midtrans implementation
- **Baris 125-160**: Xendit implementation

## 🔧 Cara Mengubah QRIS

### **Opsi 1: Menggunakan Payment Gateway Real**

#### **A. Midtrans (Recommended)**
1. **Daftar di Midtrans**: https://dashboard.midtrans.com/
2. **Setup Environment**:
   ```env
   MIDTRANS_SERVER_KEY=SB-Mid-server-your-key
   MIDTRANS_CLIENT_KEY=SB-Mid-client-your-key
   PAYMENT_GATEWAY=midtrans
   ```
3. **QRIS otomatis generate** dari Midtrans API

#### **B. Xendit**
1. **Daftar di Xendit**: https://dashboard.xendit.co/
2. **Setup Environment**:
   ```env
   XENDIT_SECRET_KEY=xnd_public_development-your-key
   XENDIT_PUBLIC_KEY=xnd_public_development-your-key
   PAYMENT_GATEWAY=xendit
   ```

#### **C. DANA**
1. **Daftar di DANA**: https://developer.dana.id/
2. **Setup Environment**:
   ```env
   DANA_MERCHANT_ID=your_merchant_id
   DANA_SECRET_KEY=your_secret_key
   PAYMENT_GATEWAY=dana
   ```

### **Opsi 2: Custom QRIS (Manual)**

#### **A. Menggunakan Library QR Code**
```bash
npm install qrcode @types/qrcode
```

**Update file**: `src/lib/paymentGateway.ts`
```typescript
// Di function generateCustomQRIS
const QRCode = require('qrcode');
const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
  width: 256,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});
```

#### **B. Menggunakan QRIS Provider Lain**
**Update file**: `src/lib/paymentGateway.ts`
```typescript
async function generateCustomQRIS(paymentId: string, amount: number, description: string) {
  // Implementasi provider QRIS Anda di sini
  const response = await fetch('https://api.your-qris-provider.com/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.YOUR_PROVIDER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      paymentId,
      amount,
      description,
      merchantId: process.env.YOUR_MERCHANT_ID
    })
  });
  
  const data = await response.json();
  return data.qrCodeUrl;
}
```

### **Opsi 3: Static QRIS (Untuk Testing)**

**Update file**: `src/lib/paymentGateway.ts`
```typescript
function generateStaticQRCode(paymentId: string, amount: number): string {
  // Buat QR code manual dengan data yang Anda inginkan
  const qrData = `QRIS|${paymentId}|${amount}|Your Merchant Name|Premium Subscription`;
  
  // Generate QR code menggunakan library atau API
  return `data:image/png;base64,${generateQRCodeBase64(qrData)}`;
}
```

## 🎨 Customize Tampilan QRIS

### **1. Mengubah Ukuran QR Code**
**File**: `src/app/(dashboard)/payment/page.tsx`
```tsx
<img 
  src={qrCode} 
  alt="QR Code Pembayaran" 
  className="w-64 h-64 mx-auto" // Ubah dari w-48 h-48 ke ukuran yang diinginkan
/>
```

### **2. Mengubah Styling Container**
**File**: `src/app/(dashboard)/payment/page.tsx`
```tsx
<div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300">
  {/* Ubah styling di sini */}
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300">
    {/* QR Code content */}
  </div>
</div>
```

### **3. Mengubah Text dan Instructions**
**File**: `src/app/(dashboard)/payment/page.tsx`
```tsx
<p className="text-gray-600 mb-4">
  {/* Ubah text instruksi di sini */}
  Scan QR Code dengan aplikasi e-wallet favorit Anda
</p>
```

## 🔄 Update Payment Verification

### **File**: `src/app/api/payment/status/[paymentId]/route.ts`

**Untuk Payment Gateway Real**:
```typescript
import { verifyPayment } from '@/lib/paymentGateway';

// Di dalam function GET
const paymentStatus = await verifyPayment(paymentId, 'midtrans');
```

## 📱 Testing QRIS

### **1. Test dengan E-Wallet**
- Scan QR code dengan GoPay, OVO, DANA, dll
- Pastikan amount dan merchant name benar

### **2. Test dengan QR Scanner**
- Gunakan aplikasi QR scanner
- Verify data yang di-encode benar

### **3. Test Payment Flow**
```bash
# Test create payment
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "description": "Test Payment", "userId": "test-user"}'

# Test payment status
curl http://localhost:3000/api/payment/status/PAY_1234567890
```

## 🚀 Production Setup

### **1. Environment Variables**
```env
# Production
NODE_ENV=production
MIDTRANS_SERVER_KEY=your_production_server_key
MIDTRANS_CLIENT_KEY=your_production_client_key
PAYMENT_GATEWAY=midtrans
```

### **2. SSL Certificate**
- Pastikan domain menggunakan HTTPS
- QRIS memerlukan HTTPS untuk production

### **3. Webhook Setup**
- Setup webhook dari payment gateway
- Handle payment notifications

## 🔍 Troubleshooting

### **Common Issues**

1. **QR Code tidak muncul**
   - Check API response
   - Verify payment gateway credentials
   - Check network connection

2. **QR Code tidak bisa di-scan**
   - Verify QR code format
   - Check e-wallet compatibility
   - Test dengan QR scanner lain

3. **Payment tidak terverifikasi**
   - Check webhook endpoint
   - Verify payment gateway status
   - Check database connection

### **Debug Commands**
```bash
# Check payment creation
console.log('QR Code generated:', qrCode);

# Check payment verification
console.log('Payment status:', paymentStatus);

# Check database
SELECT * FROM payments WHERE id = 'PAY_1234567890';
```


