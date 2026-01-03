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

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  
  // Pagination states
  const [showAllPremium, setShowAllPremium] = useState(false);
  const videosPerPage = 6;
  
  const { profile } = useAuth();

  const categories = [
    { value: 'all', label: 'All Articles', count: 0 },
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
        // Detect recovery cookie to avoid treating user as logged-in premium during reset flow
        try {
          const hasRecovery = document.cookie
            .split(';')
            .map(v => v.trim())
            .some(v => v.startsWith('recovery='));
          setIsRecovery(hasRecovery);
        } catch {}

        setLoading(true);
        
        // Set timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Loading timeout - showing fallback data');
            setLoading(false);
          }
        }, 10000); // 10 second timeout

        await Promise.all([
          fetchPosts(),
          checkUserStatus()
        ]);
        
        // Clear timeout and set loading to false after all operations complete
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        if (mounted) {
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
    filterPosts();
  }, [posts, searchTerm, selectedCategory]);

  const checkUserStatus = async () => {
    try {
      if (isRecovery) {
        // During recovery, always treat as not-premium
        setIsPremiumUser(false);
        setIsAuthenticated(false);
        return;
      }
      const supabase = createClient();
      
      // Add timeout for auth check
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      );

      const { data: userResp } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (userResp?.user) {
        setIsAuthenticated(true);
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('is_admin, membership_type')
            .eq('id', userResp.user.id)
            .single();
          
          setIsPremiumUser(profileData?.membership_type === 'premium');
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          setIsPremiumUser(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsPremiumUser(false);
      }
    } catch (error) {
      console.error('Error checking user status:', error);
      // Always set default values to prevent stuck state
      setIsAuthenticated(false);
      setIsPremiumUser(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const supabase = createClient();
      
      // Fetch all published posts with timeout
      const fetchPromise = supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('type', 'article')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error('Error in fetchPosts:', error);
      // Always set empty array to prevent stuck loading
      setPosts([]);
    }
  };

  const filterPosts = () => {
    let filtered = premiumVideoPosts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post =>
        post.tags?.includes(selectedCategory)
      );
    }

    setFilteredPosts(filtered);
  };

  const getCategoryCount = (category: string) => {
    if (category === 'all') return premiumVideoPosts.length;
    return premiumVideoPosts.filter(post => post.tags?.includes(category)).length;
  };

  // Pagination functions
  const getDisplayedPremiumVideos = () => {
    if (showAllPremium) return filteredPosts;
    return filteredPosts.slice(0, videosPerPage);
  };

  const toggleShowAllPremium = () => {
    setShowAllPremium(!showAllPremium);
  };

  // Filter premium video posts
  const premiumVideoPosts = posts.filter(post => 
    post.is_premium && 
    (post.metadata as any)?.video_url
  );

  if (loading) {
    return (
      <div className="min-h-screen pb-12 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark overflow-x-hidden">
        <div className="container">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark overflow-x-hidden">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center mb-4">
            <BookOpenIcon className="h-8 w-8 text-primary-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Trading Blog
            </h1>
            <span className="ml-4 badge badge-warning">Premium Content</span>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl">
            Premium trading content and exclusive video tutorials. 
            <span className="text-yellow-600 font-medium">
              {' '}Upgrade to premium to access all content!
            </span>
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
                  placeholder="Search premium content..."
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
            Showing {filteredPosts.length} of {premiumVideoPosts.length} premium videos
          </p>
        </div>


        {/* Premium Videos Grid */}
        {premiumVideoPosts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(filteredPosts.length > 0 ? getDisplayedPremiumVideos() : []).map((post) => {
                const vurl = (post.metadata as any)?.video_url as string | undefined;
                return (
                  <article key={`premium-video-${post.id}`} className="card overflow-hidden hover:shadow-lg transition-shadow relative">
                    <div className="aspect-video bg-gray-200 relative">
                      {isPremiumUser ? (
                        <video src={vurl} className="w-full h-full object-cover" controls />
                      ) : (
                        <>
                          {/* Blurred video background */}
                          <video 
                            src={vurl} 
                            className="w-full h-full object-cover filter blur-sm" 
                            muted 
                            loop
                            style={{ filter: 'blur(8px)' }}
                          />
                          {/* Clickable overlay with upgrade message */}
                          <Link href="/upgrade" className="absolute inset-0">
                            <LoginPrompt 
                              isAuthenticated={true}
                              isPremiumUser={false}
                              title="Premium Content"
                              description="Upgrade to Premium to watch this video"
                              buttonText="Upgrade Now"
                              buttonHref="/upgrade"
                            />
                          </Link>
                        </>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-center mb-2">
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full mr-2">
                          PREMIUM
                        </span>
                        <span className="text-xs text-gray-300">
                      {isPremiumUser ? 'Premium content' : 'Upgrade required'}
                        </span>
                      </div>
                      <Link href={isPremiumUser ? `/videos/${post.slug}` : `/upgrade`} className="block">
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
                              className="text-xs badge badge-warning text-yellow-900 px-2 py-1 rounded"
                            >
                              {tag.replace('-', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {filteredPosts.length === 0 && (
              <div className="text-center text-gray-300 mt-4">No results match your filters.</div>
            )}
            {filteredPosts.length > videosPerPage && (
              <div className="text-center mt-8">
                <button
                  onClick={toggleShowAllPremium}
                  className="btn btn-outline"
                >
              {showAllPremium ? 'Show Less' : `See All (${filteredPosts.length} videos)`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12">
            {isPremiumUser ? (
              <div className="text-center text-gray-300">
                No premium videos yet.
              </div>
            ) : (
              <Link href="/upgrade" className="block max-w-3xl mx-auto rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                <div className="relative bg-gradient-to-r from-gray-800 to-gray-700 text-white p-10 text-center">
                  <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpenIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold mb-2">Premium Content</div>
                  <div className="text-sm opacity-90 mb-4">Upgrade to access all premium trading videos.</div>
                  <span className="btn btn-primary btn-sm">Upgrade Now</span>
                </div>
              </Link>
            )}
          </div>
        )}

      </div>

    </div>
  );
}