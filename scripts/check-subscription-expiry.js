#!/usr/bin/env node

/**
 * Script to check and update expired subscriptions
 * This can be run as a cron job every hour or daily
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSubscriptionExpiry() {
  try {
    console.log('Checking for expired subscriptions...');
    
    // Get expired subscriptions
    const { data: expiredSubscriptions, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, email, subscription_end')
      .eq('membership_type', 'premium')
      .not('subscription_end', 'is', null)
      .lt('subscription_end', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      return;
    }

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      console.log('No expired subscriptions found');
      return;
    }

    console.log(`Found ${expiredSubscriptions.length} expired subscriptions`);

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
      return;
    }

    console.log(`Successfully updated ${expiredSubscriptions.length} expired subscriptions to free`);
    
    // Log the affected users
    expiredSubscriptions.forEach(user => {
      console.log(`- ${user.full_name} (${user.email}) - Expired: ${user.subscription_end}`);
    });

  } catch (error) {
    console.error('Error in checkSubscriptionExpiry:', error);
  }
}

// Run the check
checkSubscriptionExpiry()
  .then(() => {
    console.log('Subscription expiry check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });


