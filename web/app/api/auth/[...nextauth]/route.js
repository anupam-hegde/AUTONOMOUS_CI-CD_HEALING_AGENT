import NextAuth from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions = {
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authorization: {
                params: {
                    // Request additional scopes for GitHub App installation
                    scope: 'read:user user:email',
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            // Persist the GitHub access token and user info
            if (account) {
                token.accessToken = account.access_token;
                token.githubId = profile?.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Make GitHub info available in the session
            session.accessToken = token.accessToken;
            session.user.githubId = token.githubId;
            return session;
        },
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
