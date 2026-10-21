import React from "react";
import { motion } from "motion/react";

export function PageWrapper({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.99 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full flex-1 flex flex-col transform-gpu will-change-[transform,opacity] ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default PageWrapper;
