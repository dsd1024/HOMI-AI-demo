
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { Cart } from "@/api/entities";
import { Search, Filter, Package, PackageX, Eye, ShoppingCart, Box } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = ["All", "Furniture", "Lighting", "Decor", "Textiles", "Storage", "Appliances", "Building Materials"];

function ProductCard({ product, onAddToCart, addingToCart, onView }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  // Get all available images - 优先使用透明背景图
  const allImages = [
    product.transparent_image_url,
    ...(product.gallery_images || [])
  ].filter(Boolean);

  // 悬停时显示场景图，否则显示无底图
  const displayImage = isHovered 
    ? (product.image_url || product.transparent_image_url) 
    : (allImages[currentImageIndex] || product.transparent_image_url);

  // Calculate discount percentage if there's an original price
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        onView(e, product.id);
      }}
      className="w-full text-left group"
    >
      <div className="bg-white rounded-lg overflow-hidden">
        {/* Image Container - 图片占满容器 */}
        <div 
          className="relative bg-white overflow-hidden"
          style={{ aspectRatio: '1/1.2' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Sale Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-gray-600 text-white text-xs px-2 py-1 font-semibold">
                Sale
              </Badge>
            </div>
          )}

          {/* 3D View Icon - 右上角，只在无底图时显示 */}
          {!isHovered && product.has_3d_view && (
            <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md">
              <Box className="w-4 h-4 text-gray-900" />
            </div>
          )}

          {/* Product Image - 占满整个容器 */}
          {displayImage && (
            <img 
              src={displayImage} 
              alt={product.name} 
              className="w-full h-full transition-all duration-500"
              style={{
                transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                objectFit: isHovered ? 'cover' : 'contain',
                padding: isHovered ? '0' : '1rem'
              }}
            />
          )}

          {/* Image Dots Indicator - 只在无底图时显示 */}
          {!isHovered && allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex 
                      ? 'bg-gray-800 w-6' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Out of Stock Overlay */}
          {!product.in_stock && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Badge className="bg-gray-500 text-white">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
            {product.name}
          </h3>

          {/* Subtitle/Description */}
          <p className="text-sm text-gray-500 mb-3 line-clamp-1">
            {product.description || product.category}
          </p>

          {/* Price */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-[#D4745F]">
              ${product.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ${product.original_price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Color Options */}
          {product.color_options && product.color_options.length > 0 && (
            <div className="flex gap-2">
              {product.color_options.map((color, index) => (
                <button
                  key={index}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    index === 0 ? 'border-gray-800' : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.hex || color }}
                  title={color.name || color}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default function Marketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("all");
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    loadProducts();
    
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await Product.list("-created_date");
    setProducts(data);
    setLoading(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesStock = 
      stockFilter === "all" || 
      (stockFilter === "in_stock" && product.in_stock) ||
      (stockFilter === "out_of_stock" && !product.in_stock);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const addToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!product.in_stock) return;
    
    setAddingToCart(product.id);
    
    try {
      await Cart.create({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url || product.transparent_image_url,
        price: product.price,
        quantity: 1
      });
      
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Failed to add to cart");
    }
    
    setAddingToCart(null);
  };

  const viewProduct = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(createPageUrl(`ProductDetail?id=${productId}`));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-6 pb-4 sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-[#2C2C2C] mb-4">Shop</h1>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-gray-200 bg-gray-50"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg overflow-hidden">
                <Skeleton className="w-full" style={{ aspectRatio: '1/1.2' }} />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <PackageX className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No products found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 text-sm text-[#0A4D4E] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                addingToCart={addingToCart}
                onView={viewProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
