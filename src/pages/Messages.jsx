import React, { useState } from "react";
import { ArrowLeft, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Messages() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock conversations data
  const conversations = [
    {
      id: 1,
      name: "Sarah Designer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100",
      lastMessage: "I've sent you the revised floor plan",
      time: "2m ago",
      unread: 2
    },
    {
      id: 2,
      name: "West Elm Support",
      avatar: null,
      lastMessage: "Your order #12345 has been shipped",
      time: "1h ago",
      unread: 0
    },
    {
      id: 3,
      name: "Mike Contractor",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100",
      lastMessage: "Installation scheduled for next Tuesday",
      time: "3h ago",
      unread: 0
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-[#2C2C2C]">Messages</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-gray-200 bg-gray-50"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="px-4 py-6 space-y-3">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => (
            <Card key={conv.id} className="border-none shadow-sm p-4 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                {conv.avatar ? (
                  <img 
                    src={conv.avatar}
                    alt={conv.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-lg font-semibold text-white">
                      {conv.name[0]}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-[#2C2C2C]">{conv.name}</h3>
                    <span className="text-xs text-gray-500">{conv.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {conv.lastMessage}
                  </p>
                </div>

                {/* Unread Badge */}
                {conv.unread > 0 && (
                  <div className="w-6 h-6 bg-[#D4745F] rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {conv.unread}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No conversations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}