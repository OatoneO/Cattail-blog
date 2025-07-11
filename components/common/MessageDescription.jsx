/**
 * 留言板描述组件
 * 用于展示留言板的标题和说明文字
 * 
 * 功能：
 * - 展示留言板标题
 * - 展示留言板说明文字
 * - 使用动画效果展示内容
 */

"use client";

import { motion } from "framer-motion";

export default function MessageDescription() {
  return (
    <motion.div initial={{ y: 30 }} animate={{ y: 0 }}>
      <h1 className="text-4xl font-semibold">留言板</h1>
      <p className="mt-2 text-muted-foreground">欢迎在此留下您的想法、建议或问题，我会尽快回复。</p>
    </motion.div>
  );
}
