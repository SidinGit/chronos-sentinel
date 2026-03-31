import { withAuth } from 'next-auth/middleware';

export default withAuth({
    pages: {
        signIn: '/login',
    },
});

// Protect all routes except login, API routes, and static assets
export const config = {
    matcher: [
        '/((?!login|signup|api|_next/static|_next/image|favicon.ico).*)',
    ],
};
