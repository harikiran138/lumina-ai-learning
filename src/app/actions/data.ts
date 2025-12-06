'use server';

import {
    COLLECTIONS,
    getDocuments,
    getDocumentById,
    createDocument,
    updateDocument,
    findDocumentByField,
    countDocuments,
    where,
    orderBy,
    limit,
    increment,
    Timestamp
} from '@/lib/firebase';

// --- Student Actions ---

export async function getStudentDashboard(email: string) {
    try {
        // Get User
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return null;

        // Get Enrolled Courses with Progress
        const progressDocs = await getDocuments(
            COLLECTIONS.PROGRESS,
            [where('userId', '==', user.id)]
        );

        // Fetch course details for each progress
        const enrolledCourses = await Promise.all(
            progressDocs.map(async (progress: any) => {
                const course = await getDocumentById(COLLECTIONS.COURSES, progress.courseId);
                return {
                    id: course?.id || progress.courseId,
                    name: course?.name || 'Unknown Course',
                    description: course?.description || '',
                    thumbnail: course?.thumbnail || '',
                    progress: progress.progress || 0,
                    mastery: progress.mastery || 0,
                    streak: progress.streak || 0,
                    lastAccessed: progress.lastAccessed
                };
            })
        );

        // Calculate Streak  
        const currentStreak = Math.max(...enrolledCourses.map(c => c.streak || 0), 0);

        // Calculate Overall Mastery
        const avgMastery = enrolledCourses.length > 0
            ? Math.round(enrolledCourses.reduce((acc, curr) => acc + (curr.mastery || 0), 0) / enrolledCourses.length)
            : 0;

        return {
            currentStreak,
            enrolledCourses,
            overallMastery: avgMastery,
            recentActivity: []
        };
    } catch (e) {
        console.error('Error fetching student dashboard:', e);
        return null;
    }
}

export async function getEnrolledCourses(email: string) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return [];

        const progressDocs = await getDocuments(
            COLLECTIONS.PROGRESS,
            [where('userId', '==', user.id)]
        );

        const courses = await Promise.all(
            progressDocs.map(async (progress: any) => {
                const course = await getDocumentById(COLLECTIONS.COURSES, progress.courseId);
                return {
                    id: course?.id || progress.courseId,
                    name: course?.name || 'Unknown Course',
                    description: course?.description || '',
                    thumbnail: course?.thumbnail || '',
                    progress: progress.progress || 0,
                    mastery: progress.mastery || 0,
                    streak: progress.streak || 0,
                    lastAccessed: progress.lastAccessed
                };
            })
        );

        return courses;
    } catch (e) {
        console.error('Error fetching enrolled courses:', e);
        return [];
    }
}

export async function getAllCourses() {
    try {
        const courses = await getDocuments(
            COLLECTIONS.COURSES,
            [where('status', '==', 'Active')]
        );

        return courses.map((course: any) => ({
            id: course.id,
            name: course.name,
            description: course.description,
            thumbnail: course.thumbnail,
            level: course.level || 'Beginner',
            instructorId: course.instructorId || null,
            enrolledCount: course.enrolledCount || 0
        }));
    } catch (e) {
        console.error('Error fetching all courses:', e);
        return [];
    }
}

export async function enrollInCourse(email: string, courseId: string) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return { success: false, error: 'User not found' };

        // Check if already enrolled
        const existingProgress = await getDocuments(
            COLLECTIONS.PROGRESS,
            [
                where('userId', '==', user.id),
                where('courseId', '==', courseId),
                limit(1)
            ]
        );

        if (existingProgress.length > 0) {
            return { success: false, error: 'Already enrolled in this course' };
        }

        // Create Progress Record
        const newProgress = {
            userId: user.id,
            courseId: courseId,
            progress: 0,
            mastery: 0,
            streak: 0,
            lastAccessed: new Date(),
            enrolledAt: new Date()
        };

        await createDocument(COLLECTIONS.PROGRESS, newProgress);

        // Increment Course Enrolled Count
        const course = await getDocumentById(COLLECTIONS.COURSES, courseId);
        if (course) {
            await updateDocument(COLLECTIONS.COURSES, courseId, {
                enrolledCount: (course.enrolledCount || 0) + 1
            });
        }

        return { success: true };
    } catch (e) {
        console.error('Error enrolling in course:', e);
        return { success: false, error: 'Failed to enroll in course' };
    }
}

