import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/**
 * NextAuth configuration — Credentials provider.
 *
 * For this first iteration, auth validates against env vars:
 *   ADMIN_EMAIL / ADMIN_PASSWORD
 *
 * This is a single-user/team setup. For multi-user with hashed
 * passwords in MongoDB, swap the authorize() logic.
 */
export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email', placeholder: 'admin@chronos.dev' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const { getDatabase } = await import('@/lib/mongodb');
                    const bcrypt = await import('bcryptjs');

                    const db = await getDatabase();
                    // Fallback to env default user for backwards compatibility/recovery
                    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chronos.dev';
                    const adminPassword = process.env.ADMIN_PASSWORD || 'sentinel';

                    if (
                        credentials.email === adminEmail &&
                        credentials.password === adminPassword
                    ) {
                        return { id: '0', email: adminEmail, name: 'System Admin' };
                    }

                    // Otherwise check the database
                    const user = await db.collection('users').findOne({ email: credentials.email });

                    if (user && await bcrypt.compare(credentials.password, user.password)) {
                        return {
                            id: user._id.toString(),
                            email: user.email,
                            name: user.name || 'User',
                        };
                    }
                } catch (error) {
                    console.error("Auth error:", error);
                }

                return null;
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || 'chronos-sentinel-dev-secret',
};
