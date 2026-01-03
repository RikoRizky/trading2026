'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/auth';
import {
  BarChart3,
  TrendingUp,
  Users,
  PlayCircle,
  BookOpen,
  Crown,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartData {
  labels: string[];
  values: number[];
}

interface TimeSeriesData {
  date: string;
  users: number;
  posts: number;
  lessons: number;
}

export default function AdminChartsPage() {
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [userGrowth, setUserGrowth] = useState<ChartData>({ labels: [], values: [] });
  const [membershipDistribution, setMembershipDistribution] = useState<ChartData>({ labels: [], values: [] });
  const [contentStats, setContentStats] = useState<ChartData>({ labels: [], values: [] });
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    totalPosts: 0,
    totalLessons: 0,
    videoBlogs: 0,
  });

  useEffect(() => {
    const bootstrap = async () => {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);

      if (adminStatus) {
        await Promise.all([fetchChartData(), fetchTimeSeries()]);
      } else {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const fetchChartData = async () => {
    try {
      const supabase = createClient();

      // Fetch all data in parallel
      const [
        allUsersRes,
        premiumUsersRes,
        freeUsersRes,
        allPostsRes,
        lessonsRes,
        videoBlogsRes,
        monthlyUsersRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id, created_at, membership_type', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('membership_type', 'premium'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('membership_type', 'free'),
        supabase.from('posts').select('id, type, created_at', { count: 'exact' }).eq('status', 'published'),
        // Lessons: video dengan is_premium=false dan memiliki video_url di metadata
        supabase
          .from('posts')
          .select('id, metadata', { count: 'exact' })
          .eq('status', 'published')
          .eq('is_premium', false),
        // Video Blog: video dengan is_premium=true dan memiliki video_url di metadata
        supabase
          .from('posts')
          .select('id, metadata', { count: 'exact' })
          .eq('status', 'published')
          .eq('is_premium', true),
        supabase
          .from('profiles')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1000),
      ]);

      // Calculate monthly user growth - menggunakan data real dari database
      const users = (allUsersRes.data || []) as any[];
      const monthlyCounts: Record<string, number> = {};

      // Hitung semua bulan dari data yang ada
      users.forEach((user) => {
        if (user.created_at) {
          const date = new Date(user.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        }
      });

      // Ambil 6 bulan terakhir yang memiliki data
      const sortedMonths = Object.keys(monthlyCounts).sort();
      const last6Months = sortedMonths.slice(-6);

      // Jika kurang dari 6 bulan, isi dengan bulan kosong
      if (last6Months.length < 6) {
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        
        // Generate 6 bulan terakhir
        const last6MonthsWithData: string[] = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          last6MonthsWithData.push(monthKey);
        }

        setUserGrowth({
          labels: last6MonthsWithData.map((m) => {
            const [year, month] = m.split('-');
            return `${monthNames[parseInt(month) - 1]} ${year}`;
          }),
          values: last6MonthsWithData.map((m) => monthlyCounts[m] || 0),
        });
      } else {
        setUserGrowth({
          labels: last6Months.map((m) => {
            const [year, month] = m.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
          }),
          values: last6Months.map((m) => monthlyCounts[m] || 0),
        });
      }

      // Membership distribution
      setMembershipDistribution({
        labels: ['Premium', 'Gratis'],
        values: [premiumUsersRes.count || 0, freeUsersRes.count || 0],
      });

      // Content stats - filter posts yang memiliki video_url di metadata
      const lessonsData = (lessonsRes.data || []).filter(
        (post: any) => post.metadata && post.metadata.video_url
      );
      const videoBlogsData = (videoBlogsRes.data || []).filter(
        (post: any) => post.metadata && post.metadata.video_url
      );

      const lessonsCount = lessonsData.length;
      const videoBlogsCount = videoBlogsData.length;

      setContentStats({
        labels: ['Lessons', 'Video Blog'],
        values: [lessonsCount, videoBlogsCount],
      });

      // Overall stats
      setStats({
        totalUsers: allUsersRes.count || 0,
        premiumUsers: premiumUsersRes.count || 0,
        freeUsers: freeUsersRes.count || 0,
        totalPosts: lessonsCount + videoBlogsCount, // Hanya lessons + blog
        totalLessons: lessonsCount,
        videoBlogs: videoBlogsCount,
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSeries = async () => {
    try {
      const supabase = createClient();

      // Get last 30 days of data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [usersRes, postsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('posts')
          .select('created_at, type')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .eq('status', 'published'),
      ]);

      const users = (usersRes.data || []) as any[];
      const posts = (postsRes.data || []) as any[];

      // Group by date
      const dailyData: Record<string, { users: number; posts: number; lessons: number }> = {};

      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = { users: 0, posts: 0, lessons: 0 };
      }

      users.forEach((user) => {
        const dateKey = new Date(user.created_at).toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].users += 1;
        }
      });

      posts.forEach((post) => {
        const dateKey = new Date(post.created_at).toISOString().split('T')[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].posts += 1;
          if (post.type === 'lesson') {
            dailyData[dateKey].lessons += 1;
          }
        }
      });

      const timeSeriesData = Object.entries(dailyData)
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setTimeSeries(timeSeriesData);
    } catch (error) {
      console.error('Error fetching time series:', error);
    }
  };

  const maxValue = (values: number[]) => Math.max(...values, 1);

  const BarChart = ({ data, color = 'indigo' }: { data: ChartData; color?: 'indigo' | 'emerald' | 'amber' | 'blue' }) => {
    const max = maxValue(data.values);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const colorClasses = {
      indigo: 'bg-indigo-500',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
      blue: 'bg-blue-500',
    };

    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-2 h-64 relative">
          {data.values.map((value, idx) => {
            // Calculate height percentage - use full height for true proportions
            // If max is 0, all values are 0, so height is 0
            const heightPercent = max > 0 ? (value / max) * 100 : 0;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative">
                <div 
                  className="relative w-full h-full flex items-end justify-center"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Value label above bar - always show if value > 0 */}
                  {value > 0 && (
                    <div className="absolute bottom-full mb-1 text-xs font-semibold text-slate-600 dark:text-slate-300 z-10 whitespace-nowrap">
                      {value}
                    </div>
                  )}
                  {/* Bar - height is proportional to value, no minimum height */}
                  {value > 0 ? (
                <div
                      className={cn('w-full rounded-t-lg transition-all cursor-pointer', colorClasses[color])}
                      style={{ 
                        height: `${heightPercent}%`,
                        minHeight: '4px', // Only minimum for very small values to ensure visibility
                      }}
                    />
                  ) : (
                    <div className="w-full h-0" />
                  )}
                  {hoveredIndex === idx && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-900 border border-slate-700 shadow-lg z-20 whitespace-nowrap">
                      <p className="text-xs font-semibold text-white">{data.labels[idx]}</p>
                      <p className="text-xs text-slate-300 mt-0.5">Nilai: {value}</p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-400 text-center leading-tight">{data.labels[idx]}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400 dark:text-slate-400">Total</span>
          <span className="font-semibold text-white dark:text-white">{data.values.reduce((a, b) => a + b, 0)}</span>
        </div>
      </div>
    );
  };

  const PieChart = ({ data, colors = ['amber', 'slate'] }: { data: ChartData; colors?: string[] }) => {
    const total = data.values.reduce((a, b) => a + b, 0);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    
    // Color mapping dengan hex values untuk SVG
    const colorMap: Record<string, string> = {
      indigo: '#6366f1',
      emerald: '#10b981',
      amber: '#f59e0b',
      blue: '#3b82f6',
      slate: '#64748b',
    };

    let currentAngle = 0;
    const segments = data.values.map((value, idx) => {
      const percentage = total > 0 ? (value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      const colorName = colors[idx % colors.length] || 'slate';
      const colorHex = colorMap[colorName] || colorMap.slate;

      return {
        label: data.labels[idx],
        value,
        percentage,
        startAngle,
        angle,
        colorHex,
        colorName,
      };
    });

    return (
      <div className="space-y-4">
        <div className="relative h-48 w-48 mx-auto">
          <svg viewBox="0 0 100 100" className="transform -rotate-90">
            {segments.map((seg, idx) => {
              if (seg.percentage === 0) return null;
              const x1 = 50 + 50 * Math.cos((seg.startAngle * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((seg.startAngle * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos(((seg.startAngle + seg.angle) * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin(((seg.startAngle + seg.angle) * Math.PI) / 180);
              const largeArc = seg.angle > 180 ? 1 : 0;
              const midAngle = (seg.startAngle + seg.angle / 2) * Math.PI / 180;
              const tooltipX = 50 + 35 * Math.cos(midAngle);
              const tooltipY = 50 + 35 * Math.sin(midAngle);

              return (
                <g key={idx}>
                <path
                  d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={seg.colorHex}
                  stroke="#ffffff"
                    strokeWidth={hoveredIndex === idx ? "1" : "0.5"}
                    opacity={hoveredIndex !== null && hoveredIndex !== idx ? 0.5 : 1}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                  {hoveredIndex === idx && (
                    <g>
                      <circle cx={tooltipX} cy={tooltipY} r="3" fill={seg.colorHex} />
                      <text
                        x={tooltipX}
                        y={tooltipY - 5}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="8"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {seg.value}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          {hoveredIndex !== null && segments[hoveredIndex] && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 shadow-lg z-10 whitespace-nowrap">
              <p className="text-xs font-semibold text-white">{segments[hoveredIndex].label}</p>
              <p className="text-xs text-slate-300 mt-0.5">Nilai: {segments[hoveredIndex].value} ({segments[hoveredIndex].percentage.toFixed(1)}%)</p>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {segments.map((seg, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between text-sm cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded" style={{ backgroundColor: seg.colorHex }} />
                <span className="text-slate-300">{seg.label}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-white">{seg.value}</span>
                <span className="text-slate-400 ml-1">({seg.percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const LineChart = ({ data }: { data: TimeSeriesData[] }) => {
    const maxUsers = Math.max(...data.map((d) => d.users), 1);
    const maxPosts = Math.max(...data.map((d) => d.posts), 1);
    const maxLessons = Math.max(...data.map((d) => d.lessons), 1);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
      <div className="space-y-4">
        <div className="relative h-64">
          <svg viewBox={`0 0 ${data.length * 20} 200`} className="w-full h-full">
            {/* Users line */}
            <polyline
              points={data
                .map((d, idx) => {
                  const x = idx * 20;
                  const y = 200 - (d.users / maxUsers) * 180;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
            />
            {/* Posts line */}
            <polyline
              points={data
                .map((d, idx) => {
                  const x = idx * 20;
                  const y = 200 - (d.posts / maxPosts) * 180;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
            {/* Lessons line */}
            <polyline
              points={data
                .map((d, idx) => {
                  const x = idx * 20;
                  const y = 200 - (d.lessons / maxLessons) * 180;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            {/* Hover points */}
            {data.map((d, idx) => {
              const x = idx * 20;
              const userY = 200 - (d.users / maxUsers) * 180;
              const postY = 200 - (d.posts / maxPosts) * 180;
              const lessonY = 200 - (d.lessons / maxLessons) * 180;
              
              return (
                <g key={idx}>
                  <circle
                    cx={x}
                    cy={userY}
                    r="3"
                    fill="#6366f1"
                    opacity={hoveredIndex === idx ? 1 : 0}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  />
                  <circle
                    cx={x}
                    cy={postY}
                    r="3"
                    fill="#10b981"
                    opacity={hoveredIndex === idx ? 1 : 0}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  />
                  <circle
                    cx={x}
                    cy={lessonY}
                    r="3"
                    fill="#f59e0b"
                    opacity={hoveredIndex === idx ? 1 : 0}
                    style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                  />
                  <rect
                    x={x - 10}
                    y={0}
                    width={20}
                    height={200}
                    fill="transparent"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    style={{ cursor: 'pointer' }}
                  />
                </g>
              );
            })}
          </svg>
          {hoveredIndex !== null && data[hoveredIndex] && (
            <div className="absolute top-0 left-0 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-900 border border-slate-700 dark:border-slate-700 shadow-lg z-10">
              <p className="text-xs font-semibold text-white dark:text-white">{new Date(data[hoveredIndex].date).toLocaleDateString('id-ID')}</p>
              <p className="text-xs text-indigo-300 dark:text-indigo-300 mt-0.5">Users: {data[hoveredIndex].users}</p>
              <p className="text-xs text-emerald-300 dark:text-emerald-300">Posts: {data[hoveredIndex].posts}</p>
              <p className="text-xs text-amber-300 dark:text-amber-300">Lessons: {data[hoveredIndex].lessons}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <span>Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Posts</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Lessons</span>
          </div>
        </div>
      </div>
    );
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
        <div className="text-slate-400">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Charts & Analytics</h1>
        <p className="mt-2 text-sm text-slate-400">Visualisasi data dan statistik platform</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Users</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.totalUsers}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <Users className="h-6 w-6 text-indigo-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Total Konten</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.totalPosts}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
              <BookOpen className="h-6 w-6 text-emerald-300" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Premium Users</p>
              <p className="mt-2 text-3xl font-semibold text-white">{stats.premiumUsers}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
              <Crown className="h-6 w-6 text-amber-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Growth Chart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-indigo-500/5">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Pertumbuhan User (6 Bulan Terakhir)</h2>
            <p className="mt-1 text-sm text-slate-400">Jumlah user baru per bulan</p>
          </div>
          <BarChart data={userGrowth} color="indigo" />
        </div>

        {/* Membership Distribution */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-indigo-500/5">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Distribusi Membership</h2>
            <p className="mt-1 text-sm text-slate-400">Komposisi user premium vs gratis</p>
          </div>
          <PieChart data={membershipDistribution} colors={['amber', 'slate']} />
        </div>

        {/* Content Stats */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-indigo-500/5">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Distribusi Konten</h2>
            <p className="mt-1 text-sm text-slate-400">Jumlah konten berdasarkan jenis (Lessons dan Blog)</p>
          </div>
          <BarChart data={contentStats} color="emerald" />
        </div>

        {/* Time Series Chart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-indigo-500/5">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Aktivitas 30 Hari Terakhir</h2>
            <p className="mt-1 text-sm text-slate-400">Trend user, posts, dan lessons</p>
          </div>
          {timeSeries.length > 0 ? (
            <LineChart data={timeSeries} />
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">Tidak ada data</div>
          )}
        </div>
      </div>
    </div>
  );
}

