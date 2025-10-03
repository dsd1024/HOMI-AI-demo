import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Post } from "@/api/entities";
import { User } from "@/api/entities";
import { Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import PostCard from "../components/feed/PostCard";
import FilterBar from "../components/feed/FilterBar";

export default function Discover() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (err) {
      console.error("User loading error:", err);
    }
    
    const data = await Post.list("-created_date");
    setPosts(data);
    setLoading(false);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const filteredPosts = posts.filter(post => {
    if (filters.style && post.style !== filters.style) return false;
    if (filters.budget_range && post.budget_range !== filters.budget_range) return false;
    if (filters.location && !post.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    if (searchQuery && !post.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const leftPosts = filteredPosts.filter((_, index) => index % 2 === 0);
  const rightPosts = filteredPosts.filter((_, index) => index % 2 === 1);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header Section */}
      <div className="bg-white px-4 pt-6 pb-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("HomiHub"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Discover
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search designs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-gray-200 bg-gray-50"
          />
        </div>
      </div>

      {/* Filters */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      {/* Masonry Grid - 2 Columns */}
      <div className="px-2 pt-2 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className={`w-full rounded-2xl ${i % 3 === 0 ? 'aspect-[3/5]' : 'aspect-[3/4]'}`} />
                <div className="flex items-center gap-2 px-1">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div>
              {leftPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            <div>
              {rightPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}