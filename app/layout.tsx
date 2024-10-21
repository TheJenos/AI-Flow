"use client"

import localFont from "next/font/local";
import '@xyflow/react/dist/base.css';
import "./globals.css";
import { ReactNode, useEffect } from "react";
import BaseLayout from "@/components/layout/base_layout";
import { Toaster } from "@/components/ui/toaster";
import IntroSlider from "@/components/layout/intro_slider";
import mixpanel from 'mixpanel-browser'

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

  useEffect(() => {
    mixpanel.init("862df36b564f6a34e7f5829c4ad99fef", { debug: true, track_pageview: true, persistence: 'localStorage' });
  },[])

  return (
    <html lang="en">
      <head>
        <title>LLM Flow</title>
        <meta name="description" content="LLM Flow is a web application that enables you to test and refine your AI workflows without any coding. It also helps to create proof of concept from flow charts, making it easier to visualize and iterate on your ideas." />
        <meta name="keywords" content="AI, LLM, flow, tester, machine learning, artificial intelligence, OPENAI, CHATGPT" />
        <meta name="author" content="Thanura Nadun Ranasinghe" />
        <meta property="og:title" content="LLM Flow" />
        <meta property="og:description" content="LLM Flow is a web application that enables you to test and refine your AI workflows without any coding. It also helps to create proof of concept from flow charts, making it easier to visualize and iterate on your ideas." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://llmflow.netlify.com" />
        <meta property="og:image" content="/logo.svg" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <IntroSlider />
        <BaseLayout>
          {children}
        </BaseLayout>
        <Toaster />
      </body>
    </html>
  );
}
