import MessageForm from "@/components/common/MessageForm";
import {
  LoadingState,
  LoadingStateMessage,
  GuestBookFormLoading,
  LoadingMessages,
} from "@/components/common/LoadingState";
import Messages from "@/components/common/Messages";
import MessageDescription from "@/components/common/MessageDescription";
import { currentUser } from "@clerk/nextjs/server";
import { Suspense } from "react";
import Image from "next/image";

export default async function MessagePage() {
  const user = await currentUser();

  return (
    <div className="flex flex-col w-full gap-20 lg:w-2/3">
      <MessageDescription />

      <Suspense fallback={<GuestBookFormLoading />}>
        {user ? (
          <MessageForm>
            <Image
              src={user.imageUrl}
              width={40}
              height={40}
              alt="user profile image"
              className="rounded-full "
            />
          </MessageForm>
        ) : (
          <div className="flex items-center justify-start h-20 px-10 pr-2 text-sm rounded-lg bg-secondary text-muted-foreground">
            🔒 请登录后留言
          </div>
        )}
      </Suspense>

      <Suspense fallback={<LoadingMessages />}>
        <Messages />
      </Suspense>
    </div>
  );
}
