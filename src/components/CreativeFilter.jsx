
import React, { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const aspectRatios = [
  { name: "Portrait", value: "9:16" },
  { name: "Square", value: "1:1" },
  { name: "Landscape", value: "21:9" }
];

const designStyles = [
  "Modern", "Scandinavian", "Industrial", "Minimalist", 
  "Bohemian", "Traditional", "Contemporary", "Rustic",
  "Mid-Century", "Farmhouse", "Coastal", "Art Deco"
];

export default function CreativeFilter({ isOpen, onClose }) {
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [selectedStyle, setSelectedStyle] = useState("Modern");
  const [budget, setBudget] = useState(500);
  const [mode, setMode] = useState("Standard");
  const [version, setVersion] = useState("6.1");
  const [personalize, setPersonalize] = useState(true);
  const [speed, setSpeed] = useState("Fast");
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const getAspectRatioDisplay = () => {
    if (aspectRatio === "9:16") return "9:16";
    if (aspectRatio === "1:1") return "1:1";
    if (aspectRatio === "21:9") return "21:9";
    return aspectRatio;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-3xl h-[90vh] overflow-y-auto bg-white">
        <div className="relative">
          {/* Close Button - Top Right - REMOVED */}
          {/*
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
          */}

          <div className="pt-6 pb-6 space-y-8">
            {/* Top Section - Two Columns */}
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Aesthetics */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 text-center mb-6">Aesthetics</h3>
                
                {/* Aspect Ratio Selection */}
                <div className="flex gap-1.5 justify-center mb-6">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        aspectRatio === ratio.value
                          ? "bg-[#FF6B6B] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {ratio.name}
                    </button>
                  ))}
                </div>

                {/* Aspect Ratio Visual */}
                <div className="flex items-center justify-center h-40 bg-white">
                  <div 
                    className="border-2 border-gray-900 bg-white transition-all duration-300"
                    style={{
                      width: aspectRatio === "9:16" ? "60px" : aspectRatio === "1:1" ? "100px" : "140px",
                      height: aspectRatio === "9:16" ? "107px" : aspectRatio === "1:1" ? "100px" : "66px"
                    }}
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-900">{getAspectRatioDisplay()}</span>
                    </div>
                  </div>
                </div>

                {/* Slider below visual */}
                <div className="px-4">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={aspectRatio === "9:16" ? 0 : aspectRatio === "1:1" ? 1 : 2}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setAspectRatio(val === 0 ? "9:16" : val === 1 ? "1:1" : "21:9");
                    }}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                    style={{
                      background: `linear-gradient(to right, #1f2937 0%, #1f2937 50%, #e5e7eb 50%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Right Column - Budget */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 text-center mb-6">Budget</h3>
                
                {/* Budget Slider */}
                <div className="space-y-8 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-4">
                      <DollarSign className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      <div className="flex-1">
                        <input
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={budget}
                          onChange={(e) => setBudget(parseInt(e.target.value))}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-semibold text-gray-900">
                        {budget >= 10000 ? "∞" : `$${budget.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stylization Section */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-medium text-gray-900">Stylization</h3>
                <button 
                  onClick={() => setSelectedStyle("Modern")}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 px-2">
                {designStyles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedStyle === style
                        ? "bg-[#FF6B6B] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* More Options Toggle */}
            <button
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-xl transition-colors border-t border-gray-200"
            >
              <span className="text-sm font-medium text-gray-900">More Options</span>
              <span className="text-gray-500">{showMoreOptions ? "✓" : "›"}</span>
            </button>

            {/* More Options Content */}
            {showMoreOptions && (
              <div className="grid grid-cols-2 gap-8 pt-2 border-t border-gray-100">
                {/* Left Column - Mode */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Mode</label>
                    <div className="flex gap-2">
                      {["Standard", "Raw"].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMode(m)}
                          className={`flex-1 py-1.5 px-4 rounded-full text-sm font-medium transition-all ${
                            mode === m
                              ? "bg-[#FF6B6B] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Version</label>
                    <select
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full py-2 px-4 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    >
                      <option value="6.1">6.1</option>
                      <option value="6.0">6.0</option>
                      <option value="5.2">5.2</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Personalize</label>
                    <div className="flex gap-2">
                      {[true, false].map((value) => (
                        <button
                          key={value ? "on" : "off"}
                          onClick={() => setPersonalize(value)}
                          className={`flex-1 py-1.5 px-4 rounded-full text-sm font-medium transition-all ${
                            personalize === value
                              ? "bg-[#FF6B6B] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {value ? "On" : "Off"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Speed */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">Speed</label>
                    <div className="flex gap-2">
                      {["Relax", "Fast", "Turbo"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSpeed(s)}
                          className={`flex-1 py-1.5 px-3 rounded-full text-sm font-medium transition-all ${
                            speed === s
                              ? "bg-[#FF6B6B] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Apply Button */}
            <Button 
              className="w-full bg-gray-900 hover:bg-gray-800 h-12 text-base font-semibold text-white rounded-xl"
              onClick={onClose}
            >
              Apply Settings
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
