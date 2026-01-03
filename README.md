# TradingPlatform - Full-Stack Trading Web Application

A comprehensive full-stack trading platform that combines education, signal sharing, and community features for traders of all levels.

## 🚀 Features

### Core Features
- **Educational Content**: Blog articles, trading lessons, and market analysis
- **Trading Signals**: Free and premium trading signals with detailed analysis
- **Community Forum**: Discussion threads and real-time chat
- **Economic Calendar**: Important market events and news
- **Mentorship Booking**: Connect with experienced traders
- **User Authentication**: Secure sign-up/sign-in with social login options

### User Roles & Membership
- **Free Users**: Access to basic content, community features, and free signals
- **Premium Users**: Exclusive signals, advanced features, and priority support
- **Admin Panel**: Content and user management

### Technical Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live chat and notifications using Supabase Realtime
- **Secure Payments**: Stripe integration for subscriptions
- **Chart Integration**: TradingView widget for price charts
- **TypeScript**: Full type safety throughout the application

## 🛠 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

### Backend & Database
- **Supabase** (PostgreSQL, Auth, Realtime)
- **Row Level Security (RLS)** for data protection
- **Real-time subscriptions** for live features

### Payments & Integrations
- **Stripe** for payment processing
- **TradingView** widgets for charts
- **Email** support via SMTP

## 📁 Project Structure

```
trading-platform/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── env.example
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication pages
│   │   ├── (dashboard)/      # User dashboard
│   │   ├── (community)/      # Community features
│   │   ├── (content)/        # Blog, lessons, signals
│   │   ├── (admin)/          # Admin panel
│   │   ├── api/              # API routes
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── auth/             # Auth-related components
│   │   ├── charts/           # Chart components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   ├── admin/            # Admin components
│   │   └── providers/        # Context providers
│   ├── lib/
│   │   ├── supabase/         # Supabase configuration
│   │   ├── stripe/           # Stripe integration
│   │   ├── auth.ts           # Auth utilities
│   │   ├── utils.ts          # Helper functions
│   │   └── types.ts          # TypeScript types
│   └── hooks/
│       ├── useAuth.ts        # Auth hook
│       ├── useRealtime.ts    # Realtime hook
│       └── useMembership.ts  # Membership hook
└── tests/
    ├── __mocks__/
    ├── components/
    └── pages/
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd trading-platform
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Environment Setup
Copy the example environment file and fill in your credentials:

```bash
cp env.example .env.local
```

Update `.env.local` with your actual values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# TradingView Configuration
NEXT_PUBLIC_TRADINGVIEW_SYMBOL=BTCUSD

# Email Configuration (Optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
```

### 4. Database Setup

#### Option A: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase in your project
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Option B: Manual Setup
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Execute the SQL script

### 5. Configure Authentication
In your Supabase dashboard:
1. Go to Authentication > Settings
2. Configure your site URL: `http://localhost:3000`
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`
4. Enable email confirmations if desired

### 6. Run the Development Server
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Schema

### Core Tables
- **profiles**: User profiles (extends auth.users)
- **posts**: Articles, lessons, and signals
- **comments**: Post comments and replies
- **threads**: Community discussion threads
- **thread_replies**: Thread responses
- **mentorship_bookings**: Mentor-mentee bookings
- **chat_messages**: Real-time chat messages
- **stripe_customers**: Payment customer data
- **economic_events**: Economic calendar events

### Key Features
- Row Level Security (RLS) enabled on all tables
- Automatic profile creation on user signup
- Comprehensive indexing for performance
- JSON metadata for flexible signal data

## 🔐 Authentication Flow

1. **Sign Up**: Users register with email/password or Google OAuth
2. **Profile Creation**: Automatic profile creation with default settings
3. **Email Verification**: Optional email confirmation
4. **Session Management**: Secure session handling with Supabase Auth
5. **Protected Routes**: Server-side and client-side route protection

## 💳 Payment Integration

### Stripe Setup
1. Create products and prices in Stripe Dashboard
2. Configure webhooks for subscription events
3. Set up webhook endpoint at `/api/webhooks/stripe`

### Subscription Flow
1. User selects premium plan
2. Stripe Checkout session created
3. Payment processed
4. Webhook updates user membership
5. Access to premium features granted

## 🎨 UI Components

### Design System
- **Tailwind CSS** for utility-first styling
- **Custom component classes** for consistency
- **Responsive design** with mobile-first approach
- **Dark mode support** (ready for implementation)

### Key Components
- Navigation bar with user menu
- Card layouts for content
- Form components with validation
- Loading states and skeletons
- Toast notifications

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Type checking
npm run type-check
```

## 📱 Mobile Responsiveness

The application is built with a mobile-first approach:
- Responsive navigation with hamburger menu
- Touch-friendly interface elements
- Optimized layouts for all screen sizes
- Progressive Web App ready

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Static export with serverless functions
- **Railway**: Full-stack deployment
- **DigitalOcean**: Custom server setup

## 📈 Performance Optimizations

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Supabase query caching and browser caching
- **Lazy Loading**: Component and route lazy loading
- **Bundle Analysis**: Built-in bundle analyzer

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Input Validation**: Form validation and sanitization
- **CSRF Protection**: Built-in Next.js CSRF protection
- **Secure Headers**: Security headers configuration
- **Environment Variables**: Sensitive data protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Open an issue on GitHub
- **Discord**: Join our community Discord server
- **Email**: Contact support@tradingplatform.com

## 🗺 Roadmap

### Phase 1 (Current)
- ✅ Authentication system
- ✅ Basic content management
- ✅ Signal posting (free)
- ✅ Community features

### Phase 2 (Next)
- 🔄 Stripe payment integration
- 🔄 Premium signal features
- 🔄 Real-time chat
- 🔄 Mentorship booking

### Phase 3 (Future)
- 📋 Advanced analytics
- 📋 Mobile app
- 📋 API for third-party integrations
- 📋 Advanced charting tools

## 🙏 Acknowledgments

- **Supabase** for the amazing backend-as-a-service
- **Vercel** for the excellent deployment platform
- **Tailwind CSS** for the utility-first CSS framework
- **Next.js** team for the fantastic React framework

---

**Happy Trading! 📈**

