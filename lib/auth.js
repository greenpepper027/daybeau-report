import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const users = [
          {
            id: '1',
            name: '그린페퍼',
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
          },
          {
            id: '2',
            name: '데이보강남',
            username: process.env.VIEWER_USERNAME,
            password: process.env.VIEWER_PASSWORD,
            role: 'viewer',
          },
        ];
        const user = users.find(
          u => u.username === credentials.username && u.password === credentials.password
        );
        if (!user) return null;
        return { id: user.id, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role;
      return session;
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
