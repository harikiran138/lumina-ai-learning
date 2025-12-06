'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BookOpen, Clock, Users, Star, PlayCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CourseDetails() {
    const params = useParams();
    const courseId = params.courseId as string;
    const [course, setCourse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            if (courseId) {
                const data = await api.getCourseDetails(courseId);
                setCourse(data);
            }
            setIsLoading(false);
        };
        fetchCourse();
    }, [courseId]);

    if (isLoading) return <div className="text-white text-center p-20">Loading course details...</div>;
    if (!course) return <div className="text-white text-center p-20">Course not found.</div>;

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden glass-card">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10"></div>
                <img src={course.thumbnail || "/api/placeholder/1200/400"} alt={course.name} className="w-full h-80 object-cover" />

                <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                    <span className="px-3 py-1 bg-lumina-primary text-black text-xs font-bold rounded-full w-fit mb-4">
                        COURSE
                    </span>
                    <h1 className="text-4xl font-bold text-white mb-2">{course.name}</h1>
                    <p className="text-xl text-gray-200 mb-6 max-w-2xl">{course.description}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-white font-medium">{course.rating}</span>
                            <span>(1.2k reviews)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{course.students} Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">About This Course</h2>
                        <p className="text-gray-300 leading-relaxed">
                            {course.expandedDescription}
                        </p>
                    </div>

                    <div className="glass-card p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Course Content</h2>
                        <div className="space-y-4">
                            {course.modules && course.modules.length > 0 ? (
                                course.modules.map((module: any, i: number) => (
                                    <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                                        <div className="p-4 bg-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-lumina-primary/20 flex items-center justify-center text-lumina-primary font-bold text-sm">
                                                    {i + 1}
                                                </div>
                                                <h3 className="font-medium text-white">{module.title}</h3>
                                            </div>
                                            <span className="text-xs text-gray-400">{module.duration}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 italic">No modules available yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6 sticky top-24">
                        <div className="text-3xl font-bold text-white mb-2">Free</div>
                        <p className="text-gray-400 text-sm mb-6">Full lifetime access</p>

                        <button className="w-full py-4 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary transition-colors shadow-lg shadow-lumina-primary/20 mb-4 flex items-center justify-center gap-2">
                            <PlayCircle className="w-5 h-5" />
                            Start Learning Now
                        </button>

                        <div className="space-y-4 pt-6 border-t border-white/10">
                            <h4 className="font-medium text-white">This course includes:</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>24 hours on-demand video</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>12 downloadable resources</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Mobile and TV access</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Certificate of completion</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
