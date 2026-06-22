import { motion } from "framer-motion";

export default function DashboardCard({ children, className = "", delay = 0 }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436] ${className}`}
    >
      {children}
    </motion.section>
  );
}
