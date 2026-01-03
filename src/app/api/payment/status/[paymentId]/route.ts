import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { paymentId } = params;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Check if payment is expired
    const now = new Date();
    const expiresAt = new Date(payment.expires_at);
    
    if (now > expiresAt && payment.status === 'pending') {
      // Update payment status to expired
      await supabase
        .from('payments')
        .update({ status: 'expired' })
        .eq('id', paymentId);
      
      return NextResponse.json({
        success: true,
        status: 'expired'
      });
    }

    // Check payment status with Midtrans if payment method is midtrans
    if (payment.status === 'pending' && payment.payment_method === 'midtrans') {
      try {
        const { verifyPayment } = await import('@/lib/paymentGateway');
        const verificationResult = await verifyPayment(paymentId, 'midtrans');
        
        if (verificationResult.status === 'paid') {
          // Update payment status to paid
          await supabase
            .from('payments')
            .update({ 
              status: 'paid',
              paid_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentId);

          // Calculate subscription duration based on plan
          const planDuration = getPlanDuration(payment.description);
          const subscriptionEndDate = new Date();
          subscriptionEndDate.setDate(subscriptionEndDate.getDate() + planDuration);

          // Get subscription plan from payment description
          const subscriptionPlan = getSubscriptionPlan(payment.description);

          // Update user membership
          await supabase
            .from('profiles')
            .update({
              membership_type: 'premium',
              subscription_start: new Date().toISOString(),
              subscription_end: subscriptionEndDate.toISOString(),
              subscription_plan: subscriptionPlan,
              updated_at: new Date().toISOString()
            })
            .eq('id', payment.user_id);

          return NextResponse.json({
            success: true,
            status: 'paid'
          });
        } else if (verificationResult.status === 'failed') {
          await supabase
            .from('payments')
            .update({ 
              status: 'failed',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentId);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
      }
    } else if (payment.status === 'pending' && payment.payment_method === 'qris') {
      // Simulate payment verification for QRIS (demo purposes)
      const shouldSucceed = Math.random() > 0.7; // 30% chance of success
      
      if (shouldSucceed) {
        // Update payment status to paid
        await supabase
          .from('payments')
          .update({ 
            status: 'paid',
            paid_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId);

        // Update user membership
        const subscriptionEndDate = new Date();
        subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // 30 days from now

        await supabase
          .from('profiles')
          .update({
            membership_type: 'premium',
            subscription_start: new Date().toISOString(),
            subscription_end: subscriptionEndDate.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.user_id);

        return NextResponse.json({
          success: true,
          status: 'paid'
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: payment.status
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
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


