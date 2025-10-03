import React, { useState, useEffect } from "react";
import { ServiceProvider } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, MessageCircle, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InstallationList() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    const data = await ServiceProvider.list("-rating");
    setProviders(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {providers.map(provider => (
        <Link key={provider.id} to={createPageUrl(`ProviderProfile?id=${provider.id}`)}>
          <Card className="border-none shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="p-4">
              <div className="flex gap-4">
                {/* Logo */}
                <div className="relative flex-shrink-0">
                  {provider.logo_url ? (
                    <img 
                      src={provider.logo_url} 
                      alt={provider.company_name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {provider.company_name[0]}
                      </span>
                    </div>
                  )}
                  {provider.verified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0A4D4E] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#2C2C2C] mb-1">
                    {provider.company_name}
                  </h3>
                  <Badge className="bg-blue-100 text-blue-800 mb-2">
                    {provider.service_type}
                  </Badge>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">{provider.rating}</span>
                    <span className="text-xs text-gray-500">
                      ({provider.review_count} reviews)
                    </span>
                  </div>

                  {/* Location & Price */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {provider.location}
                    </div>
                    <div>
                      From ${provider.starting_price}
                    </div>
                  </div>

                  {/* Response Time */}
                  {provider.response_time && (
                    <p className="text-xs text-gray-500">
                      Responds in {provider.response_time}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <a 
                  href={`tel:${provider.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 py-2 px-4 bg-[#0A4D4E] text-white rounded-xl text-sm font-medium hover:bg-[#0A4D4E]/90 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </a>
                <a 
                  href={`sms:${provider.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-2 py-2 px-4 border-2 border-[#0A4D4E] text-[#0A4D4E] rounded-xl text-sm font-medium hover:bg-[#0A4D4E]/5 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </a>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}