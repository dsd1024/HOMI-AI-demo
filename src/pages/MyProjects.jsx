import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DesignProject } from "@/api/entities";
import { ArrowLeft, DollarSign, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";

export default function MyProjects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSkus, setSelectedSkus] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await DesignProject.list("-created_date");
      setProjects(data);
    } catch (err) {
      console.error("Load error:", err);
    }
    setLoading(false);
  };

  const selectProject = (project) => {
    setSelectedProject(project);
    // Initialize all SKU tags as selected
    setSelectedSkus(project.sku_tags || []);
  };

  const toggleSku = (sku) => {
    setSelectedSkus(prev => 
      prev.includes(sku) 
        ? prev.filter(s => s !== sku)
        : [...prev, sku]
    );
  };

  const calculateTotalCost = () => {
    if (!selectedProject || !selectedProject.ai_suggestions) return 0;
    
    return selectedProject.ai_suggestions
      .filter(item => selectedSkus.includes(item.item))
      .reduce((sum, item) => sum + (item.estimated_cost || 0), 0);
  };

  const deleteProject = async (projectId) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      await DesignProject.delete(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="px-4 pt-6 space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl("HomiHub"))}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-[#2C2C2C]">My Projects</h1>
            <p className="text-xs text-gray-500">{projects.length} saved projects</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h2>
            <p className="text-gray-500 mb-6">Start creating with Homi Studio</p>
            <Button
              onClick={() => navigate(createPageUrl("HomiStudio"))}
              className="bg-gray-900 hover:bg-gray-800"
            >
              Create New Project
            </Button>
          </div>
        ) : (
          <>
            {/* Projects Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {projects.map(project => (
                <Card 
                  key={project.id}
                  className={`overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedProject?.id === project.id
                      ? 'border-gray-900 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => selectProject(project)}
                >
                  <div className="aspect-square relative">
                    <img 
                      src={project.generated_image_url || project.reference_image_url}
                      alt={project.project_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 line-clamp-1">
                      {project.project_name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        {project.mode} Mode
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProject(project.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Selected Project Details */}
            {selectedProject && (
              <Card className="border-none shadow-lg">
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedProject.project_name}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.style_tags?.map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <img 
                    src={selectedProject.generated_image_url || selectedProject.reference_image_url}
                    alt={selectedProject.project_name}
                    className="w-full rounded-xl"
                  />

                  {/* SKU Selection */}
                  {selectedProject.sku_tags && selectedProject.sku_tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Project Items</h3>
                      <div className="space-y-2">
                        {selectedProject.ai_suggestions?.map((item, i) => {
                          const isSelected = selectedSkus.includes(item.item);
                          return (
                            <div 
                              key={i}
                              className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                                isSelected 
                                  ? 'border-gray-900 bg-gray-50'
                                  : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSku(item.item)}
                                />
                                <span className="font-medium text-gray-900">
                                  {item.item}
                                </span>
                              </div>
                              <span className={`font-semibold ${
                                isSelected ? 'text-gray-900' : 'text-gray-400'
                              }`}>
                                ${item.estimated_cost?.toLocaleString() || 0}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Total Cost */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm opacity-80">Selected Items:</span>
                      <span className="font-semibold">{selectedSkus.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold">Total Investment</span>
                      <span className="text-3xl font-bold">
                        ${calculateTotalCost().toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => navigate(createPageUrl("Marketplace"))}
                    className="w-full bg-gray-900 hover:bg-gray-800"
                  >
                    Shop These Items
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}