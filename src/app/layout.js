import { Geist_Mono, Onest } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/ui/toaster";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vendor Panel | MyShaadiStore",
  description: "MyShaadiStore vendor panel for quotation and order operations.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${onest.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
