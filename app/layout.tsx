"use client"

import localFont from "next/font/local";
import "./globals.css";
import { ReactNode } from "react";
import BaseLayout from "@/components/layout/base_layout";
import { Toaster } from "@/components/ui/toaster";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>LLM Flow</title>
        <meta name="description" content="A simple LLM flow tester" />
        <meta name="keywords" content="AI, LLM, flow, tester, machine learning, artificial intelligence, OPENAI, CHATGPT" />
        <meta name="author" content="Thanura Nadun Ranasinghe" />
        <meta property="og:title" content="LLM Flow" />
        <meta property="og:description" content="A simple LLM flow tester" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://llmflow.netlify.com" />
        <meta property="og:image" content="/logo.svg" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
          <BaseLayout>
            {children}
          </BaseLayout>
          <Toaster />
      </body>
    </html>
  );
}
