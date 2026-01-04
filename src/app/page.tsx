"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import * as Accordion from "@radix-ui/react-accordion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Controller ,Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { showSuccess } from '@/lib/swal';

import { 
  VideoCameraIcon,
  BoltIcon,
  BookOpenIcon, 
  UsersIcon,
  LightBulbIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  UserPlusIcon,
  WalletIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [membership, setMembership] = useState<any>(null);
  const [mainSwiper, setMainSwiper] = useState<any>(null);
  const [subSwiper, setSubSwiper] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);

  // Check for login success message - using window.location instead of useSearchParams to avoid SSR issues
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const loginSuccess = urlParams.get('login');
      if (loginSuccess === 'success') {
        showSuccess("Berhasil login!").then(() => {
          // Remove query parameter and refresh
          window.history.replaceState({}, '', window.location.pathname);
          window.location.reload();
        });
      }
    }
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      setUser(auth.user);

      const { data } = await supabase
        .from("profiles")
        .select("membership_type")
        .eq("id", auth.user.id)
        .single();

      setMembership(data?.membership_type);
    }

    async function loadTestimonials() {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTestimonials(data || []);
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setTestimonialsLoading(false);
      }
    }

    loadUser();
    loadTestimonials();
  }, []);

  // kondisi CTA
  let ctaHref = "/login";
  let showCTA = true;

  if (user && membership === "free") {
    ctaHref = "/upgrade";
  }

  if (user && membership === "premium") {
    showCTA = false;
  }

  const features = [
    {
      icon: BookOpenIcon,
      title: "Educational Content",
      description:
        "Access comprehensive trading lessons, market analysis, and educational articles from experienced traders.",
    },
    {
      icon: BookOpenIcon,
      title: "Exclusive Content",
      description:
        "Access members-only premium materials, courses, and expert insights.",
    },

    {
      icon: UsersIcon,
      title: "Community Forum",
      description:
        "Connect with fellow traders, share insights, and learn from experienced mentors in our active community.",
    },
    {
        icon: UsersIcon, 
        title: "Dedicated 24/7 Support",
        description:
          "Dapatkan bantuan instan dan dukungan teknis kapan saja, memastikan Anda tidak pernah melewatkan peluang pasar.",
    },
    {
      icon: BoltIcon,  
      title: "Real-Time Expert Signals",
      description:
      "Get instant, verified trading alerts and entry/exit points from our seasoned analysts. Trade smarter, not harder.",
    },
    {
      icon: VideoCameraIcon, 
      title: "Live Mentorship & Q&A",
      description:
      "Join weekly live sessions to watch experts trade, review the market, and get your questions answered instantly.",
     },
    {
      icon: LightBulbIcon,
      title: "Project-Based Learning",
      description: "Build real projects to level up your portfolio.",
    },
    {
      icon: GlobeAltIcon,
      title: "Global Access",
      description: "All tools & content available wherever you are.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Traders", icon: "ti-user" },
    { value: "500+", label: "Educational Articles", icon: "ti-book" },
    { value: "95%", label: "Student Satisfaction", icon: "ti-stats-up" },
    { value: "12K+", label: "Transaction Per Hour", icon: "ti-time" },
  ];

  const faqItems = [
    {
      question: "Apa itu layanan ini?",
      answer:
        "Ini adalah platform terbaik untuk belajar skill digital secara fleksibel dan terarah.",
    },
    {
      question: "Apakah ada sertifikat?",
      answer:
        "Ya, setiap peserta berhak mendapatkan sertifikat setelah menyelesaikan kelas.",
    },
    {
      question: "Apakah bisa refund?",
      answer:
        "Refund dapat dilakukan maksimal 7 hari setelah pembelian jika memenuhi syarat.",
    },
    {
      question: "Bagaimana metode pembayarannya?",
      answer:
        "Kami mendukung pembayaran melalui e-wallet, bank transfer, dan virtual account.",
    },
  ];

  const howItWorks = [
  {
    number: "01",
    icon: <UserPlusIcon className="w-7 h-7 text-white" />,
    title: "Create Your Account",
    description:
      "Sign up in minutes with our streamlined onboarding process. No complicated forms or lengthy verification.",
  },
  {
    number: "02",
    icon: <WalletIcon className="w-7 h-7 text-white" />,
    title: "Fund Your Wallet",
    description:
      "Deposit crypto or fiat with multiple payment options. Enjoy zero fees and instant processing.",
  },
  {
    number: "03",
    icon: <BookOpenIcon className="w-7 h-7 text-white" />,
    title: "Start Learning & Trading",
    description:
      "Access 50+ assets and start trading instantly with real-time market data and premium tools.",
  },
];



  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-crypto-purple/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-crypto-light-purple/10 rounded-full filter blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 animate-fade-in-left">
            {/* ✅ Judul */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-gray-900">
              Master Trading with
              <span className="text-primary-600"> Expert Guidance</span>
            </h1>

            {/* ✅ Paragraf */}
            <p className="mt-6 text-lg text-white max-w-lg leading-relaxed">
              Join thousands of traders who rely on our comprehensive platform
              for education and community support. Start your journey to
              trading success today.
            </p>

            {/* ✅ CTA buttons (Conditional based on membership) */}
              {showCTA && (
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href={ctaHref}
                    className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition inline-flex items-center justify-center"
                  >
                    {user && membership === "free" ? "Upgrade Premium" : "Get Started"}
                  </Link>

                  <Link
                    href={ctaHref}
                    className="px-6 py-3 border border-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center"
                  >
                    Learn More
                  </Link>
                </div>
              )}

            {/* ✅ Trust Indicators (replace old stats) */}
            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-success-500 mr-1" />
                Free to start
              </div>

              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-success-500 mr-1" />
                No credit card required
              </div>

              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-success-500 mr-1" />
                Cancel anytime
              </div>
            </div>
          </div>


          <div className="lg:w-1/2 mt-12 lg:mt-0 animate-fade-in-right">
            <div className="relative max-w-md mx-auto animate-float">
              <img 
                src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&h=800"
                alt="Trading platform dashboard" 
                className="rounded-xl shadow-2xl border border-white/10"
              />
              <div className="absolute -right-6 -bottom-6 bg-crypto-purple/20 backdrop-blur-md rounded-lg p-4 border border-crypto-purple/30 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">24h Change</p>
                    <p className="text-lg font-bold text-green-500">+12.34%</p>
                  </div>
                </div>
              </div>
              <div className="absolute -left-6 -top-6 bg-crypto-purple/20 backdrop-blur-md rounded-lg p-4 border border-crypto-purple/30 shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-crypto-purple/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-crypto-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-700">Security Level</p>
                    <p className="text-lg font-bold text-white">Enterprise</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark"/>
        <div className="relative container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.12 }}
                whileHover={{ scale: 1.05 }}
                className="
                  relative text-center py-10 group cursor-default
                  transition-all duration-300
                "
              >
               
                <i
                  className={`${stat.icon} 
                    absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2
                    text-white/10 text-7xl md:text-8xl
                    animate-pulseSlow
                    transition-all duration-500
                    group-hover:text-white/20
                    group-hover:scale-110
                  `}
                />

                {/* VALUE */}
                <div className="relative z-10 text-3xl md:text-4xl font-bold transition-all duration-300 group-hover:-translate-y-1">
                  {stat.value}
                </div>

                {/* LABEL */}
                <div className="relative z-10 text-gray-200 font-medium text-sm md:text-base transition-all duration-300 group-hover:-translate-y-1">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated BG */}
         <div className="absolute inset-0 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark"/>

        <div className="relative container">

          {/* Heading */}
          <div className="text-center mb-16">
            <p className="text-xl text-white/90 mb-2 pb-4 relative
              after:content-[''] after:w-8 after:h-0.5 after:bg-white
              after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2"
            >
              Always by <span className="text-white font-semibold">your side</span>
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Everything You Need to Succeed
            </h2>
          </div>

          {/* CARD GRID */}
          <div
            className="
              border 
              border-white/30
              rounded-3xl 
              py-16 
              px-10 
              backdrop-blur-md 
              bg-white/10
              grid 
              lg:grid-cols-4 
              md:grid-cols-3
              sm:grid-cols-2
              grid-cols-2
              gap-10
            "
          >
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="
                  text-center 
                  flex 
                  flex-col 
                  items-center 
                "
              >

                {/* Icon */}
                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full w-fit mb-4">
                  <feature.icon className="h-10 w-10 text-white" />
                </div>

                {/* CONTENT WRAPPER → SET HEIGHT */}
                <div className="flex flex-col items-center min-h-[150px]">
                  <h4 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h4>

                  <p className="text-white/80 text-sm max-w-xs mx-auto">
                    {feature.description}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-20 overflow-hidden text-white">
        {/* BG animasi sama seperti section stats */}
         <div className="absolute inset-0 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark"/>

        <div className="relative container">

          {/* Heading */}
          <div className="text-center mb-16">
            <p className="text-xl text-white/90 mb-2 pb-4 relative after:content-[''] after:w-8 after:h-0.5 after:bg-white after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2">
              Simple & Powerful
            </p>

            <h2 className="text-3xl md:text-4xl font-bold text-white">
              How It Works
            </h2>
          </div>

          {/* Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="
                  relative 
                  bg-white/10 
                  border border-white/20 
                  backdrop-blur-md 
                  rounded-xl 
                  p-8
                "
              >
                {/* Number */}
                <span
                  className="
                    absolute -top-4 -left-4 
                    bg-white/20 
                    border border-white/30 
                    rounded-md 
                    text-white 
                    font-bold 
                    text-lg 
                    px-3 py-1
                  "
                >
                  {step.number}
                </span>

                {/* Icon */}
                <div
                  className="
                    bg-white/20 
                    rounded-xl 
                    w-12 h-12 
                    flex items-center justify-center 
                    mb-6
                  "
                >
                  {step.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-4 text-white">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-white/80 text-sm">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
          {showCTA && (
          <div className="mt-8 flex justify-center">
            <Link
              href={ctaHref}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition inline-flex items-center justify-center"
            >
              {user && membership === "free" ? "Upgrade Premium" : "Get Started"}
            </Link>
          </div>
        )}
        </div>
      </section>

      {/*  Testimonials Section */}
      <section className="py-20 relative overflow-hidden text-white">
        {/* BACKGROUND */}
         <div className="absolute inset-0 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark"/>

        <div className="container relative mx-auto">
          {/* Heading */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              What Our Traders Say
            </h2>
            <p className="text-white/80 text-lg">
              Join thousands of successful traders who trust our platform
            </p>
          </div>

          {/* SLIDER */}
          {testimonialsLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : testimonials.length > 0 ? (
            <Swiper
              modules={[Autoplay, Navigation, Pagination]}
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
              }}
              navigation={{
                nextEl: ".swiper-next",
                prevEl: ".swiper-prev",
              }}
              pagination={{
                el: ".swiper-pagination",
                clickable: true,
              }}
              spaceBetween={24}
              loop
            >
              {testimonials.map((item, index) => (
                <SwiperSlide key={index}>
                  {/* CARD */}
                  <div
                    className="
                      bg-white/10 border border-white/20
                      backdrop-blur-md
                      rounded-xl p-10
                    "
                  >
                    <div
                      className="
                        grid grid-cols-1 md:grid-cols-2 gap-10
                        items-center justify-center
                      "
                    >
                      {/* LEFT — Avatar + Name */}
                      <div className="flex flex-col items-center md:items-start gap-4 md:ml-10 transition-all">

                        <img
                          src={item.avatar || '/default-avatar.png'}
                          alt={item.name}
                          className="
                            w-24 h-24 rounded-full
                            border border-white/40 shadow-md
                            object-cover
                          "
                        />

                        <div className="text-center md:text-left">
                          <h4 className="text-xl font-semibold">{item.name}</h4>
                        </div>
                      </div>

                      {/* RIGHT — Quote */}
                      <div>
                        <p className="text-xl italic text-white/90">
                          "{item.content}"
                        </p>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="text-center py-20">
              <p className="text-white/80 text-lg">No testimonials available yet.</p>
            </div>
          )}

          {/* NAVIGATION + PAGINATION */}
          <div className="mt-10 flex items-center justify-center gap-6">
            {/* ARROW LEFT */}
            <button
              className="
                swiper-prev w-10 h-10 rounded-full 
                border border-white/40 
                flex items-center justify-center
                hover:bg-white/20 transition
              "
            >
              <span className="text-white text-lg">‹</span>
            </button>

            {/* BULLET PAGINATION */}
            <div className="swiper-pagination !static"></div>

            {/* ARROW RIGHT */}
            <button
              className="
                swiper-next w-10 h-10 rounded-full 
                border border-white/40 
                flex items-center justify-center
                hover:bg-white/20 transition
              "
            >
              <span className="text-white text-lg">›</span>
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark">
        <div className="container max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {/* Frequently Asked Questions */}
              FAQ
            </h2>
            <p className="text-gray-600 text-lg">
              Pertanyaan yang sering ditanyakan oleh para pengguna
            </p>
          </div>

          <Accordion.Root
            type="single"
            collapsible
            className="space-y-4"
          >
            {faqItems.map((item, i) => (
              <Accordion.Item
                key={i}
                value={`faq-${i}`}
                className="backdrop-blur-md rounded-xl border shadow-sm overflow-hidden"
              >
                <Accordion.Header>
                  <Accordion.Trigger
                    className="
                      group w-full flex justify-between items-center p-5
                      text-left font-semibold text-gray-800
                      hover:bg-white/10
                    "
                  >
                    {item.question}

                    <ChevronDown
                      className="h-5 w-5 text-gray-600 transition-transform duration-300"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Content
                  className="
                    data-[state=closed]:animate-accordion-up
                    data-[state=open]:animate-accordion-down
                    overflow-hidden
                  "
                >
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 pt-0 text-gray-600 leading-relaxed"
                  >
                    {item.answer}
                  </motion.div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>

    </div>
  );
}
