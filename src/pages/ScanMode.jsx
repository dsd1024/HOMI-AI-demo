
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile, InvokeLLM, GenerateImage } from "@/api/integrations";
import { DesignProject } from "@/api/entities";
import { Product } from "@/api/entities";
import { ArrowLeft, Scan, CheckCircle, Loader2, Info, Grid3x3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function ScanMode() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [floorPlanImage, setFloorPlanImage] = useState(null);
  const [generatingFloorPlan, setGeneratingFloorPlan] = useState(false);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    
    return () => {
      // Store ref value to avoid stale reference
      const video = videoRef.current;
      if (video && video.srcObject) { // Fix: Changed video?.srcObject to video && video.srcObject
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("无法访问摄像头。请授予摄像头权限后重试。");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setCameraReady(false);
      setIsScanning(false);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScanProgress(0);
    
    // Simulate scanning progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          captureAndAnalyze();
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Convert canvas to blob and upload
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
      const { file_url } = await UploadFile({ file });
      
      await analyzeScan(file_url);
    }, 'image/jpeg', 0.9);
  };

  const analyzeScan = async (imageUrl) => {
    setAnalyzing(true);
    
    try {
      const result = await InvokeLLM({
        prompt: `分析这个房间扫描图像，提供以下信息：
        1. 房间尺寸估计（长、宽、高，单位：英尺）
        2. 检测到的角落和墙壁位置
        3. 房间类型识别
        4. 现有家具摆放
        5. 适合这个空间的推荐产品
        6. 基于当前空间的风格建议`,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            dimensions: {
              type: "object",
              properties: {
                length: { type: "number" },
                width: { type: "number" },
                height: { type: "number" }
              }
            },
            room_type: { type: "string" },
            detected_corners: { 
              type: "array",
              items: { 
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" }
                }
              }
            },
            existing_furniture: { type: "array", items: { type: "string" } },
            style_detected: { type: "string" },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  item: { type: "string" },
                  placement: { type: "string" },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setScanResult(result);
      
      // Load matching products
      const products = await Product.list();
      const matched = products.filter(p => 
        p.style_tags?.includes(result.style_detected)
      ).slice(0, 6);
      setMatchedProducts(matched);
      
      // Generate 3D floor plan
      await generate3DFloorPlan(result);
      
      setIsScanning(false);
      stopCamera();
    } catch (err) {
      console.error("Analysis error:", err);
      alert("扫描分析失败，请重试。");
      setIsScanning(false);
    }
    
    setAnalyzing(false);
  };

  const generate3DFloorPlan = async (scanData) => {
    setGeneratingFloorPlan(true);
    
    try {
      const prompt = `Create a professional 3D floor plan visualization based on these room specifications:
      
      Room Type: ${scanData.room_type}
      Dimensions: ${scanData.dimensions.length}ft x ${scanData.dimensions.width}ft x ${scanData.dimensions.height}ft
      Style: ${scanData.style_detected}
      Existing Furniture: ${scanData.existing_furniture.join(', ')}
      
      Requirements:
      - Top-down 3D isometric view
      - Clean architectural floor plan style
      - Show walls, doors, windows
      - Display furniture placement
      - Professional blueprint aesthetic with measurements
      - Use modern visualization style
      - Include grid lines and dimensions`;

      const result = await GenerateImage({ prompt });
      setFloorPlanImage(result.url);
    } catch (err) {
      console.error("Floor plan generation error:", err);
    }
    
    setGeneratingFloorPlan(false);
  };

  const drawScanOverlay = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !isScanning) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(10, 77, 78, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw corner detection guides
    const cornerSize = 50;
    const margin = 80;
    
    ctx.strokeStyle = '#0A4D4E';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(margin, margin + cornerSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + cornerSize, margin);
    ctx.stroke();

    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - margin - cornerSize, margin);
    ctx.lineTo(canvas.width - margin, margin);
    ctx.lineTo(canvas.width - margin, margin + cornerSize);
    ctx.stroke();

    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(margin, canvas.height - margin - cornerSize);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(margin + cornerSize, canvas.height - margin);
    ctx.stroke();

    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - margin - cornerSize, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin - cornerSize);
    ctx.stroke();

    // Draw center crosshair
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const crosshairSize = 30;
    
    ctx.strokeStyle = '#D4745F';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(centerX - crosshairSize, centerY);
    ctx.lineTo(centerX + crosshairSize, centerY);
    ctx.moveTo(centerX, centerY - crosshairSize);
    ctx.lineTo(centerX, centerY + crosshairSize);
    ctx.stroke();

    // Draw corner dots
    const dotRadius = 8;
    ctx.fillStyle = '#0A4D4E';
    
    // Four corners
    ctx.beginPath();
    ctx.arc(margin, margin, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(canvas.width - margin, margin, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(margin, canvas.height - margin, dotRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(canvas.width - margin, canvas.height - margin, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }, [isScanning]);

  useEffect(() => {
    if (isScanning && cameraReady) {
      const interval = setInterval(drawScanOverlay, 100);
      return () => clearInterval(interval);
    }
  }, [isScanning, cameraReady, drawScanOverlay]);

  const saveProject = async () => {
    await DesignProject.create({
      project_name: `Scan - ${scanResult.room_type}`,
      mode: "Scan",
      reference_image_url: floorPlanImage || "",
      style_preference: scanResult.style_detected,
      room_type: scanResult.room_type,
      ai_suggestions: scanResult.recommendations,
      status: "Planning"
    });

    navigate(createPageUrl("HomiHub"));
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopCamera();
              navigate(createPageUrl("HomiHub"));
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#2C2C2C]">扫描模式</h1>
            <p className="text-xs text-gray-500">3D空间扫描</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6 pb-8">
        {!scanResult && (
          <>
            {/* Camera View */}
            <Card className="border-none shadow-lg overflow-hidden relative">
              <div className="relative bg-black aspect-[4/3]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />
                
                {/* Scanning Instructions Overlay */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl p-3 text-white text-center">
                    {!isScanning && cameraReady ? (
                      <p className="text-sm font-medium">将房间角落对准框线</p>
                    ) : !cameraReady ? (
                      <p className="text-sm font-medium">正在启动摄像头...</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium mb-2">正在扫描空间...</p>
                        <Progress value={scanProgress} className="h-2" />
                      </>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {isScanning && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#0A4D4E] text-white px-4 py-2">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {scanProgress}% 完成
                    </Badge>
                  </div>
                )}

                {analyzing && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#D4745F] text-white px-4 py-2">
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI分析中...
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {/* Instructions */}
            {!isScanning && cameraReady && (
              <Alert className="border-l-4 border-[#0A4D4E] bg-[#0A4D4E]/5">
                <Info className="w-4 h-4 text-[#0A4D4E]" />
                <AlertDescription className="text-[#2C2C2C]">
                  <strong>扫描提示：</strong> 将摄像头对准房间角落，确保四个角落都在框线内，然后点击"开始扫描"
                </AlertDescription>
              </Alert>
            )}

            {/* Control Buttons */}
            {cameraReady && !analyzing && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    stopCamera();
                    navigate(createPageUrl("HomiHub"));
                  }}
                  disabled={isScanning}
                >
                  取消
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={startScanning}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      扫描中...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      开始扫描
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}

        {scanResult && (
          <>
            {/* 3D Floor Plan */}
            {generatingFloorPlan && (
              <Card className="border-none shadow-lg">
                <div className="p-6 text-center">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#0A4D4E] mb-4" />
                  <p className="text-sm text-gray-600">正在生成3D平面图...</p>
                </div>
              </Card>
            )}

            {floorPlanImage && (
              <Card className="border-none shadow-lg">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">3D平面图</h2>
                    <Badge className="bg-[#0A4D4E] text-white">
                      <Grid3x3 className="w-3 h-3 mr-1" />
                      已生成
                    </Badge>
                  </div>
                  <img 
                    src={floorPlanImage} 
                    alt="3D Floor Plan"
                    className="w-full rounded-xl"
                  />
                </div>
              </Card>
            )}

            {/* Scan Results */}
            <Card className="border-none shadow-lg">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">扫描完成</h2>
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    成功
                  </Badge>
                </div>

                {/* Room Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">房间类型</p>
                    <p className="font-semibold text-[#2C2C2C]">{scanResult.room_type}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">检测风格</p>
                    <p className="font-semibold text-[#2C2C2C]">{scanResult.style_detected}</p>
                  </div>
                </div>

                {/* Dimensions */}
                {scanResult.dimensions && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-blue-900 mb-2">估算尺寸</p>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">长：</span>{" "}
                        <span className="font-semibold">{scanResult.dimensions.length}英尺</span>
                      </div>
                      <div>
                        <span className="text-blue-700">宽：</span>{" "}
                        <span className="font-semibold">{scanResult.dimensions.width}英尺</span>
                      </div>
                      <div>
                        <span className="text-blue-700">高：</span>{" "}
                        <span className="font-semibold">{scanResult.dimensions.height}英尺</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Existing Furniture */}
                {scanResult.existing_furniture && scanResult.existing_furniture.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">检测到的家具</h3>
                    <div className="flex flex-wrap gap-2">
                      {scanResult.existing_furniture.map((item, i) => (
                        <Badge key={i} variant="outline">{item}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* AI Recommendations */}
            {scanResult.recommendations && scanResult.recommendations.length > 0 && (
              <Card className="border-none shadow-lg">
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold">AI推荐</h2>
                  <div className="space-y-3">
                    {scanResult.recommendations.map((rec, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-[#2C2C2C]">{rec.item}</h4>
                          <Badge className="bg-[#0A4D4E] text-white">{rec.placement}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{rec.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Matched Products */}
            {matchedProducts.length > 0 && (
              <Card className="border-none shadow-lg">
                <div className="p-6 space-y-4">
                  <h2 className="text-lg font-semibold">匹配产品</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {matchedProducts.map(product => (
                      <div key={product.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {product.image_url && (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full aspect-square object-cover"
                          />
                        )}
                        <div className="p-3">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {product.name}
                          </h4>
                          <p className="text-sm font-bold text-[#0A4D4E]">
                            ${product.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setScanResult(null);
                  setFloorPlanImage(null);
                  setMatchedProducts([]);
                  startCamera();
                }}
              >
                重新扫描
              </Button>
              <Button
                className="flex-1 bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
                onClick={saveProject}
              >
                保存项目
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
