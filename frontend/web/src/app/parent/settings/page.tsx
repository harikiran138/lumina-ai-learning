"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Smartphone, 
  LogOut,
  ChevronRight,
  Eye,
  Mail,
  Lock,
  Globe,
  Monitor
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ParentSettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
    { id: "billing", label: "Subscription", icon: CreditCard },
  ]

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black mb-2 tracking-tight">System Settings</h1>
          <p className="text-gray-400">Manage your account preferences and child supervision controls.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Navigation */}
          <div className="lg:col-span-3 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                  activeTab === tab.id 
                    ? "bg-yellow-600 text-white shadow-xl shadow-yellow-500/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                {activeTab === tab.id && <ChevronRight className="h-4 w-4 ml-auto" />}
              </button>
            ))}
            
            <div className="pt-8 px-6">
              <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full justify-start gap-4 px-0">
                <LogOut className="h-5 w-5" />
                <span className="font-bold text-sm tracking-wide">Sign Out</span>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-9">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <Card className="bg-white/5 border-white/10 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-8">Personal Information</h3>
                    <div className="flex flex-col md:flex-row gap-10 items-start md:items-center">
                       <div className="relative group">
                          <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-yellow-500 to-amber-500 p-1 flex items-center justify-center">
                             <div className="h-full w-full rounded-[1.8rem] bg-neutral-900 flex items-center justify-center text-4xl font-black">P</div>
                          </div>
                          <button className="absolute -bottom-2 -right-2 bg-white text-neutral-900 p-2 rounded-xl shadow-lg hover:scale-110 transition-transform">
                             <Monitor className="h-4 w-4" />
                          </button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Full Name</label>
                             <p className="font-bold text-lg">Parent User</p>
                          </div>
                          <div className="space-y-2">
                             <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                             <div className="flex items-center gap-2">
                                <p className="font-bold text-lg">parent@lumina.ai</p>
                                <Badge className="bg-green-500/10 text-green-400 border-none">VERIFIED</Badge>
                             </div>
                          </div>
                       </div>
                    </div>
                  </Card>

                  <Card className="bg-white/5 border-white/10 p-8 rounded-3xl">
                    <h3 className="text-xl font-bold mb-6">Connected Accounts</h3>
                    <div className="space-y-4">
                       {[
                         { name: "Google", icon: Globe, status: "Connected", account: "parent.user@gmail.com" },
                         { name: "Mobile", icon: Smartphone, status: "Connected", account: "+1 (555) 000-0000" },
                       ].map((acc, i) => (
                         <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center">
                                  <acc.icon className="h-5 w-5 text-gray-400" />
                               </div>
                               <div>
                                  <h4 className="font-bold text-sm">{acc.name}</h4>
                                  <p className="text-xs text-gray-500">{acc.account}</p>
                               </div>
                            </div>
                            <Button variant="ghost" className="text-xs font-bold text-yellow-400">Manage</Button>
                         </div>
                       ))}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "notifications" && (
                <Card className="bg-white/5 border-white/10 p-8 rounded-3xl">
                  <h3 className="text-xl font-bold mb-8">Notification Preferences</h3>
                  <div className="space-y-8">
                     {[
                       { title: "Progress Alerts", desc: "Get notified when your child masters a new subject or milestone.", checked: true },
                       { title: "Critical Incidents", desc: "Immediate notifications for safety flags or counselor alerts.", checked: true },
                       { title: "Weekly Digests", desc: "A comprehensive summary of academic activity every Monday.", checked: false },
                       { title: "Peer Interaction", desc: "Notifications when your child interacts with a new mentor or tutor.", checked: true },
                     ].map((item, i) => (
                       <div key={i} className="flex items-center justify-between group">
                          <div className="max-w-md">
                             <h4 className="font-bold text-lg mb-1 group-hover:text-yellow-400 transition-colors">{item.title}</h4>
                             <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <button className={`w-14 h-8 rounded-full p-1 transition-colors ${item.checked ? 'bg-yellow-600' : 'bg-white/10'}`}>
                             <div className={`h-6 w-6 bg-white rounded-full shadow-lg transition-transform ${item.checked ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </button>
                       </div>
                     ))}
                  </div>
                </Card>
              )}

              {activeTab === "privacy" && (
                <div className="space-y-6">
                   <Card className="bg-white/5 border-white/10 p-8 rounded-3xl border-l-4 border-l-yellow-500">
                      <div className="flex gap-6 items-start">
                         <div className="p-4 bg-yellow-500/10 rounded-2xl text-yellow-400">
                            <Shield className="h-8 w-8" />
                         </div>
                         <div>
                            <h3 className="text-xl font-bold mb-2">Lumina Privacy Shield</h3>
                            <p className="text-sm text-gray-500 leading-relaxed mb-6">
                               Your data is protected by Lumina's Advanced Privacy Shield. We use military-grade encryption for all parent-child communications and student data snapshots.
                            </p>
                            <Button className="bg-white/10 hover:bg-white/20 text-white font-bold px-6">Review Security Dashboard</Button>
                         </div>
                      </div>
                   </Card>

                   <Card className="bg-white/5 border-white/10 p-8 rounded-3xl">
                      <h3 className="text-xl font-bold mb-8">Security Settings</h3>
                      <div className="space-y-6">
                         <div className="flex items-center justify-between">
                            <div>
                               <h4 className="font-bold text-lg">Two-Factor Authentication</h4>
                               <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
                            </div>
                            <Button className="bg-yellow-600 hover:bg-yellow-700">Enable 2FA</Button>
                         </div>
                         <div className="h-px bg-white/5 w-full"></div>
                         <div className="flex items-center justify-between">
                            <div>
                               <h4 className="font-bold text-lg">Active Sessions</h4>
                               <p className="text-sm text-gray-500">Manage your logged-in devices and browser sessions.</p>
                            </div>
                            <Button variant="ghost" className="text-gray-400">View All</Button>
                         </div>
                      </div>
                   </Card>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
