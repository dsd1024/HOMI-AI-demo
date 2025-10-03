import React, { useState } from "react";
import { Post } from "@/api/entities";
import { Comment } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, MessageCircle, CheckCircle } from "lucide-react";

const sampleUsers = [
  { name: "Sarah Chen", avatar: "https://ui-avatars.com/api/?name=Sarah+Chen&background=6366f1" },
  { name: "Mike Rodriguez", avatar: "https://ui-avatars.com/api/?name=Mike+Rodriguez&background=8b5cf6" },
  { name: "Emma Johnson", avatar: "https://ui-avatars.com/api/?name=Emma+Johnson&background=ec4899" },
  { name: "David Kim", avatar: "https://ui-avatars.com/api/?name=David+Kim&background=10b981" },
  { name: "Lisa Wang", avatar: "https://ui-avatars.com/api/?name=Lisa+Wang&background=f59e0b" },
  { name: "James Miller", avatar: "https://ui-avatars.com/api/?name=James+Miller&background=ef4444" },
  { name: "Sophia Lee", avatar: "https://ui-avatars.com/api/?name=Sophia+Lee&background=3b82f6" },
  { name: "Alex Turner", avatar: "https://ui-avatars.com/api/?name=Alex+Turner&background=14b8a6" },
  { name: "Olivia Brown", avatar: "https://ui-avatars.com/api/?name=Olivia+Brown&background=a855f7" },
  { name: "Ryan Garcia", avatar: "https://ui-avatars.com/api/?name=Ryan+Garcia&background=f97316" },
  { name: "Mia Anderson", avatar: "https://ui-avatars.com/api/?name=Mia+Anderson&background=06b6d4" },
  { name: "Noah Wilson", avatar: "https://ui-avatars.com/api/?name=Noah+Wilson&background=84cc16" },
  { name: "Ava Martinez", avatar: "https://ui-avatars.com/api/?name=Ava+Martinez&background=f43f5e" },
  { name: "Ethan Davis", avatar: "https://ui-avatars.com/api/?name=Ethan+Davis&background=8b5cf6" },
  { name: "Isabella Taylor", avatar: "https://ui-avatars.com/api/?name=Isabella+Taylor&background=ec4899" }
];

const commentTemplates = [
  "Absolutely love this design! The {feature} is {adjective}. {question}",
  "This is exactly the vibe I'm going for in my {room}! Thanks for the inspiration 🙏",
  "Beautiful space! {compliment} {question}",
  "The {feature} in here is perfection! Can you share more details?",
  "Wow, this {adjective} design is stunning! Love the {feature}.",
  "I'm obsessed with this look! Where did you get the {item}?",
  "This is giving me so many ideas for my {room} renovation! 💡",
  "The color palette is {adjective}! How did you choose these tones?",
  "Such a {adjective} and inviting space! I could spend hours here 😍",
  "This is interior design goals! The {feature} really makes the space.",
  "Love how you incorporated the {feature}! Very {adjective}.",
  "This is so inspiring! Can you share where you got the {item}?",
  "The attention to detail here is amazing! Especially love the {feature}.",
  "This space feels so {adjective} and welcoming! Great job!",
  "I need this in my life! The {feature} is everything 🤩",
  "Bookmarking this for future reference! Love the {style} style.",
  "This is exactly what I needed to see today! So {adjective}!",
  "The way you styled the {feature} is brilliant! 👏",
  "I'm taking notes! This {room} is perfection.",
  "Such a calming space! The {feature} creates such a nice atmosphere."
];

const features = [
  "color palette", "lighting", "furniture arrangement", "texture combination",
  "layout", "window treatment", "artwork", "plants", "rug", "coffee table",
  "shelving", "accent wall", "ceiling design", "floor choice"
];

const adjectives = [
  "calming", "stunning", "elegant", "cozy", "modern", "sophisticated",
  "inviting", "beautiful", "perfect", "amazing", "gorgeous", "stylish",
  "chic", "warm", "bright", "inspiring", "fresh", "timeless"
];

