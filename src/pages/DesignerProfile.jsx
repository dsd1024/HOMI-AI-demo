
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Designer } from "@/api/entities";
import { Review } from "@/api/entities";
import { ArrowLeft, Star, MapPin, DollarSign, Phone, Mail, MessageCircle, CheckCircle, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function DesignerProfile() {
  const navigate = useNavigate();
  const [designer, setDesigner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const urlParams = new URLSearchParams(window.location.search);
  const designerId = urlParams.get('id');

  const loadData = useCallback(async () => {
    if (!designerId) return;
    
    const designerData = await Designer.filter({ id: designerId });
    if (designerData.length > 0) {
      setDesigner(designerData[0]);
      
      const reviewData = await Review.filter({ 
        provider_id: designerId,
        provider_type: "Designer"
      });
      setReviews(reviewData);
    }
  }, [designerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!designer) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Services"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-[#2C2C2C]">Designer Profile</h1>
        </div>
      </div>

      <div className="px-4 pt-6 pb-8 space-y-6">
        {/* Profile Card */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex gap-4 mb-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {designer.avatar_url ? (
                  <img 
                    src={designer.avatar_url} 
                    alt={designer.full_name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {designer.full_name[0]}
                    </span>
                  </div>
                )}
                {designer.verified && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#0A4D4E] rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#2C2C2C] mb-1">
                  {designer.full_name}
                </h2>
                <p className="text-gray-600 mb-3">{designer.title}</p>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(designer.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{designer.rating}</span>
                  <span className="text-sm text-gray-500">
                    ({designer.review_count} reviews)
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {designer.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {designer.years_experience}+ years
                  </div>
                </div>
              </div>
            </div>

            {/* Rate */}
            <div className="bg-gradient-to-br from-[#0A4D4E]/10 to-[#0A4D4E]/5 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hourly Rate</p>
                  <p className="text-2xl font-bold text-[#0A4D4E]">
                    ${designer.hourly_rate}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[#0A4D4E]/30" />
              </div>
            </div>

            {/* Specialties */}
            {designer.specialties && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {designer.specialties.map((specialty, i) => (
                    <Badge key={i} className="bg-[#0A4D4E] text-white">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {designer.bio && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">About</p>
                <p className="text-sm text-gray-600 leading-relaxed">{designer.bio}</p>
              </div>
            )}

            {/* Contact Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <a 
                href={`tel:${designer.phone}`}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0A4D4E] text-white rounded-xl font-medium hover:bg-[#0A4D4E]/90 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call
              </a>
              <a 
                href={`mailto:${designer.email}`}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-[#0A4D4E] text-[#0A4D4E] rounded-xl font-medium hover:bg-[#0A4D4E]/5 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Email
              </a>
            </div>
          </div>
        </Card>

        {/* Portfolio & Reviews */}
        <Tabs defaultValue="portfolio" className="w-full">
          <TabsList className="w-full bg-white shadow-sm rounded-xl grid grid-cols-2 p-1">
            <TabsTrigger value="portfolio" className="rounded-lg">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-6">
            {designer.portfolio_images && designer.portfolio_images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {designer.portfolio_images.map((img, i) => (
                  <img 
                    key={i}
                    src={img}
                    alt={`Portfolio ${i + 1}`}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                ))}
              </div>
            ) : (
              <Card className="border-none shadow-sm p-8 text-center">
                <p className="text-gray-500">No portfolio images yet</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-6 space-y-4">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <Card key={review.id} className="border-none shadow-sm p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {review.reviewer_avatar ? (
                      <img 
                        src={review.reviewer_avatar}
                        alt={review.reviewer_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {review.reviewer_name[0]}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-[#2C2C2C]">{review.reviewer_name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                    {review.comment}
                  </p>
                  {review.project_images && review.project_images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {review.project_images.map((img, i) => (
                        <img 
                          key={i}
                          src={img}
                          alt={`Project ${i + 1}`}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </Card>
              ))
            ) : (
              <Card className="border-none shadow-sm p-8 text-center">
                <p className="text-gray-500">No reviews yet</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
