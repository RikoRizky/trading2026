'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAdmin, makeUserAdmin, removeUserAdmin } from '@/lib/auth';
import { Profile } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { showSuccess } from '@/lib/swal';
import {
  UserIcon,
  UserMinusIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import {
  Activity,
  BarChart3,
  Clock3,
  Film,
  LayoutDashboard,
  PieChart,
  PlayCircle,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  name: string;
  content: string;
  avatar: string;
  created_at: string;
}

type PlanKey = '1month' | '3months' | '1year' | 'unknown';

interface DashboardStats {
  lessons: number;
  blogVideos: number;
  freeUsers: number;
  premiumUsers: number;
  expiringSoon: number;
}

interface PlanBreakdown {
  plan: PlanKey;
  label: string;
  count: number;
}

interface RecentUser {
  id: string;
  full_name?: string | null;
  email: string;
  membership_type?: string | null;
  created_at?: string | null;
  subscription_plan?: PlanKey | null;
}

const toneStyles: Record<
  'indigo' | 'blue' | 'amber' | 'emerald',
  string
> = {
  indigo: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-100',
  blue: 'bg-sky-500/10 border-sky-500/30 text-sky-100',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-100',
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100',
};

function StatCard({
  label,
  value,
  icon,
  tone,
  subtext,
  trend,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: keyof typeof toneStyles;
  subtext?: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-lg shadow-indigo-500/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
          {subtext && <p className="mt-1 text-xs text-slate-500">{subtext}</p>}
          {trend && <p className="mt-2 text-xs font-medium text-emerald-400">{trend}</p>}
        </div>
        <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl border', toneStyles[tone])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function PlanRow({ plan, total }: { plan: PlanBreakdown; total: number }) {
  const percentage = total > 0 ? Math.round((plan.count / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-300">
        <span>{plan.label}</span>
        <span className="text-slate-400">{plan.count} akun</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{percentage}% dari user premium</p>
    </div>
  );
}

function TagBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
      {children}
    </span>
  );
}

export default function AdminPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'testimonials'>('users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({ name: '', content: '', avatar: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const searchParams = useSearchParams();

  // Check for login success message
  useEffect(() => {
    const loginSuccess = searchParams.get('login');
    if (loginSuccess === 'success') {
      showSuccess("Berhasil login!").then(() => {
        // Remove query parameter and refresh
        window.history.replaceState({}, '', window.location.pathname);
        window.location.reload();
      });
    }
  }, [searchParams]);

  const [stats, setStats] = useState<DashboardStats>({
    lessons: 0,
    blogVideos: 0,
    freeUsers: 0,
    premiumUsers: 0,
    expiringSoon: 0,
  });
  const [planBreakdown, setPlanBreakdown] = useState<PlanBreakdown[]>([
    { plan: '1month', label: 'Paket 1 bulan', count: 0 },
    { plan: '3months', label: 'Paket 3 bulan', count: 0 },
    { plan: '1year', label: 'Paket 1 tahun', count: 0 },
    { plan: 'unknown', label: 'Belum memilih paket', count: 0 },
  ]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        // Set timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Admin page: Loading timeout - setting loading to false');
            setLoading(false);
            setStatsLoading(false);
          }
        }, 10000); // 10 second timeout

        // Add timeout for isAdmin check
        const adminCheckPromise = isAdmin();
        const adminTimeoutPromise = new Promise<boolean>((resolve) => 
          setTimeout(() => resolve(false), 5000)
        );

        const adminStatus = await Promise.race([
          adminCheckPromise,
          adminTimeoutPromise
        ]);

        if (!mounted) return;

        setIsAdminUser(adminStatus);

        if (adminStatus) {
          // Fetch data with timeout protection
          await Promise.all([
            fetchUsers(),
            fetchTestimonials(),
            fetchDashboardStats()
          ]);
        }

        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
          setStatsLoading(false);
        }
      } catch (error) {
        console.error('Error in bootstrap:', error);
        if (mounted) {
          setLoading(false);
          setStatsLoading(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      const supabase = createClient();
      
      // Add timeout for fetch operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Dashboard stats timeout')), 8000)
      );

      const fetchPromise = Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('type', 'lesson').eq('status', 'published'),
        supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'article')
          .eq('status', 'published')
          .contains('tags', ['video']),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('membership_type', 'free'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('membership_type', 'premium'),
        supabase
          .from('profiles')
          .select('id, full_name, email, subscription_plan, subscription_end')
          .eq('membership_type', 'premium')
          .order('updated_at', { ascending: false })
          .limit(120),
        supabase
          .from('profiles')
          .select('id, full_name, email, membership_type, created_at, subscription_plan')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      const [lessonsRes, videoBlogRes, freeUsersRes, premiumUsersRes, premiumProfilesRes, latestUsersRes] =
        await Promise.race([fetchPromise, timeoutPromise]) as any;

      const planCounts: Record<PlanKey, number> = {
        '1month': 0,
        '3months': 0,
        '1year': 0,
        unknown: 0,
      };

      const premiumProfiles = (premiumProfilesRes.data || []) as RecentUser[];
      const now = new Date();
      const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      premiumProfiles.forEach((profile) => {
        const plan = (profile.subscription_plan as PlanKey) || 'unknown';
        if (planCounts[plan] !== undefined) {
          planCounts[plan] += 1;
        } else {
          planCounts.unknown += 1;
        }
      });

      const expiringSoon = (premiumProfilesRes.data || []).filter((profile: any) => {
        if (!profile.subscription_end) return false;
        return new Date(profile.subscription_end) < twoWeeks;
      }).length;

      setPlanBreakdown((prev) =>
        prev.map((row) => ({
          ...row,
          count: planCounts[row.plan],
        })),
      );

      setStats({
        lessons: lessonsRes.count || 0,
        blogVideos: videoBlogRes.count || 0,
        freeUsers: freeUsersRes.count || 0,
        premiumUsers: premiumUsersRes.count || 0,
        expiringSoon,
      });

      setRecentUsers((latestUsersRes.data as RecentUser[]) || []);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Set default values to prevent stuck state
      setStats({
        lessons: 0,
        blogVideos: 0,
        freeUsers: 0,
        premiumUsers: 0,
        expiringSoon: 0,
      });
      setRecentUsers([]);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const supabase = createClient();
      
      // Add timeout for fetch
      const fetchPromise = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch users timeout')), 8000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await makeUserAdmin(userId);
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error making user admin:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await removeUserAdmin(userId);
      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error removing admin:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('add');
    try {
      const supabase = createClient();
      let avatarUrl = '';

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(`testimonials/${fileName}`, avatarFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(`testimonials/${fileName}`);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase.from('testimonials').insert([
        {
          name: formData.name,
          content: formData.content,
          avatar: avatarUrl,
        },
      ]);

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      setShowAddModal(false);
      setFormData({ name: '', content: '', avatar: '' });
      setAvatarFile(null);
      await fetchTestimonials();
    } catch (error: any) {
      console.error('Error adding testimonial:', error);
      alert(`Gagal menambahkan testimonial: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial) return;

    setActionLoading('edit');
    try {
      const supabase = createClient();
      let avatarUrl = editingTestimonial.avatar;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(`testimonials/${fileName}`, avatarFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(`testimonials/${fileName}`);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('testimonials')
        .update({
          name: formData.name,
          content: formData.content,
          avatar: avatarUrl,
        })
        .eq('id', editingTestimonial.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingTestimonial(null);
      setFormData({ name: '', content: '', avatar: '' });
      setAvatarFile(null);
      await fetchTestimonials();
    } catch (error) {
      console.error('Error editing testimonial:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus testimonial ini?')) return;

    setActionLoading(id);
    try {
      const supabase = createClient();

      const { data: testimonial, error: fetchError } = await supabase
        .from('testimonials')
        .select('avatar')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase.from('testimonials').delete().eq('id', id);

      if (error) throw error;

      if (testimonial?.avatar) {
        try {
          const urlParts = testimonial.avatar.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `testimonials/${fileName}`;

          await supabase.storage.from('avatars').remove([filePath]);
        } catch (storageError) {
          console.warn('Failed to delete avatar from storage:', storageError);
        }
      }

      await fetchTestimonials();
    } catch (error: any) {
      console.error('Error deleting testimonial:', error);
      alert(`Gagal menghapus testimonial: ${error.message || 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      content: testimonial.content,
      avatar: testimonial.avatar,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', content: '', avatar: '' });
    setAvatarFile(null);
    setEditingTestimonial(null);
  };

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [users, searchTerm],
  );

  const adminCount = useMemo(() => users.filter((u) => u.is_admin).length, [users]);

  if (loading && statsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-slate-900/60" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="h-28 animate-pulse rounded-2xl bg-slate-900/60" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-slate-900/60" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-900/60" />
        </div>
      </div>
    );
  }

  if (!isAdminUser && !loading && !statsLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Akses Ditolak</h1>
            <p className="mt-2 text-white/80">Anda tidak memiliki izin untuk mengakses halaman admin.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPremium = stats.premiumUsers || 0;
  const premiumRatio = stats.premiumUsers + stats.freeUsers > 0
    ? Math.round((stats.premiumUsers / (stats.premiumUsers + stats.freeUsers)) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-xl shadow-indigo-500/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
                <Sparkles className="h-4 w-4" />
                Admin Command Center
              </p>
              <h1 className="mt-3 text-2xl font-bold text-white">Dashboard Kinerja</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Pantau metrik utama seperti video lessons, konten blog, dan komposisi pengguna premium vs gratis.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <TagBadge>Lessons aktif: {stats.lessons}</TagBadge>
                <TagBadge>Video blog: {stats.blogVideos}</TagBadge>
                <TagBadge>Admin: {adminCount}</TagBadge>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-5 py-4 text-indigo-100 text-center min-w-[120px]">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">Premium</p>
              <p className="mt-1 text-3xl font-semibold leading-tight">{stats.premiumUsers}</p>
              <p className="mt-1 text-xs text-indigo-200/80">{premiumRatio}% dari total user</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-lg transition-all hover:shadow-xl">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Video Lessons</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                  <PlayCircle className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">{stats.lessons}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Konten belajar yang tayang</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-lg transition-all hover:shadow-xl">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Video Blog</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Film className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">{stats.blogVideos}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Konten artikel/video tayang</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-lg transition-all hover:shadow-xl">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">User Premium</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                  <Users className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">{stats.premiumUsers}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">{stats.expiringSoon} akan berakhir &lt; 14 hari</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/80 p-4 shadow-lg transition-all hover:shadow-xl">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">User Gratis</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                  <LayoutDashboard className="h-5 w-5 text-sky-500" />
                </div>
                <div>
                  <span className="text-2xl font-bold text-white">{stats.freeUsers}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">Siap dikonversi jadi premium</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-indigo-500/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Ringkasan Paket</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Durasi langganan</h3>
            </div>
            <div className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">Premium {totalPremium}</div>
          </div>
          <div className="mt-4 space-y-4">
            {planBreakdown.map((plan) => (
              <PlanRow key={plan.plan} plan={plan} total={totalPremium} />
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-emerald-300">
              <Activity className="h-4 w-4" />
              <span>Kesehatan subscription</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{stats.expiringSoon} user premium perlu diingatkan sebelum masa aktif habis.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Video Lessons"
          value={stats.lessons}
          icon={<PlayCircle className="h-5 w-5" />}
          tone="indigo"
          subtext="Konten belajar yang tayang"
          trend="+12% vs bulan lalu"
        />
        <StatCard
          label="Video Blog"
          value={stats.blogVideos}
          icon={<Film className="h-5 w-5" />}
          tone="amber"
          subtext="Artikel / video edukasi"
          trend="Stabil"
        />
        <StatCard
          label="User Premium"
          value={stats.premiumUsers}
          icon={<Users className="h-5 w-5" />}
          tone="emerald"
          subtext={`${premiumRatio}% dari total user`}
          trend={stats.expiringSoon ? `${stats.expiringSoon} akan habis &lt;14 hari` : 'Semua aman'}
        />
        <StatCard
          label="User Gratis"
          value={stats.freeUsers}
          icon={<BarChart3 className="h-5 w-5" />}
          tone="blue"
          subtext="Target konversi"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Konten & Komunitas</p>
              <h3 className="text-lg font-semibold text-white">Performa ringkas</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('users')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  activeTab === 'users'
                    ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/40'
                    : 'border border-slate-800 text-slate-300 hover:text-white',
                )}
              >
                Pengguna
              </button>
              <button
                onClick={() => setActiveTab('testimonials')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition',
                  activeTab === 'testimonials'
                    ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/40'
                    : 'border border-slate-800 text-slate-300 hover:text-white',
                )}
              >
                Testimonial
              </button>
            </div>
          </div>

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari pengguna..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="flex gap-2 text-xs text-slate-400">
                  <TagBadge>Admin: {adminCount}</TagBadge>
                  <TagBadge>Premium: {stats.premiumUsers}</TagBadge>
                  <TagBadge>Gratis: {stats.freeUsers}</TagBadge>
                </div>
              </div>

              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-indigo-500/40 hover:bg-slate-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-100">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{user.full_name || 'Tidak ada nama'}</h3>
                          <p className="text-sm text-slate-400">{user.email}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5',
                                user.is_admin
                                  ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-200/80 border border-slate-700',
                              )}
                            >
                              {user.is_admin ? 'Admin' : 'User'}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                                user.membership_type === 'premium'
                                  ? 'bg-amber-500/15 text-amber-700 border border-amber-500/40'
                                  : 'bg-slate-200 text-slate-800 border border-slate-300',
                              )}
                            >
                              {user.membership_type === 'premium' ? 'Premium' : 'Free'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.is_admin ? (
                          <button
                            onClick={() => handleRemoveAdmin(user.id)}
                            disabled={actionLoading === user.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20"
                          >
                            <UserMinusIcon className="h-4 w-4" />
                            {actionLoading === user.id ? 'Loading...' : 'Hapus Admin'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMakeAdmin(user.id)}
                            disabled={actionLoading === user.id}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/25"
                          >
                            <UserPlusIcon className="h-4 w-4" />
                            {actionLoading === user.id ? 'Loading...' : 'Jadikan Admin'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
                    <UserIcon className="mx-auto h-10 w-10 text-slate-500" />
                    <p className="mt-3 text-sm text-slate-300">Tidak ada pengguna ditemukan</p>
                    <p className="text-xs text-slate-500">
                      {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Belum ada pengguna terdaftar.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'testimonials' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Testimonial</p>
                  <h3 className="text-lg font-semibold text-white">Kelola suara pengguna</h3>
                </div>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-3 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/25"
                >
                  <PlusIcon className="h-4 w-4" />
                  Tambah Testimonial
                </button>
              </div>

              <div className="space-y-3">
                {testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 transition hover:border-indigo-500/40 hover:bg-slate-900"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-100">
                          {testimonial.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={testimonial.avatar}
                              alt={testimonial.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-white">{testimonial.name}</h4>
                          <p className="mt-1 text-sm text-slate-300">{testimonial.content}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Dibuat: {new Date(testimonial.created_at).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(testimonial)}
                          disabled={actionLoading === testimonial.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 text-sm font-medium text-slate-200 hover:border-indigo-500/40 hover:text-white"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          disabled={actionLoading === testimonial.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-100 hover:bg-red-500/20"
                        >
                          {actionLoading === testimonial.id ? '...' : <TrashIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {testimonials.length === 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-10 text-center">
                    <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-slate-500" />
                    <p className="mt-3 text-sm text-slate-300">Belum ada testimonial</p>
                    <p className="text-xs text-slate-500">Tambahkan testimonial pertama untuk ditampilkan di halaman utama.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">User Terbaru</p>
              <h3 className="text-lg font-semibold text-white">Aktivitas masuk</h3>
            </div>
            <PieChart className="h-5 w-5 text-indigo-200" />
          </div>

          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">{user.full_name || 'User baru'}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-semibold',
                      user.membership_type === 'premium'
                        ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/40'
                        : 'bg-slate-200 text-slate-800 border border-slate-300',
                    )}
                  >
                    {user.membership_type === 'premium' ? 'Premium' : 'Free'}
                  </span>
                  {user.subscription_plan && (
                    <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-indigo-100">
                      {user.subscription_plan === '1month' && '1 bln'}
                      {user.subscription_plan === '3months' && '3 bln'}
                      {user.subscription_plan === '1year' && '1 thn'}
                      {user.subscription_plan === 'unknown' && 'Plan?'}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {recentUsers.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-center text-sm text-slate-400">
                Belum ada data user terbaru.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-indigo-200">
              <Clock3 className="h-4 w-4" />
              <span>Pelacakan chart & metrik</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Gunakan menu Charts, Blog, Lessons, dan AI di sidebar untuk laporan detail sesuai kebutuhan.
            </p>
          </div>
        </div>
      </div>

      {/* Add Testimonial Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Tambah Testimonial</h3>
            <form onSubmit={handleAddTestimonial} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="Masukkan nama"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Konten</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input h-24 w-full resize-none"
                  placeholder="Masukkan testimonial"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Avatar (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="input w-full"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'add'}
                  className="btn btn-primary flex-1"
                >
                  {actionLoading === 'add' ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Testimonial Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Edit Testimonial</h3>
            <form onSubmit={handleEditTestimonial} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="Masukkan nama"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Konten</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="input h-24 w-full resize-none"
                  placeholder="Masukkan testimonial"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-white/80">Avatar (Opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="input w-full"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'edit'}
                  className="btn btn-primary flex-1"
                >
                  {actionLoading === 'edit' ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
