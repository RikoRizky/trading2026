'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/auth';
import { Activity, UserPlus, BookOpen, PlayCircle, Crown, Clock, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: string;
  type: 'user_registered' | 'post_created' | 'lesson_created' | 'premium_upgrade';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: {
    post_title?: string;
    post_type?: string;
    membership_type?: string;
  };
}

export default function AdminActivityPage() {
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'users' | 'content' | 'premium'>('all');

  useEffect(() => {
    const bootstrap = async () => {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);

      if (adminStatus) {
        await fetchActivities();
      } else {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const fetchActivities = async () => {
    try {
      const supabase = createClient();

      // Fetch recent users (last 50)
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, membership_type, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch recent posts (last 50)
      const { data: recentPosts, error: postsError } = await supabase
        .from('posts')
        .select('id, title, type, created_at, author:profiles(id, full_name, email, avatar_url)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50);

      if (usersError) console.error('Error fetching users:', usersError);
      if (postsError) console.error('Error fetching posts:', postsError);

      const activityItems: ActivityItem[] = [];

      // Add user registration activities
      (recentUsers || []).forEach((user: any) => {
        activityItems.push({
          id: `user-${user.id}`,
          type: 'user_registered',
          title: 'User Baru Terdaftar',
          description: `${user.full_name || user.email.split('@')[0]} bergabung ke platform`,
          timestamp: user.created_at,
          user: {
            id: user.id,
            name: user.full_name || user.email.split('@')[0],
            email: user.email,
            avatar: user.avatar_url,
          },
        });

        // Check if user upgraded to premium
        if (user.membership_type === 'premium' && user.updated_at !== user.created_at) {
          activityItems.push({
            id: `premium-${user.id}-${user.updated_at}`,
            type: 'premium_upgrade',
            title: 'Upgrade ke Premium',
            description: `${user.full_name || user.email.split('@')[0]} mengupgrade ke Premium`,
            timestamp: user.updated_at,
            user: {
              id: user.id,
              name: user.full_name || user.email.split('@')[0],
              email: user.email,
              avatar: user.avatar_url,
            },
            metadata: {
              membership_type: 'premium',
            },
          });
        }
      });

      // Add post/lesson creation activities
      (recentPosts || []).forEach((post: any) => {
        const isLesson = post.type === 'lesson';
        activityItems.push({
          id: `post-${post.id}`,
          type: isLesson ? 'lesson_created' : 'post_created',
          title: isLesson ? 'Lesson Baru Dibuat' : 'Post Baru Dibuat',
          description: `${post.title} telah dipublikasikan`,
          timestamp: post.created_at,
          user: post.author
            ? {
                id: post.author.id,
                name: post.author.full_name || post.author.email.split('@')[0],
                email: post.author.email,
                avatar: post.author.avatar_url,
              }
            : undefined,
          metadata: {
            post_title: post.title,
            post_type: post.type,
          },
        });
      });

      // Sort by timestamp (newest first)
      activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Limit to last 100 activities
      setActivities(activityItems.slice(0, 100));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registered':
        return <UserPlus className="h-5 w-5 text-blue-400" />;
      case 'post_created':
        return <BookOpen className="h-5 w-5 text-emerald-400" />;
      case 'lesson_created':
        return <PlayCircle className="h-5 w-5 text-indigo-400" />;
      case 'premium_upgrade':
        return <Crown className="h-5 w-5 text-amber-400" />;
      default:
        return <Activity className="h-5 w-5 text-slate-400" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registered':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'post_created':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'lesson_created':
        return 'bg-indigo-500/10 border-indigo-500/30';
      case 'premium_upgrade':
        return 'bg-amber-500/10 border-amber-500/30';
      default:
        return 'bg-slate-800 border-slate-700';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} bulan lalu`;
    return `${Math.floor(diffInSeconds / 31536000)} tahun lalu`;
  };

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true;
    if (filter === 'users') return activity.type === 'user_registered' || activity.type === 'premium_upgrade';
    if (filter === 'content') return activity.type === 'post_created' || activity.type === 'lesson_created';
    if (filter === 'premium') return activity.type === 'premium_upgrade';
    return true;
  });

  const stats = {
    total: activities.length,
    users: activities.filter((a) => a.type === 'user_registered').length,
    content: activities.filter((a) => a.type === 'post_created' || a.type === 'lesson_created').length,
    premium: activities.filter((a) => a.type === 'premium_upgrade').length,
  };

  if (!isAdminUser) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-slate-400">Akses ditolak. Hanya admin yang dapat mengakses halaman ini.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-slate-400">Memuat aktivitas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Activity Log</h1>
        <p className="mt-2 text-sm text-slate-400">Pantau aktivitas terbaru di platform</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Aktivitas</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.total}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <Activity className="h-6 w-6 text-indigo-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">User Baru</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.users}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/10">
              <UserPlus className="h-6 w-6 text-blue-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Konten Baru</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.content}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <BookOpen className="h-6 w-6 text-emerald-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Upgrade Premium</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.premium}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
              <Crown className="h-6 w-6 text-amber-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
            filter === 'all'
              ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-100'
              : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800/70'
          )}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('users')}
          className={cn(
            'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
            filter === 'users'
              ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-100'
              : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800/70'
          )}
        >
          Users
        </button>
        <button
          onClick={() => setFilter('content')}
          className={cn(
            'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
            filter === 'content'
              ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-100'
              : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800/70'
          )}
        >
          Konten
        </button>
        <button
          onClick={() => setFilter('premium')}
          className={cn(
            'rounded-xl border px-4 py-2 text-sm font-medium transition-colors',
            filter === 'premium'
              ? 'border-indigo-500/40 bg-indigo-500/20 text-indigo-100'
              : 'border-slate-800 bg-slate-900/70 text-slate-300 hover:bg-slate-800/70'
          )}
        >
          Premium
        </button>
      </div>

      {/* Activity List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-indigo-500/5">
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400">Tidak ada aktivitas ditemukan</p>
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  'flex items-start gap-4 rounded-2xl border p-4 transition-colors',
                  getActivityColor(activity.type)
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/70">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white">{activity.title}</h3>
                      <p className="mt-1 text-sm text-slate-300">{activity.description}</p>
                      {activity.user && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                          <Users className="h-3 w-3" />
                          <span>{activity.user.name}</span>
                          <span className="text-slate-600">•</span>
                          <span className="truncate">{activity.user.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}










