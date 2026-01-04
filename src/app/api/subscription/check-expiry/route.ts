import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // Check for expired subscriptions
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('membership_type', 'premium')
      .not('subscription_end', 'is', null)
      .lt('subscription_end', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch expired subscriptions' },
        { status: 500 }
      );
    }

    if (expiredSubscriptions && expiredSubscriptions.length > 0) {
      // Update expired subscriptions to free
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          membership_type: 'free',
          subscription_start: null,
          subscription_end: null,
          updated_at: new Date().toISOString()
        })
        .eq('membership_type', 'premium')
        .not('subscription_end', 'is', null)
        .lt('subscription_end', new Date().toISOString());

      if (updateError) {
        console.error('Error updating expired subscriptions:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update expired subscriptions' },
          { status: 500 }
        );
      }

      console.log(`Updated ${expiredSubscriptions.length} expired subscriptions to free`);
    }

    return NextResponse.json({
      success: true,
      expiredCount: expiredSubscriptions?.length || 0,
      message: `Checked and updated ${expiredSubscriptions?.length || 0} expired subscriptions`
    });

  } catch (error) {
    console.error('Subscription expiry check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


