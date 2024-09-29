"use client"

import localFont from "next/font/local";
import "./globals.css";
import { ReactNode } from "react";
import BaseLayout from "@/components/layout/base_layout";

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
        <title>AI Flow | LLM Flow tester</title>
        <meta name="description" content="A simple LLM flow tester" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
          <BaseLayout>
            {children}
          </BaseLayout>
      </body>
    </html>
  );
}
