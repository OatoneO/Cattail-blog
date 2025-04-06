import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { UserPlus } from "lucide-react";

export default function SignInAndOut({ pathname }) {
  return (
    <div className="flex items-center justify-end h-14">
      <SignedOut>
        <SignInButton
          mode="modal"
          forceRedirectUrl={pathname}
          signUpForceRedirectUrl={pathname}
        >
          <Button variant="ghost" size="icon" className="rounded-xl">
            <UserPlus />
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
