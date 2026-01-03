-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE membership_type AS ENUM ('free', 'premium');
CREATE TYPE post_type AS ENUM ('article', 'lesson', 'signal');
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE session_type AS ENUM ('call', 'video', 'in-person');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  membership_type membership_type DEFAULT 'free',
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  bio TEXT,
  website TEXT,
  twitter_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table (articles, lessons, signals)
CREATE TABLE public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  type post_type NOT NULL,
  status post_status DEFAULT 'draft',
  is_premium BOOLEAN DEFAULT false,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  featured_image_url TEXT,
  tags TEXT[],
  metadata JSONB, -- For signal-specific data like market, timeframe, etc.
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community threads
CREATE TABLE public.threads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thread replies
CREATE TABLE public.thread_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentorship bookings
CREATE TABLE public.mentorship_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_type session_type NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status booking_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe customers
CREATE TABLE public.stripe_customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Economic calendar events
CREATE TABLE public.economic_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  importance TEXT CHECK (importance IN ('low', 'medium', 'high')) DEFAULT 'medium',
  currency TEXT,
  country TEXT,
  actual_value TEXT,
  forecast_value TEXT,
  previous_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_posts_type_status ON public.posts(type, status);
CREATE INDEX idx_posts_author ON public.posts(author_id);
CREATE INDEX idx_posts_published_at ON public.posts(published_at DESC);
CREATE INDEX idx_posts_is_premium ON public.posts(is_premium);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_author_id ON public.comments(author_id);
CREATE INDEX idx_threads_category ON public.threads(category);
CREATE INDEX idx_threads_author_id ON public.threads(author_id);
CREATE INDEX idx_thread_replies_thread_id ON public.thread_replies(thread_id);
CREATE INDEX idx_chat_messages_room_name ON public.chat_messages(room_name);
CREATE INDEX idx_economic_events_date ON public.economic_events(date);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Users can view published posts" ON public.posts
  FOR SELECT USING (
    status = 'published' AND 
    (is_premium = false OR 
     EXISTS (
       SELECT 1 FROM public.profiles 
       WHERE id = auth.uid() AND membership_type = 'premium'
     ))
  );

CREATE POLICY "Authors can view own posts" ON public.posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authors can insert posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Users can view approved comments" ON public.comments
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Threads policies
CREATE POLICY "Users can view all threads" ON public.threads
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert threads" ON public.threads
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own threads" ON public.threads
  FOR UPDATE USING (auth.uid() = author_id);

-- Thread replies policies
CREATE POLICY "Users can view thread replies" ON public.thread_replies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert replies" ON public.thread_replies
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Chat messages policies
CREATE POLICY "Users can view chat messages" ON public.chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Mentorship bookings policies
CREATE POLICY "Users can view own bookings" ON public.mentorship_bookings
  FOR SELECT USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

CREATE POLICY "Users can insert bookings" ON public.mentorship_bookings
  FOR INSERT WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Users can update own bookings" ON public.mentorship_bookings
  FOR UPDATE USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

-- Economic events policies (public read)
CREATE POLICY "Anyone can view economic events" ON public.economic_events
  FOR SELECT USING (true);

-- Stripe customers policies
CREATE POLICY "Users can view own stripe customer" ON public.stripe_customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stripe customer" ON public.stripe_customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions and triggers

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.economic_events (title, description, date, importance, currency, country) VALUES
('Non-Farm Payrolls', 'Change in the number of employed people during the previous month', NOW() + INTERVAL '7 days', 'high', 'USD', 'United States'),
('Consumer Price Index', 'Change in the price of goods and services purchased by consumers', NOW() + INTERVAL '14 days', 'high', 'USD', 'United States'),
('Interest Rate Decision', 'Central bank interest rate decision', NOW() + INTERVAL '21 days', 'high', 'EUR', 'Eurozone');

