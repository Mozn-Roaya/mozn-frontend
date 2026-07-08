import { Poppins, Cairo } from "next/font/google";

import { getServerLang } from "../components/lib/lang-server";

import "./globals.css";

import type { Metadata } from "next";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Arabic UI font. Same weight ramp as Poppins so the type scale maps 1:1 when
// the app switches to `lang="ar"` (see the `--font-sans` override in globals.css).
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mozn — Early Warning System",
  description: "Mozn design system and early warning dashboard.",
  // Favicon is served from the App Router file convention `app/icon.svg` (the
  // navy MOZN tile), kept identical to the admin dashboard so both surfaces
  // share one favicon. No explicit `icons` metadata needed.
};

// Inline before hydration so the saved theme is applied before first paint —
// avoids a light→dark flash on reload. Language is resolved on the server from
// the cookie (see below), so `lang`/`dir` are already correct in the SSR HTML;
// the script only reconciles theme.
const themeBootScript = `(function(){try{var t=localStorage.getItem('mozn-theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = await getServerLang();
  const dir = lang === "ar" ? "rtl" : "ltr";
  return (
    // `lang`/`dir` come from the `mozn-lang` cookie so the first paint is in the
    // right language (Arabic → RTL + Cairo via globals.css). `suppressHydrationWarning`
    // covers the theme boot script's `data-theme` mutation.
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body
        className={`${poppins.variable} ${cairo.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
