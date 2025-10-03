import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Package, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import SKUManagement from "../components/merchant/SKUManagement";
import AdCampaignManager from "../components/merchant/AdCampaignManager";

export default function MerchantCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sku");

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header - Changed to black */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4 pt-8 pb-12">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("HomiHub"))}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Merchant Center</h1>
            <p className="text-white/80 mt-1">Manage your products and advertising</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-lg rounded-2xl grid grid-cols-2 p-1">
            <TabsTrigger value="sku" className="rounded-xl">
              <Package className="w-4 h-4 mr-2" />
              SKU Management
            </TabsTrigger>
            <TabsTrigger value="ads" className="rounded-xl">
              <TrendingUp className="w-4 h-4 mr-2" />
              Ad Campaigns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sku" className="mt-6">
            <SKUManagement />
          </TabsContent>

          <TabsContent value="ads" className="mt-6">
            <AdCampaignManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}