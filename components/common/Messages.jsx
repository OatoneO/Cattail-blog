/**
 * 留言列表组件（服务器端）
 * 用于获取和展示所有用户的留言
 * 
 * 功能：
 * - 获取留言数据
 * - 验证管理员权限
 * - 展示留言列表
 * - 限制显示最新的50条留言
 */

import prisma from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import MessageItem from "./MessageItem";

export default async function Messages() {
  const messages = await getMessages();
  const user = await currentUser();
  const isAdmin = user?.id === "user_2vxec51JBR7zN12XcPs7FGKksT8";

  return (
    <ul className="flex flex-col space-y-2">
      {messages.map((message, index) => (
        <MessageItem 
          key={message.id} 
          message={message} 
          isAdmin={isAdmin}
        />
      ))}
    </ul>
  );
}

async function getMessages() {
  const data = await prisma.message.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // 限制返回最新的50条消息
  });

  return data;
}
