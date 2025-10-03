
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile, InvokeLLM, GenerateImage } from "@/api/integrations";
import { DesignProject } from "@/api/entities";
import { Product } from "@/api/entities";
import { ArrowLeft, Upload, FileImage, Loader2, Sparkles, Box, ShoppingBag, AlertCircle, Wand2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

const styles = ["Modern", "Scandinavian", "Industrial", "Minimalist", "Bohemian", "Traditional", "Contemporary", "Rustic"];
const budgets = ["Economy", "Mid-Range", "Premium"];

export default function BlueprintMode() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [blueprint, setBlueprint] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating3D, setGenerating3D] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [model3D, setModel3D] = useState(null);
  const [stylePreference, setStylePreference] = useState("");
  const [budgetLevel, setBudgetLevel] = useState("");
  const [projectName, setProjectName] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [rendering, setRendering] = useState(false);
  const [finalRender, setFinalRender] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    // 检查HEIC格式
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
      setError("HEIC format not supported. Please convert to JPG or PNG.");
      e.target.value = '';
      return;
    }
    
    // 支持的格式
    const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      setError("Please upload JPG, PNG or PDF file.");
      e.target.value = '';
      return;
    }

    // 检查文件大小 - 降低到5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Please upload a file smaller than 5MB.");
      e.target.value = '';
      return;
    }

    setError(null);
    setUploading(true);
    
    // 添加重试逻辑
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const { file_url } = await UploadFile({ file });
        setBlueprint(file_url);
        setError(null);
        break; // Success, exit loop
      } catch (err) {
        attempts++;
        console.error(`Upload attempt ${attempts} failed:`, err);
        
        if (attempts >= maxAttempts) {
          setError("File upload failed. Please try again with a smaller file.");
          setBlueprint(null);
        } else {
          // Wait before retrying, increasing delay with each attempt
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
    
    setUploading(false);
    e.target.value = '';
  };

  const analyzeBlueprint = async () => {
    if (!blueprint || !stylePreference || !budgetLevel) {
      setError("Please complete all required fields");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const result = await InvokeLLM({
        prompt: `Analyze this 2D floor plan/blueprint and provide detailed information:
        1. Room dimensions and layout (length, width in feet)
        2. Identify all room types (living room, bedroom, kitchen, etc.)
        3. Door and window positions
        4. Available space analysis
        5. Furniture placement recommendations based on user preferences
        
        User Preferences:
        - Style: ${stylePreference}
        - Budget Level: ${budgetLevel}
        
        Please provide detailed space planning suggestions.`,
        file_urls: [blueprint],
        response_json_schema: {
          type: "object",
          properties: {
            dimensions: {
              type: "object",
              properties: {
                total_area: { type: "number" },
                rooms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      length: { type: "number" },
                      width: { type: "number" }
                    }
                  }
                }
              }
            },
            room_types: { type: "array", items: { type: "string" } },
            layout_analysis: { type: "string" },
            furniture_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  room: { type: "string" },
                  item: { type: "string" },
                  quantity: { type: "number" },
                  placement: { type: "string" },
                  estimated_cost: { type: "number" }
                }
              }
            }
          }
        }
      });

      setAnalysisResult(result);
      
      await generate3DModel(result);
      await loadRecommendedProducts(result);
      
    } catch (err) {
      setError("Analysis failed. Please try again.");
      console.error(err);
    }
    
    setAnalyzing(false);
  };

  const generate3DModel = async (analysisData) => {
    setGenerating3D(true);

    try {
      const totalArea = analysisData?.dimensions?.total_area || 1000;
      const rooms = analysisData?.dimensions?.rooms || [];
      
      const roomsList = rooms.length > 0 
        ? rooms.map(r => `${r.name} (${r.length}ft x ${r.width}ft)`).join(', ')
        : 'Living room, Bedroom, Kitchen';

      const prompt = `Create a professional 3D isometric floor plan visualization:
      
      Layout Details:
      - Total Area: ${totalArea} sq ft
      - Rooms: ${roomsList}
      - Style: ${stylePreference}
      
      Requirements:
      - 3D isometric view from above
      - Show all rooms with clear labels
      - Include doors and windows
      - Show furniture placement suggestions
      - Professional architectural visualization
      - Clean modern design
      - Use ${stylePreference} design aesthetic
      - Include measurements and dimensions`;

      const result = await GenerateImage({ prompt });
      setModel3D(result.url);
    } catch (err) {
      console.error("3D generation error:", err);
      setError("3D model generation failed, but you can still continue.");
    }
    
    setGenerating3D(false);
  };

  const loadRecommendedProducts = async (analysisData) => {
    try {
      const allProducts = await Product.list();
      const matched = allProducts.filter(p => {
        const styleMatch = p.style_tags?.includes(stylePreference);
        return styleMatch && p.in_stock;
      });

      const recommendations = analysisData?.furniture_recommendations || [];
      const productList = [];

      for (const rec of recommendations) {
        const matchingProduct = matched.find(p => 
          p.name.toLowerCase().includes(rec.item.toLowerCase().split(' ')[0])
        );
        
        if (matchingProduct) {
          productList.push({
            ...matchingProduct,
            room: rec.room,
            quantity: rec.quantity || 1,
            placement: rec.placement
          });
        }
      }

      while (productList.length < 10 && matched.length > productList.length) {
        const availableProducts = matched.filter(p => 
          !productList.find(pp => pp.id === p.id)
        );
        if (availableProducts.length > 0) {
          const product = availableProducts[0];
          productList.push({
            ...product,
            room: analysisData?.room_types?.[0] || "Living Room",
            quantity: 1
          });
        } else {
          break;
        }
      }

      setRecommendedProducts(productList);
    } catch (err) {
      console.error("Product loading error:", err);
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(recommendedProducts.map(p => p.id));
  };

  const clearAllProducts = () => {
    setSelectedProducts([]);
  };

  const renderWithSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      setError("Please select at least one product");
      return;
    }

    setRendering(true);
    setError(null);

    try {
      const totalArea = analysisResult?.dimensions?.total_area || 1000;
      const rooms = analysisResult?.dimensions?.rooms || [];
      const roomsList = rooms.map(r => r.name).join(', ');

      const selectedProductDetails = recommendedProducts.filter(p => 
        selectedProducts.includes(p.id)
      );
      
      const productList = selectedProductDetails.map(p => 
        `${p.name} (${p.category}) in ${p.room}`
      ).join(', ');

      const prompt = `Create a photorealistic, magazine-quality interior design rendering:
      
      Space Details:
      - Total Area: ${totalArea} sq ft
      - Rooms: ${roomsList}
      - Design Style: ${stylePreference}
      - Budget Level: ${budgetLevel}
      
      Featured Products:
      ${productList}
      
      Requirements:
      - Ultra-high quality photorealistic rendering
      - Professional interior design photography style
      - Natural lighting with soft shadows
      - ${stylePreference} aesthetic throughout all rooms
      - Show multiple rooms in one cohesive view
      - Magazine editorial quality (Architectural Digest style)
      - Rich textures and materials
      - Perfect composition and framing
      - Warm, inviting atmosphere
      - Professional color grading
      - All products naturally integrated into the space`;

      const result = await GenerateImage({ prompt });
      setFinalRender(result.url);
    } catch (err) {
      setError("Rendering failed. Please try again.");
      console.error(err);
    }
    
    setRendering(false);
  };

  const saveProject = async () => {
    const selectedProductDetails = recommendedProducts.filter(p => 
      selectedProducts.includes(p.id)
    );
    const totalCost = selectedProductDetails.reduce((sum, p) => 
      sum + (p.price * (p.quantity || 1)), 0
    );

    try {
      await DesignProject.create({
        project_name: projectName || `Blueprint - ${stylePreference}`,
        mode: "Blueprint",
        reference_image_url: finalRender || model3D || blueprint,
        style_preference: stylePreference,
        budget_level: budgetLevel,
        ai_suggestions: selectedProductDetails,
        total_budget: totalCost,
        status: "Planning"
      });

      navigate(createPageUrl("HomiHub"));
    } catch (err) {
      setError("Failed to save project.");
      console.error(err);
    }
  };

  const getTotalCost = () => {
    return recommendedProducts
      .filter(p => selectedProducts.includes(p.id))
      .reduce((sum, p) => sum + (p.price * (p.quantity || 1)), 0);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4] pb-8">
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
            <h1 className="text-xl font-bold text-[#2C2C2C]">Blueprint Mode</h1>
            <p className="text-xs text-gray-500">2D to 3D Smart Design</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Floor Plan</h2>
            
            <label className="block">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                blueprint ? "border-[#0A4D4E]" : "border-gray-300 hover:border-gray-400"
              }`}>
                {uploading ? (
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#0A4D4E]" />
                ) : blueprint ? (
                  <img src={blueprint} alt="Blueprint" className="max-h-64 mx-auto rounded-xl" />
                ) : (
                  <>
                    <FileImage className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">Upload CAD or Floor Plan</p>
                    <p className="text-sm text-gray-400 mt-1">Support PDF, JPG, PNG formats</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </Card>

        {blueprint && !analysisResult && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold mb-4">Design Preferences</h2>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Project Name</label>
                <Input
                  placeholder="My Dream Home"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Style Preference *</label>
                <Select value={stylePreference} onValueChange={setStylePreference}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Budget Level *</label>
                <Select value={budgetLevel} onValueChange={setBudgetLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.map(budget => (
                      <SelectItem key={budget} value={budget}>{budget}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 mt-4"
                onClick={analyzeBlueprint}
                disabled={analyzing || !stylePreference || !budgetLevel}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start AI Analysis
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {generating3D && (
          <Card className="border-none shadow-lg">
            <div className="p-6 text-center">
              <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#0A4D4E] mb-4" />
              <p className="text-sm text-gray-600">Generating 3D Model...</p>
            </div>
          </Card>
        )}

        {model3D && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">3D Floor Plan</h2>
                <Badge className="bg-[#0A4D4E] text-white">
                  <Box className="w-3 h-3 mr-1" />
                  3D View
                </Badge>
              </div>
              <img 
                src={model3D} 
                alt="3D Model"
                className="w-full rounded-xl"
              />
            </div>
          </Card>
        )}

        {analysisResult && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Space Analysis</h2>

              {analysisResult.dimensions?.total_area && (
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-teal-900 mb-2">Total Area</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {analysisResult.dimensions.total_area} sq ft
                  </p>
                </div>
              )}

              {analysisResult.dimensions?.rooms && analysisResult.dimensions.rooms.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Room Details</h3>
                  <div className="space-y-2">
                    {analysisResult.dimensions.rooms.map((room, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                        <span className="font-medium text-gray-900">{room.name}</span>
                        <span className="text-sm text-gray-600">
                          {room.length} × {room.width}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.layout_analysis && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Layout Suggestions</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {analysisResult.layout_analysis}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {recommendedProducts.length > 0 && !finalRender && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">AI Recommended Products</h2>
                <Badge className="bg-[#D4745F] text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {recommendedProducts.length} items
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600">
                Select products to include in your design rendering
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllProducts}
                  className="flex-1"
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllProducts}
                  className="flex-1"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-3">
                {recommendedProducts.map((product) => (
                  <div 
                    key={product.id}
                    className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                      selectedProducts.includes(product.id)
                        ? 'border-[#0A4D4E] bg-[#0A4D4E]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox 
                        checked={selectedProducts.includes(product.id)}
                        className="mt-1"
                      />
                      
                      {product.image_url && (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            {product.room}
                          </Badge>
                        </div>
                        {product.placement && (
                          <p className="text-xs text-gray-600 mb-2">
                            📍 {product.placement}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-[#0A4D4E]">
                            ${product.price}
                          </span>
                          {product.quantity > 1 && (
                            <span className="text-sm text-gray-500">
                              Qty: {product.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedProducts.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      {selectedProducts.length} products selected
                    </span>
                    <span className="text-2xl font-bold text-[#0A4D4E]">
                      ${getTotalCost().toLocaleString()}
                    </span>
                  </div>
                  
                  <Button
                    className="w-full bg-gradient-to-r from-[#D4745F] to-[#D4745F]/80 hover:from-[#D4745F]/90 hover:to-[#D4745F]/70 h-12"
                    onClick={renderWithSelectedProducts}
                    disabled={rendering}
                  >
                    {rendering ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Rendering Magazine-Quality Image...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 mr-2" />
                        Render Final Design
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {finalRender && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Magazine-Quality Rendering</h2>
                <Badge className="bg-[#D4745F] text-white">
                  <Camera className="w-3 h-3 mr-1" />
                  Photorealistic
                </Badge>
              </div>

              <img 
                src={finalRender} 
                alt="Final Design Rendering"
                className="w-full rounded-xl shadow-2xl"
              />

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900">Design Summary</h3>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Style</p>
                    <p className="font-medium text-gray-900">{stylePreference}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Budget Level</p>
                    <p className="font-medium text-gray-900">{budgetLevel}</p>
                  </div>
                  {analysisResult?.dimensions?.total_area && (
                    <div>
                      <p className="text-gray-500">Total Area</p>
                      <p className="font-medium text-gray-900">
                        {analysisResult.dimensions.total_area} sq ft
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Products</p>
                    <p className="font-medium text-gray-900">
                      {selectedProducts.length} items
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Investment</span>
                    <span className="text-2xl font-bold text-[#0A4D4E]">
                      ${getTotalCost().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFinalRender(null);
                    setSelectedProducts([]);
                  }}
                >
                  Modify Selection
                </Button>
                <Button
                  className="flex-1 bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
                  onClick={saveProject}
                >
                  Save Project
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
