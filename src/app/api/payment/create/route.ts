import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { generateQRISCode } from '@/lib/paymentGateway';

export async function POST(request: NextRequest) {
  try {
    const { amount, description, userId } = await request.json();

    // Validate input
    if (!amount || !description || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if user exists and is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate payment ID
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate QR Code using real payment gateway
    const qrCode = await generateQRISCode(paymentId, amount, description);
    
    // Store payment in database
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        id: paymentId,
        user_id: userId,
        amount: amount,
        description: description,
        status: 'pending',
        payment_method: 'qris',
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error creating payment:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      qrCode: qrCode,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
