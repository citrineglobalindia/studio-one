import { Bot } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function FloatingAIButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (pathname === "/ai-assistant") return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate("/ai-assistant")}
      className={cn(
        "fixed bottom-24 right-4 z-[55] h-10 w-10 rounded-full",
        "bg-gradient-to-br from-primary to-primary/80",
        "text-primary-foreground shadow-md shadow-primary/20",
        "flex items-center justify-center",
        "hover:shadow-lg hover:shadow-primary/30 transition-shadow"
      )}
      title="AI Assistant"
    >
      <Bot className="h-4 w-4" />
      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-[1.5px] border-background" />
    </motion.button>
  );
}
