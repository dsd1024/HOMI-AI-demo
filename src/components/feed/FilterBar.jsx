import React from "react";
import { SlidersHorizontal, MapPin, Palette, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

const styles = ["Modern", "Scandinavian", "Industrial", "Minimalist", "Bohemian", "Traditional", "Contemporary", "Rustic"];
const budgets = ["Economy", "Mid-Range", "Premium"];

export default function FilterBar({ filters, onFilterChange }) {
  const [localFilters, setLocalFilters] = React.useState(filters || {});

  const toggleFilter = (category, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [category]: prev[category] === value ? null : value
    }));
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const activeFilterCount = Object.values(localFilters).filter(Boolean).length;

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 h-8 px-3 flex-shrink-0 text-xs"
              >
                <SlidersHorizontal className="w-3 h-3 mr-1" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 bg-[#0A4D4E] text-white border-none h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl">
              <SheetHeader>
                <SheetTitle className="text-xl">Refine Your Search</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Location */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-[#0A4D4E]" />
                    <h3 className="font-semibold text-gray-900">Location</h3>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter ZIP code or city"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A4D4E]"
                    value={localFilters.location || ''}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                {/* Style */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-[#0A4D4E]" />
                    <h3 className="font-semibold text-gray-900">Style</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {styles.map(style => (
                      <Badge
                        key={style}
                        onClick={() => toggleFilter('style', style)}
                        className={`cursor-pointer transition-all ${
                          localFilters.style === style
                            ? "bg-[#0A4D4E] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Budget */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-4 h-4 text-[#0A4D4E]" />
                    <h3 className="font-semibold text-gray-900">Budget Range</h3>
                  </div>
                  <div className="flex gap-2">
                    {budgets.map(budget => (
                      <Badge
                        key={budget}
                        onClick={() => toggleFilter('budget_range', budget)}
                        className={`flex-1 justify-center cursor-pointer transition-all py-2 ${
                          localFilters.budget_range === budget
                            ? "bg-[#0A4D4E] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {budget}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setLocalFilters({});
                    onFilterChange({});
                  }}
                >
                  Clear All
                </Button>
                <Button 
                  className="flex-1 bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Quick Filters */}
          {localFilters.style && (
            <Badge 
              className="bg-[#0A4D4E] text-white rounded-full flex-shrink-0 h-8 px-3 text-xs cursor-pointer"
              onClick={() => {
                setLocalFilters(prev => ({ ...prev, style: null }));
                onFilterChange({ ...localFilters, style: null });
              }}
            >
              {localFilters.style} ×
            </Badge>
          )}
          {localFilters.budget_range && (
            <Badge 
              className="bg-[#D4745F] text-white rounded-full flex-shrink-0 h-8 px-3 text-xs cursor-pointer"
              onClick={() => {
                setLocalFilters(prev => ({ ...prev, budget_range: null }));
                onFilterChange({ ...localFilters, budget_range: null });
              }}
            >
              {localFilters.budget_range} ×
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}