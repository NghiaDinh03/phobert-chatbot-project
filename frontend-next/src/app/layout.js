import './globals.css'
import Navbar from '@/components/Navbar'
import ThemeProvider from '@/components/ThemeProvider'
import LanguageProvider from '@/components/LanguageProvider'
import { ToastProvider } from '@/components/Toast'

export const metadata = {
    title: 'CyberAI Assessment Platform',
    description: 'Advanced AI platform for ISO 27001:2022 & TCVN 14423 compliance assessment',
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
        ],
    }
}

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body suppressHydrationWarning>
                <ThemeProvider>
                    <LanguageProvider>
                        <ToastProvider>
                            <Navbar />
                            <main>{children}</main>
                        </ToastProvider>
                    </LanguageProvider>
                </ThemeProvider>
            </body>
        </html>
    )
}
