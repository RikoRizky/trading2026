-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  payment_method TEXT NOT NULL DEFAULT 'qris',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add subscription fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT '1month' CHECK (subscription_plan IN ('1month', '3months', '1year'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to check subscription expiry
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
BEGIN
  -- Update expired subscriptions
  UPDATE profiles 
  SET 
    membership_type = 'free',
    subscription_start = NULL,
    subscription_end = NULL,
    updated_at = NOW()
  WHERE 
    membership_type = 'premium' 
    AND subscription_end IS NOT NULL 
    AND subscription_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically check expiry (can be called by cron job)
CREATE OR REPLACE FUNCTION auto_check_subscription_expiry()
RETURNS void AS $$
BEGIN
  PERFORM check_subscription_expiry();
END;
$$ LANGUAGE plpgsql;