// --- Profile & Progress Actions ---

export async function getStudentProfile(email: string) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return null;

        return {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            joinedDate: user.createdAt,
            bio: user.bio || "Passionate learner on Lumina.",
            skills: user.skills || ['Learning', 'Growth'],
            location: user.location || 'Online',
            level: 5
        };
    } catch (e) {
        console.error("Error fetching profile", e);
        return null;
    }
}

export async function updateStudentProfile(email: string, data: any) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return { success: false, error: 'User not found' };

        const updateData: any = {
            name: data.name,
            username: data.username,
            phone: data.phone,
        };

        if (data.avatar) {
            updateData.avatar = data.avatar;
        }

        await updateDocument(COLLECTIONS.USERS, user.id, updateData);

        return { success: true };
    } catch (e) {
        console.error("Error updating profile", e);
        return { success: false, error: 'Failed to update profile' };
    }
}

export async function getStudentProgress(email: string) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return null;

        const progressDocs = await getDocuments(
            COLLECTIONS.PROGRESS,
            [where('userId', '==', user.id)]
        );

        const progressWithCourses = await Promise.all(
            progressDocs.map(async (progress: any) => {
                const course = await getDocumentById(COLLECTIONS.COURSES, progress.courseId);
                return {
                    courseName: course?.name || 'Unknown Course',
                    progress: progress.progress || 0,
                    mastery: progress.mastery || 0,
                    streak: progress.streak || 0,
                    lastAccessed: progress.lastAccessed
                };
            })
        );

        const totalCourses = progressWithCourses.length;
        const currentStreak = Math.max(...progressWithCourses.map(p => p.streak || 0), 0);
        const avgAccuracy = totalCourses > 0
            ? Math.round(progressWithCourses.reduce((acc, curr) => acc + (curr.mastery || 0), 0) / totalCourses)
            : 0;

        const totalXP = progressWithCourses.reduce((acc, curr) => acc + ((curr.progress || 0) * 10), 0);
        const weeklyActivity = [45, 60, 30, 90, 120, 60, 0];

        return {
            stats: {
                currentStreak,
                totalXP,
                avgAccuracy,
                level: Math.floor(totalXP / 1000) + 1,
                learningTime: 'Mock 48h'
            },
            weeklyActivity,
            recentCourses: progressWithCourses.sort((a, b) =>
                new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
            ).slice(0, 3)
        };
    } catch (e) {
        console.error("Error fetching progress", e);
        return null;
    }
}

// --- Community Actions ---

export async function getCommunityData(channelId: string = 'general') {
    try {
        const channels = await getDocuments(COLLECTIONS.COMMUNITY_CHANNELS);

        const messages = await getDocuments(
            COLLECTIONS.COMMUNITY_MESSAGES,
            [
                where('channelId', '==', channelId),
                orderBy('createdAt', 'asc'),
                limit(50)
            ]
        );

        return {
            channels: channels.map((c: any) => ({ ...c })),
            messages: messages.map((m: any) => ({ ...m }))
        };
    } catch (e) {
        console.error('Error fetching community data:', e);
        return { channels: [], messages: [] };
    }
}

// --- Teacher Actions ---

export async function getTeacherDashboard(email: string) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return null;

        const courses = await getDocuments(
            COLLECTIONS.COURSES,
            [where('instructorId', '==', user.id)]
        );

        const totalStudents = courses.reduce((acc, curr: any) => acc + (curr.enrolledCount || 0), 0);

        return {
            courses: courses.map((c: any) => ({
                id: c.id,
                name: c.name,
                enrolled: c.enrolledCount || 0,
                thumbnail: c.thumbnail
            })),
            totalStudents,
            activeCourses: courses.length,
            hoursTaught: 120,
            avgRating: 4.8
        };
    } catch (e) {
        console.error('Error fetching teacher dashboard:', e);
        return null;
    }
}

