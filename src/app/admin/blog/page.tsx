'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/auth';
import { Post } from '@/lib/types';
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon,
  PlayIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import { Film, PlusCircle, Trash2, Pencil, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const categories = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'trading-basics', label: 'Trading Basics' },
  { value: 'technical-analysis', label: 'Technical Analysis' },
  { value: 'fundamental-analysis', label: 'Fundamental Analysis' },
  { value: 'risk-management', label: 'Risk Management' },
  { value: 'psychology', label: 'Trading Psychology' },
  { value: 'strategies', label: 'Trading Strategies' },
  { value: 'tools', label: 'Trading Tools' },
];

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseTags(category: string): string[] {
  return ['video', category];
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);

  const [premiumVideoTitle, setPremiumVideoTitle] = useState('');
  const [premiumVideoFile, setPremiumVideoFile] = useState<File | null>(null);
  const [premiumVideoDescription, setPremiumVideoDescription] = useState('');
  const [premiumVideoCategory, setPremiumVideoCategory] = useState('trading-basics');

  const [editingVideo, setEditingVideo] = useState<Post | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
      if (adminStatus) {
        await fetchPosts();
      } else {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  // Listen to search event from topbar
  useEffect(() => {
    const handleSearch = (e: CustomEvent) => {
      setSearchTerm(e.detail);
    };

    window.addEventListener('adminSearch', handleSearch as EventListener);
    return () => window.removeEventListener('adminSearch', handleSearch as EventListener);
  }, []);

  useEffect(() => {
    const premiumVideoPosts = posts.filter(
      (post) => post.is_premium && (post.metadata as any)?.video_url,
    );

    let filtered = premiumVideoPosts;

    if (searchTerm) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((post) => post.tags?.includes(selectedCategory));
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, selectedCategory]);

  const getCategoryCount = (category: string) => {
    const premiumVideoPosts = posts.filter(
      (post) => post.is_premium && (post.metadata as any)?.video_url,
    );
    if (category === 'all') return premiumVideoPosts.length;
    return premiumVideoPosts.filter((post) => post.tags?.includes(category)).length;
  };

  const fetchPosts = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('posts')
        .select(`*, author:profiles(*)`)
        .eq('type', 'article')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPremiumVideo = async () => {
    if (!isAdminUser) return;
    if (!premiumVideoTitle || !premiumVideoFile) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: userResp, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('Auth error: ' + userError.message);

      const userId = userResp.user?.id;
      if (!userId) throw new Error('Not authenticated - no user ID');

      const fileExt = premiumVideoFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, premiumVideoFile);
      if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
      const videoUrl = urlData.publicUrl;

      const slug = `${toSlug(premiumVideoTitle)}-${Math.random().toString(36).slice(2, 8)}`;
      const tags = parseTags(premiumVideoCategory);

      const insertData = {
        title: premiumVideoTitle,
        slug,
        content: '',
        excerpt: premiumVideoDescription,
        type: 'article',
        status: 'published',
        is_premium: true,
        author_id: userId,
        tags,
        metadata: { video_url: videoUrl, video_type: 'file' },
        published_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('posts').insert(insertData);
      if (error) throw new Error(`Database error: ${error.message}`);

      setPremiumVideoTitle('');
      setPremiumVideoFile(null);
      setPremiumVideoDescription('');
      setPremiumVideoCategory('trading-basics');
      setShowAddModal(false);
      await fetchPosts();
    } catch (e) {
      console.error('Add premium video failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      alert('Gagal menambahkan video premium: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVideo = (video: Post) => {
    setEditingVideo(video);
    setPremiumVideoTitle(video.title);
    setPremiumVideoDescription(video.excerpt || '');
    setPremiumVideoCategory(video.tags?.find((tag) => tag !== 'video') || 'trading-basics');
    setShowEditModal(true);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!isAdminUser) return;
    if (!confirm('Yakin ingin menghapus video ini?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from('posts').delete().eq('id', videoId);
      if (error) throw new Error(`Database error: ${error.message}`);
      await fetchPosts();
    } catch (e) {
      console.error('Delete video failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      alert('Gagal menghapus video: ' + errorMessage);
    }
  };

  const handleUpdateVideo = async () => {
    if (!isAdminUser || !editingVideo) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      const updateData: any = {
        title: premiumVideoTitle,
        excerpt: premiumVideoDescription,
        tags: parseTags(premiumVideoCategory),
        updated_at: new Date().toISOString(),
      };

      let currentMetadata = (editingVideo.metadata || {}) as any;

      if (premiumVideoFile) {
        const { data: userResp, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error('Auth error: ' + userError.message);
        const userId = userResp.user?.id;
        if (!userId) throw new Error('Not authenticated');

        const fileExt = premiumVideoFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('videos').upload(fileName, premiumVideoFile);
        if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);
        const videoUrl = urlData.publicUrl;

        currentMetadata = { ...(editingVideo.metadata as any), video_url: videoUrl, video_type: 'file' };
      }

      updateData.metadata = currentMetadata;

      const { error } = await supabase.from('posts').update(updateData).eq('id', editingVideo.id);
      if (error) throw new Error(`Database error: ${error.message}`);

      setEditingVideo(null);
      setShowEditModal(false);
      setPremiumVideoTitle('');
      setPremiumVideoFile(null);
      setPremiumVideoDescription('');
      setPremiumVideoCategory('trading-basics');
      await fetchPosts();
    } catch (e) {
      console.error('Update video failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      alert('Gagal memperbarui video: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const premiumVideoPosts = useMemo(
    () => posts.filter((post) => post.is_premium && (post.metadata as any)?.video_url),
    [posts],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-slate-900/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-60 animate-pulse rounded-2xl bg-slate-900/60" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen py-12">
        <div className="container">
          <div className="text-center">
            <LockClosedIcon className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Akses Ditolak</h1>
            <p className="mt-2 text-white/80">Halaman ini hanya bisa diakses oleh admin.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-6 shadow-xl shadow-indigo-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
              <Film className="h-4 w-4" />
              Blog Premium Video
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">Kelola Video Premium</h1>
            <p className="mt-1 text-sm text-slate-300">
              Tambah, edit, dan hapus video premium yang tampil di halaman Trading Blog.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/25"
          >
            <PlusCircle className="h-4 w-4" />
            Tambah Video
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari video premium..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div className="relative w-full md:w-56">
            <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-slate-500 z-10" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-800 dark:border-slate-800 bg-slate-950/70 dark:bg-slate-950/70 pl-10 pr-8 text-sm text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value} className="bg-slate-900 text-slate-100">
                  {category.label} ({getCategoryCount(category.value)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Daftar Video Premium</h2>
          <span className="text-xs text-slate-500">{premiumVideoPosts.length} video</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const url = (post.metadata as any)?.video_url as string | undefined;
                        if (url) setPreviewVideo(url);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20"
                    >
                      <PlayIcon className="h-5 w-5" />
                    </button>
                    <div>
                      <h3 className="line-clamp-2 text-sm font-semibold text-white">{post.title}</h3>
                      <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <UserIcon className="h-3.5 w-3.5" />
                          {post.author?.full_name || 'Admin'}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-500" />
                        <span className="inline-flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {post.published_at ? formatDate(post.published_at) : 'Belum dipublish'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-100">
                    Premium
                  </span>
                </div>

                {post.excerpt && <p className="mt-3 line-clamp-3 text-xs text-slate-300">{post.excerpt}</p>}

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  {post.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 capitalize"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                  <span>Video URL tersimpan di Supabase Storage</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditVideo(post)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-indigo-500/40 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(post.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}

          {filteredPosts.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-400">
              Belum ada video yang cocok dengan filter.
            </div>
          )}
        </div>
      </section>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Tambah Video Premium</h3>
            <p className="mt-1 text-xs text-slate-400">
              Video akan muncul di halaman Trading Blog untuk pengguna premium.
            </p>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Judul Video</label>
                <input
                  type="text"
                  value={premiumVideoTitle}
                  onChange={(e) => setPremiumVideoTitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Masukkan judul video"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Deskripsi Singkat</label>
                <textarea
                  value={premiumVideoDescription}
                  onChange={(e) => setPremiumVideoDescription(e.target.value)}
                  className="min-h-[80px] w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Deskripsi yang tampil di kartu video"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Kategori</label>
                  <select
                    value={premiumVideoCategory}
                    onChange={(e) => setPremiumVideoCategory(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {categories
                      .filter((c) => c.value !== 'all')
                      .map((category) => (
                        <option key={category.value} value={category.value} className="bg-slate-900 text-slate-100">
                          {category.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300 dark:text-slate-300">File Video (upload)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setPremiumVideoFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-700 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 dark:file:bg-indigo-500/20 file:px-3 file:py-2 file:text-xs file:font-medium file:text-indigo-700 dark:file:text-indigo-100 hover:file:bg-indigo-500/30 dark:hover:file:bg-indigo-500/30"
                  />
                  {premiumVideoFile && (
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      File dipilih: <span className="font-medium">{premiumVideoFile.name}</span>
                    </p>
                  )}
                  {!premiumVideoFile && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">Tidak ada file yang dipilih</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleAddPremiumVideo}
                  className="rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Video'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Edit Video Premium</h3>
            <p className="mt-1 text-xs text-slate-400">Perbarui informasi video premium.</p>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Judul Video</label>
                <input
                  type="text"
                  value={premiumVideoTitle}
                  onChange={(e) => setPremiumVideoTitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Deskripsi Singkat</label>
                <textarea
                  value={premiumVideoDescription}
                  onChange={(e) => setPremiumVideoDescription(e.target.value)}
                  className="min-h-[80px] w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Kategori</label>
                <select
                  value={premiumVideoCategory}
                  onChange={(e) => setPremiumVideoCategory(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {categories
                    .filter((c) => c.value !== 'all')
                    .map((category) => (
                      <option key={category.value} value={category.value} className="bg-slate-900 text-slate-100">
                        {category.label}
                      </option>
                    ))}
                </select>
              </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Ganti File Video (opsional)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setPremiumVideoFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-xs file:font-medium file:text-indigo-100 hover:file:bg-indigo-500/30"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Jika tidak diisi, video lama akan tetap digunakan.
                  </p>
                </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVideo(null);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleUpdateVideo}
                  className="rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Preview Video</h3>
              <button
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
                onClick={() => setPreviewVideo(null)}
              >
                Tutup
              </button>
            </div>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video src={previewVideo} controls className="h-full w-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
