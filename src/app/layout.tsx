import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#272727",
};

export const metadata: Metadata = {
  title: "جحدر // JAHDAR — قاهر عمالقة الويب ومحرك التدمير الفيزيائي",
  description:
    "الفارس الصغير في مواجهة أعتى مواقع الإنترنت. ضع رابط أي موقع وانزل إلى ساحة معركتك؛ تسلّق العناوين، تزلج على الفقرات، فكّك الكلمات، واسحق كل بكسل بفيزياء حقيقية وترسانة مدمرة.",
  keywords: ["جحدر", "لعبة جحدر", "تدمير المواقع", "بكسل آرت", "destroy website", "canvas game", "jahdar"],
  authors: [{ name: "جحدر // JAHDAR" }],
  openGraph: {
    title: "جحدر // JAHDAR — قاهر عمالقة الويب",
    description: "الفارس الصغير في مواجهة عمالقة الويب — حوّل أي موقع لساحة معركة بكسلية فيزيائية",
    type: "website",
  },
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        style={{ overflow: "hidden" }}
      >
        {children}
      </body>
    </html>
  );
}
