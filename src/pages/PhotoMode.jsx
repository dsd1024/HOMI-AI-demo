
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile, InvokeLLM, GenerateImage } from "@/api/integrations";
import { DesignProject } from "@/api/entities";
import { Product } from "@/api/entities";
import { ArrowLeft, Upload, Sparkles, Loader2, Wand2, ShoppingBag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

const styles = ["Modern", "Scandinavian", "Industrial", "Minimalist", "Bohemian", "Traditional", "Contemporary", "Rustic"];
const budgets = ["Economy", "Mid-Range", "Premium"];
const rooms = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Dining Room", "Outdoor"];

export default function PhotoMode() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [budgetLevel, setBudgetLevel] = useState("");
  const [roomType, setRoomType] = useState("");
  const [aiResults, setAiResults] = useState(null);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null); // Added error state

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 更严格的文件验证
    const fileName = file.name.toLowerCase();
    
    // 检查HEIC格式
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif') {
      setError("HEIC格式不支持。请转换为JPG或PNG格式。\n\nHEIC format not supported. Please convert to JPG or PNG.");
      e.target.value = '';
      return;
    }
    
    // 检查支持的格式
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    const hasValidType = validTypes.includes(file.type);
    
    if (!hasValidExtension || !hasValidType) {
      setError("请上传JPG或PNG图片。\n\nPlease upload JPG or PNG image.");
      e.target.value = '';
      return;
    }

    // 检查文件大小 - 降低到5MB
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      setError("文件太大。请上传小于5MB的图片。\n\nFile too large. Please upload image smaller than 5MB.");
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
        setUploadedImage(file_url);
        setError(null);
        break; // 成功后跳出循环
      } catch (err) {
        attempts++;
        console.error(`Upload attempt ${attempts} failed:`, err);
        
        if (attempts >= maxAttempts) {
          setError("图片上传失败，请重试。如果问题持续，请尝试压缩图片后再上传。\n\nImage upload failed. Please try again. If the problem persists, try compressing the image first.");
          setUploadedImage(null);
        } else {
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
    
    setUploading(false);
    e.target.value = '';
  };

  const analyzeImage = async () => {
    if (!uploadedImage) return;

    setAnalyzing(true);
    setError(null); // Clear previous errors
    
    try {
      const result = await InvokeLLM({
        prompt: `Analyze this interior design image and provide:
        1. Detected style elements
        2. Color palette
        3. Key furniture pieces
        4. Recommended products to achieve similar look
        5. Estimated budget breakdown
        
        Consider the user preferences:
        - Style: ${stylePreference || 'Any'}
        - Budget: ${budgetLevel || 'Any'}
        - Room Type: ${roomType || 'Any'}`,
        file_urls: [uploadedImage],
        response_json_schema: {
          type: "object",
          properties: {
            detected_style: { type: "string" },
            color_palette: { type: "array", items: { type: "string" } },
            furniture_pieces: { type: "array", items: { type: "string" } },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  description: { type: "string" },
                  estimated_cost: { type: "number" }
                }
              }
            }
          }
        }
      });

      setAiResults(result);
      
      // Load matching products from marketplace
      const products = await Product.list();
      const matched = products.filter(p => 
        p.style_tags?.some(tag => tag === (stylePreference || result.detected_style))
      ).slice(0, 6);
      setMatchedProducts(matched);
    } catch (err) {
      setError("Failed to analyze image. Please try again with a different photo.");
      console.error(err);
    }
    
    setAnalyzing(false);
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const generateWithProducts = async () => {
    if (selectedProducts.length === 0) return;

    setGenerating(true);
    setError(null); // Clear previous errors

    try {
      const selectedProductDetails = matchedProducts.filter(p => selectedProducts.includes(p.id));
      const productDescriptions = selectedProductDetails.map(p => 
        `${p.name} (${p.category})`
      ).join(', ');

      const prompt = `Create a photorealistic interior design image that combines the following:
      
      Original Room Context:
      - Style: ${stylePreference || aiResults?.detected_style || 'Modern'}
      - Room Type: ${roomType || 'Living Room'}
      - Color Palette: ${aiResults?.color_palette?.join(', ') || 'neutral tones'}
      
      Add these products naturally into the space:
      ${productDescriptions}
      
      Requirements:
      - Maintain photorealistic quality
      - Products should fit naturally in the space
      - Preserve the room's original lighting and perspective
      - Make it look like a professional interior design photo`;

      const result = await GenerateImage({ prompt });
      
      setGeneratedImage(result.url);
    } catch (err) {
      setError("Failed to generate image. Please try again.");
      console.error(err);
    }
    
    setGenerating(false);
  };

  const saveProject = async () => {
    const totalBudget = aiResults?.recommendations?.reduce((sum, item) => sum + (item.estimated_cost || 0), 0) || 0;
    
    try {
      await DesignProject.create({
        project_name: projectName || "Photo Inspiration Project",
        mode: "Photo",
        reference_image_url: generatedImage || uploadedImage,
        style_preference: stylePreference || aiResults?.detected_style,
        budget_level: budgetLevel,
        room_type: roomType,
        ai_suggestions: aiResults?.recommendations,
        total_budget: totalBudget
      });

      navigate(createPageUrl("HomiHub"));
    } catch (err) {
      setError("Failed to save project. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4] pb-8">
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
            <h1 className="text-xl font-bold text-[#2C2C2C]">Photo Mode</h1>
            <p className="text-xs text-gray-500">AI-powered product placement</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Upload Room Photo</h2>
            
            <label className="block">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png" // Updated accept attribute
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                uploadedImage ? "border-[#0A4D4E]" : "border-gray-300 hover:border-gray-400"
              }`}>
                {uploading ? (
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#0A4D4E]" />
                ) : uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded" className="max-h-64 mx-auto rounded-xl" />
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">Tap to upload image</p>
                    <p className="text-sm text-gray-400 mt-1">JPG or PNG only (max 5MB)</p> {/* Updated max size */}
                    <p className="text-xs text-gray-400 mt-2">⚠️ HEIC format not supported</p> {/* Added HEIC warning */}
                  </>
                )}
              </div>
            </label>
          </div>
        </Card>

        {/* Preferences */}
        {uploadedImage && !aiResults && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold mb-4">Project Details</h2>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Project Name</label>
                <Input
                  placeholder="My Dream Living Room"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Style Preference</label>
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
                <label className="text-sm font-medium text-gray-700 mb-2 block">Budget Level</label>
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

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Room Type</label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room} value={room}>{room}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-[#0A4D4E] hover:bg-[#0A4D4E]/90 mt-4"
                onClick={analyzeImage}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze With Homi
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Matched Products */}
        {aiResults && matchedProducts.length > 0 && !generatedImage && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Matched Products from Shop</h2>
                <Badge className="bg-[#0A4D4E] text-white">
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  {matchedProducts.length} items
                </Badge>
              </div>
              
              <p className="text-sm text-gray-600">
                Select products to add them naturally to your room
              </p>

              <div className="grid grid-cols-2 gap-3">
                {matchedProducts.map(product => (
                  <div 
                    key={product.id}
                    className={`border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                      selectedProducts.includes(product.id)
                        ? 'border-[#0A4D4E] shadow-lg'
                        : 'border-gray-200'
                    }`}
                    onClick={() => toggleProductSelection(product.id)}
                  >
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full aspect-square object-cover"
                      />
                    )}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {product.name}
                          </h4>
                          <p className="text-sm font-bold text-[#0A4D4E] mt-1">
                            ${product.price}
                          </p>
                        </div>
                        <Checkbox 
                          checked={selectedProducts.includes(product.id)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full bg-gradient-to-r from-[#0A4D4E] to-[#0A4D4E]/80 hover:from-[#0A4D4E]/90 hover:to-[#0A4D4E]/70 mt-4"
                onClick={generateWithProducts}
                disabled={selectedProducts.length === 0 || generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Room with Products ({selectedProducts.length})
                  </>
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Generated Result */}
        {generatedImage && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your New Room Design</h2>
                <Badge className="bg-[#D4745F] text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              </div>

              {/* Before & After */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">BEFORE</p>
                  <img 
                    src={uploadedImage} 
                    alt="Original"
                    className="w-full rounded-xl"
                  />
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">AFTER - WITH PRODUCTS</p>
                  <img 
                    src={generatedImage} 
                    alt="Generated"
                    className="w-full rounded-xl"
                  />
                </div>
              </div>

              {/* Selected Products Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3">Products Added:</h3>
                <div className="space-y-2">
                  {matchedProducts
                    .filter(p => selectedProducts.includes(p.id))
                    .map(product => (
                      <div key={product.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{product.name}</span>
                        <span className="font-semibold text-[#0A4D4E]">${product.price}</span>
                      </div>
                    ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-[#0A4D4E]">
                    ${matchedProducts
                      .filter(p => selectedProducts.includes(p.id))
                      .reduce((sum, p) => sum + p.price, 0)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setGeneratedImage(null);
                    setSelectedProducts([]);
                  }}
                >
                  Try Different Products
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

        {/* AI Analysis Results */}
        {aiResults && !generatedImage && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">AI Analysis</h2>
                <Badge className="bg-[#D4745F] text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Insights
                </Badge>
              </div>

              {aiResults.detected_style && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Detected Style</h3>
                  <Badge className="bg-[#0A4D4E] text-white">{aiResults.detected_style}</Badge>
                </div>
              )}

              {aiResults.color_palette && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Color Palette</h3>
                  <div className="flex gap-2 flex-wrap">
                    {aiResults.color_palette.map((color, i) => (
                      <Badge key={i} variant="outline">{color}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
