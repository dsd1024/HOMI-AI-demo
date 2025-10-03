import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Store } from "@/api/entities";
import { ArrowLeft, MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StoreDetail() {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const urlParams = new URLSearchParams(window.location.search);
  const storeId = urlParams.get('id');

  const loadStore = useCallback(async () => {
    if (!storeId) return;
    
    setLoading(true);
    const storeData = await Store.filter({ id: storeId });
    if (storeData.length > 0) {
      setStore(storeData[0]);
    }
    setLoading(false);
  }, [storeId]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const openNavigation = () => {
    if (store?.latitude && store?.longitude) {
      // Google Maps navigation
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`, '_blank');
    } else if (store?.address) {
      // Fallback to address search
      const address = encodeURIComponent(`${store.address}, ${store.city}, ${store.state} ${store.zip_code}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F4]">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="px-4 pt-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center">
        <p className="text-gray-500">Store not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-[#2C2C2C]">Store Location</h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Map Placeholder */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="h-64 bg-gradient-to-br from-[#0A4D4E]/10 to-[#0A4D4E]/5 relative flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 mx-auto text-[#0A4D4E] mb-3" />
              <Button 
                onClick={openNavigation}
                className="bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Open in Maps
              </Button>
            </div>
          </div>
        </Card>

        {/* Store Info */}
        <Card className="border-none shadow-lg">
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">
                {store.store_name}
              </h2>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p>{store.address}</p>
                  <p>{store.city}, {store.state} {store.zip_code}</p>
                </div>
              </div>
            </div>

            {store.hours && (
              <div className="flex items-start gap-2 text-gray-600">
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Hours</p>
                  <p>{store.hours}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Contact Info */}
        <Card className="border-none shadow-lg">
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[#2C2C2C] mb-4">Contact Information</h3>

            {store.phone && (
              <a href={`tel:${store.phone}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-[#0A4D4E] rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-semibold text-[#2C2C2C]">{store.phone}</p>
                </div>
              </a>
            )}

            {store.email && (
              <a href={`mailto:${store.email}`} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 bg-[#0A4D4E] rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-[#2C2C2C]">{store.email}</p>
                </div>
              </a>
            )}
          </div>
        </Card>

        {/* Navigation Button */}
        <Button 
          onClick={openNavigation}
          className="w-full bg-gradient-to-r from-[#0A4D4E] to-[#0A4D4E]/80 hover:from-[#0A4D4E]/90 hover:to-[#0A4D4E]/70 h-12"
        >
          <Navigation className="w-5 h-5 mr-2" />
          Start Navigation
        </Button>
      </div>
    </div>
  );
}