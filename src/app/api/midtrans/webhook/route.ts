import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerClient();

    // Verify webhook signature per Midtrans docs:
    // sha512(order_id + status_code + gross_amount + serverKey)
    const signature = request.headers.get('x-midtrans-signature');
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    if (!serverKey) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY is not configured' }, { status: 500 });
    }

    const { order_id: signatureOrderId, status_code: signatureStatusCode, gross_amount: signatureGrossAmount } = body || {};
    if (signature && signatureOrderId && signatureStatusCode && signatureGrossAmount) {
      const payload = `${signatureOrderId}${signatureStatusCode}${signatureGrossAmount}${serverKey}`;
      const expectedSignature = crypto.createHash('sha512').update(payload).digest('hex');
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const { order_id, transaction_status, fraud_status, payment_type } = body;

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', order_id)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', order_id);
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Handle different transaction statuses
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        // Payment successful - update user to premium
        await handleSuccessfulPayment(supabase, payment, body);
      } else if (fraud_status === 'challenge') {
        // Payment under review
        await supabase
          .from('payments')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id);
      } else {
        // Payment denied
        await supabase
          .from('payments')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', order_id);
      }
    } else if (transaction_status === 'pending') {
      // Payment pending
      await supabase
        .from('payments')
        .update({ 
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);
    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      // Payment failed
      await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSuccessfulPayment(supabase: any, payment: any, webhookData: any) {
  try {
    // Update payment status
    await supabase
      .from('payments')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    // Calculate subscription duration based on plan
    const planDuration = getPlanDuration(payment.description);
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + planDuration);

    // Get subscription plan from payment description
    const subscriptionPlan = getSubscriptionPlan(payment.description);

    // Update user profile to premium
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        membership_type: 'premium',
        subscription_start: new Date().toISOString(),
        subscription_end: subscriptionEndDate.toISOString(),
        subscription_plan: subscriptionPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.user_id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    console.log(`User ${payment.user_id} upgraded to premium until ${subscriptionEndDate.toISOString()}`);
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

function getPlanDuration(description: string): number {
  if (description.includes('1 Month') || description.includes('30 days')) {
    return 30;
  } else if (description.includes('3 Months') || description.includes('90 days')) {
    return 90;
  } else if (description.includes('1 Year') || description.includes('365 days')) {
    return 365;
  }
  return 30; // Default to 30 days
}

function getSubscriptionPlan(description: string): string {
  if (description.includes('1 Month') || description.includes('30 days')) {
    return '1month';
  } else if (description.includes('3 Months') || description.includes('90 days')) {
    return '3months';
  } else if (description.includes('1 Year') || description.includes('365 days')) {
    return '1year';
  }
  return '1month'; // Default to 1 month
}
