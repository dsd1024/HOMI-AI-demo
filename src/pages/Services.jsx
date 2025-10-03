import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Wrench } from "lucide-react";

import DesignersList from "../components/services/DesignersList";
import InstallationList from "../components/services/InstallationList";

export default function Services() {
  const [activeTab, setActiveTab] = useState("designers");

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 text-white px-4 pt-8 pb-12">
        <h1 className="text-3xl font-bold mb-2">Homi Services</h1>
        <p className="text-white/80">Professional support for your home transformation</p>
      </div>

      {/* Tabs */}
      <div className="px-4 -mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-white shadow-lg rounded-2xl grid grid-cols-2 p-1">
            <TabsTrigger value="designers" className="rounded-xl">
              <Users className="w-4 h-4 mr-2" />
              Local Designers
            </TabsTrigger>
            <TabsTrigger value="installation" className="rounded-xl">
              <Wrench className="w-4 h-4 mr-2" />
              Installation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="designers" className="mt-6">
            <DesignersList />
          </TabsContent>

          <TabsContent value="installation" className="mt-6">
            <InstallationList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}