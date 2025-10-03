
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ServiceProvider } from "@/api/entities";
import { Review } from "@/api/entities";
import { ArrowLeft, Star, MapPin, Phone, MessageCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProviderProfile() {
  const navigate = useNavigate();
  const [provider, setProvider] = useState(null);
  const [reviews, setReviews] = useState([]);
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get('id');

  const loadData = useCallback(async () => {
    if (!providerId) return;
    
    const providerData = await ServiceProvider.filter({ id: providerId });
    if (providerData.length > 0) {
      setProvider(providerData[0]);
      
      const reviewData = await Review.filter({ 
        provider_id: providerId,
        provider_type: "ServiceProvider"
      });
      setReviews(reviewData);
    }
  }, [providerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!provider) {
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
          <h1 className="text-xl font-bold text-[#2C2C2C]">Service Provider</h1>
        </div>
      </div>

      <div className="px-4 pt-6 pb-8 space-y-6">
        {/* Profile Card */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex gap-4 mb-4">
              {/* Logo */}
              <div className="relative flex-shrink-0">
                {provider.logo_url ? (
                  <img 
                    src={provider.logo_url} 
                    alt={provider.company_name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {provider.company_name[0]}
                    </span>
                  </div>
                )}
                {provider.verified && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#0A4D4E] rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#2C2C2C] mb-2">
                  {provider.company_name}
                </h2>
                <Badge className="bg-blue-100 text-blue-800 mb-3">
                  {provider.service_type}
                </Badge>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(provider.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold">{provider.rating}</span>
                  <span className="text-sm text-gray-500">
                    ({provider.review_count} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {provider.location}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-900 mb-1">Starting Price</p>
              <p className="text-2xl font-bold text-blue-900">
                ${provider.starting_price}
              </p>
            </div>

            {/* Response Time */}
            {provider.response_time && (
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Responds in {provider.response_time}</span>
              </div>
            )}

            {/* Description */}
            {provider.description && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">About</p>
                <p className="text-sm text-gray-600 leading-relaxed">{provider.description}</p>
              </div>
            )}

            {/* Specialties */}
            {provider.specialties && provider.specialties.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 mb-2">Services</p>
                <div className="flex flex-wrap gap-2">
                  {provider.specialties.map((specialty, i) => (
                    <Badge key={i} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <a 
                href={`tel:${provider.phone}`}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-[#0A4D4E] text-white rounded-xl font-medium hover:bg-[#0A4D4E]/90 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Call Now
              </a>
              <a 
                href={`sms:${provider.phone}`}
                className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-[#0A4D4E] text-[#0A4D4E] rounded-xl font-medium hover:bg-[#0A4D4E]/5 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Message
              </a>
            </div>
          </div>
        </Card>

        {/* Reviews */}
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Customer Reviews ({reviews.length})
            </h3>

            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start gap-3 mb-3">
                      {review.reviewer_avatar ? (
                        <img 
                          src={review.reviewer_avatar}
                          alt={review.reviewer_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
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
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {review.comment}
                    </p>
                    {review.project_images && review.project_images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-3">
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
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No reviews yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
