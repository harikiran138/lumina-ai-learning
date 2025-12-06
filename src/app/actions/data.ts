'use server';

import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// --- Student Actions ---

export async function getStudentDashboard(email: string) {
    try {
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
        if (!user) return null;

        const userId = user._id.toString();

        // Get Enrolled Courses with Progress
        const enrolledCourses = await db.collection("progress").aggregate([
            { $match: { userId: userId } },
            {
                $lookup: {
                    from: "courses",
                    let: { courseId: { $toObjectId: "$courseId" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$courseId"] } } }
                    ],
                    as: "courseDetails"
                }
            },
            { $unwind: "$courseDetails" },
            {
                $project: {
                    id: "$courseDetails._id",
                    name: "$courseDetails.name",
                    description: "$courseDetails.description",
                    thumbnail: "$courseDetails.thumbnail",
                    progress: "$progress",
                    mastery: "$mastery",
                    streak: "$streak",
                    lastAccessed: "$lastAccessed"
                }
            }
        ]).toArray();

        // Calculate Streak
        const currentStreak = Math.max(...enrolledCourses.map((c: any) => c.streak || 0), 0);

        // Calculate Overall Mastery
        const avgMastery = enrolledCourses.length > 0
            ? Math.round(enrolledCourses.reduce((acc: number, curr: any) => acc + (curr.mastery || 0), 0) / enrolledCourses.length)
            : 0;

        // Calculate Total Hours
        const totalHours = enrolledCourses.reduce((acc: number, curr: any) => acc + (curr.hoursSpent || 0), 0);

        return {
            currentStreak,
            enrolledCourses: enrolledCourses.map((c: any) => ({ ...c, id: c.id.toString() })),
            overallMastery: avgMastery,
            totalHours, // Return total hours
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
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
        if (!user) return [];

        const courses = await db.collection("progress").aggregate([
            { $match: { userId: user._id.toString() } },
            {
                $lookup: {
                    from: "courses",
                    let: { courseId: { $toObjectId: "$courseId" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$courseId"] } } }
                    ],
                    as: "courseDetails"
                }
            },
            { $unwind: "$courseDetails" },
            {
                $project: {
                    id: "$courseDetails._id",
                    name: "$courseDetails.name",
                    description: "$courseDetails.description",
                    thumbnail: "$courseDetails.thumbnail",
                    progress: "$progress",
                    mastery: "$mastery",
                    streak: "$streak",
                    lastAccessed: "$lastAccessed"
                }
            }
        ]).toArray();

        return courses.map((c: any) => ({ ...c, id: c.id.toString() }));
    } catch (e) {
        console.error('Error fetching enrolled courses:', e);
        return [];
    }
}

export async function getAllCourses() {
    try {
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const courses = await db.collection("courses").find({ status: 'Active' }).toArray();

        return courses.map(course => ({
            id: course._id.toString(),
            name: course.name,
            description: course.description,
            thumbnail: course.thumbnail,
            level: course.level || 'Beginner',
            instructorId: course.instructorId,
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
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
        if (!user) return { success: false, error: 'User not found' };

        // Check if already enrolled
        const existingProgress = await db.collection("progress").findOne({
            userId: user._id.toString(),
            courseId: courseId
        });

        if (existingProgress) {
            return { success: false, error: 'Already enrolled in this course' };
        }

        // Create Progress Record
        const newProgress = {
            userId: user._id.toString(),
            courseId: courseId,
            progress: 0,
            mastery: 0,
            streak: 0,
            lastAccessed: new Date(),
            enrolledAt: new Date()
        };

        await db.collection("progress").insertOne(newProgress);

        // Increment Course Enrolled Count
        await db.collection("courses").updateOne(
            { _id: new ObjectId(courseId) },
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
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
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
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const updateData: any = {
            name: data.name,
            username: data.username,
            phone: data.phone,
        };

        if (data.avatar) {
            updateData.avatar = data.avatar;
        }

        await db.collection("users").updateOne(
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
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
        if (!user) return null;

        const progressWithCourses = await db.collection("progress").aggregate([
            { $match: { userId: user._id.toString() } },
            {
                $lookup: {
                    from: "courses",
                    let: { courseId: { $toObjectId: "$courseId" } },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$courseId"] } } }
                    ],
                    as: "courseDetails"
                }
            },
            { $unwind: "$courseDetails" },
            {
                $project: {
                    courseName: "$courseDetails.name",
                    progress: "$progress",
                    mastery: "$mastery",
                    streak: "$streak",
                    lastAccessed: "$lastAccessed"
                }
            }
        ]).toArray();

        const totalCourses = progressWithCourses.length;
        const currentStreak = Math.max(...progressWithCourses.map((p: any) => p.streak || 0), 0);
        const avgAccuracy = totalCourses > 0
            ? Math.round(progressWithCourses.reduce((acc: number, curr: any) => acc + (curr.mastery || 0), 0) / totalCourses)
            : 0;

        const totalXP = progressWithCourses.reduce((acc: number, curr: any) => acc + ((curr.progress || 0) * 10), 0);
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
            recentCourses: progressWithCourses.sort((a: any, b: any) =>
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
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const channels = await db.collection("community_channels").find().toArray();

        const messages = await db.collection("community_messages")
            .find({ channelId })
            .sort({ createdAt: 1 })
            .limit(50)
            .toArray();

        return {
            channels: channels.map(c => ({ ...c, id: c._id.toString() })),
            messages: messages.map(m => ({ ...m, id: m._id.toString() }))
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
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
        if (!user) return null;

        const courses = await db.collection("courses").find({ instructorId: user._id.toString() }).toArray();
        const totalStudents = courses.reduce((acc, curr) => acc + (curr.enrolledCount || 0), 0);

        return {
            courses: courses.map(c => ({
                id: c._id.toString(),
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
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
        if (!user) return [];

        const courses = await db.collection("courses").find({ instructorId: user._id.toString() }).toArray();
        const courseIds = courses.map(c => c._id.toString());

        if (courseIds.length === 0) return [];

        const progressDocs = await db.collection("progress").find({
            courseId: { $in: courseIds }
        }).toArray();

        const studentIds = [...new Set(progressDocs.map(p => p.userId))];
        if (studentIds.length === 0) return [];

        // Convert string IDs to ObjectIds for $in query if they are stored as ObjectIds in users collection
        // Assuming users store _id as ObjectId
        const studentObjectIds = studentIds.map(id => new ObjectId(id));
        const students = await db.collection("users").find({ _id: { $in: studentObjectIds } }).toArray();

        return students.map(student => {
            const studentId = student._id.toString();
            const studentProgress = progressDocs.filter(p => p.userId === studentId);
            const coursesTaken = courses.filter(c =>
                studentProgress.some(p => p.courseId === c._id.toString())
            );

            const avgProgress = studentProgress.length > 0
                ? Math.round(studentProgress.reduce((acc, curr) => acc + (curr.progress || 0), 0) / studentProgress.length)
                : 0;

            const sorted = studentProgress.sort((a, b) =>
                new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
            );
            const lastActive = sorted[0]?.lastAccessed || student.createdAt;

            return {
                id: studentId,
                name: student.name,
                email: student.email,
                avatar: student.avatar,
                courses: coursesTaken.map(c => c.name),
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
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
        if (!user) return [];

        const courses = await db.collection("courses").find({ instructorId: user._id.toString() }).toArray();

        return courses.map(course => ({
            id: course._id.toString(),
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
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const user = await db.collection("users").findOne({ email });
        if (!user) return { success: false, error: 'User not found' };

        const newCourse = {
            name: courseData.title,
            description: courseData.description,
            instructorId: user._id.toString(),
            thumbnail: courseData.image,
            level: courseData.level,
            status: 'Active',
            enrolledCount: 0,
            modules: [],
            createdAt: new Date(),
            ...courseData
        };
        // Remove id if present to let Mongodb generate _id
        delete newCourse.id;

        await db.collection("courses").insertOne(newCourse);
        return { success: true };
    } catch (e) {
        console.error('Error creating course:', e);
        return { success: false, error: 'Failed to create course' };
    }
}

export async function inviteStudentToCourse(teacherEmail: string, studentEmail: string, courseId: string) {
    try {
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const teacher = await db.collection("users").findOne({ email: teacherEmail });
        if (!teacher) return { success: false, error: 'Teacher not found' };

        const course = await db.collection("courses").findOne({ _id: new ObjectId(courseId) });
        if (!course || course.instructorId !== teacher._id.toString()) {
            return { success: false, error: 'Course not found or access denied' };
        }

        const student = await db.collection("users").findOne({ email: studentEmail });
        if (!student || student.role !== 'student') {
            return { success: false, error: 'Student not found with this email' };
        }

        // Check enrollment
        const existingProgress = await db.collection("progress").findOne({
            userId: student._id.toString(),
            courseId: courseId
        });

        if (existingProgress) {
            return { success: false, error: 'Student is already enrolled' };
        }

        const newProgress = {
            userId: student._id.toString(),
            courseId: courseId,
            progress: 0,
            mastery: 0,
            streak: 0,
            lastAccessed: new Date(),
            enrolledAt: new Date(),
            invitedBy: teacher._id.toString()
        };

        await db.collection("progress").insertOne(newProgress);

        await db.collection("courses").updateOne(
            { _id: new ObjectId(courseId) },
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
        const db = client.db("lumina-database");

        const teacher = await db.collection("users").findOne({ email });
        if (!teacher) return { success: false, error: 'Teacher not found' };

        const newModule = {
            id: Date.now().toString(),
            title: moduleTitle,
            duration: '0 min',
            lessons: []
        };

        const result = await db.collection("courses").updateOne(
            { _id: new ObjectId(courseId), instructorId: teacher._id.toString() },
            { $push: { modules: newModule } } as any
        );

        if (result.modifiedCount === 0) {
            return { success: false, error: 'Course not found or access denied' };
        }

        return { success: true, message: 'Module added successfully' };
    } catch (e) {
        console.error('Error adding module:', e);
        return { success: false, error: 'Failed to add module' };
    }
}

export async function addLesson(email: string, courseId: string, moduleId: string, lessonTitle: string) {
    try {
        const client = await clientPromise;
        const db = client.db("lumina-database");

        const newLesson = {
            id: Date.now().toString(),
            title: lessonTitle,
            type: 'video',
            duration: '10 min',
            completed: false
        };

        // Aggregation-style update isn't needed if we trust the structure, but we need to find the specific module in the array
        // simpler to pull, update, push? No, use arrayFilters

        const result = await db.collection("courses").updateOne(
            { _id: new ObjectId(courseId), "modules.id": moduleId },
            { $push: { "modules.$.lessons": newLesson } } as any
        );

        if (result.modifiedCount === 0) {
            return { success: false, error: 'Course/Module not found' };
        }

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
        const db = client.db("lumina-database");

        const usersCount = await db.collection("users").countDocuments();
        const coursesCount = await db.collection("courses").countDocuments();

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
        const db = client.db("lumina-database");

        const users = await db.collection("users").find().toArray();

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
        const db = client.db("lumina-database");

        const course = await db.collection("courses").findOne({ _id: new ObjectId(courseId) });
        if (!course) return null;

        return {
            id: course._id.toString(),
            name: course.name,
            description: course.description,
            thumbnail: course.thumbnail,
            instructorId: course.instructorId,
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