export async function getTeacherStudents(email: string) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return [];

        const courses = await getDocuments(
            COLLECTIONS.COURSES,
            [where('instructorId', '==', user.id)]
        );

        const courseIds = courses.map((c: any) => c.id);
        if (courseIds.length === 0) return [];

        // Get all progress documents for teacher's courses
        const allProgress = await getDocuments(COLLECTIONS.PROGRESS);
        const progressDocs = allProgress.filter((p: any) => courseIds.includes(p.courseId));

        const studentIds = [...new Set(progressDocs.map((p: any) => p.userId))];
        if (studentIds.length === 0) return [];

        // Get all students
        const allUsers = await getDocuments(COLLECTIONS.USERS);
        const students = allUsers.filter((u: any) => studentIds.includes(u.id));

        return students.map((student: any) => {
            const studentProgress = progressDocs.filter((p: any) => p.userId === student.id);
            const coursesTaken = courses.filter((c: any) =>
                studentProgress.some((p: any) => p.courseId === c.id)
            );

            const avgProgress = studentProgress.length > 0
                ? Math.round(studentProgress.reduce((acc, curr: any) => acc + (curr.progress || 0), 0) / studentProgress.length)
                : 0;

            const sorted = studentProgress.sort((a: any, b: any) =>
                new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
            );
            const lastActive = sorted[0]?.lastAccessed || student.createdAt;

            return {
                id: student.id,
                name: student.name,
                email: student.email,
                avatar: student.avatar,
                courses: coursesTaken.map((c: any) => c.name),
                progress: avgProgress,
                lastActive
            };
        });
    } catch (e) {
        console.error('Error fetching teacher students:', e);
        return [];
    }
}

export async function getTeacherCourses(email: string) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return [];

        const courses = await getDocuments(
            COLLECTIONS.COURSES,
            [where('instructorId', '==', user.id)]
        );

        return courses.map((course: any) => ({
            id: course.id,
            title: course.name,
            students: course.enrolledCount || 0,
            level: course.level || 'Beginner',
            status: course.status || 'Active',
            image: course.thumbnail || '/api/placeholder/600/400',
            lastUpdated: 'Recently'
        }));
    } catch (e) {
        console.error('Error fetching teacher courses:', e);
        return [];
    }
}

export async function createCourse(email: string, courseData: any) {
    try {
        const user = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!user) return { success: false, error: 'User not found' };

        const newCourse = {
            id: courseData.id,
            name: courseData.title,
            description: courseData.description,
            instructorId: user.id,
            thumbnail: courseData.image,
            level: courseData.level,
            status: 'Active',
            enrolledCount: 0,
            modules: [],
            createdAt: new Date(),
            ...courseData
        };

        await createDocument(COLLECTIONS.COURSES, newCourse, courseData.id);
        return { success: true };
    } catch (e) {
        console.error('Error creating course:', e);
        return { success: false, error: 'Failed to create course' };
    }
}

export async function inviteStudentToCourse(teacherEmail: string, studentEmail: string, courseId: string) {
    try {
        const teacher = await findDocumentByField(COLLECTIONS.USERS, 'email', teacherEmail);
        if (!teacher) return { success: false, error: 'Teacher not found' };

        const course = await getDocumentById(COLLECTIONS.COURSES, courseId);
        if (!course || course.instructorId !== teacher.id) {
            return { success: false, error: 'Course not found or access denied' };
        }

        const student = await findDocumentByField(COLLECTIONS.USERS, 'email', studentEmail);
        if (!student || student.role !== 'student') {
            return { success: false, error: 'Student not found with this email' };
        }

        // Check if already enrolled
        const existingProgress = await getDocuments(
            COLLECTIONS.PROGRESS,
            [
                where('userId', '==', student.id),
                where('courseId', '==', courseId),
                limit(1)
            ]
        );

        if (existingProgress.length > 0) {
            return { success: false, error: 'Student is already enrolled in this course' };
        }

        // Create Progress Record
        const newProgress = {
            userId: student.id,
            courseId: courseId,
            progress: 0,
            mastery: 0,
            streak: 0,
            lastAccessed: new Date(),
            enrolledAt: new Date(),
            invitedBy: teacher.id
        };

        await createDocument(COLLECTIONS.PROGRESS, newProgress);

        // Increment Course Enrolled Count
        await updateDocument(COLLECTIONS.COURSES, courseId, {
            enrolledCount: (course.enrolledCount || 0) + 1
        });

        return { success: true, message: `Successfully added ${student.name} to the course.` };
    } catch (e) {
        console.error('Error inviting student:', e);
        return { success: false, error: 'Failed to invite student' };
    }
}

