'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserIcon, PencilIcon, CheckIcon, XMarkIcon, PhotoIcon, KeyIcon } from '@heroicons/react/24/outline';
import { updateProfile, updatePassword, isAdmin } from '@/lib/auth';
import { getUserAvatarUrl, getUserDisplayName } from '@/lib/auth';
import Image from 'next/image';

export default function AdminProfilePage() {
  const { user, profile: ctxProfile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  // Form states
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const checkAdmin = async () => {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
      if (!adminStatus) {
        window.location.href = '/admin';
      }
    };
    checkAdmin();
  }, []);

  // Update profile data when profile changes
  useEffect(() => {
    if (profile?.full_name) {
      setNewName(profile.full_name);
    } else if ((user as any)?.user_metadata?.full_name) {
      setNewName((user as any).user_metadata.full_name);
    } else if (user?.email) {
      setNewName(user.email.split('@')[0]);
    }
  }, [profile, user]);

  useEffect(() => {
    if (ctxProfile) {
      setProfile(ctxProfile);
      setInitialized(true);
    } else if (user && !initialized) {
      refreshProfile().finally(() => setInitialized(true));
    }
  }, [ctxProfile, user, refreshProfile, initialized]);

  // Compute derived values
  const displayName = useMemo(() => getUserDisplayName(user, profile), [user, profile]);
  const computedAvatarUrl = useMemo(() => getUserAvatarUrl(user, profile), [user, profile]);

  useEffect(() => {
    if (computedAvatarUrl) {
      setAvatarUrl(computedAvatarUrl);
    } else {
      setAvatarUrl(null);
    }
  }, [computedAvatarUrl]);

  // Handle name update
  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setMessage('Nama tidak boleh kosong');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await updateProfile({ full_name: newName.trim() });

    if (error) {
      setMessage('Gagal mengupdate nama: ' + error.message);
      setMessageType('error');
    } else {
      setMessage('Nama berhasil diupdate!');
      setMessageType('success');
      await refreshProfile();
      setProfile((prev: any) => ({ ...prev, full_name: newName.trim() }));
      setEditingName(false);
    }

    setLoading(false);
  };

  // Handle avatar update
  const handleUpdateAvatar = async () => {
    if (!avatarFile) {
      setEditingAvatar(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile, {
        upsert: true,
      });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newAvatarUrl = urlData.publicUrl;

      const { error: updateError } = await updateProfile({ avatar_url: newAvatarUrl });

      if (updateError) throw updateError;

      setMessage('Avatar berhasil diupdate!');
      setMessageType('success');
      setAvatarUrl(newAvatarUrl);
      await refreshProfile();
      setProfile((prev: any) => ({ ...prev, avatar_url: newAvatarUrl }));
      setAvatarFile(null);
      setEditingAvatar(false);
    } catch (error: any) {
      setMessage('Gagal mengupdate avatar: ' + (error.message || 'Unknown error'));
      setMessageType('error');
    }

    setLoading(false);
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Password tidak boleh kosong');
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Password tidak cocok');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password minimal 6 karakter');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await updatePassword(newPassword);

    if (error) {
      setMessage('Gagal mengupdate password: ' + error.message);
      setMessageType('error');
    } else {
      setMessage('Password berhasil diupdate!');
      setMessageType('success');
      setNewPassword('');
      setConfirmPassword('');
      setEditingPassword(false);
    }

    setLoading(false);
  };

  if (!isAdminUser) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-slate-400">Memuat...</p>
      </div>
    );
  }

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p className="text-slate-400">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
        <p className="mt-2 text-sm text-slate-400">Kelola informasi profil dan pengaturan akun Anda</p>
      </div>

      {message && (
        <div
          className={`rounded-xl border p-4 ${
            messageType === 'success'
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
              : 'border-red-500/40 bg-red-500/10 text-red-100'
          }`}
        >
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Avatar Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-indigo-500/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Foto Profil</h2>
          <button
            onClick={() => setEditingAvatar(!editingAvatar)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500/40 hover:text-white hover:bg-slate-800/70"
          >
            <PencilIcon className="h-4 w-4" />
            <span>{editingAvatar ? 'Batal' : 'Ubah'}</span>
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-300 font-semibold text-2xl">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {editingAvatar && (
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pilih File Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-300 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500/20 dark:file:bg-indigo-500/20 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-100 dark:file:text-indigo-100 hover:file:bg-indigo-500/30 dark:hover:file:bg-indigo-500/30"
                />
                {avatarFile && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-400">
                    File dipilih: <span className="font-medium text-slate-300 dark:text-slate-300">{avatarFile.name}</span>
                  </p>
                )}
                {!avatarFile && (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">Tidak ada file yang dipilih</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleUpdateAvatar}
                  disabled={loading || !avatarFile}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditingAvatar(false);
                    setAvatarFile(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Batal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-indigo-500/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Informasi Profil</h2>
          <button
            onClick={() => setEditingName(!editingName)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500/40 hover:text-white hover:bg-slate-800/70"
          >
            <PencilIcon className="h-4 w-4" />
            <span>{editingName ? 'Batal' : 'Ubah'}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nama Lengkap</label>
            {editingName ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 h-10 rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Masukkan nama lengkap"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    if (profile?.full_name) {
                      setNewName(profile.full_name);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Batal</span>
                </button>
              </div>
            ) : (
              <p className="text-white text-lg">{displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <p className="text-slate-400">{user?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-500/15 px-3 py-1 text-sm font-medium text-indigo-100">
              <UserIcon className="h-4 w-4" />
              Admin
            </span>
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-lg shadow-indigo-500/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Ubah Password</h2>
          <button
            onClick={() => {
              setEditingPassword(!editingPassword);
              setNewPassword('');
              setConfirmPassword('');
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500/40 hover:text-white hover:bg-slate-800/70"
          >
            <KeyIcon className="h-4 w-4" />
            <span>{editingPassword ? 'Batal' : 'Ubah Password'}</span>
          </button>
        </div>

        {editingPassword && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Masukkan password baru"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Konfirmasi Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-slate-800 bg-slate-950/70 px-3 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Konfirmasi password baru"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUpdatePassword}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/20 px-4 py-2 text-sm font-medium text-indigo-100 hover:bg-indigo-500/30 disabled:opacity-60"
              >
                <CheckIcon className="h-4 w-4" />
                <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
              <button
                onClick={() => {
                  setEditingPassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Batal</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

