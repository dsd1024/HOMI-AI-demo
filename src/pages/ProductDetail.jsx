
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Product } from "@/api/entities";
import { Store } from "@/api/entities";
import { Cart } from "@/api/entities";
import { ArrowLeft, Package, PackageX, MapPin, Star, ShoppingCart, Box, ChevronLeft, ChevronRight, Phone, Mail, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ProductDetail() {
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  const loadData = useCallback(async () => {
    if (!productId) return;
    
    setLoading(true);
    
    const productData = await Product.filter({ id: productId });
    if (productData.length > 0) {
      setProduct(productData[0]);
      
      // Load ALL stores for now (since product_ids relationships need to be set up)
      // In production, filter by store.product_ids?.includes(productId)
      const allStores = await Store.list();
      
      // For demo purposes, show all stores
      // TODO: Filter stores that actually have this product
      setStores(allStores);
    }
    
    setLoading(false);
  }, [productId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const allImages = product ? [product.image_url, ...(product.gallery_images || [])] : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const addToCart = async () => {
    if (!product) return;
    
    setAddingToCart(true);
    
    try {
      await Cart.create({
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        price: product.price,
        quantity: 1
      });
      
      alert("Added to cart!");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Failed to add to cart");
    }
    
    setAddingToCart(false);
  };

  const addToFloorPlan = async () => {
    if (!product) return;
    
    // This would integrate with the Design/Blueprint mode
    alert("This product will be added to your current floor plan design!");
    navigate(createPageUrl("BlueprintMode"));
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

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Marketplace"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-[#2C2C2C]">Product Details</h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Image Gallery */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="relative aspect-square bg-gray-100">
            {allImages.length > 0 && (
              <>
                <img 
                  src={allImages[currentImageIndex]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
                
                {allImages.length > 1 && (
                  <>
                    {/* Navigation Buttons */}
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>

                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {allImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex 
                              ? 'bg-white w-6' 
                              : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {allImages.length > 1 && (
            <div className="p-4 flex gap-2 overflow-x-auto">
              {allImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex 
                      ? 'border-[#0A4D4E]' 
                      : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Product Info */}
        <Card className="border-none shadow-lg">
          <div className="p-6 space-y-4">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h2 className="text-2xl font-bold text-[#2C2C2C] flex-1">{product.name}</h2>
                {product.in_stock ? (
                  <Badge className="bg-green-500 text-white">
                    <Package className="w-4 h-4 mr-1" />
                    In Stock
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500 text-white">
                    <PackageX className="w-4 h-4 mr-1" />
                    Out of Stock
                  </Badge>
                )}
              </div>
              <p className="text-3xl font-bold text-[#0A4D4E] mb-3">${product.price}</p>
              {product.vendor && (
                <p className="text-sm text-gray-600">by <span className="font-semibold">{product.vendor}</span></p>
              )}
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>
            )}

            {product.dimensions && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Dimensions</h3>
                <p className="text-sm text-gray-600">
                  {product.dimensions.length}" L × {product.dimensions.width}" W × {product.dimensions.height}" H
                </p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              {product.category && (
                <Badge variant="outline">{product.category}</Badge>
              )}
              {product.style_tags?.map((tag, i) => (
                <Badge key={i} className="bg-[#0A4D4E]/10 text-[#0A4D4E]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        {/* 3D View & Floor Plan */}
        <Card className="border-none shadow-lg">
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Visualize</h3>
            
            <Tabs defaultValue="3d" className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="3d">
                  <Box className="w-4 h-4 mr-2" />
                  3D View
                </TabsTrigger>
                <TabsTrigger value="floorplan">
                  Add to Floor Plan
                </TabsTrigger>
              </TabsList>

              <TabsContent value="3d" className="mt-4">
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Box className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">3D Model Preview</p>
                    <p className="text-sm text-gray-500 mt-1">Interactive 360° view</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="floorplan" className="mt-4">
                <div className="bg-gradient-to-br from-[#0A4D4E]/5 to-[#0A4D4E]/10 rounded-xl p-6 text-center">
                  <Box className="w-12 h-12 mx-auto text-[#0A4D4E] mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">Add to Your Design</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Import this product into your current floor plan design
                  </p>
                  <Button
                    onClick={addToFloorPlan}
                    className="bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
                  >
                    Import to Floor Plan
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>

        {/* Nearby Pickup Stores */}
        {product.in_stock && stores.length > 0 && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0A4D4E]" />
                <h3 className="text-lg font-semibold text-[#2C2C2C]">
                  Nearby Pickup Stores ({stores.length})
                </h3>
              </div>

              <div className="space-y-3">
                {stores.map(store => (
                  <Card key={store.id} className="border border-gray-200 hover:border-[#0A4D4E] hover:shadow-md transition-all">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#2C2C2C] mb-1">
                            {store.store_name}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {store.address}, {store.city}, {store.state} {store.zip_code}
                          </p>
                          {store.hours && (
                            <p className="text-xs text-gray-500">{store.hours}</p>
                          )}
                        </div>
                        <MapPin className="w-5 h-5 text-[#0A4D4E] flex-shrink-0 ml-2" />
                      </div>
                      
                      {/* Contact Options */}
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <a
                          href={`tel:${store.phone}`}
                          className="flex items-center justify-center gap-1 py-2 px-3 bg-[#0A4D4E] text-white rounded-lg text-xs font-medium hover:bg-[#0A4D4E]/90 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                        <a
                          href={`mailto:${store.email}`}
                          className="flex items-center justify-center gap-1 py-2 px-3 border border-[#0A4D4E] text-[#0A4D4E] rounded-lg text-xs font-medium hover:bg-[#0A4D4E]/5 transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                        <Link
                          to={createPageUrl(`StoreDetail?id=${store.id}`)}
                          className="flex items-center justify-center gap-1 py-2 px-3 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                          <Navigation className="w-3 h-3" />
                          Navigate
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        )}

        {product.in_stock && stores.length === 0 && (
          <Card className="border-none shadow-lg">
            <div className="p-6 text-center">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No pickup stores found nearby</p>
              <p className="text-sm text-gray-400 mt-1">Product available for delivery only</p>
            </div>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#0A4D4E] text-[#0A4D4E] hover:bg-[#0A4D4E]/5"
            onClick={addToFloorPlan}
          >
            <Box className="w-5 h-5 mr-2" />
            Add to Design
          </Button>
          <Button
            className="flex-1 bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
            onClick={addToCart}
            disabled={!product.in_stock || addingToCart}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {addingToCart ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
