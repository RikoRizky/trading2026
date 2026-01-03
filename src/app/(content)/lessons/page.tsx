'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/lib/types';
import { formatDate, truncateText, cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import LoginPrompt from '@/components/LoginPrompt';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  BookOpenIcon,
  ClockIcon,
  UserIcon,
  PlayIcon,
  LockClosedIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { mockLessons } from '@/lib/mockData';

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredLessons, setFilteredLessons] = useState<Post[]>([]);
  const { profile, user, loading: authLoading, refreshProfile } = useAuth();
  
  // Derived state from AuthProvider
  const isAuthenticated = !!user;
  const isAdminUser = profile?.is_admin || false;
  
  // Free video states
  const [freeVideoTitle, setFreeVideoTitle] = useState('');
  const [freeVideoUrl, setFreeVideoUrl] = useState('');
  const [freeVideoDescription, setFreeVideoDescription] = useState('');
  const [freeVideoCategory, setFreeVideoCategory] = useState('trading-basics');
  
  // Edit states
  const [editingVideo, setEditingVideo] = useState<Post | null>(null);
  const [editMode, setEditMode] = useState<'free' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Pagination states
  const [showAllFree, setShowAllFree] = useState(false);
  const videosPerPage = 6;
  
  const [submitting, setSubmitting] = useState(false);

  // Filter free video posts - moved before useEffect to avoid temporal dead zone
  const freeVideoPosts = lessons.filter(lesson => 
    !lesson.is_premium && 
    (lesson.metadata as any)?.video_url
  );

  const categories = [
    { value: 'all', label: 'All Categories', count: 0 },
    { value: 'trading-basics', label: 'Trading Basics', count: 0 },
    { value: 'technical-analysis', label: 'Technical Analysis', count: 0 },
    { value: 'fundamental-analysis', label: 'Fundamental Analysis', count: 0 },
    { value: 'risk-management', label: 'Risk Management', count: 0 },
    { value: 'psychology', label: 'Trading Psychology', count: 0 },
    { value: 'strategies', label: 'Trading Strategies', count: 0 },
    { value: 'tools', label: 'Trading Tools', count: 0 },
  ];

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Set timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Loading timeout - showing fallback data');
            setLessons(mockLessons as unknown as Post[]);
            setLoading(false);
          }
        }, 10000); // 10 second timeout

        await fetchLessons();
        
        // Clear timeout and set loading to false after operation completes
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        if (mounted) {
          setLessons(mockLessons as unknown as Post[]);
          setLoading(false);
        }
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    filterLessons();
  }, [lessons, searchTerm, selectedCategory]);

  const fetchLessons = async () => {
    try {
      const supabase = createClient();
      
      // Add timeout for fetch operation
      const fetchPromise = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .or('type.eq.lesson,and(type.eq.article,is_premium.eq.false)')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Fetch timeout')), 8000)
      );

      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('Error fetching lessons:', error);
        setLessons(mockLessons as unknown as Post[]);
      } else {
        const final = (data && data.length > 0) ? data : mockLessons;
        setLessons(final as unknown as Post[]);
      }
    } catch (error) {
      console.error('Error in fetchLessons:', error);
      // Always set fallback data to prevent stuck state
      setLessons(mockLessons as unknown as Post[]);
    }
  };

  const filterLessons = () => {
    let filtered = freeVideoPosts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(video =>
        video.tags?.includes(selectedCategory)
      );
    }

    setFilteredLessons(filtered);
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return freeVideoPosts.length;
    return freeVideoPosts.filter(video => video.tags?.includes(category)).length;
  };


  const toSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const parseTags = (category: string): string[] => {
    return ['video', category];
  };

  const handleAddFreeVideo = async () => {
    if (!isAdminUser) return;
    if (!freeVideoTitle || !freeVideoUrl) return;
    setSubmitting(true);
    
    try {
      console.log('=== Starting free video upload ===');
      console.log('Form data:', { freeVideoTitle, freeVideoUrl, freeVideoDescription, freeVideoCategory });
      
      const supabase = createClient();
      console.log('Supabase client created');
      
      const { data: userResp, error: userError } = await supabase.auth.getUser();
      console.log('User response:', { userResp, userError });
      
      if (userError) {
        throw new Error('Auth error: ' + userError.message);
      }
      
      const userId = userResp.user?.id;
      if (!userId) {
        throw new Error('Not authenticated - no user ID');
      }

      console.log('User ID:', userId);

      const slug = `${toSlug(freeVideoTitle)}-${Math.random().toString(36).slice(2, 8)}`;
      const tags = parseTags(freeVideoCategory);

      const insertData = {
        title: freeVideoTitle,
        slug,
        content: '',
        excerpt: freeVideoDescription,
        type: 'article',
        status: 'published',
        is_premium: false, // Free video
        author_id: userId,
        tags,
        metadata: { video_url: freeVideoUrl, video_type: 'url' },
        published_at: new Date().toISOString(),
      };

      console.log('Inserting free video data:', insertData);

      const { data, error } = await supabase
        .from('posts')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from insert');
      }

      console.log('Free video uploaded successfully:', data);

      setFreeVideoTitle('');
      setFreeVideoUrl('');
      setFreeVideoDescription('');
      setFreeVideoCategory('trading-basics');
      
      // Refresh lessons
      console.log('Refreshing lessons...');
      await fetchLessons();
      
      // Refresh profile to ensure admin status is up to date
      if (user) {
        await refreshProfile();
      }
      
      alert('Video gratis berhasil ditambahkan!');
    } catch (e) {
      console.error('Add free video failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      alert('Gagal menambahkan video gratis: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditVideo = (video: Post) => {
    setEditingVideo(video);
    setEditMode('free');
    setFreeVideoTitle(video.title);
    setFreeVideoDescription(video.excerpt || '');
    setFreeVideoUrl((video.metadata as any)?.video_url || '');
    setFreeVideoCategory(video.tags?.find(tag => tag !== 'video') || 'trading-basics');
    setShowEditModal(true);
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!isAdminUser) return;
    if (!confirm('Apakah Anda yakin ingin menghapus video ini?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', videoId);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      alert('Video berhasil dihapus!');
      await fetchLessons();
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
      const { data: userResp, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw new Error('Auth error: ' + userError.message);
      const userId = userResp.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const updateData: any = {
        title: freeVideoTitle,
        excerpt: freeVideoDescription,
        tags: parseTags(freeVideoCategory),
        updated_at: new Date().toISOString(),
        metadata: { 
          video_url: freeVideoUrl, 
          video_type: 'url' 
        },
      };

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', editingVideo.id);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      alert('Video berhasil diperbarui!');
      setEditingVideo(null);
      setEditMode(null);
      setShowEditModal(false);
      setFreeVideoTitle('');
      setFreeVideoUrl('');
      setFreeVideoDescription('');
      setFreeVideoCategory('trading-basics');
      
      await fetchLessons();
    } catch (e) {
      console.error('Update video failed:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      alert('Gagal memperbarui video: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingVideo(null);
    setEditMode(null);
    setShowEditModal(false);
    setFreeVideoTitle('');
    setFreeVideoUrl('');
    setFreeVideoDescription('');
    setFreeVideoCategory('trading-basics');
  };

  // Pagination functions
  const toggleShowAllFree = () => {
    setShowAllFree(!showAllFree);
  };


  // Don't wait for authLoading if it takes too long - show content anyway
  // Auth state will update when ready
  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark overflow-x-hidden">
        <div className="container px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8 mx-auto"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-6 bg-white/10 border border-white/20 rounded-xl">
                  <div className="h-48 bg-gray-300/30 rounded mb-4"></div>
                  <div className="h-6 bg-gray-300/30 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300/30 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-300/30 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark overflow-x-hidden">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <PlayIcon className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Trading Videos
            </h1>
            {!isAuthenticated && (
              <span className="ml-4 badge badge-warning">Login Required</span>
            )}
            {isAuthenticated && (
              <span className="ml-4 badge badge-success">Free for All Users</span>
            )}
          </div>
          <p className="text-xl text-gray-300 max-w-3xl">
            Watch free trading videos and tutorials. Learn from experienced traders and improve your skills with our comprehensive collection of video content.
            {!isAuthenticated && (
              <span className="text-yellow-600 font-medium">
                {' '}Please login to watch the videos!
              </span>
            )}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input pl-10 appearance-none"
                >
                  {categories.map((category) => (
                    <option className="bg-black bg-opacity-80" key={category.value} value={category.value}>
                      {category.label} ({getCategoryCount(category.value)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-300">
            Showing {filteredLessons.length} of {freeVideoPosts.length} videos
          </p>
        </div>

        {/* Admin Form for Free Videos */}
        {isAdminUser && (
          <div className="card p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Free Video (Admin Only)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-900 mb-1">Title</label>
                <input
                  type="text"
                  className="input"
                  value={freeVideoTitle}
                  onChange={(e) => setFreeVideoTitle(e.target.value)}
                  placeholder="Video title"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-900 mb-1">Video URL</label>
                <input
                  type="text"
                  className="input"
                  value={freeVideoUrl}
                  onChange={(e) => setFreeVideoUrl(e.target.value)}
                  placeholder="Example: https://www.youtube.com/watch?v=..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={freeVideoDescription}
                  onChange={(e) => setFreeVideoDescription(e.target.value)}
                  placeholder="Short description about this video..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-1">Category</label>
                <select
                  className="input"
                  value={freeVideoCategory}
                  onChange={(e) => setFreeVideoCategory(e.target.value)}
                >
                  {categories.slice(1).map((category) => (
                    <option className="bg-black bg-opacity-80" key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <button 
                className="btn btn-primary" 
                onClick={handleAddFreeVideo} 
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Add Free Video'}
              </button>
            </div>
            <p className="text-xs text-gray-300 mt-2">
              Free videos are available to all users.
            </p>
          </div>
        )}

        {/* Free Videos Grid */}
        {freeVideoPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLessons.slice(0, showAllFree ? filteredLessons.length : videosPerPage).map((post) => {
                const vurl = (post.metadata as any)?.video_url as string | undefined;
                
                // Improved YouTube URL detection and conversion
                const isYouTube = vurl && (
                  /youtu\.be/.test(vurl) || 
                  /youtube\.com/.test(vurl) ||
                  /youtube\.com\/embed/.test(vurl)
                );
                
                let embedUrl = vurl;
                if (isYouTube && vurl) {
                  // Extract video ID from various YouTube URL formats
                  let videoId: string | null = null;
                  
                  // Format: https://www.youtube.com/watch?v=VIDEO_ID
                  const watchMatch = vurl.match(/[?&]v=([^&]+)/);
                  if (watchMatch) {
                    videoId = watchMatch[1];
                  }
                  // Format: https://youtu.be/VIDEO_ID
                  else if (vurl.includes('youtu.be/')) {
                    const match = vurl.match(/youtu\.be\/([^?&]+)/);
                    if (match) videoId = match[1];
                  }
                  // Format: https://www.youtube.com/embed/VIDEO_ID (already embed)
                  else if (vurl.includes('youtube.com/embed/')) {
                    const match = vurl.match(/embed\/([^?&]+)/);
                    if (match) videoId = match[1];
                  }
                  // Format: https://www.youtube.com/v/VIDEO_ID
                  else if (vurl.includes('youtube.com/v/')) {
                    const match = vurl.match(/v\/([^?&]+)/);
                    if (match) videoId = match[1];
                  }
                  // Format: https://www.youtube.com/shorts/VIDEO_ID
                  else if (vurl.includes('youtube.com/shorts/')) {
                    const match = vurl.match(/shorts\/([^?&]+)/);
                    if (match) videoId = match[1];
                  }
                  
                  if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                  } else if (vurl.includes('youtube.com/embed/')) {
                    embedUrl = vurl; // Already in embed format
                  }
                }

                return (
                  <article key={`free-video-${post.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-200 relative">
                      {vurl ? (
                        isYouTube ? (
                          // YouTube videos should always show for free videos
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={post.title}
                          />
                        ) : (
                          <>
                            {/* Non-YouTube videos */}
                            {isAuthenticated ? (
                              <video 
                                src={vurl} 
                                className="w-full h-full object-cover"
                                controls
                              />
                            ) : (
                              <>
                                <video 
                                  src={vurl} 
                                  className="w-full h-full object-cover"
                                  style={{ filter: 'blur(8px)' }}
                                  muted
                                  loop
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Link href="/login" className="z-10">
                                    <LoginPrompt 
                                      isAuthenticated={isAuthenticated}
                                      title="Login Required"
                                      description="Please login to watch this free video"
                                      buttonText="Login"
                                      buttonHref="/login"
                                    />
                                  </Link>
                                </div>
                              </>
                            )}
                          </>
                        )
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                          <PlayIcon className="h-16 w-16 text-primary-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center mb-2">
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                          FREE
                        </span>
                        <span className="text-xs text-gray-300">
                          {!isAuthenticated ? 'Login required' : 'Available to all users'}
                        </span>
                      </div>
                      <Link href={!isAuthenticated ? "/login" : `/videos/${post.slug}`} className="block">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 hover:text-primary-700">{post.title}</h3>
                      </Link>
                      {post.excerpt ? (
                        <p className="text-sm text-gray-300 line-clamp-2">{post.excerpt}</p>
                      ) : null}
                      <div className="mt-2 flex items-center text-xs text-gray-900">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {post.author?.full_name || 'Admin'}
                        <ClockIcon className="h-3 w-3 ml-3 mr-1" />
                        {formatDate(post.published_at || post.created_at)}
                      </div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs badge badge-success text-success-700 px-2 py-1 rounded"
                            >
                              {tag.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                      {isAdminUser && (
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => handleEditVideo(post)}
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVideo(post.id)}
                            className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {filteredLessons.length > videosPerPage && (
              <div className="text-center mt-8">
                <button
                  onClick={toggleShowAllFree}
                  className="btn btn-outline"
                >
                  {showAllFree ? 'Show Less' : `See All (${filteredLessons.length} videos)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <PlayIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No free videos yet
            </h3>
            <p className="text-gray-300 mb-4">
              {isAdminUser ? 'Add your first free video using the form above.' : 'Free videos will be available soon.'}
            </p>
          </div>
        )}

      </div>

      {/* Edit Modal */}
      {showEditModal && editingVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-black bg-opacity-50 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-300">
                  Edit Free Video
                </h3>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={freeVideoTitle}
                    onChange={(e) => setFreeVideoTitle(e.target.value)}
                    placeholder="Video title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Video URL</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={freeVideoUrl}
                    onChange={(e) => setFreeVideoUrl(e.target.value)}
                    placeholder="Example: https://www.youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    value={freeVideoDescription}
                    onChange={(e) => setFreeVideoDescription(e.target.value)}
                    placeholder="Short description about this video..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select
                    className="input w-full"
                    value={freeVideoCategory}
                    onChange={(e) => setFreeVideoCategory(e.target.value)}
                  >
                    {categories.slice(1).map((category) => (
                      <option className="bg-black bg-opacity-80"key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateVideo}
                  className="btn btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Update Video'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

