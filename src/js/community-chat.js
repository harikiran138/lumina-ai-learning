/**
 * Lumina Community Chat System
 * Shared functionality for all community pages (student, teacher, admin)
 */

class CommunityChat {
    constructor() {
        this.currentUser = null;
        this.chatRooms = [];
        this.currentRoomId = null;
        this.currentMessages = [];
        this.api = null;
        this.allUsers = [];
        this.refreshInterval = null;
        
        // DOM elements
        this.groupList = document.getElementById('group-list');
        this.chatHeader = document.getElementById('chat-header');
        this.messagesContainer = document.getElementById('messages-container');
        this.messageInputForm = document.getElementById('message-input-form');
        this.messageInput = document.getElementById('message-input');
        this.memberList = document.getElementById('member-list');
    }

    // Initialize the community chat system
    async initialize() {
        try {
            this.api = new LuminaAPI();
            await this.api.init();
            
            this.currentUser = await this.api.getCurrentUser();
            this.allUsers = await this.api.getAllUsers();
            this.chatRooms = await this.api.getAllChatRooms();
            
            if (this.chatRooms.length > 0) {
                this.currentRoomId = this.chatRooms[0].id;
                await this.loadChatRoom(this.currentRoomId);
            }
            
            this.renderGroupList();
            this.setupEventListeners();
            
            // Auto-refresh messages every 3 seconds
            this.refreshInterval = setInterval(() => this.refreshMessages(), 3000);
            
        } catch (error) {
            console.error('Failed to initialize community:', error);
        }
    }

    async loadChatRoom(roomId) {
        try {
            this.currentRoomId = roomId;
            this.currentMessages = await this.api.getChatMessages(roomId);
            const room = this.chatRooms.find(r => r.id === roomId);
            
            this.renderChat(room);
            this.renderMemberList(room);
        } catch (error) {
            console.error('Failed to load chat room:', error);
        }
    }

