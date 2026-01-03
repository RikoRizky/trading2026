'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserIcon, PencilIcon, CheckIcon, XMarkIcon, PhotoIcon, KeyIcon } from '@heroicons/react/24/outline'
import { updateProfile, updatePassword } from '@/lib/auth'

export default function ProfilePage() {
  const { user, profile: ctxProfile, refreshProfile } = useAuth()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  // Edit states
  const [editingName, setEditingName] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState(false)
  const [editingPassword, setEditingPassword] = useState(false)

  // Form states
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Loading states
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Update profile data when profile changes
  useEffect(() => {
    if (profile?.full_name) {
      setNewName(profile.full_name)
    } else if ((user as any)?.user_metadata?.full_name) {
      setNewName((user as any).user_metadata.full_name)
    } else if (user?.email) {
      setNewName(user.email.split('@')[0])
    }
  }, [profile, user])

  useEffect(() => {
    if (ctxProfile) {
      setProfile(ctxProfile)
      setInitialized(true)
    } else if (user && !initialized) {
      refreshProfile().finally(() => setInitialized(true))
    }
  }, [ctxProfile, user, refreshProfile, initialized])

  // Compute derived values
  const displayName = useMemo(() => {
    if (profile?.full_name) return profile.full_name
    return (user as any)?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Belum diatur'
  }, [profile?.full_name, user])

  const userRoleLabel = useMemo(() => {
    if (profile?.is_admin) return 'Admin'
    if (profile?.membership_type === 'premium') return 'Premium'
    return 'Gratis'
  }, [profile?.is_admin, profile?.membership_type])

  useEffect(() => {
    if (!profile && !user) return

    const preferredAvatar = profile?.avatar_url || profile?.profile_photo || (user as any)?.user_metadata?.avatar_url
    if (preferredAvatar) {
      if (preferredAvatar.startsWith('http')) {
        setAvatarUrl(preferredAvatar)
      } else {
        const { data } = supabase.storage.from('avatars').getPublicUrl(preferredAvatar)
        setAvatarUrl(data?.publicUrl || null)
      }
      return
    }

    setAvatarUrl(null)
  }, [profile, supabase, user])

  // Handle name update
  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setMessage('Nama tidak boleh kosong')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await updateProfile({ full_name: newName.trim() })

    if (error) {
      setMessage('Gagal mengupdate nama: ' + error.message)
    } else {
      setMessage('Nama berhasil diupdate!')
      await refreshProfile()
      setProfile((prev: any) => ({ ...prev, full_name: newName.trim() }))
      setEditingName(false)
    }

    setLoading(false)
  }

  // Handle avatar upload
  const handleUpdateAvatar = async () => {
    if (!avatarFile) {
      setMessage('Pilih file gambar terlebih dahulu')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Upload to Supabase storage
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user!.id}_${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile)

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await updateProfile({ avatar_url: publicUrl })

      if (updateError) {
        throw updateError
      }

      setMessage('Foto profil berhasil diupdate!')
      await refreshProfile()
      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }))
      setEditingAvatar(false)
      setAvatarFile(null)
    } catch (error: any) {
      setMessage('Gagal mengupload foto: ' + error.message)
    }

    setLoading(false)
  }

  // Handle password update
  const handleUpdatePassword = async () => {
    if (!newPassword) {
      setMessage('Kata sandi baru tidak boleh kosong')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Konfirmasi kata sandi tidak cocok')
      return
    }

    if (newPassword.length < 6) {
      setMessage('Kata sandi minimal 6 karakter')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await updatePassword(newPassword)

    if (error) {
      setMessage('Gagal mengupdate kata sandi: ' + error.message)
    } else {
      setMessage('Kata sandi berhasil diupdate!')
      setEditingPassword(false)
      setNewPassword('')
      setConfirmPassword('')
    }

    setLoading(false)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        {/* <p className="text-gray-500">Anda belum login.</p> */}
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      {/* Message display */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${message.includes('berhasil') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Profile Avatar Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Foto Profil</h2>
          <button
            onClick={() => setEditingAvatar(!editingAvatar)}
            className="flex items-center badge badge-warning space-x-2 text-blue-600 hover:text-blue-800"
          >
            <PhotoIcon className="h-5 w-5" />
            <span>{editingAvatar ? 'Batal' : 'Ubah'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || 'User'}
              className="w-24 h-24 rounded-full border shadow object-cover"
            />
          ) : (
            <UserIcon className="h-24 w-24 text-primary-600" />
          )}

          {editingAvatar && (
            <div className="flex-1 max-w-md">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={handleUpdateAvatar}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditingAvatar(false)
                    setAvatarFile(null)
                  }}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
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
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Informasi Profil</h2>
          <button
            onClick={() => setEditingName(!editingName)}
            className="flex items-center badge badge-warning space-x-2 text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
            <span>{editingName ? 'Batal' : 'Ubah'}</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nama Lengkap</label>
            {editingName ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-3 py-2 border bg-black bg-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan nama lengkap"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckIcon className="h-4 w-4" />
                  <span>{loading ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditingName(false)
                    setNewName(profile?.full_name || '')
                  }}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Batal</span>
                </button>
              </div>
            ) : (
              <p className="text-lg">{displayName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <p className="text-lg">{user.email}</p>
          </div>



          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Status Keanggotaan</label>
            {profile?.membership_type === 'premium' ? (
              <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                ⭐ PREMIUM
              </span>
            ) : (
              <div className="flex items-center space-x-4">
                <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                  FREE
                </span>
                {!profile?.is_admin && (
                  <button
                    onClick={() => window.open('/upgrade', '_blank')}
                    className="inline-block px-6 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <span className="mr-2">⭐</span> Upgrade to Premium
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Password Section */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Keamanan</h2>
          <button
            onClick={() => setEditingPassword(!editingPassword)}
            className="flex items-center space-x-2 badge badge-warning text-blue-600 hover:text-blue-800"
          >
            <KeyIcon className="h-5 w-5" />
            <span>{editingPassword ? 'Batal' : 'Ubah Kata Sandi'}</span>
          </button>
        </div>

        {editingPassword && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Kata Sandi Baru</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border bg-black bg-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan kata sandi baru"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Konfirmasi Kata Sandi</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border bg-black bg-opacity-50 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Konfirmasi kata sandi baru"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleUpdatePassword}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckIcon className="h-4 w-4" />
                <span>{loading ? 'Mengupdate...' : 'Update Kata Sandi'}</span>
              </button>
              <button
                onClick={() => {
                  setEditingPassword(false)
                  setNewPassword('')
                  setConfirmPassword('')
                }}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Batal</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