const rooms = [
  "living room", "bedroom", "kitchen", "office", "dining room", "home"
];

const items = [
  "sofa", "coffee table", "lamp", "rug", "chair", "artwork",
  "plant stand", "shelving unit", "mirror", "cushions"
];

const questions = [
  "Where did you get that sofa?",
  "What's the paint color?",
  "Can you share the source?",
  "Is this DIY or store-bought?",
  "What are the dimensions?",
  "How did you make it work?",
  "Any tips for recreating this?",
  "What's your secret?"
];

const compliments = [
  "How did you manage to make it feel so spacious?",
  "The balance is incredible!",
  "You have such great taste!",
  "This looks professionally designed!",
  "Every detail is perfect!",
  "The proportions are spot on!"
];

const styles = [
  "modern", "minimalist", "scandinavian", "industrial", "bohemian",
  "contemporary", "rustic", "traditional"
];

function generateComment(post) {
  const template = commentTemplates[Math.floor(Math.random() * commentTemplates.length)];
  
  let comment = template
    .replace("{feature}", features[Math.floor(Math.random() * features.length)])
    .replace("{adjective}", adjectives[Math.floor(Math.random() * adjectives.length)])
    .replace("{room}", rooms[Math.floor(Math.random() * rooms.length)])
    .replace("{item}", items[Math.floor(Math.random() * items.length)])
    .replace("{question}", questions[Math.floor(Math.random() * questions.length)])
    .replace("{compliment}", compliments[Math.floor(Math.random() * compliments.length)])
    .replace("{style}", post.style?.toLowerCase() || styles[Math.floor(Math.random() * styles.length)]);
  
  return comment;
}

export default function GenerateComments() {
  const [generating, setGenerating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [stats, setStats] = useState({ posts: 0, comments: 0 });

  const generateAllComments = async () => {
    setGenerating(true);
    setCompleted(false);
    
    try {
      // Get all posts
      const posts = await Post.list();
      
      let totalComments = 0;
      
      for (const post of posts) {
        // Check if post already has comments
        const existingComments = await Comment.filter({ post_id: post.id });
        
        // Only generate if post has fewer than 3 comments
        if (existingComments.length < 3) {
          // Generate 2-5 random comments per post
          const numComments = Math.floor(Math.random() * 4) + 2; // 2-5 comments
          
          // Shuffle users and pick random ones
          const shuffledUsers = [...sampleUsers].sort(() => Math.random() - 0.5);
          
          for (let i = 0; i < numComments && i < shuffledUsers.length; i++) {
            const user = shuffledUsers[i];
            const commentText = generateComment(post);
            const likesCount = Math.floor(Math.random() * 20); // 0-19 likes
            
            await Comment.create({
              post_id: post.id,
              content: commentText,
              author_name: user.name,
              author_avatar: user.avatar,
              likes_count: likesCount
            });
            
            totalComments++;
          }
        }
      }
      
      setStats({ posts: posts.length, comments: totalComments });
      setCompleted(true);
      
    } catch (err) {
      console.error("Generate comments error:", err);
      alert("Failed to generate comments");
    }
    
    setGenerating(false);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-[#0A4D4E]" />
          <div>
            <h3 className="font-semibold text-lg">Generate Comments</h3>
            <p className="text-sm text-gray-500">
              Automatically generate realistic user comments for all posts
            </p>
          </div>
        </div>

        {completed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-900">Comments Generated!</p>
              <p className="text-sm text-green-700 mt-1">
                Added {stats.comments} comments across {stats.posts} posts
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={generateAllComments}
          disabled={generating}
          className="w-full bg-[#0A4D4E] hover:bg-[#0A4D4E]/90"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Comments...
            </>
          ) : (
            <>
              <MessageCircle className="w-4 h-4 mr-2" />
              Generate Comments for All Posts
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Generates 2-5 comments per post</p>
          <p>• Uses 15 different realistic user personas</p>
          <p>• Comments are contextual and varied</p>
          <p>• Only generates for posts with fewer than 3 comments</p>
        </div>
      </div>
    </Card>
  );
}