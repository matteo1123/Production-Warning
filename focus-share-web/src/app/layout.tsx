import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PW Focus - Share Your Browser Focus Sessions",
  description: "Discover and share curated link collections, warnings, and notes for focused browsing",
};

// Google Analytics Measurement ID - set via environment variable
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>{GA_MEASUREMENT_ID ? (
          <><Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" /><Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{__html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}',{page_title:document.title,page_path:window.location.pathname});`}} /></>
        ) : null}</head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white`} suppressHydrationWarning>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

