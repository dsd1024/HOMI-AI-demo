import React, { useState, useEffect } from "react";
import { Designer } from "@/api/entities";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, DollarSign, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DesignersList() {
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDesigners();
  }, []);

  const loadDesigners = async () => {
    setLoading(true);
    const data = await Designer.list("-rating");
    setDesigners(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4 pb-8">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-20 rounded-xl" />
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
      {designers.map(designer => (
        <Link key={designer.id} to={createPageUrl(`DesignerProfile?id=${designer.id}`)}>
          <Card className="border-none shadow-lg hover:shadow-xl transition-all overflow-hidden">
            <div className="p-4">
              <div className="flex gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {designer.avatar_url ? (
                    <img 
                      src={designer.avatar_url} 
                      alt={designer.full_name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {designer.full_name[0]}
                      </span>
                    </div>
                  )}
                  {designer.verified && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0A4D4E] rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[#2C2C2C] mb-1">
                    {designer.full_name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">{designer.title}</p>

                  {/* Rating */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{designer.rating}</span>
                      <span className="text-xs text-gray-500">
                        ({designer.review_count} reviews)
                      </span>
                    </div>
                  </div>

                  {/* Location & Rate */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {designer.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${designer.hourly_rate}/hr
                    </div>
                  </div>

                  {/* Specialties */}
                  {designer.specialties && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {designer.specialties.slice(0, 3).map((specialty, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-2 py-0">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio Preview */}
              {designer.portfolio_images && designer.portfolio_images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {designer.portfolio_images.slice(0, 3).map((img, i) => (
                    <img 
                      key={i}
                      src={img}
                      alt={`Portfolio ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}