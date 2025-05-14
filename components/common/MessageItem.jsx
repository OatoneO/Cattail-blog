/**
 * 留言项组件（客户端）
 * 用于显示单条留言及其操作按钮
 * 
 * 功能：
 * - 显示留言内容
 * - 显示用户信息
 * - 显示时间
 * - 管理员或留言发布者可删除留言（仅登录用户可见）
 */

"use client";

import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";
import { removeMessage } from "@/app/actions";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

export default function MessageItem({ message, isAdmin }) {
  const { userId, isSignedIn } = useAuth();
  const isAuthor = isSignedIn && userId === message.userId;
  const canDelete = isSignedIn && (isAdmin || isAuthor);

  return (
    <li>
      <div className="flex items-start gap-3 my-1">
        <div className="flex flex-col items-center flex-shrink-0 gap-2">
          <Image
            src={message.userImg}
            width={40}
            height={40}
            alt="user profile image"
            className="mb-1 rounded-full"
          />
        </div>

        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p>{message.userName}</p>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            {canDelete && (
              <form
                action={async (formData) => {
                  try {
                    const result = await removeMessage(formData);
                    if (result.success) {
                      toast.success("留言已删除");
                    } else {
                      toast.error(result.error || "删除失败");
                    }
                  } catch (error) {
                    toast.error(error.message || "删除失败");
                  }
                }}
              >
                <input type="hidden" name="messageId" value={message.id} />
                <button
                  type="submit"
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  title="删除留言"
                >
                  <Trash2 size={14} />
                </button>
              </form>
            )}
          </div>

          <p className="mt-1 text-xs font-light break-words">
            {message.message}
          </p>
        </div>
      </div>
    </li>
  );
} 