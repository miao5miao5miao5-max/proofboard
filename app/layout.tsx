import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { PageTransitionWrapper } from "@/components/layout/PageTransitionWrapper";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Proofboard",
  description:
    "Voice-first, AI-powered mastery-learning tool for proof-of-knowledge workflows",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="relative" style={{ zIndex: 1 }}>
          <SidebarProvider>
            <PageTransitionWrapper>
              {children}
            </PageTransitionWrapper>
          </SidebarProvider>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
