
import React, { useState, useEffect } from "react";
import { AdCampaign } from "@/api/entities";
import { SKU } from "@/api/entities";
import { Plus, TrendingUp, DollarSign, MousePointerClick, Eye, ShoppingCart, Play, Pause, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const objectives = [
  { value: "exposure", label: "Exposure (曝光)", icon: Eye },
  { value: "click", label: "Click (点击)", icon: MousePointerClick },
  { value: "conversion", label: "Conversion (成交)", icon: ShoppingCart }
];

const pricingModels = [
  { value: "CPC", label: "CPC (按点击)", desc: "Pay per click" },
  { value: "CPM", label: "CPM (按千次曝光)", desc: "Pay per 1000 impressions" },
  { value: "CPS", label: "CPS (按成交)", desc: "Pay per sale" }
];

export default function AdCampaignManager() {
  const [campaigns, setCampaigns] = useState([]);
  const [skus, setSkus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Added saving state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [formData, setFormData] = useState({
    campaign_name: "",
    sku_id: "",
    objective: "exposure",
    budget: 1000,
    pricing_model: "CPC",
    target_zip_codes: [],
    target_styles: [],
    start_date: "",
    end_date: "",
    status: "draft"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignsData, skusData] = await Promise.all([
        AdCampaign.list("-created_date"),
        SKU.filter({ status: "active" })
      ]);
      setCampaigns(campaignsData);
      setSkus(skusData);
    } catch (err) {
      console.error("Load data error:", err);
    }
    setLoading(false);
  };

  const saveCampaign = async () => { // Renamed from handleSubmit
    if (!formData.campaign_name || !formData.sku_id || !formData.budget) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true); // Set saving to true
    try {
      if (editingCampaign) {
        await AdCampaign.update(editingCampaign.id, formData);
      } else {
        await AdCampaign.create(formData);
      }
      
      setShowCreateDialog(false);
      setEditingCampaign(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error("Save campaign error:", err);
      alert("Failed to save campaign");
    } finally {
      setSaving(false); // Set saving to false
    }
  };

  const resetForm = () => {
    setFormData({
      campaign_name: "",
      sku_id: "",
      objective: "exposure",
      budget: 1000,
      pricing_model: "CPC",
      target_zip_codes: [],
      target_styles: [],
      start_date: "",
      end_date: "",
      status: "draft"
    });
  };

  const handleStatusChange = async (campaign, newStatus) => {
    try {
      await AdCampaign.update(campaign.id, { ...campaign, status: newStatus });
      loadData();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleDelete = async (campaignId) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    
    try {
      await AdCampaign.delete(campaignId);
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const calculateROAS = (campaign) => {
    if (campaign.spend === 0) return 0;
    return (campaign.revenue / campaign.spend).toFixed(2);
  };

  const calculateCTR = (campaign) => {
    if (campaign.impressions === 0) return 0;
    return ((campaign.clicks / campaign.impressions) * 100).toFixed(2);
  };

  const calculateCVR = (campaign) => {
    if (campaign.clicks === 0) return 0;
    return ((campaign.conversions / campaign.clicks) * 100).toFixed(2);
  };

  return (
    <div className="pb-8 space-y-6"> {/* Changed space-y-4 to space-y-6 */}
      {/* Summary Dashboard */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4" />
              <span className="text-sm opacity-80">Total Impressions</span>
            </div>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0).toLocaleString()}
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointerClick className="w-4 h-4" />
              <span className="text-sm opacity-80">Total Clicks</span>
            </div>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0).toLocaleString()}
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm opacity-80">Total Conversions</span>
            </div>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0).toLocaleString()}
            </div>
          </div>
        </Card>

        <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm opacity-80">Total Spend</span>
            </div>
            <div className="text-2xl font-bold">
              ${campaigns.reduce((sum, c) => sum + (c.spend || 0), 0).toLocaleString()}
            </div>
          </div>
        </Card>
      </div>

      {/* Create Campaign Button */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Button className="w-full bg-gray-900 hover:bg-gray-800" onClick={() => { resetForm(); setEditingCampaign(null); }}> {/* Changed color and text */}
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "Create New Campaign"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Campaign Name *</label>
              <Input
                value={formData.campaign_name}
                onChange={(e) => setFormData(prev => ({ ...prev, campaign_name: e.target.value }))}
                placeholder="e.g., Summer Sale - Modern Sofas"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Select SKU *</label>
              <Select value={formData.sku_id} onValueChange={(val) => setFormData(prev => ({ ...prev, sku_id: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a product" />
                </SelectTrigger>
                <SelectContent>
                  {skus.map(sku => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.sku_name} - ${sku.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Campaign Objective *</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {objectives.map(obj => {
                  const Icon = obj.icon;
                  return (
                    <button
                      key={obj.value}
                      onClick={() => setFormData(prev => ({ ...prev, objective: obj.value }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.objective === obj.value
                          ? 'border-gray-900 bg-gray-900/5' // Changed color
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1 text-gray-900" /> {/* Changed color */}
                      <p className="text-xs font-medium text-center">{obj.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Pricing Model *</label>
              <Select value={formData.pricing_model} onValueChange={(val) => setFormData(prev => ({ ...prev, pricing_model: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pricingModels.map(model => (
                    <SelectItem key={model.value} value={model.value}>
                      <div>
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-gray-500">{model.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Budget ($) *</label>
              <Input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Target ZIP Codes (comma-separated)</label>
              <Input
                value={formData.target_zip_codes.join(", ")}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  target_zip_codes: e.target.value.split(",").map(z => z.trim()).filter(Boolean)
                }))}
                placeholder="e.g., 94301, 94302, 94303"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Target Styles (comma-separated)</label>
              <Input
                value={formData.target_styles.join(", ")}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  target_styles: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                }))}
                placeholder="e.g., Modern, Minimalist, Scandinavian"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4"> {/* Added pt-4 as per outline */}
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingCampaign(null);
                setFormData({ // Reset form data explicitly as per outline, ensuring defaults for select components
                  campaign_name: "",
                  sku_id: "",
                  objective: "exposure", // Revert to initial default
                  budget: 0,
                  pricing_model: "CPC",  // Revert to initial default
                  target_zip_codes: [],
                  target_styles: [],
                  start_date: "",
                  end_date: "",
                  status: "draft"
                });
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gray-900 hover:bg-gray-800" // Changed color
              onClick={saveCampaign} // Changed from handleSubmit to saveCampaign
              disabled={saving} // Added disabled state
            >
              {saving ? "Saving..." : editingCampaign ? "Update Campaign" : "Create Campaign"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaigns List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-none shadow-lg">
              <div className="p-4">
                <Skeleton className="h-24 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-none shadow-lg">
          <div className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No campaigns yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="border-none shadow-lg">
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {campaign.pricing_model} • Budget: ${campaign.budget}
                    </p>
                  </div>
                  <Badge className={`${
                    campaign.status === 'active' ? 'bg-green-500' :
                    campaign.status === 'paused' ? 'bg-yellow-500' :
                    campaign.status === 'completed' ? 'bg-blue-500' :
                    'bg-gray-500'
                  } text-white`}>
                    {campaign.status}
                  </Badge>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Impressions</div>
                    <div className="text-lg font-bold text-gray-900">{campaign.impressions || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Clicks</div>
                    <div className="text-lg font-bold text-gray-900">{campaign.clicks || 0}</div>
                    <div className="text-xs text-gray-400">CTR: {calculateCTR(campaign)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Conversions</div>
                    <div className="text-lg font-bold text-gray-900">{campaign.conversions || 0}</div>
                    <div className="text-xs text-gray-400">CVR: {calculateCVR(campaign)}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">ROAS</div>
                    <div className="text-lg font-bold text-gray-900">{calculateROAS(campaign)}x</div> {/* Changed color */}
                    <div className="text-xs text-gray-400">Spent: ${campaign.spend || 0}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedCampaign(selectedCampaign?.id === campaign.id ? null : campaign)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {selectedCampaign?.id === campaign.id ? "Hide" : "View"} Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusChange(campaign, campaign.status === 'active' ? 'paused' : 'active')}
                  >
                    {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(campaign.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Expanded Details */}
                {selectedCampaign?.id === campaign.id && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Objective:</span>
                        <span className="ml-2 font-medium">{campaign.objective}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Revenue:</span>
                        <span className="ml-2 font-medium text-green-600">${campaign.revenue || 0}</span>
                      </div>
                      {campaign.start_date && (
                        <div>
                          <span className="text-gray-500">Start:</span>
                          <span className="ml-2 font-medium">{campaign.start_date}</span>
                        </div>
                      )}
                      {campaign.end_date && (
                        <div>
                          <span className="text-gray-500">End:</span>
                          <span className="ml-2 font-medium">{campaign.end_date}</span>
                        </div>
                      )}
                    </div>
                    {campaign.target_zip_codes && campaign.target_zip_codes.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Target ZIP Codes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {campaign.target_zip_codes.map((zip, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{zip}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {campaign.target_styles && campaign.target_styles.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-500">Target Styles:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {campaign.target_styles.map((style, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{style}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
