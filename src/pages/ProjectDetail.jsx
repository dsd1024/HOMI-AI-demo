
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DesignProject } from "@/api/entities";
import { Cart } from "@/api/entities";
import { Product } from "@/api/entities";
import { ArrowLeft, ShoppingCart, Loader2, CheckCircle, DollarSign, Package, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectDetail() {
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setLoading(false); // Ensure loading is false if no projectId
      return;
    }
    
    setLoading(true);
    try {
      const projects = await DesignProject.filter({ id: projectId });
      if (projects.length > 0) {
        setProject(projects[0]);
      } else {
        setProject(null); // No project found
      }
    } catch (err) {
      console.error("Load project error:", err);
      setProject(null); // Clear project on error
    }
    setLoading(false);
  }, [projectId]); // Dependency on projectId

  useEffect(() => {
    loadProject();
  }, [loadProject]); // Dependency on the memoized loadProject function

  const addAllToCart = async () => {
    if (!project || !project.ai_suggestions) return;
    
    setAddingToCart(true);
    
    try {
      // Try to match SKU suggestions with actual products
      const allProducts = await Product.list();
      
      for (const suggestion of project.ai_suggestions) {
        // Try to find matching product
        const matchedProduct = allProducts.find(p => 
          p.name?.toLowerCase().includes(suggestion.item.toLowerCase()) ||
          suggestion.item.toLowerCase().includes(p.name?.toLowerCase())
        );
        
        if (matchedProduct) {
          // Add actual product
          await Cart.create({
            product_id: matchedProduct.id,
            product_name: matchedProduct.name,
            product_image: matchedProduct.image_url,
            price: matchedProduct.price,
            quantity: 1
          });
        } else {
          // Add as placeholder item
          await Cart.create({
            product_id: `placeholder-${suggestion.item}`,
            product_name: suggestion.item,
            product_image: project.generated_image_url || project.reference_image_url,
            price: suggestion.estimated_cost || 0,
            quantity: 1
          });
        }
      }
      
      setAddedToCart(true);
      setTimeout(() => {
        navigate(createPageUrl("Cart"));
      }, 1500);
      
    } catch (err) {
      console.error("Add to cart error:", err);
      alert("Failed to add items to cart");
    }
    
    setAddingToCart(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F7F4]">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="px-4 pt-6 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex items-center justify-center">
        <p className="text-gray-500">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("Profile"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#2C2C2C]">Project Details</h1>
            <p className="text-xs text-gray-500">{project.mode} Mode</p>
          </div>
          <Badge className={`${
            project.status === 'Completed' ? 'bg-green-500' :
            project.status === 'In Progress' ? 'bg-blue-500' :
            'bg-gray-500'
          } text-white`}>
            {project.status}
          </Badge>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Project Image */}
        <Card className="border-none shadow-lg overflow-hidden">
          <img 
            src={project.generated_image_url || project.reference_image_url}
            alt={project.project_name}
            className="w-full max-h-96 object-cover"
          />
        </Card>

        {/* Project Info */}
        <Card className="border-none shadow-lg">
          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {project.project_name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.style_preference && (
                  <Badge variant="outline">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {project.style_preference}
                  </Badge>
                )}
                {project.budget_level && (
                  <Badge variant="outline">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {project.budget_level}
                  </Badge>
                )}
                {project.room_type && (
                  <Badge variant="outline">{project.room_type}</Badge>
                )}
              </div>
            </div>

            {project.style_tags && project.style_tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Style Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.style_tags.map((tag, i) => (
                    <Badge key={i} className="bg-[#0A4D4E]/10 text-[#0A4D4E]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Products List */}
        {project.ai_suggestions && project.ai_suggestions.length > 0 && (
          <Card className="border-none shadow-lg">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Products in Design</h3>
                <Badge className="bg-[#0A4D4E] text-white">
                  <Package className="w-3 h-3 mr-1" />
                  {project.ai_suggestions.length} items
                </Badge>
              </div>

              <div className="space-y-3">
                {project.ai_suggestions.map((item, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.item}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                      </div>
                      <span className="font-bold text-[#0A4D4E] ml-3">
                        ${item.estimated_cost?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Budget */}
              <div className="bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 rounded-xl p-6 text-white mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-90">Total Items:</span>
                  <span className="font-semibold">{project.ai_suggestions.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total Investment</span>
                  <span className="text-3xl font-bold">
                    ${project.total_budget?.toLocaleString() || 0}
                  </span>
                </div>
                <p className="text-xs opacity-75 mt-2">
                  Estimated cost for all items in this design
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-[#0A4D4E] text-[#0A4D4E] hover:bg-[#0A4D4E]/5"
            onClick={() => navigate(createPageUrl("Marketplace"))}
          >
            Browse Shop
          </Button>
          <Button
            className="flex-1 bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
            onClick={addAllToCart}
            disabled={addingToCart || addedToCart || !project.ai_suggestions || project.ai_suggestions.length === 0}
          >
            {addedToCart ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Added to Cart!
              </>
            ) : addingToCart ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add All to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
