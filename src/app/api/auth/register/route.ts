import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2).optional(),
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = registerSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.errors },
                { status: 400 }
            );
        }

        const { email, password, name, role } = validation.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: name || null,
                role: role || 'STUDENT',
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
            },
        });

        // Generate JWT token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Create session
        await prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
        });

        return NextResponse.json(
            {
                message: 'User registered successfully',
                user,
                token,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
