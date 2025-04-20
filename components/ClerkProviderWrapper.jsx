"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { enUS, zhCN } from "@clerk/localizations";
import { neobrutalism, light } from "@clerk/themes";

export default function ClerkProviderWrapper({ children }) {
  return (
    <ClerkProvider 
      localization={zhCN}
      appearance={{
        baseTheme: light,
        variables: {
          borderRadius: '0.5rem',
        },
        elements: {
          card: "shadow-md",
          formButtonPrimary: 
            "bg-primary text-primary-foreground hover:bg-primary/90",
          socialButtonsBlockButton: "border border-border",
          footerActionLink: "text-primary hover:text-primary/90",
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
