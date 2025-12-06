'use server';

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const DB_NAME = 'test';

// --- Student Actions ---

export async function getStudentDashboard(email: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Get User
        const user = await db.collection('users').findOne({ email });
        if (!user) return null;

        // Get Enrolled Courses (via Progress) with Course Details
        const progressDocs = await db.collection('progress').aggregate([
            { $match: { userId: user._id } },
            {
                $lookup: {
                    from: 'courses',
                    let: { courseId: '$courseId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$id', '$$courseId'] } } }
                    ],
                    as: 'courseDetails'
                }
            },
            { $unwind: { path: '$courseDetails', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    id: '$courseDetails.id',
                    name: '$courseDetails.name',
                    description: '$courseDetails.description',
                    thumbnail: '$courseDetails.thumbnail',
                    progress: '$progress',
                    mastery: '$mastery',
                    streak: '$streak',
                    lastAccessed: '$lastAccessed',
                    courseIdRef: '$courseId' // Return original ID to debug
                }
            }
        ]).toArray();

        // Calculate Streak (Max streak from progress)
        const currentStreak = progressDocs.reduce((acc, curr) => Math.max(acc, curr.streak || 0), 0);

        // Calculate Overall Mastery
        const avgMastery = progressDocs.length > 0
            ? Math.round(progressDocs.reduce((acc, curr) => acc + (curr.mastery || 0), 0) / progressDocs.length)
            : 0;

        return {
            currentStreak,
            enrolledCourses: progressDocs,
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
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const user = await db.collection('users').findOne({ email });
        if (!user) return [];

        // Aggregate Progress with Course Details
        const courses = await db.collection('progress').aggregate([
            { $match: { userId: user._id } },
            {
                $lookup: {
                    from: 'courses',
                    let: { courseId: '$courseId' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$id', '$$courseId'] } } }
                    ],
                    as: 'courseDetails'
                }
            },
            { $unwind: '$courseDetails' },
            {
                $project: {
                    _id: 0,
                    id: '$courseDetails.id',
                    name: '$courseDetails.name',
                    description: '$courseDetails.description',
                    thumbnail: '$courseDetails.thumbnail',
                    progress: '$progress',
                    mastery: '$mastery',
                    streak: '$streak',
                    lastAccessed: '$lastAccessed'
                }
            }
        ]).toArray();

        return courses;

    } catch (e) {
        console.error('Error fetching enrolled courses:', e);
        return [];
    }
}


export async function getAllCourses() {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const courses = await db.collection('courses').find({ status: 'Active' }).toArray();

        return courses.map(course => ({
            id: course.id,
            name: course.name,
            description: course.description,
            thumbnail: course.thumbnail,
            level: course.level || 'Beginner',
            instructorId: course.instructorId ? course.instructorId.toString() : null, // Fix: Convert ObjectId to string
            enrolledCount: course.enrolledCount || 0
        }));
    } catch (e) {
        console.error('Error fetching all courses:', e);
        return [];
    }
}

export async function enrollInCourse(email: string, courseId: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const user = await db.collection('users').findOne({ email });
        if (!user) return { success: false, error: 'User not found' };

        // Check if already enrolled
        const existingProgress = await db.collection('progress').findOne({
            userId: user._id,
            courseId: courseId
        });

        if (existingProgress) {
            return { success: false, error: 'Already enrolled in this course' };
        }

        // Create Progress Record
        const newProgress = {
            userId: user._id,
            courseId: courseId,
            progress: 0,
            mastery: 0, // Initial mastery
            streak: 0,
            lastAccessed: new Date(),
            enrolledAt: new Date()
        };

        await db.collection('progress').insertOne(newProgress);

        // Increment Course Enrolled Count
        await db.collection('courses').updateOne(
            { id: courseId },
            { $inc: { enrolledCount: 1 } }
        );

        return { success: true };

    } catch (e) {
        console.error('Error enrolling in course:', e);
        return { success: false, error: 'Failed to enroll in course' };
    }
}

// --- Profile & Progress Actions ---

export async function getStudentProfile(email: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const user = await db.collection('users').findOne({ email });
        if (!user) return null;

        return {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            joinedDate: user.createdAt,
            // Mock extended fields if missing
            bio: user.bio || "Passionate learner on Lumina.",
            skills: user.skills || ['Learning', 'Growth'],
            location: user.location || 'Online',
            level: 5 // Calculate based on XP/Progress later
        };
    } catch (e) {
        console.error("Error fetching profile", e);
        return null;
    }
}

export async function updateStudentProfile(email: string, data: any) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const updateData: any = {
            name: data.name,
            username: data.username, // New field
            phone: data.phone,       // New field
            // Don't update email for now as it identifies the user
            // email: data.email 
        };

        // Only update avatar if provided (and not empty)
        if (data.avatar) {
            updateData.avatar = data.avatar;
        }

        await db.collection('users').updateOne(
            { email },
            { $set: updateData }
        );

        return { success: true };
    } catch (e) {
        console.error("Error updating profile", e);
        return { success: false, error: 'Failed to update profile' };
    }
}

