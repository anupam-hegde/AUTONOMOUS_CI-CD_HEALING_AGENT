import './globals.css'
import { Providers } from '../components/Providers';

export const metadata = {
    title: 'Code Compliance | Admin Dashboard',
    description: 'Enforce coding standards across your team with AI-powered analysis.',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
            </head>
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    )
}
