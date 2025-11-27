import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'No token provided' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);

        // Delete session
        await prisma.session.deleteMany({
            where: { token },
        });

        return NextResponse.json({
            message: 'Logout successful',
        });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
