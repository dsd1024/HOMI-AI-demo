import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Post } from "@/api/entities";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { Plus, SlidersHorizontal, ArrowUp, Loader2, X, Image as ImageIcon, FileText, Camera, Layout, ScanLine } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import PostCard from "../components/feed/PostCard";
import FilterBar from "../components/feed/FilterBar";

export default function HomiHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedMode, setSelectedMode] = useState("Photo Mode");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [inputText, setInputText] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [creativeFilterSelectedStyle, setCreativeFilterSelectedStyle] = useState(null);

  // AI Chat states
  const [processing, setProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    zipCode: null,
    style: null,
    budget: null,
    roomType: null
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filterOpen) {
      setCreativeFilterSelectedStyle(filters.style || null);
    }
  }, [filterOpen, filters.style]);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);
      if (userData.location) {
        setUserPreferences(prev => ({ ...prev, zipCode: userData.location }));
      }
    } catch (err) {
      console.error("User loading error:", err);
    }
    
    const data = await Post.list("-created_date");
    setPosts(data);
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const { file_url } = await UploadFile({ file });
      navigate(createPageUrl(`HomiStudio?image=${encodeURIComponent(file_url)}`));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleModeClick = (mode) => {
    if (mode === selectedMode) {
      setSelectedMode(null);
      return;
    }
    setSelectedMode(mode);
    
    if (mode === "Photo Mode") {
      navigate(createPageUrl("PhotoMode"));
    } else if (mode === "Blueprint") {
      navigate(createPageUrl("BlueprintMode"));
    } else if (mode === "Scan") {
      navigate(createPageUrl("ScanMode"));
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const processUserInput = async () => {
    if (!inputText.trim()) return;
    
    setProcessing(true);
    setShowChatDialog(true);
    
    const userMessage = { role: "user", content: inputText };
    setChatHistory(prev => [...prev, userMessage]);
    
    try {
      const analysisResult = await InvokeLLM({
        prompt: `You are Homi AI, a friendly interior design assistant. Analyze this user input and extract design preferences.

User input: "${inputText}"

Current known preferences:
- ZIP Code: ${userPreferences.zipCode || 'Unknown'}
- Style: ${userPreferences.style || 'Unknown'}
- Budget: ${userPreferences.budget || 'Unknown'}
- Room Type: ${userPreferences.roomType || 'Unknown'}

Extract any new information and provide:
1. detected_zip_code (5-digit ZIP code if mentioned, otherwise null)
2. detected_style (one of: Modern, Scandinavian, Industrial, Minimalist, Bohemian, Traditional, Contemporary, Rustic - or null)
3. detected_budget (number in USD if mentioned, otherwise null)
4. detected_room_type (Living Room, Bedroom, Kitchen, Bathroom, Office, Dining Room, or Outdoor - or null)
5. has_enough_info (true if we have BOTH style AND budget)
6. response_message (friendly response in Chinese and English)
7. needs_more_info (array of missing fields: ["style", "budget"] if not enough info)

If information is missing, politely ask for it in a conversational way.
If we have enough information, confirm and let user know we'll generate their design.`,
        response_json_schema: {
          type: "object",
          properties: {
            detected_zip_code: { type: ["string", "null"] },
            detected_style: { type: ["string", "null"] },
            detected_budget: { type: ["number", "null"] },
            detected_room_type: { type: ["string", "null"] },
            has_enough_info: { type: "boolean" },
            response_message: { type: "string" },
            needs_more_info: { 
              type: "array",
              items: { type: "string" }
            }
          },
          required: ["has_enough_info", "response_message"]
        }
      });

      // Update user preferences with detected information
      const updatedPrefs = { ...userPreferences };
      if (analysisResult.detected_zip_code) updatedPrefs.zipCode = analysisResult.detected_zip_code;
      if (analysisResult.detected_style) updatedPrefs.style = analysisResult.detected_style;
      if (analysisResult.detected_budget) updatedPrefs.budget = analysisResult.detected_budget;
      if (analysisResult.detected_room_type) updatedPrefs.roomType = analysisResult.detected_room_type;
      setUserPreferences(updatedPrefs);

      // Add AI response to chat
      const aiMessage = { role: "assistant", content: analysisResult.response_message };
      setChatHistory(prev => [...prev, aiMessage]);

      // If we have enough info, navigate to generation
      if (analysisResult.has_enough_info && updatedPrefs.style && updatedPrefs.budget) {
        setTimeout(() => {
          const params = new URLSearchParams({
            prompt: inputText,
            style: updatedPrefs.style,
            budget: updatedPrefs.budget.toString(),
            ...(updatedPrefs.zipCode && { location: updatedPrefs.zipCode }),
            ...(updatedPrefs.roomType && { roomType: updatedPrefs.roomType })
          });
          
          navigate(createPageUrl(`HomiStudio?${params.toString()}`));
          setShowChatDialog(false);
        }, 1500);
      }
      
    } catch (err) {
      console.error("AI processing error:", err);
      const errorMessage = { 
        role: "assistant", 
        content: "抱歉，我遇到了一些问题。请再试一次。\n\nSorry, I encountered an issue. Please try again." 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    }
    
    setProcessing(false);
    setInputText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      processUserInput();
    }
  };

  const filteredPosts = posts.filter(post => {
    if (filters.style && post.style !== filters.style) return false;
    if (filters.budget_range && post.budget_range !== filters.budget_range) return false;
    if (filters.location && !post.location?.toLowerCase().includes(filters.location.toLowerCase())) return false;
    return true;
  });

  const leftPosts = filteredPosts.filter((_, index) => index % 2 === 0);
  const rightPosts = filteredPosts.filter((_, index) => index % 2 === 1);

  const handleCreativeFilterStyleSelect = (style) => {
    setCreativeFilterSelectedStyle(prev => prev === style ? null : style);
  };

  const handleCreativeFilterApply = () => {
    setFilters(prev => ({
      ...prev,
      style: creativeFilterSelectedStyle || undefined,
    }));
    setFilterOpen(false);
  };

  const handleCreativeFilterReset = () => {
    setCreativeFilterSelectedStyle(null);
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters.style;
      return newFilters;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center px-6 pt-16 pb-8">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-12 leading-tight">
          What do you want your<br />home to feel like {user ? user.full_name.split(' ')[0] : 'Sida'}?
        </h1>

        {/* Large Input Box */}
        <div className="w-full max-w-md bg-white rounded-3xl border-2 border-gray-200 p-6 shadow-sm mb-8">
          <input
            type="text"
            placeholder="Start with a creative idea or task..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 text-base mb-6"
            disabled={processing}
          />
          
          {/* Bottom Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Upload File Button */}
              <label className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading || processing}
                />
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Plus className="w-6 h-6" />
                )}
              </label>
              
              {/* Filter Button */}
              <button 
                type="button"
                onClick={() => setFilterOpen(true)}
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                disabled={processing}
              >
                <SlidersHorizontal className="w-6 h-6" />
              </button>
            </div>

            {/* Submit Button */}
            <button 
              onClick={processUserInput}
              disabled={!inputText.trim() || uploading || processing}
              className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? (
                <Loader2 className="w-5 h-5 text-gray-700 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mode Selection Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 w-full max-w-md">
          <button
            onClick={() => handleModeClick("Photo Mode")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap ${
              selectedMode === "Photo Mode"
                ? "bg-gray-900 text-white"
                : "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <Camera className={`w-5 h-5 ${selectedMode === "Photo Mode" ? "text-white" : "text-gray-400"}`} />
            Photo Mode
            {selectedMode === "Photo Mode" && (
              <X className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => handleModeClick("Blueprint")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap ${
              selectedMode === "Blueprint"
                ? "bg-gray-900 text-white"
                : "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <Layout className={`w-5 h-5 ${selectedMode === "Blueprint" ? "text-white" : "text-gray-400"}`} />
            Blueprint
            {selectedMode === "Blueprint" && (
              <X className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => handleModeClick("Scan")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap ${
              selectedMode === "Scan"
                ? "bg-gray-900 text-white"
                : "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300"
            }`}
          >
            <ScanLine className={`w-5 h-5 ${selectedMode === "Scan" ? "text-white" : "text-gray-400"}`} />
            Scan
            {selectedMode === "Scan" && (
              <X className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Chat Dialog Overlay */}
      {showChatDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">H</span>
                </div>
                <span className="font-semibold">Homi Agent</span>
              </div>
              <button onClick={() => setShowChatDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}
              {processing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions / Generate Button */}
            {userPreferences.style && userPreferences.budget && (
              <div className="p-4 border-t bg-gray-50">
                <Button
                  onClick={() => {
                    const params = new URLSearchParams({
                      style: userPreferences.style,
                      budget: userPreferences.budget.toString(),
                      ...(userPreferences.zipCode && { location: userPreferences.zipCode }),
                      ...(userPreferences.roomType && { roomType: userPreferences.roomType })
                    });
                    navigate(createPageUrl(`HomiStudio?${params.toString()}`));
                    setShowChatDialog(false);
                  }}
                  className="w-full bg-gray-900 hover:bg-gray-800"
                >
                  Generate My Design
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Discover Section */}
      <div className="bg-[#FAFAFA] pt-8 pb-24">
        <div className="px-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover</h2>
          <p className="text-gray-600 text-sm">Explore design inspiration from our community</p>
        </div>

        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        <div className="px-2 pt-4">
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
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500">Be the first to share your design!</p>
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

      {/* Creative Filter Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setFilterOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 mb-6">Filter Posts</h3>

            <div className="mb-6">
                <label className="text-sm font-medium text-gray-900 mb-3 block">Style</label>
                <div className="flex flex-wrap gap-2">
                  {["Modern", "Scandinavian", "Industrial", "Minimalist", "Bohemian", "Traditional", "Contemporary", "Rustic"].map((style) => (
                    <button
                      key={style}
                      onClick={() => handleCreativeFilterStyleSelect(style)}
                      className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all flex-shrink-0 ${
                        creativeFilterSelectedStyle === style
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                className="px-6 py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                onClick={handleCreativeFilterReset}
              >
                Reset
              </button>
              <button
                className="px-6 py-3 rounded-2xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
                onClick={handleCreativeFilterApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}