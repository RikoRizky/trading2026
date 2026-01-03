import { createServerClient, getServerUser, hasPremiumAccess } from '@/lib/supabase/server';
import { Post } from '@/lib/types';
import Link from 'next/link';
import LoginPrompt from '@/components/LoginPrompt';

type PageProps = {
  params: { slug: string };
};

function isYouTubeUrl(url?: string): boolean {
  if (!url) return false;
  return /youtu\.be|youtube\.com/.test(url);
}

function toEmbedUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'embed/');
  return url;
}

export default async function VideoDetailPage({ params }: PageProps) {
  const { slug } = params;
  const supabase = createServerClient();
  const user = await getServerUser();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`*, author:profiles(*)`)
    .eq('slug', slug)
    .single();

  if (error || !post) {
    return (
      <div className="container py-10">
        <h1 className="text-xl font-semibold">Video not found</h1>
        <p className="mt-2 text-gray-300">The video you are looking for does not exist.</p>
        <div className="mt-6">
          <Link href="/lessons" className="btn btn-primary">Back to videos</Link>
        </div>
      </div>
    );
  }

  const typedPost = post as unknown as Post;
  const videoUrl = (typedPost.metadata as any)?.video_url as string | undefined;
  const premium = !!typedPost.is_premium;
  const isAuthenticated = !!user;
  const hasPremium = isAuthenticated ? await hasPremiumAccess(user?.id) : false;
  const canWatch = premium ? (isAuthenticated && hasPremium) : isAuthenticated;

  // Fetch suggestions: same premium flag, must have video_url, exclude current, limit 6
  const { data: suggestions } = await supabase
    .from('posts')
    .select('*')
    .neq('slug', slug)
    .eq('is_premium', premium)
    .not('metadata->>video_url', 'is', null)
    .order('published_at', { ascending: false })
    .limit(6);

  const seeAllHref = premium ? '/blog' : '/lessons';

  return (
    <div className="container py-8">
      {/* Main player */}
      <div className="mb-8">
        <div className="mx-auto max-w-4xl aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative rounded-lg overflow-hidden shadow-lg">
          {canWatch && videoUrl ? (
            isYouTubeUrl(videoUrl) ? (
              <iframe
                src={toEmbedUrl(videoUrl)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={videoUrl} className="w-full h-full object-cover" controls />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-500 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-white/80 text-sm">Premium Video</p>
              </div>
            </div>
          )}

          {!canWatch && (
            <LoginPrompt
              isAuthenticated={isAuthenticated}
              isPremiumUser={hasPremium}
              className="backdrop-blur-sm"
              buttonHref={!isAuthenticated ? "/login" : "/upgrade"}
            />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl mb-12">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 leading-snug">{typedPost.title}</h1>
        {typedPost.tags && typedPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {typedPost.tags.map((tag) => (
              <span key={tag} className="text-[11px] badge badge-warning text-warning-900 px-2.5 py-1 rounded-full border border-primary-100">
                {tag.replace('-', ' ')}
              </span>
            ))}
          </div>
        )}
        {typedPost.excerpt && (
          <p className="text-gray-300 mb-5 leading-relaxed">{typedPost.excerpt}</p>
        )}
        <div className="prose max-w-none">
          <p className="whitespace-pre-line text-gray-300 leading-relaxed">{typedPost.content}</p>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Suggested videos</h2>
          <Link href={seeAllHref} className="text-primary-300 hover:text-primary-700 text-sm font-medium">
            See all →
          </Link>
        </div>

        {suggestions && suggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((s) => {
              const su = (s as any)?.metadata?.video_url as string | undefined;
              const href = `/videos/${s.slug}`;
              const yt = isYouTubeUrl(su);
              const eurl = toEmbedUrl(su);
              return (
                <Link key={s.id} href={href} className="card overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-200">
                    {su ? (
                      yt ? (
                        <iframe src={eurl} className="w-full h-full" />
                      ) : (
                        <video src={su} className="w-full h-full object-cover" />
                      )
                    ) : null}
                  </div>
                  <div className="p-4">
                    <div className="mb-2">
                      {s.is_premium ? (
                        <span className="bg-yellow-500 text-white text-[10px] px-2 py-1 rounded-full">PREMIUM</span>
                      ) : (
                        <span className="bg-green-500 text-white text-[10px] px-2 py-1 rounded-full">FREE</span>
                      )}
                    </div>
                    <div className="text-sm font-semibold line-clamp-2 text-gray-900 mb-1">{s.title}</div>
                    {Array.isArray((s as any).tags) && (s as any).tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(s as any).tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-[10px] badge badge-warning text-warning-900 px-2 py-0.5 rounded">
                            {tag.replace('-', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                    {(s as any).excerpt && (
                      <p className="text-xs text-gray-300 line-clamp-2">{(s as any).excerpt}</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-300">No suggestions available.</p>
        )}
      </div>
    </div>
  );
}


