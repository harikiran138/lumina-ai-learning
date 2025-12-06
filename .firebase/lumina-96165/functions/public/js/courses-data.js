/**
 * Lumina Courses Database
 * Comprehensive course catalog with detailed metadata
 */

const COURSES_DATABASE = {
    // ===== MATHEMATICS =====
    math_calculus_1: {
        id: 'math_calculus_1',
        name: 'Calculus I: Limits & Derivatives',
        category: 'Mathematics',
        subcategory: 'Calculus',
        description: 'Master the fundamentals of calculus including limits, continuity, derivatives, and their applications.',
        instructor: {
            id: 'teacher_001',
            name: 'Prof. Sarah Mitchell',
            email: 'sarah.mitchell@lumina.edu',
            avatar: 'SM',
            bio: 'PhD in Mathematics, 15+ years teaching experience',
            rating: 4.9
        },
        level: 'Beginner',
        duration: '12 weeks',
        rating: 4.8,
        reviews: 324,
        students: 2156,
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1577720643272-265b434e3884?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1577720643272-265b434e3884?w=150&h=150&fit=crop',
        tags: ['calculus', 'derivatives', 'limits', 'mathematics', 'college'],
        objectives: [
            'Understand the concept of limits and continuity',
            'Master derivatives and differentiation rules',
            'Apply derivatives to real-world problems',
            'Learn optimization and related rates'
        ],
        modules: [
            { id: 1, title: 'Limits and Continuity', lessons: 5 },
            { id: 2, title: 'Derivatives', lessons: 8 },
            { id: 3, title: 'Applications of Derivatives', lessons: 6 },
            { id: 4, title: 'Optimization Problems', lessons: 4 }
        ],
        lessons: 23,
        videos: 23,
        quizzes: 8,
        assignments: 4,
        totalHours: 48,
        language: 'English',
        certificate: true,
        startDate: '2025-01-15',
        pace: 'Self-paced',
        requirements: ['High School Algebra', 'Basic Trigonometry']
    },

    math_linear_algebra: {
        id: 'math_linear_algebra',
        name: 'Linear Algebra Essentials',
        category: 'Mathematics',
        subcategory: 'Linear Algebra',
        description: 'Learn matrices, vectors, eigenvalues, and linear transformations with practical applications.',
        instructor: {
            id: 'teacher_002',
            name: 'Dr. James Chen',
            email: 'james.chen@lumina.edu',
            avatar: 'JC',
            bio: 'MIT Graduate, Research Mathematician',
            rating: 4.9
        },
        level: 'Intermediate',
        duration: '10 weeks',
        rating: 4.9,
        reviews: 412,
        students: 1834,
        price: 59.99,
        image: 'https://images.unsplash.com/photo-1594716992062-786257b39c6d?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1594716992062-786257b39c6d?w=150&h=150&fit=crop',
        tags: ['linear algebra', 'matrices', 'vectors', 'mathematics'],
        objectives: [
            'Master matrix operations and determinants',
            'Understand vector spaces and subspaces',
            'Learn eigenvalues and eigenvectors',
            'Apply linear algebra to computer science and physics'
        ],
        modules: [
            { id: 1, title: 'Vectors and Matrices', lessons: 6 },
            { id: 2, title: 'Matrix Operations', lessons: 7 },
            { id: 3, title: 'Eigenvalues and Diagonalization', lessons: 5 },
            { id: 4, title: 'Applications', lessons: 4 }
        ],
        lessons: 22,
        videos: 22,
        quizzes: 7,
        assignments: 5,
        totalHours: 44,
        language: 'English',
        certificate: true,
        startDate: '2025-01-20',
        pace: 'Self-paced',
        requirements: ['Calculus I', 'College Algebra']
    },

    // ===== COMPUTER SCIENCE =====
    cs_python_fundamentals: {
        id: 'cs_python_fundamentals',
        name: 'Python Programming Fundamentals',
        category: 'Computer Science',
        subcategory: 'Programming',
        description: 'Learn Python from scratch with real-world projects and best practices.',
        instructor: {
            id: 'teacher_003',
            name: 'Alex Rodriguez',
            email: 'alex.rodriguez@lumina.edu',
            avatar: 'AR',
            bio: 'Full Stack Developer, 10+ years experience',
            rating: 4.8
        },
        level: 'Beginner',
        duration: '8 weeks',
        rating: 4.7,
        reviews: 1023,
        students: 5234,
        price: 39.99,
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=150&h=150&fit=crop',
        tags: ['python', 'programming', 'coding', 'beginner', 'web development'],
        objectives: [
            'Learn Python syntax and fundamentals',
            'Master data structures and algorithms',
            'Work with functions and modules',
            'Build real-world Python applications'
        ],
        modules: [
            { id: 1, title: 'Getting Started with Python', lessons: 4 },
            { id: 2, title: 'Data Types and Operations', lessons: 6 },
            { id: 3, title: 'Functions and Modules', lessons: 5 },
            { id: 4, title: 'Object-Oriented Programming', lessons: 6 },
            { id: 5, title: 'Projects', lessons: 3 }
        ],
        lessons: 24,
        videos: 24,
        quizzes: 10,
        assignments: 8,
        totalHours: 40,
        language: 'English',
        certificate: true,
        startDate: '2025-02-01',
        pace: 'Self-paced',
        requirements: ['No prior experience needed']
    },

    cs_web_development: {
        id: 'cs_web_development',
        name: 'Full Stack Web Development',
        category: 'Computer Science',
        subcategory: 'Web Development',
        description: 'Build modern, responsive web applications with HTML, CSS, JavaScript, and frameworks.',
        instructor: {
            id: 'teacher_004',
            name: 'Emma Thompson',
            email: 'emma.thompson@lumina.edu',
            avatar: 'ET',
            bio: 'Lead Frontend Engineer at TechCorp',
            rating: 4.9
        },
        level: 'Intermediate',
        duration: '16 weeks',
        rating: 4.8,
        reviews: 876,
        students: 3456,
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=150&h=150&fit=crop',
        tags: ['web development', 'html', 'css', 'javascript', 'react', 'node.js'],
        objectives: [
            'Master frontend technologies (HTML, CSS, JS)',
            'Learn React and modern frameworks',
            'Build backend with Node.js and Express',
            'Deploy applications to production'
        ],
        modules: [
            { id: 1, title: 'Frontend Basics', lessons: 8 },
            { id: 2, title: 'Advanced JavaScript', lessons: 10 },
            { id: 3, title: 'React Framework', lessons: 12 },
            { id: 4, title: 'Backend Development', lessons: 10 },
            { id: 5, title: 'Deployment & DevOps', lessons: 6 }
        ],
        lessons: 46,
        videos: 46,
        quizzes: 15,
        assignments: 12,
        totalHours: 80,
        language: 'English',
        certificate: true,
        startDate: '2025-02-10',
        pace: 'Self-paced',
        requirements: ['Python Fundamentals or equivalent']
    },

    cs_data_science: {
        id: 'cs_data_science',
        name: 'Data Science Fundamentals',
        category: 'Computer Science',
        subcategory: 'Data Science',
        description: 'Learn data analysis, visualization, and machine learning with Python.',
        instructor: {
            id: 'teacher_005',
            name: 'Dr. Marcus Johnson',
            email: 'marcus.johnson@lumina.edu',
            avatar: 'MJ',
            bio: 'Data Scientist at Google, PhD in Statistics',
            rating: 5.0
        },
        level: 'Advanced',
        duration: '14 weeks',
        rating: 4.9,
        reviews: 654,
        students: 2123,
        price: 99.99,
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150&h=150&fit=crop',
        tags: ['data science', 'machine learning', 'python', 'analytics', 'statistics'],
        objectives: [
            'Understand data science fundamentals',
            'Master pandas and data manipulation',
            'Learn data visualization techniques',
            'Build machine learning models',
            'Deploy ML models in production'
        ],
        modules: [
            { id: 1, title: 'Data Science Basics', lessons: 5 },
            { id: 2, title: 'Data Wrangling with Pandas', lessons: 8 },
            { id: 3, title: 'Data Visualization', lessons: 6 },
            { id: 4, title: 'Machine Learning Fundamentals', lessons: 10 },
            { id: 5, title: 'Projects', lessons: 4 }
        ],
        lessons: 33,
        videos: 33,
        quizzes: 12,
        assignments: 10,
        totalHours: 60,
        language: 'English',
        certificate: true,
        startDate: '2025-02-15',
        pace: 'Self-paced',
        requirements: ['Python Fundamentals', 'Statistics Basics']
    },

    // ===== PHYSICS =====
    physics_mechanics: {
        id: 'physics_mechanics',
        name: 'Classical Mechanics',
        category: 'Physics',
        subcategory: 'Mechanics',
        description: 'Study motion, forces, energy, and momentum in classical physics.',
        instructor: {
            id: 'teacher_001',
            name: 'Prof. Evelyn Reed',
            email: 'evelyn.reed@lumina.edu',
            avatar: 'ER',
            bio: 'Physics PhD, 20+ years research experience',
            rating: 4.9
        },
        level: 'Beginner',
        duration: '12 weeks',
        rating: 4.8,
        reviews: 512,
        students: 1834,
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=150&h=150&fit=crop',
        tags: ['physics', 'mechanics', 'motion', 'forces', 'energy'],
        objectives: [
            'Understand Newtonian mechanics',
            'Learn kinematics and dynamics',
            'Master conservation laws',
            'Apply physics to real-world problems'
        ],
        modules: [
            { id: 1, title: 'Kinematics', lessons: 6 },
            { id: 2, title: 'Dynamics and Forces', lessons: 7 },
            { id: 3, title: 'Energy and Power', lessons: 5 },
            { id: 4, title: 'Momentum and Collisions', lessons: 4 }
        ],
        lessons: 22,
        videos: 22,
        quizzes: 8,
        assignments: 6,
        totalHours: 44,
        language: 'English',
        certificate: true,
        startDate: '2025-01-25',
        pace: 'Self-paced',
        requirements: ['Calculus I', 'Trigonometry']
    },

    physics_electricity: {
        id: 'physics_electricity',
        name: 'Electricity & Magnetism',
        category: 'Physics',
        subcategory: 'Electromagnetism',
        description: 'Explore electric fields, magnetic fields, circuits, and electromagnetic waves.',
        instructor: {
            id: 'teacher_006',
            name: 'Dr. Robert Maxwell',
            email: 'robert.maxwell@lumina.edu',
            avatar: 'RM',
            bio: 'Electrical Engineering Expert',
            rating: 4.8
        },
        level: 'Intermediate',
        duration: '12 weeks',
        rating: 4.7,
        reviews: 389,
        students: 1234,
        price: 59.99,
        image: 'https://images.unsplash.com/photo-1516714435840-f2adc3f3fee1?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1516714435840-f2adc3f3fee1?w=150&h=150&fit=crop',
        tags: ['physics', 'electricity', 'magnetism', 'circuits'],
        objectives: [
            'Understand electric fields and forces',
            'Learn Coulomb\'s law and Gauss\'s law',
            'Master magnetic fields and forces',
            'Study electromagnetic induction'
        ],
        modules: [
            { id: 1, title: 'Electric Charges and Fields', lessons: 6 },
            { id: 2, title: 'Electric Potential', lessons: 5 },
            { id: 3, title: 'Magnetic Fields', lessons: 6 },
            { id: 4, title: 'Electromagnetic Waves', lessons: 4 }
        ],
        lessons: 21,
        videos: 21,
        quizzes: 8,
        assignments: 6,
        totalHours: 42,
        language: 'English',
        certificate: true,
        startDate: '2025-02-01',
        pace: 'Self-paced',
        requirements: ['Classical Mechanics', 'Calculus II']
    },

    // ===== CHEMISTRY =====
    chemistry_general: {
        id: 'chemistry_general',
        name: 'General Chemistry I',
        category: 'Chemistry',
        subcategory: 'General Chemistry',
        description: 'Introduction to chemistry: atomic structure, bonding, reactions, and stoichiometry.',
        instructor: {
            id: 'teacher_007',
            name: 'Dr. Amanda Price',
            email: 'amanda.price@lumina.edu',
            avatar: 'AP',
            bio: 'Chemical Engineer, Industry Experience',
            rating: 4.8
        },
        level: 'Beginner',
        duration: '10 weeks',
        rating: 4.7,
        reviews: 678,
        students: 3456,
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1629904531159-d36694d7f2c4?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1629904531159-d36694d7f2c4?w=150&h=150&fit=crop',
        tags: ['chemistry', 'atoms', 'reactions', 'elements', 'molecules'],
        objectives: [
            'Understand atomic structure',
            'Learn chemical bonding',
            'Master stoichiometry',
            'Study reaction mechanisms'
        ],
        modules: [
            { id: 1, title: 'Atomic Structure', lessons: 5 },
            { id: 2, title: 'Chemical Bonding', lessons: 6 },
            { id: 3, title: 'Reactions and Stoichiometry', lessons: 7 },
            { id: 4, title: 'Thermochemistry', lessons: 4 }
        ],
        lessons: 22,
        videos: 22,
        quizzes: 8,
        assignments: 6,
        totalHours: 40,
        language: 'English',
        certificate: true,
        startDate: '2025-02-05',
        pace: 'Self-paced',
        requirements: ['High School Chemistry']
    },

    // ===== BIOLOGY =====
    biology_molecular: {
        id: 'biology_molecular',
        name: 'Molecular Biology',
        category: 'Biology',
        subcategory: 'Molecular Biology',
        description: 'Study DNA, RNA, proteins, and cellular processes at the molecular level.',
        instructor: {
            id: 'teacher_008',
            name: 'Prof. Lisa Wong',
            email: 'lisa.wong@lumina.edu',
            avatar: 'LW',
            bio: 'Molecular Biologist, PhD from Cambridge',
            rating: 4.9
        },
        level: 'Intermediate',
        duration: '14 weeks',
        rating: 4.8,
        reviews: 523,
        students: 1923,
        price: 69.99,
        image: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1576091160550-112173f7f869?w=150&h=150&fit=crop',
        tags: ['biology', 'molecular biology', 'dna', 'rna', 'proteins'],
        objectives: [
            'Understand DNA structure and function',
            'Learn replication and transcription',
            'Study protein synthesis',
            'Explore gene expression and regulation'
        ],
        modules: [
            { id: 1, title: 'DNA Structure', lessons: 6 },
            { id: 2, title: 'Replication and Repair', lessons: 6 },
            { id: 3, title: 'Transcription and Translation', lessons: 8 },
            { id: 4, title: 'Gene Expression', lessons: 6 }
        ],
        lessons: 26,
        videos: 26,
        quizzes: 10,
        assignments: 8,
        totalHours: 48,
        language: 'English',
        certificate: true,
        startDate: '2025-02-10',
        pace: 'Self-paced',
        requirements: ['General Biology', 'Chemistry I']
    },

    // ===== LANGUAGES =====
    language_spanish_101: {
        id: 'language_spanish_101',
        name: 'Spanish I: Beginner',
        category: 'Languages',
        subcategory: 'Spanish',
        description: 'Learn Spanish basics: vocabulary, grammar, pronunciation, and conversation skills.',
        instructor: {
            id: 'teacher_009',
            name: 'Maria Gonzalez',
            email: 'maria.gonzalez@lumina.edu',
            avatar: 'MG',
            bio: 'Native Spanish Speaker, Language Education Expert',
            rating: 4.9
        },
        level: 'Beginner',
        duration: '12 weeks',
        rating: 4.8,
        reviews: 1234,
        students: 5678,
        price: 39.99,
        image: 'https://images.unsplash.com/photo-1623813551600-f5da88e6f2f2?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1623813551600-f5da88e6f2f2?w=150&h=150&fit=crop',
        tags: ['spanish', 'language', 'beginner', 'conversation'],
        objectives: [
            'Learn Spanish alphabet and pronunciation',
            'Master basic grammar and vocabulary',
            'Practice conversational skills',
            'Understand Spanish culture'
        ],
        modules: [
            { id: 1, title: 'Getting Started', lessons: 4 },
            { id: 2, title: 'Nouns and Adjectives', lessons: 6 },
            { id: 3, title: 'Verbs and Tenses', lessons: 8 },
            { id: 4, title: 'Conversations', lessons: 5 }
        ],
        lessons: 23,
        videos: 23,
        quizzes: 12,
        assignments: 8,
        totalHours: 35,
        language: 'English',
        certificate: true,
        startDate: '2025-02-01',
        pace: 'Self-paced',
        requirements: ['No prior Spanish knowledge needed']
    },

    language_french_101: {
        id: 'language_french_101',
        name: 'French I: Beginner',
        category: 'Languages',
        subcategory: 'French',
        description: 'Master French fundamentals with interactive lessons and authentic materials.',
        instructor: {
            id: 'teacher_010',
            name: 'Pierre Dubois',
            email: 'pierre.dubois@lumina.edu',
            avatar: 'PD',
            bio: 'Parisian Native, Linguistics PhD',
            rating: 4.9
        },
        level: 'Beginner',
        duration: '12 weeks',
        rating: 4.7,
        reviews: 892,
        students: 4123,
        price: 39.99,
        image: 'https://images.unsplash.com/photo-1512941691920-25bde2e4dc75?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1512941691920-25bde2e4dc75?w=150&h=150&fit=crop',
        tags: ['french', 'language', 'beginner', 'european'],
        objectives: [
            'Learn French pronunciation and alphabet',
            'Build vocabulary and grammar skills',
            'Practice French conversations',
            'Explore French culture'
        ],
        modules: [
            { id: 1, title: 'French Basics', lessons: 4 },
            { id: 2, title: 'Grammar Foundations', lessons: 7 },
            { id: 3, title: 'Practical Conversations', lessons: 6 },
            { id: 4, title: 'French Culture', lessons: 4 }
        ],
        lessons: 21,
        videos: 21,
        quizzes: 10,
        assignments: 8,
        totalHours: 35,
        language: 'English',
        certificate: true,
        startDate: '2025-02-05',
        pace: 'Self-paced',
        requirements: ['No prior French knowledge needed']
    },

    // ===== BUSINESS =====
    business_marketing_101: {
        id: 'business_marketing_101',
        name: 'Digital Marketing Fundamentals',
        category: 'Business',
        subcategory: 'Marketing',
        description: 'Learn modern digital marketing strategies, social media, and analytics.',
        instructor: {
            id: 'teacher_011',
            name: 'Chris Anderson',
            email: 'chris.anderson@lumina.edu',
            avatar: 'CA',
            bio: 'Marketing Director at Fortune 500',
            rating: 4.8
        },
        level: 'Beginner',
        duration: '8 weeks',
        rating: 4.7,
        reviews: 567,
        students: 2834,
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1460925895917-adf4e565db18?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-adf4e565db18?w=150&h=150&fit=crop',
        tags: ['marketing', 'digital marketing', 'social media', 'business'],
        objectives: [
            'Master digital marketing fundamentals',
            'Learn SEO and content marketing',
            'Understand social media strategies',
            'Analyze marketing metrics and ROI'
        ],
        modules: [
            { id: 1, title: 'Digital Marketing Basics', lessons: 5 },
            { id: 2, title: 'SEO and SEM', lessons: 6 },
            { id: 3, title: 'Social Media Marketing', lessons: 6 },
            { id: 4, title: 'Analytics', lessons: 4 }
        ],
        lessons: 21,
        videos: 21,
        quizzes: 8,
        assignments: 6,
        totalHours: 32,
        language: 'English',
        certificate: true,
        startDate: '2025-02-08',
        pace: 'Self-paced',
        requirements: ['Basic computer skills']
    },

    // ===== DESIGN =====
    design_ux_ui: {
        id: 'design_ux_ui',
        name: 'UX/UI Design Principles',
        category: 'Design',
        subcategory: 'User Experience',
        description: 'Learn user experience and interface design with real-world projects.',
        instructor: {
            id: 'teacher_012',
            name: 'Jessica Lee',
            email: 'jessica.lee@lumina.edu',
            avatar: 'JL',
            bio: 'Lead Designer at Airbnb',
            rating: 5.0
        },
        level: 'Beginner',
        duration: '10 weeks',
        rating: 4.9,
        reviews: 743,
        students: 2456,
        price: 59.99,
        image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
        thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=150&h=150&fit=crop',
        tags: ['design', 'ux', 'ui', 'user experience', 'interface design'],
        objectives: [
            'Understand UX/UI principles',
            'Master design thinking',
            'Learn wireframing and prototyping',
            'Study accessibility and usability'
        ],
        modules: [
            { id: 1, title: 'Design Fundamentals', lessons: 5 },
            { id: 2, title: 'User Research', lessons: 5 },
            { id: 3, title: 'Wireframing & Prototyping', lessons: 6 },
            { id: 4, title: 'Projects', lessons: 4 }
        ],
        lessons: 20,
        videos: 20,
        quizzes: 8,
        assignments: 6,
        totalHours: 40,
        language: 'English',
        certificate: true,
        startDate: '2025-02-12',
        pace: 'Self-paced',
        requirements: ['Basic design knowledge helpful']
    }
};

