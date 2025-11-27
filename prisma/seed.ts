import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding with ACTIVE data...');

    // Clear existing data (development only)
    if (process.env.NODE_ENV !== 'production') {
        console.log('🗑️  Clearing existing data...');
        await prisma.notification.deleteMany();
        await prisma.contextMemory.deleteMany();
        await prisma.chatLog.deleteMany();
        await prisma.task.deleteMany();
        await prisma.agent.deleteMany();
        await prisma.project.deleteMany();
        await prisma.session.deleteMany();
        await prisma.user.deleteMany();
    }

    // Create Users with realistic data
    console.log('👤 Creating active users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await prisma.user.createMany({
        data: [
            {
                email: 'admin@lumina.ai',
                passwordHash: hashedPassword,
                name: 'Alexandra Martinez',
                role: 'ADMIN',
                bio: 'Platform Administrator & AI Systems Lead',
            },
            {
                email: 'teacher@lumina.ai',
                passwordHash: hashedPassword,
                name: 'Dr. James Chen',
                role: 'TEACHER',
                bio: 'Professor of Computer Science & AI Pedagogy Specialist',
            },
            {
                email: 'student@lumina.ai',
                passwordHash: hashedPassword,
                name: 'Sarah Johnson',
                role: 'STUDENT',
                bio: 'CS Major | AI Enthusiast | Learning Full-Stack Development',
            },
            {
                email: 'john.doe@lumina.ai',
                passwordHash: hashedPassword,
                name: 'John Doe',
                role: 'STUDENT',
                bio: 'Data Science Student | Machine Learning Explorer',
            },
            {
                email: 'emma.wilson@lumina.ai',
                passwordHash: hashedPassword,
                name: 'Emma Wilson',
                role: 'STUDENT',
                bio: 'Software Engineering Student | Python Developer',
            },
            {
                email: 'michael.brown@lumina.ai',
                passwordHash: hashedPassword,
                name: 'Michael Brown',
                role: 'TEACHER',
                bio: 'Senior Lecturer | Web Development & APIs Specialist',
            },
            {
                email: 'lisa.anderson@lumina.ai',
                passwordHash: hashedPassword,
                name: 'Lisa Anderson',
                role: 'STUDENT',
                bio: 'Frontend Developer | React & Next.js Enthusiast',
            },
            {
                email: 'david.lee@lumina.ai',
                passwordHash: hashedPassword,
                name: 'David Lee',
                role: 'STUDENT',
                bio: 'Backend Development | Database Design Student',
            },
            {
                email: 'sophia.garcia@lumina.ai',
                passwordHash: hashedPassword,
                name: 'Sophia Garcia',
                role: 'TEACHER',
                bio: 'AI Research Lead | Deep Learning & Neural Networks',
            },
            {
                email: 'ryan.martinez@lumina.ai',
                passwordHash: hashedPassword,
                name: 'Ryan Martinez',
                role: 'STUDENT',
                bio: 'Mobile App Development | Flutter & React Native',
            },
        ],
    });

    const allUsers = await prisma.user.findMany();
    console.log(`✅ Created ${allUsers.length} active users`);

    // Create AI Agents with detailed configs
    console.log('🤖 Creating AI agents with specialized roles...');

    const agents = [];

    const researchAgent = await prisma.agent.create({
        data: {
            name: 'Nova Research',
            type: 'RESEARCH',
            role: 'Senior Research Analyst',
            description: 'Specialized in web research, competitive analysis, and market intelligence gathering',
            status: 'IDLE',
            tools: ['web_search', 'content_analysis', 'data_extraction', 'competitor_analysis'],
            systemPrompt: 'You are Nova, a highly skilled research agent with expertise in gathering, analyzing, and synthesizing information from multiple sources.',
            config: {
                expertise: ['Market Research', 'Technology Trends', 'Academic Papers', 'Industry Reports'],
                preferredSources: ['ArXiv', 'Google Scholar', 'Tech Blogs', 'Industry News'],
            },
        },
    });
    agents.push(researchAgent);

    const uiuxAgent = await prisma.agent.create({
        data: {
            name: 'Pixel Designer',
            type: 'UI_UX',
            role: 'Lead UI/UX Architect',
            description: 'Expert in interface design, user experience optimization, and accessibility standards',
            status: 'IDLE',
            tools: ['design_analysis', 'component_generation', 'accessibility_check', 'color_theory', 'typography'],
            systemPrompt: 'You are Pixel, a creative UI/UX designer focused on creating beautiful, accessible, and user-friendly interfaces.',
            config: {
                designPrinciples: ['Clarity', 'Consistency', 'Accessibility', 'Aesthetics'],
                frameworks: ['Material Design', 'Apple HIG', 'W3C WCAG'],
            },
        },
    });
    agents.push(uiuxAgent);

    const codeAgent = await prisma.agent.create({
        data: {
            name: 'CodeMaster AI',
            type: 'CODE',
            role: 'Senior Software Engineer',
            description: 'Full-stack development expert specializing in clean code, best practices, and modern frameworks',
            status: 'BUSY',
            tools: ['code_generation', 'bug_fixing', 'code_review', 'refactoring', 'testing', 'documentation'],
            systemPrompt: 'You are CodeMaster, an expert software engineer with deep knowledge of multiple programming languages and frameworks.',
            config: {
                languages: ['TypeScript', 'Python', 'JavaScript', 'Go', 'Rust'],
                frameworks: ['Next.js', 'React', 'Node.js', 'FastAPI', 'PostgreSQL'],
                practices: ['TDD', 'Clean Code', 'SOLID Principles', 'Design Patterns'],
            },
        },
    });
    agents.push(codeAgent);

    const dbAgent = await prisma.agent.create({
        data: {
            name: 'DBMaster Pro',
            type: 'DATABASE',
            role: 'Database Administrator',
            description: 'Database optimization, query performance, schema design, and data integrity specialist',
            status: 'IDLE',
            tools: ['query_execution', 'migration_generation', 'db_optimization', 'indexing', 'backup_restore'],
            systemPrompt: 'You are DBMaster, a database expert with extensive experience in SQL, NoSQL, and distributed systems.',
            config: {
                databases: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch'],
                expertise: ['Query Optimization', 'Index Design', 'Data Modeling', 'Performance Tuning'],
            },
        },
    });
    agents.push(dbAgent);

    const testAgent = await prisma.agent.create({
        data: {
            name: 'QA Guardian',
            type: 'TEST',
            role: 'Quality Assurance Lead',
            description: 'Automated testing, quality assurance, bug detection, and system validation expert',
            status: 'IDLE',
            tools: ['test_execution', 'validation', 'debugging', 'e2e_testing', 'integration_testing'],
            systemPrompt: 'You are QA Guardian, a meticulous testing expert ensuring software quality and reliability.',
            config: {
                testingTypes: ['Unit', 'Integration', 'E2E', 'Performance', 'Security'],
                tools: ['Jest', 'Vitest', 'Playwright', 'Cypress', 'K6'],
            },
        },
    });
    agents.push(testAgent);

    const orchestratorAgent = await prisma.agent.create({
        data: {
            name: 'Maestro Coordinator',
            type: 'ORCHESTRATOR',
            role: 'Chief Operations Coordinator',
            description: 'Multi-agent task delegation, workflow optimization, and team coordination specialist',
            status: 'BUSY',
            tools: ['task_delegation', 'agent_coordination', 'workflow_management', 'priority_optimization'],
            systemPrompt: 'You are Maestro, the orchestrator who coordinates complex workflows between specialized AI agents.',
            config: {
                capabilities: ['Task Breakdown', 'Agent Selection', 'Workflow Design', 'Progress Monitoring'],
                strategy: 'Optimize for parallel execution while maintaining task dependencies',
            },
        },
    });
    agents.push(orchestratorAgent);

    console.log(`✅ Created ${agents.length} specialized AI agents`);

    // Create Active Projects
    console.log('📁 Creating active projects...');

    const adminUser = allUsers.find(u => u.email === 'admin@lumina.ai')!;
    const teacher1 = allUsers.find(u => u.email === 'teacher@lumina.ai')!;
    const student1 = allUsers.find(u => u.email === 'student@lumina.ai')!;
    const student2 = allUsers.find(u => u.email === 'john.doe@lumina.ai')!;
    const student3 = allUsers.find(u => u.email === 'emma.wilson@lumina.ai')!;

    const projects = [];

    const mainProject = await prisma.project.create({
        data: {
            name: 'Lumina AI Platform Enhancement',
            description: 'Core platform improvements including new features, performance optimization, and UI/UX enhancements',
            userId: adminUser.id,
            status: 'ACTIVE',
            settings: {
                theme: 'golden-black',
                priority: 'high',
                deadline: '2025-12-31',
            },
        },
    });
    projects.push(mainProject);

    const studentProject1 = await prisma.project.create({
        data: {
            name: 'Full-Stack E-Commerce App',
            description: 'Building a modern e-commerce platform with Next.js, PostgreSQL, and Stripe integration',
            userId: student1.id,
            status: 'ACTIVE',
            settings: {
                tech_stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe'],
                progress: 65,
            },
        },
    });
    projects.push(studentProject1);

    const studentProject2 = await prisma.project.create({
        data: {
            name: 'Machine Learning Recommendation System',
            description: 'Developing an AI-powered recommendation engine using collaborative filtering and deep learning',
            userId: student2.id,
            status: 'ACTIVE',
            settings: {
                algorithms: ['Collaborative Filtering', 'Content-Based', 'Hybrid'],
                dataset_size: '50K users',
            },
        },
    });
    projects.push(studentProject2);

    const teacherProject = await prisma.project.create({
        data: {
            name: 'Advanced Web Development Course',
            description: 'Creating comprehensive course materials for advanced web development with modern frameworks',
            userId: teacher1.id,
            status: 'ACTIVE',
            settings: {
                modules: 12,
                duration: '16 weeks',
                enrollment: 45,
            },
        },
    });
    projects.push(teacherProject);

    const studentProject3 = await prisma.project.create({
        data: {
            name: 'Real-Time Chat Application',
            description: 'Building a scalable real-time chat app with WebSockets, Redis, and microservices architecture',
            userId: student3.id,
            status: 'ACTIVE',
            settings: {
                features: ['Group Chat', 'File Sharing', 'Video Calls', 'End-to-End Encryption'],
                target_users: '10K concurrent',
            },
        },
    });
    projects.push(studentProject3);

    console.log(`✅ Created ${projects.length} active projects`);

    // Create Active Tasks with realistic data
    console.log('📋 Creating active tasks...');

    const taskTemplates = [
        // Platform Enhancement Tasks
        { title: 'Implement Golden Theme Across Dashboard', description: 'Update all dashboard components to use the new golden yellow and black color scheme', agentId: uiuxAgent.id, projectId: mainProject.id, status: 'COMPLETED', priority: 9 },
        { title: 'Optimize Database Query Performance', description: 'Analyze slow queries and add proper indexes to improve response times by 50%', agentId: dbAgent.id, projectId: mainProject.id, status: 'RUNNING', priority: 10 },
        { title: 'Add Real-Time WebSocket Support', description: 'Implement WebSocket connections for live agent status updates and notifications', agentId: codeAgent.id, projectId: mainProject.id, status: 'RUNNING', priority: 8 },
        { title: 'Research Modern AI Learning Trends', description: 'Compile report on latest trends in AI-powered education and personalized learning', agentId: researchAgent.id, projectId: mainProject.id, status: 'COMPLETED', priority: 7 },
        { title: 'Setup E2E Testing Suite', description: 'Configure Playwright for end-to-end testing of critical user flows', agentId: testAgent.id, projectId: mainProject.id, status: 'PENDING', priority: 8 },

        // E-Commerce Project Tasks
        { title: 'Design Product Catalog UI', description: 'Create responsive product listing with filters, search, and pagination', agentId: uiuxAgent.id, projectId: studentProject1.id, status: 'COMPLETED', priority: 8 },
        { title: 'Implement Stripe Payment Integration', description: 'Integrate Stripe checkout flow with webhook handling for order processing', agentId: codeAgent.id, projectId: studentProject1.id, status: 'RUNNING', priority: 10 },
        { title: 'Build Shopping Cart System', description: 'Create persistent shopping cart with Redis caching for performance', agentId: codeAgent.id, projectId: studentProject1.id, status: 'COMPLETED', priority: 9 },
        { title: 'Optimize Product Database Schema', description: 'Design efficient schema for product catalog with variants and inventory', agentId: dbAgent.id, projectId: studentProject1.id, status: 'COMPLETED', priority: 8 },

        // ML Recommendation System Tasks
        { title: 'Research Recommendation Algorithms', description: 'Compare collaborative filtering vs content-based vs hybrid approaches', agentId: researchAgent.id, projectId: studentProject2.id, status: 'COMPLETED', priority: 9 },
        { title: 'Implement Matrix Factorization', description: 'Build collaborative filtering using SVD and ALS algorithms', agentId: codeAgent.id, projectId: studentProject2.id, status: 'RUNNING', priority: 10 },
        { title: 'Create Training Data Pipeline', description: 'Build ETL pipeline for user interaction data processing', agentId: dbAgent.id, projectId: studentProject2.id, status: 'COMPLETED', priority: 8 },
        { title: 'Test Model Accuracy', description: 'Validate recommendation quality using precision, recall, and NDCG metrics', agentId: testAgent.id, projectId: studentProject2.id, status: 'PENDING', priority: 7 },

        // Course Development Tasks
        { title: 'Create React Advanced Patterns Module', description: 'Develop course content on hooks, context, and performance optimization', agentId: codeAgent.id, projectId: teacherProject.id, status: 'COMPLETED', priority: 8 },
        { title: 'Design Course UI Template', description: 'Create consistent template for all course modules with accessibility focus', agentId: uiuxAgent.id, projectId: teacherProject.id, status: 'COMPLETED', priority: 7 },
        { title: 'Research Best Teaching Practices', description: 'Compile modern pedagogical approaches for online technical education', agentId: researchAgent.id, projectId: teacherProject.id, status: 'RUNNING', priority: 6 },

        // Chat App Tasks
        { title: 'Implement WebSocket Server', description: 'Build scalable WebSocket server using Socket.io with Redis adapter', agentId: codeAgent.id, projectId: studentProject3.id, status: 'COMPLETED', priority: 10 },
        { title: 'Design Chat Interface', description: 'Create modern, responsive chat UI with message threading and reactions', agentId: uiuxAgent.id, projectId: studentProject3.id, status: 'RUNNING', priority: 8 },
        { title: 'Setup Message Queue System', description: 'Configure RabbitMQ for reliable message delivery and offline support', agentId: dbAgent.id, projectId: studentProject3.id, status: 'PENDING', priority: 9 },
        { title: 'Test Concurrent Connections', description: 'Load test system with 10K concurrent users to ensure scalability', agentId: testAgent.id, projectId: studentProject3.id, status: 'PENDING', priority: 8 },
    ];

    for (const template of taskTemplates) {
        const completedAt = template.status === 'COMPLETED' ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null;
        const startedAt = template.status !== 'PENDING' ? new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000) : null;

        await prisma.task.create({
            data: {
                title: template.title,
                description: template.description,
                agentId: template.agentId,
                projectId: template.projectId,
                status: template.status as any,
                priority: template.priority,
                startedAt,
                completedAt,
                input: { notes: 'Task auto-generated from project requirements' },
                result: template.status === 'COMPLETED' ? { success: true, completedBy: 'AI Agent', quality: 'High' } : null,
            },
        });
    }

    console.log(`✅ Created ${taskTemplates.length} active tasks`);

    // Create Chat Conversations
    console.log('💬 Creating chat conversations...');

    const chatTemplates = [
        // Student asking for help
        { userId: student1.id, agentId: codeAgent.id, projectId: studentProject1.id, message: 'Can you help me implement Stripe webhooks for my e-commerce project?', role: 'USER' },
        { userId: student1.id, agentId: codeAgent.id, projectId: studentProject1.id, message: 'I\'ll help you set up Stripe webhooks. First, create an endpoint at /api/webhooks/stripe. You\'ll need to verify the webhook signature using Stripe\'s library...', role: 'AGENT' },

        // Student asking research agent
        { userId: student2.id, agentId: researchAgent.id, projectId: studentProject2.id, message: 'What are the latest papers on recommendation systems?', role: 'USER' },
        { userId: student2.id, agentId: researchAgent.id, projectId: studentProject2.id, message: 'I found several cutting-edge papers: 1) "Neural Collaborative Filtering" (2017) - introduces deep learning for recommendations, 2) "BERT4Rec" (2019) - uses transformers...', role: 'AGENT' },

        // Teacher coordinating
        { userId: teacher1.id, agentId: orchestratorAgent.id, projectId: teacherProject.id, message: 'I need to create 5 new course modules. Can you coordinate this?', role: 'USER' },
        { userId: teacher1.id, agentId: orchestratorAgent.id, projectId: teacherProject.id, message: 'I\'ll break this down: Research Agent will gather content, Code Agent will create examples, UI Agent will design templates, and QA Agent will review. Expected completion: 2 weeks.', role: 'AGENT' },

        // UI/UX feedback
        { userId: student3.id, agentId: uiuxAgent.id, projectId: studentProject3.id, message: 'How can I make my chat interface more accessible?', role: 'USER' },
        { userId: student3.id, agentId: uiuxAgent.id, projectId: studentProject3.id, message: 'Great question! Focus on: 1) Keyboard navigation (Tab, Enter, Escape), 2) Screen reader support with ARIA labels, 3) High contrast mode, 4) Adjustable text size...', role: 'AGENT' },

        // Database optimization
        { userId: adminUser.id, agentId: dbAgent.id, projectId: mainProject.id, message: 'Our queries are slow. Can you analyze the database?', role: 'USER' },
        { userId: adminUser.id, agentId: dbAgent.id, projectId: mainProject.id, message: 'I analyzed the query logs. Main issues: 1) Missing indexes on user_id + created_at columns, 2) N+1 query problem in task fetching, 3) Unoptimized JOIN operations. I recommend...', role: 'AGENT' },
    ];

    for category(const chat of chatTemplates) {
        await prisma.chatLog.create({
            data: {
                userId: chat.userId,
                agentId: chat.agentId,
                projectId: chat.projectId,
                message: chat.message,
                role: chat.role as any,
                timestamp: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
                metadata: { read: Math.random() > 0.3 },
            },
        });
    }

    console.log(`✅ Created ${chatTemplates.length} realistic chat conversations`);

    // Create Notifications
    console.log('🔔 Creating notifications...');

    const notifications = [
        { userId: student1.id, title: 'Task Completed', message: 'CodeMaster AI completed: Implement Stripe Payment Integration', type: 'TASK_COMPLETED' },
        { userId: student2.id, title: 'New Research Available', message: 'Nova Research found 15 relevant papers on recommendation systems', type: 'INFO' },
        { userId: teacher1.id, title: 'Course Module Ready', message: 'React Advanced Patterns module is ready for review', type: 'SUCCESS' },
        { userId: adminUser.id, title: 'System Alert', message: 'Database optimization completed. Query performance improved by 47%', type: 'SUCCESS' },
        { userId: student3.id, title: 'Agent Available', message: 'Pixel Designer is now available for your chat interface design', type: 'INFO' },
        { userId: student1.id, title: 'High Priority', message: 'Your Stripe webhook task needs attention - security review required', type: 'WARNING' },
    ];

    for (const notif of notifications) {
        await prisma.notification.create({
            data: {
                userId: notif.userId,
                title: notif.title,
                message: notif.message,
                type: notif.type as any,
                read: Math.random() > 0.5,
                data: { timestamp: new Date(), source: 'system' },
                createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            },
        });
    }

    console.log(`✅ Created ${notifications.length} notifications`);

    // Final Statistics
    const stats = {
        users: await prisma.user.count(),
        agents: await prisma.agent.count(),
        projects: await prisma.project.count(),
        tasks: await prisma.task.count(),
        chatLogs: await prisma.chatLog.count(),
        notifications: await prisma.notification.count(),
    };

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📊 Final Statistics:');
    console.log(`   👤 Users: ${stats.users}`);
    console.log(`   🤖 AI Agents: ${stats.agents}`);
    console.log(`   📁 Projects: ${stats.projects}`);
    console.log(`   📋 Tasks: ${stats.tasks}`);
    console.log(`   💬 Chat Messages: ${stats.chatLogs}`);
    console.log(`   🔔 Notifications: ${stats.notifications}`);
    console.log('\n✨ Your database is now filled with realistic, active data!');
    console.log('🚀 Run `npm run dev` and visit http://localhost:3000\n');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
