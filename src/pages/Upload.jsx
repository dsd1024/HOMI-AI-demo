import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Post } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Upload as UploadIcon, X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const styles = ["Modern", "Scandinavian", "Industrial", "Minimalist", "Bohemian", "Traditional", "Contemporary", "Rustic"];
const budgets = ["Economy", "Mid-Range", "Premium"];
const rooms = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Dining Room", "Outdoor"];

export default function Upload() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [image, setImage] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    style: "",
    budget_range: "",
    room_type: "",
    location: ""
  });

  // Check if image was passed via URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageParam = urlParams.get('image');
    if (imageParam) {
      setImage(decodeURIComponent(imageParam));
    }
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError(null);
      return;
    }

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      setError("HEIC format not supported. Please convert to JPG or PNG.");
      e.target.value = '';
      return;
    }

    if (!fileName.endsWith('.jpg') && !fileName.endsWith('.jpeg') && !fileName.endsWith('.png')) {
      setError("Please upload JPG or PNG image.");
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Please upload image smaller than 10MB.");
      e.target.value = '';
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const { file_url } = await UploadFile({ file });
      setImage(file_url);
      setError(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Image upload failed, please try again.");
      setImage(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      setError("Please upload an image first");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      await Post.create({
        ...formData,
        image_url: image
      });

      navigate(createPageUrl("HomiHub"));
    } catch (err) {
      console.error("Post creation error:", err);
      setError("Failed to publish, please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#2C2C2C]">Share Your Space</h1>
          <Button variant="ghost" onClick={() => navigate(createPageUrl("HomiHub"))}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-6 pb-8 space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-lg overflow-hidden">
          <div className="p-6">
            <label className="block">
              <input
                type="file"
                accept="image/jpeg, image/png"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-gray-400 transition-all">
                {uploading ? (
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-[#0A4D4E]" />
                ) : image ? (
                  <img src={image} alt="Preview" className="max-h-64 mx-auto rounded-xl object-contain" />
                ) : (
                  <>
                    <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">Tap to upload photo</p>
                    <p className="text-sm text-gray-400 mt-1">Share your beautiful space</p>
                  </>
                )}
              </div>
            </label>
          </div>
        </Card>

        <Card className="border-none shadow-lg">
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
              <Input
                placeholder="Give your post a catchy title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
              <Textarea
                placeholder="Tell the story behind your design..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Style</label>
                <Select value={formData.style} onValueChange={(value) => setFormData({...formData, style: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map(style => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Budget</label>
                <Select value={formData.budget_range} onValueChange={(value) => setFormData({...formData, budget_range: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.map(budget => (
                      <SelectItem key={budget} value={budget}>{budget}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Room Type</label>
              <Select value={formData.room_type} onValueChange={(value) => setFormData({...formData, room_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(room => (
                    <SelectItem key={room} value={room}>{room}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Location</label>
              <Input
                placeholder="City or ZIP code"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>
        </Card>

        <Button
          type="submit"
          className="w-full bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
          disabled={!image || uploading}
        >
          {uploading ? "Publishing..." : "Publish Post"}
        </Button>
      </form>
    </div>
  );
}