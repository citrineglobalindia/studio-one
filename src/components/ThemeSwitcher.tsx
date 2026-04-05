import { useTheme, ThemeColor } from "@/contexts/ThemeContext";
import { Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const themes: { value: ThemeColor; label: string; preview: string }[] = [
  { value: "black", label: "Dark Gold", preview: "bg-[hsl(220,20%,7%)]" },
  { value: "white", label: "Light", preview: "bg-[hsl(0,0%,98%)]" },
  { value: "blue", label: "Midnight Blue", preview: "bg-[hsl(222,47%,8%)]" },
  { value: "ocean", label: "Ocean Breeze", preview: "bg-gradient-to-br from-[hsl(210,100%,97%)] to-[hsl(210,80%,92%)]" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className={`h-5 w-5 rounded-full border-2 ${t.preview} ${theme === t.value ? "border-primary ring-2 ring-primary/30" : "border-border"}`} />
            <span className={theme === t.value ? "font-semibold text-primary" : ""}>{t.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
