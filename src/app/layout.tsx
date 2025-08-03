import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "./components/ThemeProvider";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Local Models - AI Chatbot",
  description: "Chat with Llama 3.2 ,Deepseek 1.5b ,Gemini 2.5 AI model  - Fast, intelligent, and responsive AI assistant",
  keywords: ["AI", "chatbot", "Llama", "artificial intelligence", "chat", "assistant"],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",
  publisher: "Your Company",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    title: "Llama 3.2 - AI Chatbot",
    description: "Chat with Llama 3.2 AI model - Fast, intelligent, and responsive AI assistant",
    siteName: "Llama 3.2 Chatbot",
  },
  twitter: {
    card: "summary_large_image",
    title: "Llama 3.2 - AI Chatbot",
    description: "Chat with Llama 3.2 AI model - Fast, intelligent, and responsive AI assistant",
    creator: "@yourusername",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50 dark:bg-gray-900`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
