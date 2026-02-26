import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Add-Auth Next.js Demo",
  description: "Next.js example showing add-auth integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
