#!/bin/bash

# Add More Data to Lumina Database
# Run this after initial setup to add even more realistic data

echo "📊 Adding More Active Data to Lumina..."
echo "======================================="

# Check if Docker is running
if docker-compose ps | grep -q "lumina-postgres.*Up"; then
    echo "✓ Docker containers are running"
    
    # Add more data using Prisma
    docker-compose exec -T app npx tsx << 'TYPESCRIPT'
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addMoreData() {
  console.log('🌱 Adding more active data...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Add 10 more students
  const moreUsers = await prisma.user.createMany({
    data: [
      { email: 'carlos.rodriguez@lumina.ai', passwordHash: hashedPassword, name: 'Carlos Rodriguez', role: 'STUDENT', bio: 'DevOps Engineer | Kubernetes & CI/CD' },
      { email: 'priya.patel@lumina.ai', passwordHash: hashedPassword, name: 'Priya Patel', role: 'STUDENT', bio: 'Cloud Architect | AWS & Azure Specialist' },
      { email: 'marcus.chen@lumina.ai', passwordHash: hashedPassword, name: 'Marcus Chen', role: 'STUDENT', bio: 'Security Engineer | Cybersecurity Expert' },
      { email: 'aisha.mohammed@lumina.ai', passwordHash: hashedPassword, name: 'Aisha Mohammed', role: 'STUDENT', bio: 'Blockchain Developer | Web3 Enthusiast' },
      { email: 'felix.andersson@lumina.ai', passwordHash: hashedPassword, name: 'Felix Andersson', role: 'STUDENT', bio: 'Game Developer | Unity & Unreal Engine' },
      { email: 'yuki.tanaka@lumina.ai', passwordHash: hashedPassword, name: 'Yuki Tanaka', role: 'TEACHER', bio: 'AI Ethics Professor | Responsible AI Advocate' },
      { email: 'olivia.brown@lumina.ai', passwordHash: hashedPassword, name: 'Olivia Brown', role: 'STUDENT', bio: 'Data Engineer | Big Data & Analytics' },
      { email: 'diego.silva@lumina.ai', passwordHash: hashedPassword, name: 'Diego Silva', role: 'STUDENT', bio: 'IoT Developer | Embedded Systems' },
      { email: 'zara.khan@lumina.ai', passwordHash: hashedPassword, name: 'Zara Khan', role: 'STUDENT', bio: 'AR/VR Developer | Metaverse Builder' },
      { email: 'lucas.mueller@lumina.ai', passwordHash: hashedPassword, name: 'Lucas Mueller', role: 'TEACHER', bio: 'Systems Design | Distributed Architectures' },
    ],
  });
  
  console.log(`✅ Added ${moreUsers.count} more users`);
  
  // Add more projects
  const users = await prisma.user.findMany();
  const newUser1 = users.find(u => u.email === 'carlos.rodriguez@lumina.ai');
  const newUser2 = users.find(u => u.email === 'priya.patel@lumina.ai');
  const newUser3 = users.find(u => u.email === 'aisha.mohammed@lumina.ai');
  
  if (newUser1 && newUser2 && newUser3) {
    await prisma.project.createMany({
      data: [
        {
          name: 'Kubernetes Cluster Management',
          description: 'DevOps automation with K8s, Terraform, and GitOps',
          userId: newUser1.id,
          status: 'ACTIVE',
          settings: { tech: ['Kubernetes', 'Terraform', 'ArgoCD'], team_size: 5 },
        },
        {
          name: 'Cloud Native Microservices',
          description: 'Building scalable microservices on AWS with serverless architecture',
          userId: newUser2.id,
          status: 'ACTIVE',
          settings: { cloud: 'AWS', services: ['Lambda', 'DynamoDB', 'API Gateway'] },
        },
        {
          name: 'DeFi Trading Platform',
          description: 'Decentralized finance application with smart contracts',
          userId: newUser3.id,
          status: 'ACTIVE',
          settings: { blockchain: 'Ethereum', language: 'Solidity' },
        },
      ],
    });
    
    console.log('✅ Added 3 more projects');
  }
  
  // Add more tasks
  const agents = await prisma.agent.findMany();
  const projects = await prisma.project.findMany();
  
  if (agents.length > 0 && projects.length > 0) {
    const codeAgent = agents.find(a => a.type === 'CODE');
    const researchAgent = agents.find(a => a.type === 'RESEARCH');
    const randomProject = projects[Math.floor(Math.random() * projects.length)];
    
    if (codeAgent && randomProject) {
      await prisma.task.createMany({
        data: [
          {
            title: 'Implement GraphQL API',
            description: 'Build GraphQL server with Apollo and type-safe resolvers',
            agentId: codeAgent.id,
            projectId: randomProject.id,
            status: 'PENDING',
            priority: 8,
            input: { framework: 'Apollo Server', language: 'TypeScript' },
          },
          {
            title: 'Setup Redis Caching',
            description: 'Configure Redis for session management and query caching',
            agentId: codeAgent.id,
            projectId: randomProject.id,
            status: 'RUNNING',
            priority: 9,
            startedAt: new Date(),
            input: { cache_ttl: '1 hour', use_case: 'API responses' },
          },
        ],
      });
      
      console.log('✅ Added 2 more tasks');
    }
    
    if (researchAgent && randomProject) {
      await prisma.task.create({
        data: {
          title: 'Research Latest AI Models',
          description: 'Compare GPT-4, Claude, and Gemini for our use case',
          agentId: researchAgent.id,
          projectId: randomProject.id,
          status: 'COMPLETED',
          priority: 7,
          startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          input: { models: ['GPT-4', 'Claude 3', 'Gemini Pro'] },
          result: { recommendation: 'GPT-4 for code, Claude for analysis' },
        },
      });
      
      console.log('✅ Added research task');
    }
  }
  
  // Add more notifications
  const firstUsers = await prisma.user.findMany({ take: 5 });
  
  for (const user of firstUsers) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Platform Update',
        message: 'New Golden Yellow theme is now live! 🌟',
        type: 'INFO',
        read: false,
        data: { feature: 'theme_update', version: '2.0' },
      },
    });
  }
  
  console.log('✅ Added 5 more notifications');
  
  const stats = {
    users: await prisma.user.count(),
    projects: await prisma.project.count(),
    tasks: await prisma.task.count(),
    notifications: await prisma.notification.count(),
  };
  
  console.log('\n🎉 More data added successfully!');
  console.log(`📊 New totals: ${stats.users} users, ${stats.projects} projects, ${stats.tasks} tasks, ${stats.notifications} notifications`);
}

addMoreData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
TYPESCRIPT

else
    echo "❌ Error: Docker containers are not running"
    echo "Run: ./docker-setup.sh first"
    exit 1
fi

echo ""
echo "✨ More data added! Refresh your app to see the updates."
