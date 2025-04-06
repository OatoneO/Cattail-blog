"use client";

import { motion } from "framer-motion";

export default function MessageDescription() {
  return (
    <motion.div initial={{ y: 30 }} animate={{ y: 0 }}>
      <h1 className="text-4xl font-semibold">Knowledge Graph</h1>
    </motion.div>
  );
}
