'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
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
    Share2
} from 'lucide-react';

export default function StudentCommunity() {
    const [activeChannel, setActiveChannel] = useState('general');
    const [messageInput, setMessageInput] = useState('');

    const [channels, setChannels] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // Check cache first
            const cached = localStorage.getItem(`lumina_community_${activeChannel}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                setChannels(parsed.channels || []);
                setMessages(parsed.messages || []);
                setIsLoading(false); // Show cached content immediately
            } else {
                setIsLoading(true);
            }

            try {
                const data = await api.getCommunityData(activeChannel);
                if (data) {
                    setChannels(data.channels || []);
                    setMessages(data.messages || []);
                    // Update cache
                    localStorage.setItem(`lumina_community_${activeChannel}`, JSON.stringify(data));
                }
            } catch (e) {
                console.error("Failed to load community data", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeChannel]);

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        const tempContent = messageInput;
        setMessageInput(''); // Clear immediately for UX

        try {
            const res = await api.sendCommunityMessage(activeChannel, tempContent);
            if (res.success && res.message) {
                // Optimistically add to list (or re-fetch, but appending is faster)
                const newMsg = {
                    ...res.message,
                    // If backend doesn't format time string, we do it here or rely on raw date
                    time: 'Just now'
                };
                const updatedMessages = [...messages, newMsg];
                setMessages(updatedMessages);

                // Update cache
                const currentCache = JSON.parse(localStorage.getItem(`lumina_community_${activeChannel}`) || '{"channels":[], "messages":[]}');
                currentCache.messages = updatedMessages;
                localStorage.setItem(`lumina_community_${activeChannel}`, JSON.stringify(currentCache));
            } else {
                console.error("Failed to send", res.error);
                // Ideally show toast
                setMessageInput(tempContent); // Revert
            }
        } catch (e) {
            console.error("Error sending message", e);
            setMessageInput(tempContent);
        }
    };

    // Mock DMs for now until we have a proper schema
    const directMessages = [
        { id: 'teacher-1', name: 'Dr. Sarah Wilson', status: 'online', avatar: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=random' },
        { id: 'student-2', name: 'Alex Johnson', status: 'offline', avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random' },
    ];

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-6 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-full lg:w-80 flex flex-col gap-6 h-full overflow-y-auto">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search discussions..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-lumina-primary/50"
                    />
                </div>

                {/* Channels */}
                <div className="glass-card p-4 flex-1 overflow-y-auto">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <Hash className="w-4 h-4" /> Channels
                    </h3>
                    <div className="space-y-1 mb-6">
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => setActiveChannel(channel.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${activeChannel === channel.id ? 'bg-lumina-primary/20 text-lumina-primary font-medium' : 'text-gray-300 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Hash className="w-4 h-4 opacity-50" />
                                    <span>{channel.name}</span>
                                </div>
                                {channel.unread > 0 && (
                                    <span className="bg-lumina-primary text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{channel.unread}</span>
                                )}
                            </button>
                        ))}
                        {channels.length === 0 && !isLoading && (
                            <div className="text-xs text-gray-500 px-3">No channels found. Defaulting to 'general'.</div>
                        )}
                    </div>

                    <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Direct Messages
                    </h3>
                    <div className="space-y-1">
                        {directMessages.map(dm => (
                            <button key={dm.id} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors">
                                <div className="relative">
                                    <img src={dm.avatar} alt={dm.name} className="w-8 h-8 rounded-full" />
                                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${dm.status === 'online' ? 'bg-green-500' : dm.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                                </div>
                                <span>{dm.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 glass-card flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3">
                        <Hash className="w-6 h-6 text-gray-400" />
                        <div>
                            <h2 className="font-bold text-white leading-tight">{channels.find(c => c.id === activeChannel)?.name || activeChannel}</h2>
                            <p className="text-xs text-gray-400">128 members • Topic: General Discussion</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2 mr-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs text-white">
                                    <Users className="w-4 h-4" />
                                </div>
                            ))}
                        </div>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 border border-transparent hover:border-white/10">
                            <Search className="w-5 h-5" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 border border-transparent hover:border-white/10">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {messages.map((msg, index) => (
                        <div key={msg.id || index} className="flex gap-4 group">
                            <img src={msg.avatar} alt={msg.user} className="w-10 h-10 rounded-full mt-1" />
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-white hover:underline cursor-pointer">{msg.user}</span>
                                    <span className="text-xs text-gray-500">{msg.time || new Date(msg.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-gray-300 leading-relaxed text-sm">{msg.content}</p>

                                <div className="flex items-center gap-4 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors">
                                        <Heart className="w-4 h-4" /> {msg.likes > 0 && msg.likes}
                                    </button>
                                    <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-lumina-primary transition-colors">
                                        <MessageCircle className="w-4 h-4" /> {msg.replies > 0 && `${msg.replies} replies`}
                                    </button>
                                    <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center py-10 text-gray-500">No messages yet. Start the conversation!</div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/10">
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lumina-primary/50 transition-colors"
                            placeholder={`Message #${activeChannel}`}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-2">
                            <button className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <Paperclip className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                            <button className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                <Smile className="w-5 h-5" />
                            </button>
                            {messageInput && (
                                <button
                                    onClick={handleSendMessage}
                                    className="p-1 bg-lumina-primary text-black rounded-lg hover:bg-lumina-secondary transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 px-2">
                        <p className="text-[10px] text-gray-500">
                            <strong>Tip:</strong> You can format messages using Markdown.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