    async sendMessage(text) {
        try {
            await this.api.sendChatMessage(this.currentRoomId, text);
            await this.refreshMessages();
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    async refreshMessages() {
        if (this.currentRoomId) {
            try {
                this.currentMessages = await this.api.getChatMessages(this.currentRoomId);
                this.renderMessages();
            } catch (error) {
                console.error('Failed to refresh messages:', error);
            }
        }
    }

    // --- RENDERING FUNCTIONS ---
    renderGroupList() {
        this.groupList.innerHTML = '';
        this.chatRooms.forEach(room => {
            const isActive = room.id === this.currentRoomId;
            const activeClasses = isActive ? 'text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';
            
            this.groupList.innerHTML += `
                <a href="#" data-room-id="${room.id}" class="group-link flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-md ${activeClasses}">
                    <div class="flex items-center">
                        <span class="text-lg mr-2">${room.avatar}</span>
                        <div>
                            <div class="font-semibold">${room.name}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">${room.description}</div>
                        </div>
                    </div>
                </a>
            `;
        });
    }

    renderMemberList(room) {
        if (!room) return;
        
        this.memberList.innerHTML = '';
        
        // Get member details from all users
        const members = room.members.map(memberId => 
            this.allUsers.find(user => user.id === memberId)
        ).filter(Boolean);
        
        // Sort members by role: admins, teachers, then students
        const admins = members.filter(m => m.role === 'admin');
        const teachers = members.filter(m => m.role === 'teacher');
        const students = members.filter(m => m.role === 'student');
        
        // Render admins
        if (admins.length > 0) {
            this.memberList.innerHTML += `<h3 class="px-2 pt-3 pb-1 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Admins — ${admins.length}</h3>`;
            admins.forEach(member => {
                this.memberList.innerHTML += `
                    <div class="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        <div class="w-8 h-8 rounded-full ${member.color} flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">${member.avatar}</div>
                        <span class="ml-3 font-semibold text-sm">${member.name}</span>
                    </div>
                `;
            });
        }
        
        // Render teachers
        if (teachers.length > 0) {
            this.memberList.innerHTML += `<h3 class="px-2 pt-3 pb-1 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Teachers — ${teachers.length}</h3>`;
            teachers.forEach(member => {
                this.memberList.innerHTML += `
                    <div class="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        <div class="w-8 h-8 rounded-full ${member.color} flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">${member.avatar}</div>
                        <span class="ml-3 font-semibold text-sm">${member.name}</span>
                    </div>
                `;
            });
        }

        // Render students
        if (students.length > 0) {
            this.memberList.innerHTML += `<h3 class="px-2 pt-3 pb-1 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Students — ${students.length}</h3>`;
            students.forEach(member => {
                this.memberList.innerHTML += `
                    <div class="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                        <div class="relative w-8 h-8">
                            <div class="w-8 h-8 rounded-full ${member.color} flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">${member.avatar}</div>
                            <span class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white dark:border-[#1C1C1C]"></span>
                        </div>
                        <span class="ml-3 font-semibold text-sm">${member.name}</span>
                    </div>
                `;
            });
        }
    }

    renderChat(room) {
        if (!room) return;
        
        // Update Header with member avatars
        const members = room.members.map(memberId => 
            this.allUsers.find(user => user.id === memberId)
        ).filter(Boolean);
        
        let memberAvatars = '';
        members.slice(0, 4).forEach(m => {
            memberAvatars += `<div class="w-8 h-8 rounded-full ${m.color} flex items-center justify-center text-white text-sm font-bold border-2 border-white dark:border-black">${m.avatar}</div>`;
        });
        if (members.length > 4) {
            memberAvatars += `<div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-300 text-xs font-bold border-2 border-white dark:border-black">+${members.length - 4}</div>`;
        }

        this.chatHeader.innerHTML = `
            <button class="flex items-center justify-between w-full text-left p-1 -m-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" onclick="toggleMemberSidebar()">
                <div class="flex-1">
                    <h3 class="font-bold text-lg">${room.name}</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${room.description}</p>
                </div>
                <div class="flex items-center">
                    <div class="flex -space-x-2 mr-4">${memberAvatars}</div>
                    <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            </button>`;

        this.renderMessages();
        this.messageInput.placeholder = `Message ${room.name}`;
    }

    renderMessages() {
        this.messagesContainer.innerHTML = '';
        let lastSender = null;
        
        this.currentMessages.forEach(msg => {
            const isCurrentUser = msg.senderId === this.currentUser.id;
            const isContinuing = lastSender === msg.senderId;
            const messageGroupClass = isContinuing ? 'chat-message-group mt-1' : 'chat-message-group mt-4';

            if (isCurrentUser) {
                this.messagesContainer.innerHTML += `
                    <div class="flex items-start gap-3 flex-row-reverse ${messageGroupClass}">
                        <div class="w-10 h-10 rounded-full ${this.currentUser.color} flex-shrink-0 flex items-center justify-center text-white font-bold chat-avatar">
                            ${this.currentUser.avatar}
                        </div>
                        <div class="flex-1 flex flex-col items-end">
                            ${!isContinuing ? `<p class="font-semibold text-sm">You <span class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">${msg.time}</span></p>` : ''}
                            <div class="mt-1 text-sm bg-amber-500 text-white p-3 rounded-lg ${isContinuing ? '' : 'rounded-br-none'} max-w-md">
                                ${msg.text}
                            </div>
                        </div>
                    </div>`;
            } else {
                const roleBadge = msg.senderRole === 'teacher' ? `<span class="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 font-bold px-1.5 py-0.5 rounded-full ml-2">TEACHER</span>` : 
                                msg.senderRole === 'admin' ? `<span class="text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-bold px-1.5 py-0.5 rounded-full ml-2">ADMIN</span>` : '';
                                
                this.messagesContainer.innerHTML += `
                    <div class="flex items-start gap-3 ${messageGroupClass}">
                        <div class="w-10 h-10 rounded-full ${msg.senderColor} flex-shrink-0 flex items-center justify-center text-white font-bold chat-avatar">
                            ${msg.senderAvatar}
                        </div>
                        <div>
                            ${!isContinuing ? `<p class="font-semibold text-sm">${msg.sender} ${roleBadge}<span class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">${msg.time}</span></p>` : ''}
                            <div class="mt-1 text-sm bg-white dark:bg-[#1C1C1C] p-3 rounded-lg ${isContinuing ? '' : 'rounded-tl-none'} border border-gray-200 dark:border-gray-800 max-w-md">
                                ${msg.text}
                            </div>
                        </div>
                    </div>`;
            }
            lastSender = msg.senderId;
        });
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    setupEventListeners() {
        // Group selection
        this.groupList.addEventListener('click', (e) => {
            const link = e.target.closest('.group-link');
            if (link) {
                e.preventDefault();
                const roomId = link.dataset.roomId;
                this.loadChatRoom(roomId);
            }
        });

        // Message submission
        this.messageInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = this.messageInput.value.trim();
            if (text && this.currentRoomId) {
                this.messageInput.value = '';
                await this.sendMessage(text);
            }
        });
    }

    // Cleanup function
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Global community chat instance
window.communityChat = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.communityChat = new CommunityChat();
    await window.communityChat.initialize();
});