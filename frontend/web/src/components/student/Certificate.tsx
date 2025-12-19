'use client';

import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Share2, Award } from 'lucide-react';

interface CertificateProps {
    studentName: string;
    courseName: string;
    issueDate: Date | string;
    certificateId: string;
    onClose?: () => void;
}

const Certificate: React.FC<CertificateProps> = ({ studentName, courseName, issueDate, certificateId, onClose }) => {
    const certificateRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!certificateRef.current) return;

        try {
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2, // Higher resolution
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Lumina-Certificate-${certificateId}.pdf`);
        } catch (error) {
            console.error('Error generating certificate:', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-5xl mx-auto">
                {/* Actions Bar */}
                <div className="flex justify-end gap-3 mb-4">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-lg hover:shadow-blue-500/25"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-md"
                        >
                            Close
                        </button>
                    )}
                </div>

                {/* Certificate Container */}
                <div
                    ref={certificateRef}
                    className="relative w-full bg-[#fdfbf7] text-gray-900 shadow-2xl overflow-hidden"
                    style={{ aspectRatio: '1.414/1' }} // Standard A4 landscape ratio
                >
                    {/* Ornamental Border */}
                    <div className="absolute inset-4 border-[3px] border-double border-yellow-600/40 rounded-sm"></div>
                    <div className="absolute inset-6 border border-gray-900/10 rounded-sm"></div>

                    {/* Corner Decorations */}
                    <div className="absolute top-8 left-8 w-24 h-24 border-t-4 border-l-4 border-yellow-600/60 rounded-tl-3xl"></div>
                    <div className="absolute top-8 right-8 w-24 h-24 border-t-4 border-r-4 border-yellow-600/60 rounded-tr-3xl"></div>
                    <div className="absolute bottom-8 left-8 w-24 h-24 border-b-4 border-l-4 border-yellow-600/60 rounded-bl-3xl"></div>
                    <div className="absolute bottom-8 right-8 w-24 h-24 border-b-4 border-r-4 border-yellow-600/60 rounded-br-3xl"></div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-16 text-center">
                        {/* Logo/Header */}
                        <div className="mb-8 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg text-white">
                                <Award className="w-8 h-8" />
                            </div>
                            <h1 className="text-4xl font-serif text-gray-900 tracking-wider">LUMINA AI LEARNING</h1>
                            <p className="text-sm text-gray-500 uppercase tracking-[0.3em] mt-2">Certificate of Completion</p>
                        </div>

                        {/* Body */}
                        <div className="space-y-6 max-w-3xl">
                            <p className="text-lg text-gray-600 font-light italic">This is to certify that</p>

                            <h2 className="text-5xl font-serif text-blue-900 py-4 border-b border-gray-200 inline-block min-w-[400px]">
                                {studentName}
                            </h2>

                            <p className="text-lg text-gray-600 font-light italic mt-6">
                                has successfully completed the course
                            </p>

                            <h3 className="text-3xl font-bold text-gray-800 mt-2">
                                {courseName}
                            </h3>

                            <p className="text-gray-500 mt-4 leading-relaxed max-w-2xl mx-auto">
                                Demonstrating dedication to learning and mastery of the fundamental concepts and practical applications taught within this curriculum.
                            </p>
                        </div>

                        {/* Footer / Signatures */}
                        <div className="absolute bottom-16 left-0 right-0 px-20 flex justify-between items-end">
                            <div className="text-center">
                                <div className="w-48 border-b border-gray-400 mb-2"></div>
                                <p className="font-serif text-lg text-gray-900">Dr. Sarah Connor</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Lead Instructor</p>
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 relative mb-4">
                                    {/* Seal Mockup */}
                                    <div className="absolute inset-0 bg-yellow-600/20 rounded-full flex items-center justify-center animate-pulse">
                                        <div className="w-20 h-20 border-2 border-yellow-600 rounded-full flex items-center justify-center">
                                            <Award className="w-10 h-10 text-yellow-700" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400">ID: {certificateId}</p>
                                <p className="text-xs text-gray-400">Date: {new Date(issueDate).toLocaleDateString()}</p>
                            </div>

                            <div className="text-center">
                                <div className="w-48 border-b border-gray-400 mb-2"></div>
                                <p className="font-serif text-lg text-gray-900">Lumina AI Platform</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Academic Director</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificate;
