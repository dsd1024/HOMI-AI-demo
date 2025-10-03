import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Package, MessageCircle } from "lucide-react";
import ProductSetup from "../components/ProductSetup";
import GenerateComments from "../components/admin/GenerateComments";

export default function AdminSetup() {
  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <div className="bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 text-white px-4 pt-8 pb-12">
        <h1 className="text-3xl font-bold mb-2">Admin Setup</h1>
        <p className="text-white/80">Configure products, comments and store relationships</p>
      </div>

      <div className="px-4 -mt-6 pb-8">
        <Tabs defaultValue="products" className="w-full">
          <TabsList className="w-full bg-white shadow-lg rounded-2xl grid grid-cols-2 p-1">
            <TabsTrigger value="products" className="rounded-xl">
              <Package className="w-4 h-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="comments" className="rounded-xl">
              <MessageCircle className="w-4 h-4 mr-2" />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-6">
            <ProductSetup />
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <GenerateComments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}