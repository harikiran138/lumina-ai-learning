
'use client';

import { FileText, Upload, Folder, Download, Search } from 'lucide-react';

export default function TeacherResources() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Resources</h1>
                    <p className="text-gray-400">Manage course materials and file library</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload File
                </button>
            </div>

            {/* Folders Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Course Slides', 'Assignments', 'Readings', 'Templates'].map((folder) => (
                    <div key={folder} className="card p-4 hover:border-amber-500/50 cursor-pointer transition-colors group">
                        <Folder className="w-8 h-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="font-semibold text-white">{folder}</h3>
                        <p className="text-xs text-gray-400">12 files</p>
                    </div>
                ))}
            </div>

            {/* Recent Files */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Recent Uploads</h2>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-900/30 text-blue-400 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Lecture_Notes_Week_{i}.pdf</p>
                                    <p className="text-xs text-gray-500">2.4 MB • Uploaded yesterday</p>
                                </div>
                            </div>
                            <button className="p-2 text-gray-400 hover:text-white transition-colors">
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
