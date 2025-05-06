import "./global.css";
import "./fonts.css"; // 添加字体CSS引用
// import { Roboto_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import ClerkProviderWrapper from "@/components/layout/ClerkProviderWrapper";
// import Header from "@/components/Header"; // Header might be removed or simplified
import Navbar from "@/components/layout/Navbar"; // Import Navbar
import Footer from "@/components/layout/Footer";
import MainWrapper from "@/components/layout/MainWrapper";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "sonner";

// const roboto_mono = Roboto_Mono({ subsets: ["latin"] });

// 提供元数据
export const metadata = {
  title: "Cattail | Developer",
  description:
    "Hi, I'm Cattail, an undergraduate student at NJTECH majoring in Computer Science. ",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="zh"
      suppressHydrationWarning
      className="scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-muted"
    >
      <ClerkProviderWrapper>
        <body className="bg-background text-foreground font-roboto-mono">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar />
            <div className="flex flex-col items-center px-4 mx-auto max-w-4xl lg:max-w-5xl sm:px-12 md:px-20 lg:px-12 xl:max-w-7xl min-h-svh pt-4">
              <MainWrapper>{children}</MainWrapper>
              <Footer />
            </div>
            <Analytics />
            <SpeedInsights />
            <Toaster />
          </ThemeProvider>
        </body>
      </ClerkProviderWrapper>
    </html>
  );
}