export async function getStudentProgress(email: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const user = await db.collection('users').findOne({ email });
        if (!user) return null;

        const progressDocs = await db.collection('progress').aggregate([
            { $match: { userId: user._id } },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: 'id',
                    as: 'courseDetails'
                }
            },
            { $unwind: '$courseDetails' },
            {
                $project: {
                    _id: 0,
                    courseName: '$courseDetails.name',
                    progress: '$progress',
                    mastery: '$mastery',
                    streak: '$streak',
                    lastAccessed: '$lastAccessed'
                }
            }
        ]).toArray();

        // Calculate Stats
        const totalCourses = progressDocs.length;
        const currentStreak = progressDocs.reduce((acc, curr) => Math.max(acc, curr.streak || 0), 0);
        const avgAccuracy = totalCourses > 0
            ? Math.round(progressDocs.reduce((acc, curr) => acc + (curr.mastery || 0), 0) / totalCourses)
            : 0;

        // Mock XP based on progress
        const totalXP = progressDocs.reduce((acc, curr) => acc + ((curr.progress || 0) * 10), 0);

        // Mock Weekly Activity (Random for now)
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
            recentCourses: progressDocs.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()).slice(0, 3)
        };

    } catch (e) {
        console.error("Error fetching progress", e);
        return null;
    }
}

// --- Community Actions ---

export async function getCommunityData(channelId: string = 'general') {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Get Channels
        const channels = await db.collection('community_channels').find({}).toArray();

        // Get Messages for active channel
        const messages = await db.collection('community_messages')
            .find({ channelId })
            .sort({ createdAt: 1 })
            .limit(50)
            .toArray();

        // Transform _id to string for client
        return {
            channels: channels.map(c => ({ ...c, _id: c._id.toString() })),
            messages: messages.map(m => ({
                ...m,
                _id: m._id.toString(),
                userId: m.userId.toString()
            }))
        };

    } catch (e) {
        console.error('Error fetching community data:', e);
        return { channels: [], messages: [] };
    }
}

// --- Teacher Actions ---

export async function getTeacherDashboard(email: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const user = await db.collection('users').findOne({ email });
        if (!user) return null;

        // Get Courses taught by this teacher
        const courses = await db.collection('courses').find({ instructorId: user._id }).toArray();

        // Calculate Total Students (Sum of enrolledCount)
        const totalStudents = courses.reduce((acc, curr) => acc + (curr.enrolledCount || 0), 0);

        return {
            courses: courses.map(c => ({
                id: c.id,
                name: c.name,
                enrolled: c.enrolledCount,
                thumbnail: c.thumbnail
            })),
            totalStudents,
            activeCourses: courses.length,
            // Mock other stats for now
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
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const user = await db.collection('users').findOne({ email });
        if (!user) return [];

        const courses = await db.collection('courses').find({ instructorId: user._id }).toArray();
        const courseIds = courses.map(c => c.id);

        if (courseIds.length === 0) return [];

        const progressDocs = await db.collection('progress').find({ courseId: { $in: courseIds } }).toArray();
        const studentIds = [...new Set(progressDocs.map(p => p.userId))];

        if (studentIds.length === 0) return [];

        const students = await db.collection('users').find({ _id: { $in: studentIds } }).toArray();

        return students.map(student => {
            const studentProgress = progressDocs.filter(p => p.userId.toString() === student._id.toString());
            const coursesTaken = courses.filter(c => studentProgress.some(p => p.courseId === c.id));

            const avgProgress = studentProgress.length > 0
                ? Math.round(studentProgress.reduce((acc, curr) => acc + (curr.progress || 0), 0) / studentProgress.length)
                : 0;

            const lastActive = studentProgress.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())[0]?.lastAccessed;

            return {
                id: student._id.toString(),
                name: student.name,
                email: student.email,
                avatar: student.avatar,
                courses: coursesTaken.map(c => c.name),
                progress: avgProgress,
                lastActive: lastActive || student.createdAt
            };
        });

    } catch (e) {
        console.error('Error fetching teacher students:', e);
        return [];
    }
}


export async function getTeacherCourses(email: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const user = await db.collection('users').findOne({ email });
        if (!user) return [];

        const courses = await db.collection('courses').find({ instructorId: user._id }).toArray();

        // Calculate student counts dynamically if needed, or rely on enrolledCount
        return courses.map(course => ({
            id: course.id,
            title: course.name,
            students: course.enrolledCount || 0,
            level: course.level || 'Beginner',
            status: course.status || 'Active',
            image: course.thumbnail || '/api/placeholder/600/400',
            lastUpdated: 'Recently' // You might want to store updatedAt in DB
        }));
    } catch (e) {
        console.error('Error fetching teacher courses:', e);
        return [];
    }
}

