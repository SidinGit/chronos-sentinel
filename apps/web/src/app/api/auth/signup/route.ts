import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        const db = await getDatabase();
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store the user
        const result = await usersCollection.insertOne({
            email,
            password: hashedPassword,
            role: 'admin', // First user could be defaulted to admin
            createdAt: new Date(),
        });

        return NextResponse.json(
            { success: true, userId: result.insertedId.toString() },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error during signup' },
            { status: 500 }
        );
    }
}
