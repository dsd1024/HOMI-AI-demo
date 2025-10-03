import React, { useState, useEffect } from "react";
import { SKU } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Plus, Upload, Edit, Trash2, Eye, EyeOff, FileSpreadsheet, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const categories = ["Furniture", "Lighting", "Decor", "Textiles", "Storage", "Appliances", "Building Materials"];
const styles = ["Modern", "Scandinavian", "Industrial", "Minimalist", "Bohemian", "Traditional", "Contemporary", "Rustic"];
const spaces = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Dining Room", "Outdoor"];
const statuses = [
  { value: "draft", label: "Draft", color: "bg-gray-500" },
  { value: "pending", label: "Pending Review", color: "bg-yellow-500" },
  { value: "active", label: "Active", color: "bg-green-500" },
  { value: "inactive", label: "Inactive", color: "bg-red-500" }
];

export default function SKUManagement() {
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSku, setEditingSku] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    sku_name: "",
    category: "",
    brand: "",
    specifications: "",
    material: "",
    color: "",
    style_tags: [],
    space_tags: [],
    price: 0,
    stock: 0,
    delivery_days: 0,
    main_image: "",
    scene_images: [],
    video_url: "",
    model_3d_url: "",
    status: "draft"
  });

  useEffect(() => {
    loadSKUs();
  }, []);

  const loadSKUs = async () => {
    setLoading(true);
    try {
      const data = await SKU.list("-created_date");
      setSkus(data);
    } catch (err) {
      console.error("Load SKUs error:", err);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      
      if (field === "main_image") {
        setFormData(prev => ({ ...prev, main_image: file_url }));
      } else if (field === "scene_images") {
        setFormData(prev => ({ ...prev, scene_images: [...prev.scene_images, file_url] }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    }
    setUploading(false);
  };

  const saveSku = async () => {
    if (!formData.sku_name || !formData.category || !formData.price) {
      alert("Please fill in required fields: SKU Name, Category, and Price");
      return;
    }
    setSaving(true);
    try {
      if (editingSku) {
        await SKU.update(editingSku.id, {
          ...formData,
          version: editingSku.version + 1
        });
      } else {
        await SKU.create(formData);
      }
      
      setShowCreateDialog(false);
      setEditingSku(null);
      resetForm();
      loadSKUs();
    } catch (err) {
      console.error("Save SKU error:", err);
      alert("Failed to save SKU");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sku_name: "",
      category: "",
      brand: "",
      specifications: "",
      material: "",
      color: "",
      style_tags: [],
      space_tags: [],
      price: 0,
      stock: 0,
      delivery_days: 0,
      main_image: "",
      scene_images: [],
      video_url: "",
      model_3d_url: "",
      status: "draft"
    });
  };

  const handleEdit = (sku) => {
    setEditingSku(sku);
    setFormData(sku);
    setShowCreateDialog(true);
  };

  const handleDelete = async (skuId) => {
    if (!confirm("Are you sure you want to delete this SKU?")) return;
    
    try {
      await SKU.delete(skuId);
      loadSKUs();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete SKU");
    }
  };

  const handleStatusChange = async (sku, newStatus) => {
    try {
      await SKU.update(sku.id, { ...sku, status: newStatus });
      loadSKUs();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const toggleTag = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(t => t !== value)
        : [...prev[field], value]
    }));
  };

  const handleBatchImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("Batch import file:", file.name);
    alert("Batch import functionality coming soon!");
    e.target.value = null;
  };

  const filteredSKUs = skus.filter(sku => {
    const matchesSearch = sku.sku_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || sku.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pb-8 space-y-6">
      {/* Search and Filter Bar */}
      <Card className="border-none shadow-lg">
        <div className="p-4 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1 bg-gray-900 hover:bg-gray-800" onClick={() => { resetForm(); setEditingSku(null); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create SKU
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingSku ? "Edit SKU" : "Create New SKU"}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Basic Information</h3>
                    
                    <div>
                      <label className="text-sm font-medium">SKU Name *</label>
                      <Input
                        value={formData.sku_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, sku_name: e.target.value }))}
                        placeholder="e.g., Modern Oak Coffee Table"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Category *</label>
                        <Select value={formData.category} onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Brand</label>
                        <Input
                          value={formData.brand}
                          onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Specifications</label>
                      <Textarea
                        value={formData.specifications}
                        onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                        placeholder="Size, dimensions, weight, etc."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Material</label>
                        <Input
                          value={formData.material}
                          onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Color</label>
                        <Input
                          value={formData.color}
                          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Style & Space Tags</h3>
                    
                    <div>
                      <label className="text-sm font-medium">Style Tags</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {styles.map(style => (
                          <Badge
                            key={style}
                            onClick={() => toggleTag('style_tags', style)}
                            className={`cursor-pointer ${
                              formData.style_tags.includes(style)
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {formData.style_tags.includes(style) && '✓ '}
                            {style}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Space Tags</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {spaces.map(space => (
                          <Badge
                            key={space}
                            onClick={() => toggleTag('space_tags', space)}
                            className={`cursor-pointer ${
                              formData.space_tags.includes(space)
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {formData.space_tags.includes(space) && '✓ '}
                            {space}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Inventory */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Pricing & Inventory</h3>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm font-medium">Price ($) *</label>
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Stock</label>
                        <Input
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Delivery Days</label>
                        <Input
                          type="number"
                          value={formData.delivery_days}
                          onChange={(e) => setFormData(prev => ({ ...prev, delivery_days: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Media */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm">Visual Assets</h3>
                    
                    <div>
                      <label className="text-sm font-medium">Main Image</label>
                      <div className="mt-2">
                        {formData.main_image ? (
                          <div className="relative">
                            <img src={formData.main_image} alt="Main" className="w-full h-40 object-cover rounded-lg" />
                            <button
                              onClick={() => setFormData(prev => ({ ...prev, main_image: "" }))}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileUpload(e, "main_image")}
                              className="hidden"
                            />
                            <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-900 transition-colors">
                              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Click to upload main image</p>
                            </div>
                          </label>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Scene Images</label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {formData.scene_images.map((img, i) => (
                          <div key={i} className="relative">
                            <img src={img} alt={`Scene ${i+1}`} className="w-full h-24 object-cover rounded-lg" />
                            <button
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                scene_images: prev.scene_images.filter((_, idx) => idx !== i)
                              }))}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, "scene_images")}
                            className="hidden"
                          />
                          <div className="w-full h-24 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-900">
                            <Plus className="w-6 h-6 text-gray-400" />
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Video URL</label>
                        <Input
                          value={formData.video_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">3D Model URL</label>
                        <Input
                          value={formData.model_3d_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, model_3d_url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={formData.status} onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowCreateDialog(false);
                      setEditingSku(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gray-900 hover:bg-gray-800"
                    onClick={saveSku}
                    disabled={saving || uploading}
                  >
                    {saving ? "Saving..." : editingSku ? "Update SKU" : "Create SKU"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <label className="flex-1">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleBatchImport}
                className="hidden"
              />
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Batch Import
                </span>
              </Button>
            </label>
          </div>
        </div>
      </Card>

      {/* SKU List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-none shadow-lg">
              <div className="p-4">
                <Skeleton className="h-20 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredSKUs.length === 0 ? (
        <Card className="border-none shadow-lg">
          <div className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No SKUs found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSKUs.map(sku => (
            <Card key={sku.id} className="border-none shadow-lg overflow-hidden">
              <div className="p-4">
                <div className="flex gap-4">
                  {sku.main_image && (
                    <img 
                      src={sku.main_image}
                      alt={sku.sku_name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{sku.sku_name}</h3>
                        <p className="text-sm text-gray-500">
                          {sku.brand} • {sku.category}
                        </p>
                      </div>
                      <Badge className={`${statuses.find(s => s.value === sku.status)?.color} text-white ml-2`}>
                        {statuses.find(s => s.value === sku.status)?.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-bold text-gray-900">${sku.price}</span>
                      <span className="text-gray-500">Stock: {sku.stock}</span>
                      <span className="text-gray-500">v{sku.version}</span>
                    </div>

                    {sku.style_tags && sku.style_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sku.style_tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {sku.style_tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{sku.style_tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(sku)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleStatusChange(sku, sku.status === 'active' ? 'inactive' : 'active')}
                    >
                      {sku.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(sku.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}