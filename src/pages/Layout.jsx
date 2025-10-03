

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Cart } from "@/api/entities";
import { User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Home, Sparkles, ShoppingBag, User as UserIcon, MessageCircle, ShoppingCart, Image, Wrench, Menu, X, SlidersHorizontal, Loader2, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import CreativeFilter from "./components/CreativeFilter";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showBottomBar, setShowBottomBar] = useState(false); // New state for bottom bar visibility

  useEffect(() => {
    loadCartCount();
    loadUser();
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      // Show bottom bar when scrolled down more than 300px
      if (window.scrollY > 300) {
        setShowBottomBar(true);
      } else {
        setShowBottomBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  const loadCartCount = async () => {
    try {
      const cartItems = await Cart.list();
      const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(totalItems);
    } catch (err) {
      console.error("Cart count error:", err);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (err) {
      console.error("User loading error:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 文件验证
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension || fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      alert("Please upload JPG or PNG image only (HEIC not supported)");
      e.target.value = ''; // 清空文件输入，允许用户重新选择
      return;
    }

    // 检查文件大小
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert("File too large. Please upload image smaller than 5MB.");
      e.target.value = ''; // 清空文件输入，允许用户重新选择
      return;
    }

    // 立即导航到Studio显示上传中状态
    navigate(createPageUrl(`HomiStudio?uploading=true`));
    setUploading(true);

    // 添加重试逻辑
    let attempts = 0;
    const maxAttempts = 3;
    let uploadSuccess = false;
    
    while (attempts < maxAttempts && !uploadSuccess) {
      try {
        const { file_url } = await UploadFile({ file });
        navigate(createPageUrl(`HomiStudio?image=${encodeURIComponent(file_url)}`), { replace: true });
        uploadSuccess = true; // 标记上传成功
      } catch (err) {
        attempts++;
        console.error(`Upload attempt ${attempts} failed:`, err);
        
        if (attempts >= maxAttempts) {
          alert("Upload failed after multiple retries. Please try again with a smaller image or a stable connection.");
          navigate(createPageUrl("HomiHub")); // 返回主页或错误页
        } else {
          // 等待一段时间再重试，例如 1s, 2s, 3s
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
    
    setUploading(false);
    e.target.value = ''; // 清空文件输入，防止再次选择相同文件时不触发onChange
  };

  const menuItems = [
    { name: "Discover", path: "Discover" },
    { name: "Homi Studio", path: "HomiStudio" },
    { name: "Shop", path: "Marketplace" },
    { name: "My Projects", path: "MyProjects" },
    { name: "Service", path: "Services" },
    { name: "Merchant Center", path: "MerchantCenter" },
    { name: "Subscribe", path: "Subscribe" },
    { name: "Profile", path: "Profile" },
  ];

  return (
    <div className="min-h-screen bg-[#F9F7F4] flex flex-col">
      <style>{`
        :root {
          --primary: #0A4D4E;
          --accent: #D4745F;
          --background: #F9F7F4;
          --text: #2C2C2C;
        }
        
        @keyframes logo-click {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        
        .logo-click-effect:active {
          animation: logo-click 0.2s ease-in-out;
        }

        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out forwards;
        }

        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }
      `}</style>

      {/* Top Navigation Bar - Compact with Logo */}
      <div className="bg-white border-b border-gray-100 px-2 py-2 sticky top-0 z-50">
        <div className="flex items-center justify-between gap-1 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-900" />
          </Button>

          <button
            onClick={() => navigate(createPageUrl("HomiHub"))}
            className="flex-1 flex justify-center hover:opacity-80 transition-opacity logo-click-effect"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dd9816b8d2bfcfbd7d3756/2906e88c4_Screenshot2025-10-02at20049AM.png"
              alt="Homi AI"
              className="h-10"
            />
          </button>

          {/* Cart Icon - Moved to top navigation bar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Cart"))}
            className="h-8 w-8 flex-shrink-0 relative"
          >
            <ShoppingCart className="w-5 h-5 text-[#0A4D4E]" />
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-[#D4745F] text-white rounded-full text-[10px] font-semibold">
                {cartCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Profile"))}
            className="w-8 h-8 flex-shrink-0 p-0 relative overflow-hidden rounded-full"
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dd9816b8d2bfcfbd7d3756/d6cd0f204_IMG_0315.jpg"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </Button>
        </div>
      </div>

      {/* Menu Sheet - Overlay */}
      {/* Overlay for menu */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-[99] flex justify-start">
          <div className="w-64 bg-white h-full shadow-lg p-4 animate-slide-in-left">
            <div className="flex justify-between items-center mb-6">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68dd9816b8d2bfcfbd7d3756/038d57866_Screenshot2025-10-02at124423PM.png"
                alt="Homi AI"
                className="h-10"
              />
              <button onClick={() => setMenuOpen(false)} className="p-1">
                <X className="w-5 h-5 text-gray-900" />
              </button>
            </div>
            <nav className="space-y-2">
              <ul className="space-y-1">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        navigate(createPageUrl(item.path));
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center p-3 rounded-md text-gray-700 hover:bg-gray-100 transition-colors text-left"
                    >
                      <span className="font-medium">{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* Creative Filter */}
      <CreativeFilter isOpen={filterOpen} onClose={() => setFilterOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 pb-28 overflow-auto relative">
        {children}
        
        {/* Floating Cart Icon - REMOVED from here */}
      </main>

      {/* Bottom Creative Input Bar - Only show when scrolled down */}
      {showBottomBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-transparent px-4 pb-6 pt-2 pointer-events-none animate-slide-up">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-3 flex items-center gap-3">
              {/* Left - Upload Photo Button */}
              <label className="flex-shrink-0 cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg, image/png" // Only allow JPEG and PNG through native file picker
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors">
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
                  ) : (
                    <Image className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </label>

              {/* Middle - Input */}
              <input
                type="text"
                placeholder={uploading ? "Uploading..." : "Start with a creative idea or upload image"}
                disabled={uploading}
                className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400 text-sm"
              />

              {/* Right - Filter Button */}
              <button
                onClick={() => setFilterOpen(true)}
                className="flex-shrink-0 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors"
                disabled={uploading}
              >
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
              </button>

              {/* Submit Button */}
              <button
                disabled={uploading}
                className="flex-shrink-0 w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <ArrowUp className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