/**
 * Get all courses
 */
function getAllCourses() {
    return Object.values(COURSES_DATABASE);
}

/**
 * Get course by ID
 */
function getCourseById(courseId) {
    return COURSES_DATABASE[courseId];
}

/**
 * Get courses by category
 */
function getCoursesByCategory(category) {
    return Object.values(COURSES_DATABASE).filter(course => course.category === category);
}

/**
 * Get courses by level
 */
function getCoursesByLevel(level) {
    return Object.values(COURSES_DATABASE).filter(course => course.level === level);
}

/**
 * Search courses
 */
function searchCourses(query) {
    const q = query.toLowerCase();
    return Object.values(COURSES_DATABASE).filter(course =>
        course.name.toLowerCase().includes(q) ||
        course.description.toLowerCase().includes(q) ||
        course.tags.some(tag => tag.toLowerCase().includes(q)) ||
        course.category.toLowerCase().includes(q)
    );
}

/**
 * Get featured courses
 */
function getFeaturedCourses() {
    return Object.values(COURSES_DATABASE)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6);
}

/**
 * Get categories
 */
function getCategories() {
    const categories = new Set();
    Object.values(COURSES_DATABASE).forEach(course => {
        categories.add(course.category);
    });
    return Array.from(categories).sort();
}

// Make functions available globally
window.COURSES_DATABASE = COURSES_DATABASE;
window.getAllCourses = getAllCourses;
window.getCourseById = getCourseById;
window.getCoursesByCategory = getCoursesByCategory;
window.getCoursesByLevel = getCoursesByLevel;
window.searchCourses = searchCourses;
window.getFeaturedCourses = getFeaturedCourses;
window.getCategories = getCategories;
