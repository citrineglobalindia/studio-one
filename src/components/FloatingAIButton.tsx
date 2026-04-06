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
        "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full",
        "bg-gradient-to-br from-primary to-primary/80",
        "text-primary-foreground shadow-lg shadow-primary/25",
        "flex items-center justify-center",
        "hover:shadow-xl hover:shadow-primary/30 transition-shadow",
        "ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
      )}
      title="AI Assistant"
    >
      <Bot className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background" />
    </motion.button>
  );
}
