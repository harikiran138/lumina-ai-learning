"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  MessageSquare,
  Users,
  Hash,
  Search,
  Send,
  MoreVertical,
  Smile,
  Paperclip,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";

export default function StudentCommunity() {
  const [activeCommunity, setActiveCommunity] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [communities, setCommunities] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Communities
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await api.get("/api/community/");
        if (res.success) {
          setCommunities(res.data || []);
          if (res.data.length > 0 && !activeCommunity) {
            setActiveCommunity(res.data[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to load communities", e);
      }
    };
    fetchCommunities();
  }, []);

  // Fetch Posts when activeCommunity or activeSubject changes
  useEffect(() => {
    const fetchPosts = async () => {
      if (!activeCommunity && !activeSubject) return;
      
      setIsLoading(true);
      try {
        let url = "/api/community/posts";
        const params = new URLSearchParams();
        if (activeCommunity) params.append("community_id", activeCommunity);
        if (activeSubject) params.append("subject_tag", activeSubject);
        
        const res = await api.get(`${url}?${params.toString()}`);
        if (res.success) {
          setPosts(res.data || []);
        }
      } catch (e) {
        console.error("Failed to load posts", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [activeCommunity, activeSubject]);

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !messageInput.trim() || !activeCommunity) return;

    try {
      const selectedComm = communities.find(c => c.id === activeCommunity);
      const res = await api.post("/api/community/post/create", {
        community_id: activeCommunity,
        title: postTitle,
        content: messageInput,
        subject_tag: selectedComm?.subject_tag || "general"
      });

      if (res.success) {
        setPosts([res.data, ...posts]);
        setPostTitle("");
        setMessageInput("");
        setShowCreateModal(false);
      }
    } catch (e) {
      console.error("Error creating post", e);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await api.post("/api/community/like", { post_id: postId });
      if (res.success) {
        setPosts(posts.map(p => {
          if (p.id === postId) {
            return { 
              ...p, 
              likes_count: res.liked ? (p.likes_count || 0) + 1 : Math.max(0, (p.likes_count || 0) - 1),
              user_liked: res.liked
            };
          }
          return p;
        }));
      }
    } catch (e) {
      console.error("Error liking post", e);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-6 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full lg:w-80 flex flex-col gap-6 h-full overflow-y-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search discussions..."
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none"
          />
        </div>

        <div className="glass-card p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4" /> Topics
          </h3>
          <div className="space-y-1 mb-6">
            <button
              onClick={() => { setActiveSubject(null); setActiveCommunity(communities[0]?.id); }}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                !activeSubject ? "bg-lumina-primary/20 text-lumina-primary font-medium" : "text-gray-300 hover:bg-white/5"
              }`}
            >
              All Threads
            </button>
            {communities.map((comm) => (
              <button
                key={comm.id}
                onClick={() => { setActiveCommunity(comm.id); setActiveSubject(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeCommunity === comm.id && !activeSubject
                    ? "bg-lumina-primary/20 text-lumina-primary font-medium"
                    : "text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 opacity-50" />
                  <span>{comm.name}</span>
                </div>
              </button>
            ))}
          </div>

          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full py-2 bg-lumina-primary text-black rounded-lg font-bold text-sm hover:bg-lumina-secondary transition-all"
          >
            Start New Discussion
          </button>
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 glass-card flex flex-col h-full overflow-hidden relative">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-lumina-primary" />
            <div>
              <h2 className="font-bold text-white">Community Feed</h2>
              <p className="text-xs text-gray-400">
                {posts.length} discussion{posts.length === 1 ? "" : "s"} found
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumina-primary"></div>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id} className="group glass-card p-6 border-white/5 hover:border-white/20 transition-all">
                <div className="flex gap-4">
                  <img
                    src={post.users?.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.users?.full_name || "User")}`}
                    alt="avatar"
                    className="w-12 h-12 rounded-full ring-2 ring-lumina-primary/20"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-white text-lg">{post.title}</span>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-gray-400 uppercase tracking-wider">
                          {post.subject_tag}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 leading-relaxed mb-4">{post.content}</p>
                    
                    <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 text-sm transition-colors ${
                          post.user_liked ? "text-red-500" : "text-gray-500 hover:text-red-400"
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.user_liked ? "fill-current" : ""}`} />
                        {post.likes_count || 0}
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-lumina-primary transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        Reply
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-white ml-auto">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No discussions in this topic yet.</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-lumina-primary hover:underline font-medium"
              >
                Be the first to post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl p-8 border-white/10 shadow-2xl relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Start a New Discussion</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title (be descriptive)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lumina-primary"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
              />
              <textarea
                placeholder="What's on your mind? Share your thoughts, code, or questions..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white h-48 focus:outline-none focus:border-lumina-primary"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <div className="flex gap-4">
                <select 
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none"
                  value={activeCommunity || ""}
                  onChange={(e) => setActiveCommunity(e.target.value)}
                >
                  {communities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <button 
                  onClick={handleCreatePost}
                  disabled={!postTitle || !messageInput}
                  className="flex-1 py-3 bg-lumina-primary text-black rounded-xl font-bold hover:bg-lumina-secondary disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Post Discussion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
