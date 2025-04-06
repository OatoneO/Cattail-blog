import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

const localization = {
  signUp: {
    start: {
      title: "Sign Up",
      subtitle: "Create an account",
    },
  },
  signIn: {
    start: {
      title: "Welcome Back",
      subtitle: "Sign in to Cattail's blog",
    },
  },
};

export default function ClerkProviderWrapper({ children }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
      }}
      localization={localization}
    >
      {children}
    </ClerkProvider>
  );
}
