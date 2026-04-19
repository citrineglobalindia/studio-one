import { useState } from "react";
import { Star, Send } from "lucide-react";
import { toast } from "sonner";
import { RoleSubpageHeader } from "@/components/role-mobile/RoleSubpageHeader";

const TOPICS = ["App experience", "Bug report", "Feature request", "Other"];

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!rating) return toast.error("Please rate your experience");
    if (!message.trim()) return toast.error("Please share a message");
    toast.success("Thanks for the feedback! 💛");
    setRating(0);
    setMessage("");
  };

  return (
    <RoleSubpageHeader title="Send Feedback" back="/m/settings">
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <p className="text-[13px] font-semibold text-foreground mb-3 text-center">How is StudioAi treating you?</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className="p-1.5 active:scale-90 transition-transform"
              aria-label={`Rate ${n} stars`}
            >
              <Star
                className={`h-8 w-8 ${
                  n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 mb-2">Topic</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => setTopic(t)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
              topic === t
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold px-2 mb-2">Your message</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell us what's on your mind..."
        rows={6}
        className="w-full p-3.5 rounded-2xl bg-card border border-border text-[13px] outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
      />

      <button
        onClick={handleSubmit}
        className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <Send className="h-4 w-4" />
        Send Feedback
      </button>
    </RoleSubpageHeader>
  );
}
