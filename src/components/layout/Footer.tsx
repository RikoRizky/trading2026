import Link from 'next/link';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import { FaTwitter, FaDiscord, FaYoutube, FaTelegram } from "react-icons/fa";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Platform: [
      { name: 'Blog', href: '/blog' },
      { name: 'Lessons', href: '/lessons' },
      { name: 'Community', href: '/community' },
      { name: 'AI', href: '/ai' },
    ],
    Support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Documentation', href: '/docs' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' },
      { name: 'Disclaimer', href: '/disclaimer' },
    ],
  };

const socialLinks = [
  { name: "Discord", href: "#", icon: <FaDiscord className="w-5 h-5" /> },
  { name: "YouTube", href: "#", icon: <FaYoutube className="w-5 h-5" /> },
  { name: "Telegram", href: "#", icon: <FaTelegram className="w-5 h-5" /> },
];

  return (
    <footer className="bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark text-white border-t border-white/10">
      <div className="container">
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-8 w-8 text-primary-400" />
                <span className="ml-2 text-xl font-bold">
                  TradingPlatform
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Empowering traders with education and community support. 
                Join thousands of traders who trust our platform for their trading journey.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                    aria-label={social.name}
                  >
                    <span className="text-xl">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Footer Links */}
            {Object.entries(footerLinks).map(([category, links]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {currentYear} TradingPlatform. All rights reserved.
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-400 text-sm">
                <span className="font-medium">Risk Warning:</span> Trading involves substantial risk of loss.
                Past performance is not indicative of future results.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

