import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebXR Portfolio Showroom",
  description: "Interactive 3D portfolio showcasing frontend development and VR skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
