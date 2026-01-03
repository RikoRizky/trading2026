'use client';

import Link from 'next/link';
import { UsersIcon } from '@heroicons/react/24/outline';
import { SiDiscord, SiTelegram, SiWhatsapp, SiYoutube, SiInstagram } from 'react-icons/si';

type SocialItem = {
  id: string;
  name: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ElementType;
  badge?: string;
};

const socials: SocialItem[] = [
  {
    id: 'discord',
    name: 'Discord',
    description: 'Real-time chats, voice channels, and learning rooms with fellow traders.',
    href: '#',
    cta: 'Join Discord',
    icon: SiDiscord,
    badge: 'Recommended',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Get quick notifications for setup updates and daily discussions.',
    href: '#',
    cta: 'Join Telegram',
    icon: SiTelegram,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Casual group chat and quick market updates.',
    href: '#',
    cta: 'Join WhatsApp',
    icon: SiWhatsapp,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Market analysis videos, strategies, and live session recordings.',
    href: '#',
    cta: 'Subscribe on YouTube',
    icon: SiYoutube,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Setup highlights, short tips, and community activity updates.',
    href: '#',
    cta: 'Follow Instagram',
    icon: SiInstagram,
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen py-12 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark overflow-x-hidden">
      <div className="container">
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <UsersIcon className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Community</h1>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl">
            Join our community on your favorite platforms. Get updates, discuss setups, and grow together with other traders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {socials.map((item) => (
            <div key={item.id} className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <item.icon className="h-6 w-6 text-primary-600 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  </div>
                  {item.badge && (
                    <span className="badge badge-primary">{item.badge}</span>
                  )}
                </div>
                <p className="text-gray-300 mb-4">{item.description}</p>
              </div>
              <div>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full"
                >
                  {item.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}