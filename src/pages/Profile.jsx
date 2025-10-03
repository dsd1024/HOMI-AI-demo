import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { DesignProject } from "@/api/entities";
import { Post } from "@/api/entities";
import { Settings, LogOut, Sparkles, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "../components/feed/UserAvatar";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userData = await User.me();
    setUser(userData);

    const userProjects = await DesignProject.filter({ created_by: userData.email });
    setProjects(userProjects);

    const userPosts = await Post.filter({ created_by: userData.email });
    setMyPosts(userPosts);
  };

  const handleLogout = async () => {
    await User.logout();
    navigate(createPageUrl("HomiHub"));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#0A4D4E] to-[#0A4D4E]/80 text-white px-4 pt-8 pb-12">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <UserAvatar user={user} size="xl" />
            <div>
              <h1 className="text-2xl font-bold">{user.full_name}</h1>
              <p className="text-white/80 text-sm">{user.email}</p>
              {user.location && (
                <p className="text-white/70 text-xs mt-1">{user.location}</p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-xs text-white/70">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{myPosts.length}</div>
            <div className="text-xs text-white/70">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.followers_count || 0}</div>
            <div className="text-xs text-white/70">Followers</div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="px-4 -mt-6 pb-8">
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="w-full bg-white shadow-lg rounded-2xl grid grid-cols-2 p-1">
            <TabsTrigger value="projects" className="rounded-xl">
              <Sparkles className="w-4 h-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="posts" className="rounded-xl">
              <Image className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-6 space-y-4">
            {projects.length === 0 ? (
              <Card className="border-none shadow-sm p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No projects yet</p>
              </Card>
            ) : (
              projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => navigate(createPageUrl(`ProjectDetail?id=${project.id}`))}
                  className="w-full text-left"
                >
                  <Card className="border-none shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-[#2C2C2C] text-lg">{project.project_name}</h3>
                          <p className="text-sm text-gray-500">{project.mode} Mode</p>
                        </div>
                        <Badge className={`${
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </Badge>
                      </div>
                      {(project.generated_image_url || project.reference_image_url) && (
                        <img 
                          src={project.generated_image_url || project.reference_image_url} 
                          alt={project.project_name}
                          className="w-full h-48 object-cover rounded-xl mb-3"
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {project.style_preference && (
                            <Badge variant="outline" className="text-xs">
                              {project.style_preference}
                            </Badge>
                          )}
                          {project.budget_level && (
                            <Badge variant="outline" className="text-xs">
                              {project.budget_level}
                            </Badge>
                          )}
                        </div>
                        {project.total_budget && (
                          <span className="text-sm font-semibold text-[#0A4D4E]">
                            ${project.total_budget.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </button>
              ))
            )}
          </TabsContent>

          <TabsContent value="posts" className="mt-6 space-y-4">
            {myPosts.length === 0 ? (
              <Card className="border-none shadow-sm p-8 text-center">
                <Image className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No posts yet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {myPosts.map(post => (
                  <div key={post.id} className="aspect-square rounded-xl overflow-hidden">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button
          variant="outline"
          className="w-full mt-6 border-[#D4745F] text-[#D4745F] hover:bg-[#D4745F] hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}