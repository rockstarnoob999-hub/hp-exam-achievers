import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HP Exam Achievers - Mock Tests for HP Government Exams",
  description: "Himachal Pradesh No.1 mock test platform. Timed tests, instant results, Hindi support, live leaderboard. Starting at Rs 9.",
  keywords: "HPSSC mock test, HP exam, JOA IT mock, HPRCA mock test, Himachal Pradesh exam preparation",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}