export async function addModule(email: string, courseId: string, moduleTitle: string) {
    try {
        const teacher = await findDocumentByField(COLLECTIONS.USERS, 'email', email);
        if (!teacher) return { success: false, error: 'Teacher not found' };

        const course = await getDocumentById(COLLECTIONS.COURSES, courseId);
        if (!course || course.instructorId !== teacher.id) {
            return { success: false, error: 'Course not found or access denied' };
        }

        const newModule = {
            id: Date.now().toString(),
            title: moduleTitle,
            duration: '0 min',
            lessons: []
        };

        const currentModules = course.modules || [];
        await updateDocument(COLLECTIONS.COURSES, courseId, {
            modules: [...currentModules, newModule]
        });

        return { success: true, message: 'Module added successfully' };
    } catch (e) {
        console.error('Error adding module:', e);
        return { success: false, error: 'Failed to add module' };
    }
}

export async function addLesson(email: string, courseId: string, moduleId: string, lessonTitle: string) {
    try {
        const course = await getDocumentById(COLLECTIONS.COURSES, courseId);
        if (!course) return { success: false, error: 'Course not found' };

        const newLesson = {
            id: Date.now().toString(),
            title: lessonTitle,
            type: 'video',
            duration: '10 min',
            completed: false
        };

        const modules = course.modules || [];
        const updatedModules = modules.map((module: any) => {
            if (module.id === moduleId) {
                return {
                    ...module,
                    lessons: [...(module.lessons || []), newLesson]
                };
            }
            return module;
        });

        await updateDocument(COLLECTIONS.COURSES, courseId, {
            modules: updatedModules
        });

        return { success: true, message: 'Lesson added successfully' };
    } catch (e) {
        console.error('Error adding lesson:', e);
        return { success: false, error: 'Failed to add lesson' };
    }
}

// --- Admin Actions ---

export async function getAdminDashboard(email: string) {
    try {
        const usersCount = await countDocuments(COLLECTIONS.USERS);
        const coursesCount = await countDocuments(COLLECTIONS.COURSES);

        return {
            totalUsers: usersCount,
            totalCourses: coursesCount,
            systemHealth: '98%',
            securityAlerts: 0
        };
    } catch (e) {
        console.error('Error fetching admin dashboard:', e);
        return null;
    }
}

export async function getUsersForAdmin() {
    try {
        const users = await getDocuments(COLLECTIONS.USERS);

        return users.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            createdAt: user.createdAt,
            avatar: user.avatar
        }));
    } catch (e) {
        console.error('Error fetching users for admin:', e);
        return [];
    }
}

export async function getCourseDetails(courseId: string) {
    try {
        const course = await getDocumentById(COLLECTIONS.COURSES, courseId);
        if (!course) return null;

        return {
            id: course.id,
            name: course.name,
            description: course.description,
            thumbnail: course.thumbnail,
            instructorId: course.instructorId || null,
            expandedDescription: course.expandedDescription || "No detailed description available.",
            modules: course.modules || [],
            rating: 4.8,
            students: course.enrolledCount || 120,
            duration: '8 weeks'
        };
    } catch (e) {
        console.error('Error fetching course details:', e);
        return null;
    }
}
