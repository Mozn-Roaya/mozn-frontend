import type { Metadata } from "next";
import { Almarai, Poppins } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { getServerLocale } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";
import "./globals.css";

// Split by script: Poppins for Latin (English), Almarai for Arabic. The
// --font-sans stack lists Poppins first, so Latin glyphs render in Poppins and
// Arabic glyphs — which Poppins doesn't cover — fall through per-glyph to
// Almarai. Almarai still ships 300/400/700/800 only; Poppins carries the full
// range, so font-medium/semibold on Latin text hit real 500/600 weights.
const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MOZN · Early Warning System",
  description: "Admin dashboard for the MOZN early-warning station network.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getServerLocale();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={cn(almarai.variable, poppins.variable)}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
