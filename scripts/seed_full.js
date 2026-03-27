// MongoDB Seeding Script - Extensive Data
// Run with: npx mongosh "YourConnectionStr" scripts/seed_full.js

db = db.getSiblingDB('test'); // Or 'lumina-db'

print('🚀 Starting Extensive Seeding...');

// 1. Clear existing data
const collections = ['users', 'courses', 'progress', 'community_channels', 'community_messages'];
collections.forEach(c => {
    try {
        db[c].drop();
        print(`   - Dropped ${c}`);
    } catch (e) { /* ignore */ }
});

// Helpers
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 2. Create Users
print('👤 Creating Users...');
const userDocs = [];

// Fixed Users
userDocs.push({
    _id: ObjectId(),
    name: 'Admin User',
    email: 'admin@lumina.com',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=C0392B&color=fff',
    createdAt: new Date().toISOString()
});

const teachers = [
    { name: 'Dr. Sarah Wilson', email: 'teacher@lumina.com' },
    { name: 'Prof. Alan Turing', email: 'alan@lumina.com' },
    { name: 'Dr. Marie Curie', email: 'marie@lumina.com' },
    { name: 'Dr. Richard Feynman', email: 'richard@lumina.com' }
];

teachers.forEach(t => {
    userDocs.push({
        _id: ObjectId(),
        name: t.name,
        email: t.email,
        password: 'teacher123',
        role: 'teacher',
        status: 'active',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=27AE60&color=fff`,
        createdAt: new Date().toISOString()
    });
});

// Random Students
const studentNames = ['Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Evan Wright', 'Fiona Green', 'George King', 'Hannah Montana', 'Ian Malcolm', 'Julia Child', 'Kevin Hart', 'Luna Lovegood', 'Miles Morales', 'Nancy Drew', 'Oscar Wilde', 'Peter Parker', 'Quinn Fabray', 'Rachel Green', 'Steve Rogers', 'Tony Stark'];

studentNames.forEach((name, i) => {
    userDocs.push({
        _id: ObjectId(),
        name: name,
        email: `student${i + 1}@lumina.com`, // student1@lumina.com
        password: 'student123',
        role: 'student',
        status: randomItem(['active', 'active', 'active', 'inactive']),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
        createdAt: new Date(Date.now() - randomInt(0, 10000000000)).toISOString()
    });
});
// Ensure specific main student exists
userDocs.push({
    _id: ObjectId(),
    name: 'Student User',
    email: 'student@lumina.com',
    password: 'student123',
    role: 'student',
    status: 'active',
    avatar: 'https://ui-avatars.com/api/?name=Student+User&background=0D8ABC&color=fff',
    createdAt: new Date().toISOString()
});

db.users.insertMany(userDocs);
const allUsers = db.users.find().toArray();
const teacherDocs = allUsers.filter(u => u.role === 'teacher');
const studentDocs = allUsers.filter(u => u.role === 'student');


// 3. Create Courses
print('📚 Creating Courses...');
const courseTemplates = [
    { id: 'qm_101', name: 'Quantum Mechanics I', desc: 'Introduction to Wave Functions.' },
    { id: 'bio_101', name: 'Advanced Biology', desc: 'Cellular processes and genetics.' },
    { id: 'ai_202', name: 'Artificial Intelligence', desc: 'Deep Learning fundamentals.' },
    { id: 'hist_101', name: 'World History', desc: 'A journey through time.' },
    { id: 'math_300', name: 'Calculus III', desc: 'Multivariable calculus.' },
    { id: 'cs_101', name: 'Intro to Programming', desc: 'Python for beginners.' },
    { id: 'art_200', name: 'Digital Art', desc: 'Creating art with code.' },
    { id: 'phy_202', name: 'Astrophysics', desc: 'Understanding the cosmos.' }
];

const courseDocs = courseTemplates.map(t => {
    const instructor = randomItem(teacherDocs);
    return {
        _id: ObjectId(),
        id: t.id,
        name: t.name,
        description: t.desc,
        thumbnail: `/images/course-${t.id.split('_')[0]}.jpg`,
        instructorId: instructor._id,
        instructorName: instructor.name,
        totalLessons: randomInt(10, 30),
        enrolledCount: randomInt(10, 500)
    };
});
db.courses.insertMany(courseDocs);


// 4. Create Progress
print('📈 Creating Progress...');
const progressDocs = [];

studentDocs.forEach(student => {
    // Enroll in 1-4 random courses
    const numCourses = randomInt(1, 4);
    const enrolledCourses = [];

    for (let i = 0; i < numCourses; i++) {
        const course = randomItem(courseDocs);
        if (enrolledCourses.includes(course.id)) continue;
        enrolledCourses.push(course.id);

        progressDocs.push({
            userId: student._id,
            courseId: course.id,
            progress: randomInt(0, 100),
            mastery: randomInt(60, 100),
            streak: randomInt(0, 50),
            lastAccessed: new Date(Date.now() - randomInt(0, 604800000)).toISOString()
        });
    }
});
db.progress.insertMany(progressDocs);


// 5. Create Community
print('💬 Creating Community Data...');
const channels = [
    { id: 'general', name: 'General', type: 'public', description: 'General discussion.' },
    { id: 'announcements', name: 'Announcements', type: 'public', description: 'News.' },
    { id: 'help', name: 'Help & Support', type: 'public', description: 'Get help.' },
    { id: 'random', name: 'Random', type: 'public', description: 'Fun chatter.' }
];
db.community_channels.insertMany(channels);

const messages = [];
const phrases = [
    "Does anyone have notes for the last lecture?",
    "When is the assignment due?",
    "Check out this cool resource I found!",
    "I'm stuck on problem 3, any tips?",
    "Good morning everyone!",
    "Has the grade been posted yet?",
    "This course has been amazing so far.",
    "Anyone want to form a study group?",
    "The professor is really good.",
    "I need coffee..."
];

for (let i = 0; i < 40; i++) {
    const user = randomItem(allUsers);
    messages.push({
        channelId: randomItem(channels).id,
        userId: user._id,
        userName: user.name,
        userAvatar: user.avatar,
        content: randomItem(phrases),
        likes: randomInt(0, 20),
        replies: randomInt(0, 5),
        createdAt: new Date(Date.now() - randomInt(0, 604800000)).toISOString()
    });
}
db.community_messages.insertMany(messages);

print('✅ Extensive Seeding Complete!');
print(`   - Users: ${allUsers.length}`);
print(`   - Courses: ${courseDocs.length}`);
print(`   - Progress Records: ${progressDocs.length}`);
print(`   - Messages: ${messages.length}`);
