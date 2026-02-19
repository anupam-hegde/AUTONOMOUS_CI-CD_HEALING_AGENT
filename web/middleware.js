import { withAuth } from 'next-auth/middleware';

export default withAuth({
    pages: {
        signIn: '/login',
    },
});

// Protect all dashboard routes
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/projects/:path*',
        '/rules/:path*',
        '/history/:path*',
        '/settings/:path*',
    ],
};
