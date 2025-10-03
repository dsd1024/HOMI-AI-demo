import React from "react";
import { ArrowLeft, Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function Subscribe() {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "3 AI renders per day",
        "Basic design tools",
        "Community access",
        "Standard support"
      ],
      color: "from-gray-500 to-gray-600",
      buttonText: "Current Plan",
      disabled: true
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      popular: true,
      features: [
        "Unlimited AI renders",
        "Advanced design tools",
        "Priority support",
        "Export high-res images",
        "AR preview",
        "Product recommendations"
      ],
      color: "from-[#0A4D4E] to-[#0A4D4E]/80",
      buttonText: "Upgrade to Pro"
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "per month",
      features: [
        "Everything in Pro",
        "Dedicated account manager",
        "Custom integrations",
        "White-label option",
        "API access",
        "Team collaboration"
      ],
      color: "from-purple-600 to-purple-700",
      buttonText: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 text-white px-4 pt-8 pb-16">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-white hover:bg-white/10 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Upgrade Your Experience</h1>
          <p className="text-white/80">Choose the perfect plan for your needs</p>
        </div>
      </div>

      {/* Plans */}
      <div className="px-4 -mt-8 pb-8 space-y-4">
        {plans.map((plan, index) => (
          <Card 
            key={plan.name}
            className={`border-none shadow-lg overflow-hidden ${
              plan.popular ? 'ring-2 ring-[#D4745F]' : ''
            }`}
          >
            {plan.popular && (
              <div className="bg-gradient-to-r from-[#D4745F] to-[#D4745F]/80 text-white text-center py-2">
                <Badge className="bg-white text-[#D4745F]">
                  <Zap className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <div className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-[#0A4D4E]">{plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
              </div>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full h-12 bg-gradient-to-r ${plan.color} hover:opacity-90`}
                disabled={plan.disabled}
              >
                {plan.buttonText}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}