import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Post } from "@/api/entities";
import { Comment } from "@/api/entities";
import { User } from "@/api/entities";
import { ArrowLeft, Heart, Share2, Copy, Check, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "../components/feed/UserAvatar";

export default function PostDetail() {
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  const loadPost = useCallback(async () => {
    if (!postId) return;
    
    setLoading(true);
    const postData = await Post.filter({ id: postId });
    if (postData.length > 0) {
      setPost(postData[0]);
    }
    setLoading(false);
  }, [postId]);

  const loadComments = useCallback(async () => {
    if (!postId) return;
    
    setLoadingComments(true);
    try {
      const commentsData = await Comment.filter({ post_id: postId });
      // Sort by newest first
      const sortedComments = commentsData.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
      setComments(sortedComments);
    } catch (err) {
      console.error("Load comments error:", err);
    }
    setLoadingComments(false);
  }, [postId]);

  const loadCurrentUser = async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);
    } catch (err) {
      console.error("Load user error:", err);
    }
  };

  useEffect(() => {
    loadPost();
    loadComments();
    loadCurrentUser();
  }, [loadPost, loadComments]);

  const handleLike = () => {
    setLiked(!liked);
  };

  const copyDiscountCode = () => {
    if (post?.discount_code) {
      navigator.clipboard.writeText(post.discount_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const navigateToProduct = (productId) => {
    navigate(createPageUrl(`ProductDetail?id=${productId}`));
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !currentUser) return;
    
    setSubmittingComment(true);
    
    try {
      await Comment.create({
        post_id: postId,
        content: newComment.trim(),
        author_name: currentUser.full_name,
        author_avatar: currentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.full_name)}&background=random`,
        likes_count: 0
      });
      
      setNewComment("");
      await loadComments(); // Reload comments
    } catch (err) {
      console.error("Submit comment error:", err);
      alert("Failed to post comment");
    }
    
    setSubmittingComment(false);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F4]">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="px-4 pt-6">
          <Skeleton className="w-full aspect-square rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <img 
              src={post.author_avatar}
              alt={post.author_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold text-gray-900">{post.author_name}</h2>
              <p className="text-xs text-gray-500">{post.location || "Interior Designer"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Main Image with SKU Tags */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="relative">
            <img 
              src={post.image_url}
              alt={post.title}
              className="w-full object-cover"
            />
            
            {/* SKU Tags Overlay */}
            {post.sku_tags && post.sku_tags.length > 0 && (
              <>
                {post.sku_tags.map((sku, i) => (
                  <button
                    key={i}
                    onClick={() => navigateToProduct(sku.product_id)}
                    className="absolute bg-white/95 backdrop-blur-sm hover:bg-gray-900 text-gray-900 hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={sku.position}
                  >
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      {sku.name}
                      <svg 
                        className="w-3 h-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ))}
              </>
            )}
          </div>
        </Card>

        {/* Post Content */}
        <Card className="border-none shadow-lg">
          <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {post.style && (
                <Badge className="bg-gray-900 text-white">{post.style}</Badge>
              )}
              {post.room_type && (
                <Badge variant="outline">{post.room_type}</Badge>
              )}
              {post.budget_range && (
                <Badge variant="outline">{post.budget_range}</Badge>
              )}
            </div>

            {/* Description */}
            {post.description && (
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {post.description}
              </div>
            )}

            {/* Discount Code */}
            {post.discount_code && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 border-2 border-dashed border-red-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      🎁 Exclusive Discount Code
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {post.discount_code}
                    </p>
                  </div>
                  <Button
                    onClick={copyDiscountCode}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Engagement */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
              <button 
                onClick={handleLike}
                className="flex items-center gap-2 transition-colors"
              >
                <Heart 
                  className={`w-6 h-6 ${liked ? "fill-red-500 text-red-500" : "text-gray-500"}`} 
                />
                <span className="font-semibold text-gray-700">
                  {(post.likes_count || 0) + (liked ? 1 : 0)}
                </span>
              </button>
              
              <div className="flex items-center gap-2 text-gray-500">
                <MessageCircle className="w-6 h-6" />
                <span className="font-semibold text-gray-700">{comments.length}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Featured Products */}
        {post.sku_tags && post.sku_tags.length > 0 && (
          <Card className="border-none shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Featured Products in This Design
              </h3>
              <div className="space-y-3">
                {post.sku_tags.map((sku, i) => (
                  <button
                    key={i}
                    onClick={() => navigateToProduct(sku.product_id)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">🛋️</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{sku.name}</p>
                      <p className="text-xs text-gray-500">Tap to view product</p>
                    </div>
                    <svg 
                      className="w-5 h-5 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Comments Section */}
        <Card className="border-none shadow-lg">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comments ({comments.length})
            </h3>

            {/* Add Comment */}
            {currentUser && (
              <div className="mb-6 space-y-3">
                <div className="flex gap-3">
                  <UserAvatar user={currentUser} size="md" />
                  <div className="flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="min-h-[80px] resize-none"
                      disabled={submittingComment}
                    />
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="mt-2 bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
                    >
                      {submittingComment ? (
                        <>
                          <Send className="w-4 h-4 mr-2 animate-pulse" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {loadingComments ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No comments yet</p>
                  <p className="text-sm text-gray-400 mt-1">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 pb-4 border-b border-gray-100 last:border-0">
                    <img 
                      src={comment.author_avatar} 
                      alt={comment.author_name}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">
                          {comment.author_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimeAgo(comment.created_date)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <button className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors">
                          <Heart className="w-4 h-4" />
                          <span className="text-xs">{comment.likes_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}