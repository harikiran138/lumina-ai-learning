'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    BookOpen,
    Search,
    Filter,
    Clock,
    MoreVertical,
    PlayCircle,
    CheckCircle
} from 'lucide-react';

export default function StudentCourses() {
    const [activeTab, setActiveTab] = useState<'my_courses' | 'explore'>('my_courses');
    const [myCourses, setMyCourses] = useState<any[]>([]);
    const [exploreData, setExploreData] = useState<{ enrolled: any[], recommended: any[] }>({ enrolled: [], recommended: [] });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (activeTab === 'my_courses') {
                    const data = await api.getStudentCourses();
                    setMyCourses(data);
                } else {
                    const data = await api.getExploreCourses();
                    setExploreData(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    const handleEnroll = async (courseId: string) => {
        try {
            const res = await api.enrollInCourse(courseId);
            if (res.success) {
                // Refresh data
                const data = await api.getExploreCourses();
                setExploreData(data);
                alert("Enrolled successfully!");
            }
        } catch (e) {
            alert("Failed to enroll");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Learning Portal</h1>
                    <p className="text-gray-400">Manage your learning journey</p>
                </div>

                <div className="flex bg-white/5 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('my_courses')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'my_courses' ? 'bg-lumina-primary text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        My Courses
                    </button>
                    <button
                        onClick={() => setActiveTab('explore')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'explore' ? 'bg-lumina-primary text-black' : 'text-gray-400 hover:text-white'}`}
                    >
                        Explore Courses
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-primary"></div>
                </div>
            ) : (
                <>
                    {activeTab === 'my_courses' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myCourses.length > 0 ? myCourses.map((course) => (
                                <CourseCard key={course.id} course={course} isEnrolled={true} />
                            )) : (
                                <div className="col-span-full py-12 text-center text-gray-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p>You haven't enrolled in any courses yet.</p>
                                    <button onClick={() => setActiveTab('explore')} className="mt-4 text-lumina-primary hover:underline">Explore now</button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'explore' && (
                        <div className="space-y-12">
                            {exploreData.enrolled.length > 0 && (
                                <section>
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        Your Enrolled Courses
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {exploreData.enrolled.map(course => (
                                            <CourseCard key={course.id} course={course} isEnrolled={true} compact />
                                        ))}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-lumina-primary" />
                                    Recommended For You
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {exploreData.recommended.length > 0 ? exploreData.recommended.map(course => (
                                        <CourseCard key={course.id} course={course} isEnrolled={false} onEnroll={() => handleEnroll(course.id)} />
                                    )) : (
                                        <div className="col-span-full text-gray-500">No new courses available.</div>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function CourseCard({ course, isEnrolled, compact, onEnroll }: any) {
    return (
        <div className={`glass-card group hover:border-lumina-primary/30 transition-all duration-300 flex flex-col h-full ${compact ? 'p-0' : ''}`}>
            <div className={`${compact ? 'h-32' : 'h-48'} bg-gradient-to-br from-gray-800 to-gray-900 relative rounded-t-xl overflow-hidden`}>
                <img src={course.thumbnail || "/api/placeholder/400/320"} alt={course.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                {isEnrolled && (
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs text-white backdrop-blur-md border border-white/10">
                        Enrolled
                    </div>
                )}
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <h3 className={`${compact ? 'text-sm' : 'text-lg'} font-bold text-white mb-2 group-hover:text-lumina-primary transition-colors line-clamp-2`}>{course.name}</h3>
                {!compact && <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-1">{course.description}</p>}

                <div className="mt-auto pt-4 flex justify-between items-center">
                    {isEnrolled ? (
                        <Link href={`/student/courses/${course.id}`} className={`w-full text-center px-4 py-2 ${compact ? 'text-xs px-2 py-1' : ''} bg-white/5 hover:bg-lumina-primary hover:text-black border border-white/10 rounded-lg font-medium transition-all`}>
                            Continue
                        </Link>
                    ) : (
                        <button onClick={onEnroll} className="w-full px-4 py-2 bg-lumina-primary text-black hover:bg-lumina-secondary rounded-lg font-bold text-sm transition-all">
                            Enroll Now
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
