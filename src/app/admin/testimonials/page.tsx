'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAdmin } from '@/lib/auth';
import {
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { Sparkles } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  content: string;
  avatar: string;
  created_at: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({ name: '', content: '', avatar: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
      if (adminStatus) {
        await fetchTestimonials();
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
    } finally {
      setLoading(false);
    }
  };

  const filteredTestimonials = useMemo(
    () =>
      testimonials.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.content.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [testimonials, searchTerm],
  );

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

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(`testimonials/${fileName}`);

        avatarUrl = publicUrl;
      }

      const { error } = await supabase
        .from('testimonials')
        .insert([{ name: formData.name, content: formData.content, avatar: avatarUrl }]);

      if (error) throw error;

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
        .update({ name: formData.name, content: formData.content, avatar: avatarUrl })
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

  const resetForm = () => {
    setFormData({ name: '', content: '', avatar: '' });
    setAvatarFile(null);
    setEditingTestimonial(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-3xl bg-slate-900/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div key={idx} className="h-40 animate-pulse rounded-2xl bg-slate-900/60" />
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
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Testimonial
            </p>
            <h1 className="mt-2 text-2xl font-bold text-white">Kelola Testimonial Pengguna</h1>
            <p className="mt-1 text-sm text-slate-300">
              Tambah, edit, dan hapus testimonial yang ditampilkan di halaman utama.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/25"
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Testimonial
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Cari testimonial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-800 bg-slate-950/70 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <p className="text-xs text-slate-500">{filteredTestimonials.length} testimonial</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredTestimonials.map((testimonial) => (
          <article
            key={testimonial.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-100">
                {testimonial.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{testimonial.name}</h3>
                <p className="mt-1 text-xs text-slate-300">{testimonial.content}</p>
                <p className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                  <span>
                    Dibuat:{' '}
                    {new Date(testimonial.created_at).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setEditingTestimonial(testimonial);
                  setFormData({ name: testimonial.name, content: testimonial.content, avatar: testimonial.avatar });
                  setShowEditModal(true);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 hover:border-indigo-500/40 hover:text-white"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteTestimonial(testimonial.id)}
                disabled={actionLoading === testimonial.id}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20"
              >
                {actionLoading === testimonial.id ? '...' : <TrashIcon className="h-4 w-4" />}
              </button>
            </div>
          </article>
        ))}

        {filteredTestimonials.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-400">
            Belum ada testimonial.
          </div>
        )}
      </section>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Tambah Testimonial</h3>
            <form onSubmit={handleAddTestimonial} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Masukkan nama pengguna"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Konten</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="min-h-[90px] w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Tulis testimonial singkat"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Avatar (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-xs file:font-medium file:text-indigo-100 hover:file:bg-indigo-500/30"
                />
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
                  type="submit"
                  disabled={actionLoading === 'add'}
                  className="rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60"
                >
                  {actionLoading === 'add' ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTestimonial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Edit Testimonial</h3>
            <form onSubmit={handleEditTestimonial} className="mt-4 space-y-4 text-sm">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Nama</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Masukkan nama pengguna"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Konten</label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="min-h-[90px] w-full rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Tulis testimonial singkat"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">Avatar (opsional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 file:px-3 file:py-2 file:text-xs file:font-medium file:text-indigo-100 hover:file:bg-indigo-500/30"
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTestimonial(null);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'edit'}
                  className="rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60"
                >
                  {actionLoading === 'edit' ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
