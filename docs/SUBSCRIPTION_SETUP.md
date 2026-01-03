# Subscription System Setup

## Overview
Sistem subscription dengan pembayaran QRIS dan auto-expiry setelah 30 hari.

## Features
- ✅ Pembayaran QRIS untuk upgrade premium
- ✅ Masa berlaku 30 hari otomatis
- ✅ Auto-expiry setelah masa berlaku habis
- ✅ Real-time status subscription di dashboard
- ✅ Notifikasi sebelum expiry

## Database Schema

### Tabel `payments`
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'qris',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabel `profiles` (updated)
```sql
ALTER TABLE profiles 
ADD COLUMN subscription_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_end TIMESTAMP WITH TIME ZONE;
```

## API Endpoints

### 1. Create Payment
```
POST /api/payment/create
Body: { amount, description, userId }
Response: { success, paymentId, qrCode, expiresAt }
```

### 2. Check Payment Status
```
GET /api/payment/status/[paymentId]
Response: { success, status }
```

### 3. Check Subscription Expiry
```
POST /api/subscription/check-expiry
Response: { success, expiredCount, message }
```

## Flow Pembayaran

1. **User klik "Upgrade Now"** → Redirect ke `/payment`
2. **Generate QR Code** → User scan dengan e-wallet
3. **Payment Verification** → Check status setiap 10 detik
4. **Success** → Update membership ke premium + set expiry 30 hari
5. **Auto-expiry** → Cron job check dan downgrade ke free

## Setup Cron Job

### Option 1: Server Cron
```bash
# Edit crontab
crontab -e

# Add this line to run every hour
0 * * * * cd /path/to/your/project && npm run check-subscriptions

# Or every day at midnight
0 0 * * * cd /path/to/your/project && npm run check-subscriptions
```

### Option 2: Vercel Cron (if using Vercel)
Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/subscription/check-expiry",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Option 3: External Cron Service
- GitHub Actions
- AWS Lambda with EventBridge
- Google Cloud Scheduler

## Environment Variables

```env
# Required for cron script
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
```

## Testing

### Manual Test
```bash
# Run subscription check manually
npm run check-subscriptions
```

### API Test
```bash
# Test payment creation
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "description": "Test", "userId": "user-id"}'

# Test subscription check
curl -X POST http://localhost:3000/api/subscription/check-expiry
```

## Security Notes

1. **RLS Policies**: Payments table has proper RLS policies
2. **Service Role**: Cron script uses service role key
3. **Validation**: All inputs are validated
4. **Expiry Check**: Automatic cleanup of expired payments

## Monitoring

### Logs to Monitor
- Payment creation success/failure
- Subscription expiry updates
- Failed payment verifications

### Metrics to Track
- Daily active premium users
- Payment success rate
- Subscription renewal rate

## Troubleshooting

### Common Issues

1. **QR Code not generating**
   - Check Supabase connection
   - Verify user authentication

2. **Payment not updating**
   - Check payment gateway integration
   - Verify webhook endpoints

3. **Subscription not expiring**
   - Check cron job is running
   - Verify database permissions

### Debug Commands
```bash
# Check subscription status
SELECT id, membership_type, subscription_end FROM profiles WHERE membership_type = 'premium';

# Check recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

# Check expired subscriptions
SELECT * FROM profiles WHERE membership_type = 'premium' AND subscription_end < NOW();
```


