import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
    title: 'PhoBERT AI Platform - Enterprise Edition',
    description: 'Nền tảng AI tiên tiến cho đánh giá tuân thủ ISO 27001:2022 & TCVN 14423',
    icons: { icon: '/favicon.ico' }
}

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <body>
                <Navbar />
                <main>{children}</main>
            </body>
        </html>
    )
}
