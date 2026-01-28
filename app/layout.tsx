import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YouTube Downloader - Download MP3 & MP4",
  description: "Download YouTube videos in MP3 or MP4 format with real-time progress tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {/* Theme Toggle - Responsive positioning */}
          <div className="fixed top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-50">
            <ThemeToggle />
          </div>
          
          {/* Main Content */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
