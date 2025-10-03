import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart } from "lucide-react";

export default function PostCard({ post, onLike }) {
  const navigate = useNavigate();
  const [liked, setLiked] = React.useState(false);

  const handleLike = (e) => {
    e.stopPropagation();
    setLiked(!liked);
    onLike && onLike(post.id);
  };

  const handleClick = () => {
    navigate(createPageUrl(`PostDetail?id=${post.id}`));
  };

  const heightClass = React.useMemo(() => {
    const heights = ['aspect-[3/4]', 'aspect-[3/5]', 'aspect-[2/3]'];
    return heights[Math.floor(Math.random() * heights.length)];
  }, []);

  const authorName = post.author_name || post.created_by?.split('@')[0] || 'User';

  return (
    <div className="mb-3">
      <button 
        onClick={handleClick}
        className="w-full text-left"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-lg transition-shadow">
          <div className={`relative ${heightClass} overflow-hidden`}>
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-white font-semibold text-sm drop-shadow-lg leading-tight">
                {post.title}
              </h3>
            </div>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <img 
            src={post.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`}
            alt={authorName}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
          <span className="text-xs font-medium text-gray-800 truncate">
            {authorName}
          </span>
        </div>
        
        <button 
          onClick={handleLike}
          className="flex items-center gap-1 transition-colors flex-shrink-0"
        >
          <Heart 
            className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`} 
          />
          <span className="text-xs font-medium text-gray-700">
            {(post.likes_count || 0) + (liked ? 1 : 0)}
          </span>
        </button>
      </div>
    </div>
  );
}