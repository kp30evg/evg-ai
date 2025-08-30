import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "Evergreen AI - The AI OS for Business | Command Everything",
  description: "Replace 130+ business tools with one AI-powered platform. Run your entire business through natural language commands. 48-hour migration guaranteed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
        style={{ backgroundColor: '#FFFFFF', color: '#222B2E', margin: 0, padding: 0 }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
