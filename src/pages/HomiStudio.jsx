
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile, GenerateImage, InvokeLLM } from "@/api/integrations";
import { User } from "@/api/entities";
import { DesignProject } from "@/api/entities";
import { Cart } from "@/api/entities";
import { Product } from "@/api/entities";
import { ArrowLeft, Loader2, X, ShoppingCart, Save, ZoomIn, ShoppingBag, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

export default function HomiStudio() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  
  const [selectedStyle, setSelectedStyle] = useState("Modern");
  const [budget, setBudget] = useState(5000);
  const [roomType, setRoomType] = useState("");
  const [userPrompt, setUserPrompt] = useState("");

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  
  const [expandedImageId, setExpandedImageId] = useState(null);
  
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (err) {
      console.log("Using guest user");
      setUser({ 
        email: "guest@homi.ai", 
        full_name: "Guest",
        role: "user" 
      });
    }
  }, []);

  const generateImages = useCallback(async (style = selectedStyle, budgetValue = budget, prompt = userPrompt, room = roomType) => {
    setGenerating(true);
    setGenerationError(null);
    setGeneratedImages([]);

    try {
      const basePrompt = prompt || `A beautiful ${room || 'living'} space with ${style} design style`;
      
      const finalPrompt = `${basePrompt}

**Design Style:** ${style}
**Budget Level:** $${budgetValue.toLocaleString()}
${room ? `**Room Type:** ${room}` : ''}

**Technical Requirements:**
- Photorealistic, magazine-quality rendering
- Professional interior photography style
- Natural lighting with soft shadows
- 4K resolution quality
- ${style} design aesthetic
- Rich textures and materials
- Perfect composition and framing
- Show complete room layout with furniture and decor`;

      // Generate SKU tags based on room type and style
      const generateSkuTags = () => {
        const furnitureByRoom = {
          'Living Room': ['Sofa', 'Coffee Table', 'Floor Lamp', 'Rug', 'Side Table'],
          'Bedroom': ['Bed', 'Nightstand', 'Dresser', 'Table Lamp', 'Rug'],
          'Kitchen': ['Dining Table', 'Chairs', 'Pendant Light', 'Bar Stools', 'Cabinet'],
          'Office': ['Desk', 'Office Chair', 'Bookshelf', 'Desk Lamp', 'Storage'],
          'Dining Room': ['Dining Table', 'Dining Chairs', 'Chandelier', 'Buffet', 'Rug']
        };

        const baseFurniture = furnitureByRoom[room] || furnitureByRoom['Living Room'];

        return baseFurniture.map((item, index) => ({
          name: item,
          x: `${15 + index * 17}%`,
          y: `${35 + (index % 2) * 25}%`,
          product_id: `product-${item.toLowerCase().replace(/\s+/g, '-')}`,
          style: style,
          estimated_cost: Math.round(budgetValue / baseFurniture.length)
        }));
      };

      const skuTags = generateSkuTags();

      // Generate 4 images
      const newImages = [];
      for (let i = 0; i < 4; i++) {
        let success = false;
        let attempts = 0;
        
        while (!success && attempts < 2) {
          try {
            const result = await GenerateImage({ 
              prompt: finalPrompt
            });
            
            const imageDetails = {
              id: Date.now() + i,
              url: result.url,
              prompt: finalPrompt,
              budget: budgetValue,
              style: style,
              roomType: room,
              timestamp: new Date().toISOString(),
              skuTags: skuTags.map(tag => ({
                ...tag,
                x: `${parseInt(tag.x) + (Math.random() * 10 - 5)}%`,
                y: `${parseInt(tag.y) + (Math.random() * 10 - 5)}%`
              }))
            };

            newImages.push(imageDetails);
            setGeneratedImages(prev => [...prev, imageDetails]);
            
            if (i === 0) {
              setSelectedImage(imageDetails);
            }
            
            success = true;
          } catch (err) {
            console.error(`Image ${i + 1} attempt ${attempts + 1} failed:`, err);
            attempts++;
            if (attempts < 2) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
      }

      if (newImages.length === 0) {
        setGenerationError("Generation failed. Please try again.");
      }

    } catch (err) {
      console.error("Generation error:", err);
      setGenerationError("Error occurred. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [selectedStyle, budget, userPrompt, roomType]); // Dependencies for useCallback

  useEffect(() => {
    loadUser();
    
    // 从URL参数获取风格和预算
    const urlParams = new URLSearchParams(location.search);
    const styleParam = urlParams.get('style');
    const budgetParam = urlParams.get('budget');
    const promptParam = urlParams.get('prompt');
    const roomTypeParam = urlParams.get('roomType');
    
    if (styleParam) setSelectedStyle(styleParam);
    if (budgetParam) setBudget(parseInt(budgetParam));
    if (promptParam) setUserPrompt(decodeURIComponent(promptParam));
    if (roomTypeParam) setRoomType(roomTypeParam);
    
    // 如果有风格和预算参数，自动开始生成
    if (styleParam && budgetParam) {
      setTimeout(() => {
        generateImages(styleParam, parseInt(budgetParam), promptParam, roomTypeParam);
      }, 500);
    }
  }, [location.search, loadUser, generateImages]); // Added generateImages to dependencies

  const calculateTotalCost = () => {
    if (!selectedImage || !selectedImage.skuTags) return budget;
    return selectedImage.skuTags.reduce((sum, tag) => sum + (tag.estimated_cost || 0), 0);
  };

  const handleSaveProject = async () => {
    if (!selectedImage) {
      alert("Please select an image to save");
      return;
    }

    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    const totalCost = calculateTotalCost();

    try {
      await DesignProject.create({
        project_name: projectName,
        mode: "Text",
        generated_image_url: selectedImage.url,
        style_preference: selectedStyle,
        budget_level: budget < 2000 ? "Economy" : budget < 8000 ? "Mid-Range" : budget < 20000 ? "Premium" : "Luxury",
        room_type: roomType || "Living Room",
        total_budget: Math.round(totalCost),
        ai_suggestions: selectedImage.skuTags?.map(tag => ({
          item: tag.name,
          description: `${selectedStyle} style ${tag.name.toLowerCase()}`,
          estimated_cost: tag.estimated_cost
        })),
        sku_tags: selectedImage.skuTags?.map(tag => tag.name),
        style_tags: [selectedStyle],
        status: "Completed"
      });

      setShowSaveDialog(false);
      alert("Project saved successfully!");
      navigate(createPageUrl("MyProjects"));
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save project");
    }
  };

  const handleAddAllToCart = async () => {
    if (!selectedImage || !selectedImage.skuTags) return;
    
    setAddingToCart(true);
    
    try {
      const allProducts = await Product.list();
      
      for (const tag of selectedImage.skuTags) {
        const matchedProduct = allProducts.find(p => 
          p.name?.toLowerCase().includes(tag.name.toLowerCase().split(' ')[0]) ||
          tag.name.toLowerCase().includes(p.name?.toLowerCase().split(' ')[0])
        );
        
        if (matchedProduct) {
          await Cart.create({
            product_id: matchedProduct.id,
            product_name: matchedProduct.name,
            product_image: matchedProduct.image_url || matchedProduct.transparent_image_url,
            price: matchedProduct.price,
            quantity: 1
          });
        } else {
          await Cart.create({
            product_id: `placeholder-${tag.name}`,
            product_name: tag.name,
            product_image: selectedImage.url,
            price: tag.estimated_cost || 0,
            quantity: 1
          });
        }
      }
      
      setAddedToCart(true);
      setTimeout(() => {
        navigate(createPageUrl("Cart"));
      }, 1500);
      
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Failed to add items to cart");
    }
    
    setAddingToCart(false);
  };

  const navigateToProduct = (productName) => {
    navigate(createPageUrl(`Marketplace?search=${encodeURIComponent(productName)}`));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("HomiHub"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#2C2C2C]">Homi Studio</h1>
            <p className="text-xs text-gray-500">AI Design Generation</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
        {/* Generating State */}
        {generating && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto animate-spin text-gray-900 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Creating Your Design...</h2>
              <p className="text-gray-500 mb-4">Generating 4 design solutions</p>
              <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-4 text-left">
                <p className="text-xs font-semibold text-gray-700 mb-2">Design Brief:</p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Style:</span> {selectedStyle}<br/>
                  <span className="font-medium">Budget:</span> ${budget.toLocaleString()}<br/>
                  {roomType && <><span className="font-medium">Room:</span> {roomType}</>}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {generationError && !generating && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{generationError}</AlertDescription>
          </Alert>
        )}

        {/* Generated Images Grid */}
        {generatedImages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Generated Designs</h2>
              <Badge className="bg-[#D4745F] text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                {generatedImages.length} Options
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {generatedImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setSelectedImage(img);
                    setExpandedImageId(img.id);
                  }}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all relative group ${
                    selectedImage?.id === img.id
                      ? 'border-gray-900 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img.url} alt="Generated" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>

            {/* Design Details */}
            {selectedImage && (
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Design Details</h2>
                    <Badge className="bg-gray-900 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2">Design Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Style</p>
                        <p className="font-medium text-gray-900">{selectedImage.style}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="font-medium text-gray-900">${selectedImage.budget.toLocaleString()}</p>
                      </div>
                      {selectedImage.roomType && (
                        <div>
                          <p className="text-gray-500">Room Type</p>
                          <p className="font-medium text-gray-900">{selectedImage.roomType}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Items</p>
                        <p className="font-medium text-gray-900">{selectedImage.skuTags?.length || 0} products</p>
                      </div>
                    </div>
                  </div>

                  {/* SKU Tags List */}
                  {selectedImage.skuTags && selectedImage.skuTags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Featured Products</h4>
                      <div className="space-y-2">
                        {selectedImage.skuTags.map((tag, index) => (
                          <button
                            key={index}
                            onClick={() => navigateToProduct(tag.name)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <ShoppingBag className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-900">{tag.name}</span>
                            </div>
                            <span className="text-sm font-semibold text-[#0A4D4E]">
                              ${tag.estimated_cost?.toLocaleString() || 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm opacity-80">Total Investment:</span>
                      <span className="font-semibold">{selectedImage.skuTags?.length || 0} items</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Estimated Cost</span>
                      <span className="text-3xl font-bold">
                        ${Math.round(calculateTotalCost()).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setProjectName(`${selectedStyle} Design - ${new Date().toLocaleDateString()}`);
                        setShowSaveDialog(true);
                      }}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Project
                    </Button>
                    <Button
                      className="flex-1 bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
                      onClick={handleAddAllToCart}
                      disabled={addingToCart || addedToCart}
                    >
                      {addedToCart ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Added!
                        </>
                      ) : addingToCart ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add All to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Expanded Image Modal with SKU Tags */}
        {expandedImageId && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedImageId(null)}
          >
            <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setExpandedImageId(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300"
              >
                <X className="w-8 h-8" />
              </button>
              
              {(() => {
                const img = generatedImages.find(i => i.id === expandedImageId);
                return (
                  <div className="relative bg-white rounded-xl overflow-hidden">
                    <img 
                      src={img.url} 
                      alt="Expanded" 
                      className="w-full max-h-[80vh] object-contain"
                    />
                    
                    {/* SKU Tags Overlay */}
                    {img.skuTags && img.skuTags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => navigateToProduct(tag.name)}
                        className="absolute bg-white/95 backdrop-blur-sm hover:bg-gray-900 text-gray-900 hover:text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-xl hover:shadow-2xl transform hover:scale-110 flex items-center gap-2"
                        style={{ 
                          left: tag.x, 
                          top: tag.y,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span className="whitespace-nowrap">{tag.name}</span>
                        <span className="text-xs opacity-75">${tag.estimated_cost}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Save Project Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <Card className="w-full max-w-md border-none shadow-2xl">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Save Project</h2>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Project Name</label>
                  <Input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full"
                  />
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-gray-900 mb-3">Project Summary</h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Style</p>
                      <p className="font-medium text-gray-900">{selectedStyle}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Budget</p>
                      <p className="font-medium text-gray-900">${budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Items</p>
                      <p className="font-medium text-gray-900">
                        {selectedImage?.skuTags?.length || 0} products
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Room</p>
                      <p className="font-medium text-gray-900">
                        {roomType || "Living Room"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Investment</span>
                      <span className="text-3xl font-bold text-gray-900">
                        ${Math.round(calculateTotalCost()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gray-900 hover:bg-gray-800"
                    onClick={handleSaveProject}
                    disabled={!projectName.trim()}
                  >
                    Confirm & Save
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