export async function createCourse(email: string, courseData: any) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const user = await db.collection('users').findOne({ email });
        if (!user) return { success: false, error: 'User not found' };

        const newCourse = {
            id: courseData.id, // Should be unique (slug)
            name: courseData.title,
            description: courseData.description,
            instructorId: user._id,
            thumbnail: courseData.image,
            level: courseData.level,
            status: 'Active',
            enrolledCount: 0,
            modules: [], // Start empty
            createdAt: new Date(),
            ...courseData
        };

        await db.collection('courses').insertOne(newCourse);
        return { success: true };
    } catch (e) {
        console.error('Error creating course:', e);
        return { success: false, error: 'Failed to create course' };
    }
}

export async function inviteStudentToCourse(teacherEmail: string, studentEmail: string, courseId: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const teacher = await db.collection('users').findOne({ email: teacherEmail });
        if (!teacher) return { success: false, error: 'Teacher not found' };

        // Verify Course Ownership
        const course = await db.collection('courses').findOne({ id: courseId, instructorId: teacher._id });
        if (!course) return { success: false, error: 'Course not found or access denied' };

        // Find Student
        const student = await db.collection('users').findOne({ email: studentEmail, role: 'student' });
        if (!student) return { success: false, error: 'Student not found with this email' };

        // Check if already enrolled
        const existingProgress = await db.collection('progress').findOne({
            userId: student._id,
            courseId: courseId
        });

        if (existingProgress) {
            return { success: false, error: 'Student is already enrolled in this course' };
        }

        // Create Progress Record (Enrollment)
        const newProgress = {
            userId: student._id,
            courseId: courseId,
            progress: 0,
            mastery: 0,
            streak: 0,
            lastAccessed: new Date(),
            enrolledAt: new Date(),
            invitedBy: teacher._id
        };

        await db.collection('progress').insertOne(newProgress);

        // Increment Course Enrolled Count
        await db.collection('courses').updateOne(
            { id: courseId },
            { $inc: { enrolledCount: 1 } }
        );

        return { success: true, message: `Successfully added ${student.name} to the course.` };

    } catch (e) {
        console.error('Error inviting student:', e);
        return { success: false, error: 'Failed to invite student' };

    }
}

export async function addModule(email: string, courseId: string, moduleTitle: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const teacher = await db.collection('users').findOne({ email });
        if (!teacher) return { success: false, error: 'Teacher not found' };

        // Verify Ownership
        const course = await db.collection('courses').findOne({ id: courseId, instructorId: teacher._id });
        if (!course) return { success: false, error: 'Course not found or access denied' };

        const newModule = {
            id: new ObjectId().toString(),
            title: moduleTitle,
            duration: '0 min', // Calculated from lessons
            lessons: []
        };

        await db.collection('courses').updateOne(
            { id: courseId },
            { $push: { modules: newModule } as any }
        );

        return { success: true, message: 'Module added successfully' };
    } catch (e) {
        console.error('Error adding module:', e);
        return { success: false, error: 'Failed to add module' };
    }
}

export async function addLesson(email: string, courseId: string, moduleId: string, lessonTitle: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        // Security check omitted for brevity but should exist (teacher check)

        const newLesson = {
            id: new ObjectId().toString(),
            title: lessonTitle,
            type: 'video', // Default
            duration: '10 min', // Mock
            completed: false
        };

        // Note: Updating nested arrays deeply is tricky. For simplicity, we match by courseId.
        // In production, we'd be more precise with array filters.
        await db.collection('courses').updateOne(
            { id: courseId, "modules.id": moduleId },
            { $push: { "modules.$.lessons": newLesson } as any }
        );

        return { success: true, message: 'Lesson added successfully' };

    } catch (e) {
        console.error('Error adding lesson:', e);
        return { success: false, error: 'Failed to add lesson' };
    }
}


// --- Admin Actions ---

export async function getAdminDashboard(email: string) {
    try {
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const usersCount = await db.collection('users').countDocuments();
        const coursesCount = await db.collection('courses').countDocuments();
        // Mock revenue/system health
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
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const users = await db.collection('users').find({}).toArray();

        return users.map(user => ({
            id: user._id.toString(),
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
        const client = await clientPromise;
        const db = client.db(DB_NAME);

        const course = await db.collection('courses').findOne({ id: courseId });
        if (!course) return null;

        // Ensure serialized return
        return {
            id: course.id,
            name: course.name,
            description: course.description,
            thumbnail: course.thumbnail,
            instructorId: course.instructorId ? course.instructorId.toString() : null,
            expandedDescription: course.expandedDescription || "No detailed description available.",
            modules: course.modules || [],
            // Mock dynamic stats if missing
            rating: 4.8,
            students: course.enrolledCount || 120,
            duration: '8 weeks'
        };
    } catch (e) {
        console.error('Error fetching course details:', e);
        return null;
    }
}
