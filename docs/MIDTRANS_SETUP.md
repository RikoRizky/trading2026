# Setup Midtrans Payment Gateway

Dokumentasi ini menjelaskan cara mengintegrasikan Midtrans payment gateway dengan aplikasi trading platform.

## 1. Daftar Akun Midtrans

1. Kunjungi [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. Daftar akun baru atau login jika sudah ada
3. Pilih paket yang sesuai dengan kebutuhan bisnis

## 2. Konfigurasi Environment Variables

Tambahkan konfigurasi berikut ke file `.env.local`:

```env
# Midtrans Configuration
MIDTRANS_SERVER_KEY=your_midtrans_server_key
MIDTRANS_CLIENT_KEY=your_midtrans_client_key

# App URL untuk callback
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Cara Mendapatkan API Keys:

1. **Server Key**: 
   - Login ke Midtrans Dashboard
   - Pergi ke Settings > Access Keys
   - Copy Server Key (untuk backend)

2. **Client Key**:
   - Dari halaman yang sama
   - Copy Client Key (untuk frontend)

## 3. Webhook Configuration

### Setup Webhook URL di Midtrans Dashboard:

1. Login ke Midtrans Dashboard
2. Pergi ke Settings > Configuration
3. Set Webhook URL: `https://yourdomain.com/api/midtrans/webhook`
4. Enable webhook notifications untuk:
   - Payment notifications
   - Transaction status changes

## 4. Testing

### Sandbox Mode (Development):
- Gunakan sandbox credentials
- Test dengan kartu kredit test
- Webhook akan dikirim ke URL yang dikonfigurasi

### Production Mode:
- Ganti ke production credentials
- Update webhook URL ke domain production
- Test dengan transaksi real

## 5. Payment Flow

### Frontend Flow:
1. User memilih paket premium di `/upgrade`
2. Sistem redirect ke Midtrans payment page
3. User melakukan pembayaran
4. Midtrans redirect ke callback URL

### Backend Flow:
1. Webhook menerima notifikasi dari Midtrans
2. Sistem verifikasi signature webhook
3. Update status pembayaran di database
4. Update user membership ke premium
5. Set subscription end date sesuai paket

## 6. Callback URLs

Sistem menggunakan callback URLs berikut:

- **Success**: `/payment/success`
- **Pending**: `/payment/pending` 
- **Error**: `/payment/error`

## 7. Database Schema

Sistem menggunakan tabel berikut:

### Payments Table:
```sql
CREATE TABLE payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Profiles Table (Updated):
```sql
ALTER TABLE profiles 
ADD COLUMN subscription_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_plan TEXT DEFAULT '1month';
```

## 8. Subscription Plans

Sistem mendukung 3 paket subscription:

1. **1 Month** (30 hari) - Rp 50.000
2. **3 Months** (90 hari) - Rp 120.000 (Save 20%)
3. **1 Year** (365 hari) - Rp 400.000 (Save 33%)

## 9. Security Considerations

1. **Webhook Signature Verification**: Sistem memverifikasi signature webhook dari Midtrans
2. **HTTPS Required**: Pastikan webhook URL menggunakan HTTPS di production
3. **Environment Variables**: Jangan commit API keys ke repository
4. **Rate Limiting**: Implementasi rate limiting untuk API endpoints

## 10. Troubleshooting

### Common Issues:

1. **Webhook tidak diterima**:
   - Pastikan URL webhook accessible dari internet
   - Check firewall settings
   - Verify webhook URL di Midtrans dashboard

2. **Payment status tidak update**:
   - Check webhook signature verification
   - Verify database connection
   - Check error logs

3. **User tidak jadi premium**:
   - Check webhook handler logs
   - Verify user ID mapping
   - Check database permissions

### Debug Mode:

Enable debug logging dengan menambahkan:
```env
DEBUG_MIDTRANS=true
```

## 11. Production Checklist

- [ ] Environment variables configured
- [ ] Webhook URL set di Midtrans dashboard
- [ ] HTTPS enabled untuk production
- [ ] Database migrations applied
- [ ] Test payment flow end-to-end
- [ ] Monitor webhook delivery
- [ ] Setup error monitoring
- [ ] Backup database regularly

## 12. Support

Untuk bantuan lebih lanjut:
- [Midtrans Documentation](https://docs.midtrans.com/)
- [Midtrans Support](https://support.midtrans.com/)
- [API Reference](https://api-docs.midtrans.com/)
