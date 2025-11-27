import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Validate session
        const session = await prisma.session.findUnique({
            where: { token },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        avatar: true,
                        bio: true,
                    },
                },
            },
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Invalid or expired session' },
                { status: 401 }
            );
        }

        if (session.expiresAt < new Date()) {
            await prisma.session.delete({ where: { id: session.id } });
            return NextResponse.json(
                { error: 'Session expired' },
                { status: 401 }
            );
        }

        return NextResponse.json({
            user: session.user,
        });
    } catch (error) {
        console.error('User info error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
