import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight, ArrowLeft, Camera, Building2, Users, Palette, Check, Loader2, Upload,
  MapPin, Phone, Globe, Instagram, Sparkles
} from "lucide-react";

const steps = [
  { id: 1, title: "Studio Info", desc: "Tell us about your studio", icon: Building2 },
  { id: 2, title: "Team Size", desc: "How big is your team?", icon: Users },
  { id: 3, title: "Branding", desc: "Customize your workspace", icon: Palette },
  { id: 4, title: "Get Started", desc: "You're all set!", icon: Sparkles },
];

const teamSizes = [
  { value: "solo", label: "Solo (Just me)", desc: "Freelance photographer" },
  { value: "small", label: "Small (2-5)", desc: "Small studio team" },
  { value: "medium", label: "Medium (6-15)", desc: "Growing studio" },
  { value: "large", label: "Large (16+)", desc: "Full production house" },
];

const specialties = [
  "Wedding", "Pre-Wedding", "Portrait", "Commercial", "Fashion",
  "Product", "Event", "Real Estate", "Newborn", "Film"
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    studioName: "",
    city: "",
    phone: "",
    website: "",
    instagram: "",
    teamSize: "",
    selectedSpecialties: [] as string[],
    primaryColor: "#C4973B",
  });

  const toggleSpecialty = (s: string) => {
    setData(prev => ({
      ...prev,
      selectedSpecialties: prev.selectedSpecialties.includes(s)
        ? prev.selectedSpecialties.filter(x => x !== s)
        : [...prev.selectedSpecialties, s]
    }));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error("Not authenticated");

      // Generate slug from studio name
      const slug = data.studioName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: data.studioName,
          slug,
          owner_id: user.id,
          city: data.city || null,
          phone: data.phone || null,
          website: data.website || null,
          instagram: data.instagram || null,
          team_size: data.teamSize,
          specialties: data.selectedSpecialties,
          primary_color: data.primaryColor,
        })
        .select()
        .single();
      if (orgError) throw orgError;

      // Add user as owner member
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: "owner",
        });
      if (memberError) throw memberError;

      // Get starter plan and create trial subscription
      const { data: starterPlan } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("slug", "starter")
        .single();

      if (starterPlan) {
        await supabase.from("subscriptions").insert({
          organization_id: org.id,
          plan_id: starterPlan.id,
          status: "trial",
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // Update profile
      await supabase
        .from("profiles")
        .update({ display_name: data.studioName })
        .eq("user_id", user.id);

      toast.success("Welcome to StudioAi! Your workspace is ready.");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 1) return data.studioName.length > 0;
    if (step === 2) return data.teamSize.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-10">
      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                step >= s.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-12 sm:w-20 mx-1.5 transition-colors ${
                  step > s.id ? "bg-primary" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <h2 className="text-xl font-bold">{steps[step - 1].title}</h2>
          <p className="text-sm text-muted-foreground">{steps[step - 1].desc}</p>
        </div>
      </div>

      <Card className="w-full max-w-lg border-border/50 shadow-xl">
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Studio Name *</Label>
                  <Input
                    value={data.studioName}
                    onChange={e => setData(p => ({ ...p, studioName: e.target.value }))}
                    placeholder="e.g. PixelPerfect Studios"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">City</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={data.city}
                        onChange={e => setData(p => ({ ...p, city: e.target.value }))}
                        placeholder="Mumbai"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Phone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={data.phone}
                        onChange={e => setData(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+91..."
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Website</Label>
                    <div className="relative mt-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={data.website}
                        onChange={e => setData(p => ({ ...p, website: e.target.value }))}
                        placeholder="www.studio.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground">Instagram</Label>
                    <div className="relative mt-1">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        value={data.instagram}
                        onChange={e => setData(p => ({ ...p, instagram: e.target.value }))}
                        placeholder="@studio"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Specialties</Label>
                  <div className="flex flex-wrap gap-2">
                    {specialties.map(s => (
                      <Badge
                        key={s}
                        variant={data.selectedSpecialties.includes(s) ? "default" : "outline"}
                        className="cursor-pointer transition-all hover:scale-105"
                        onClick={() => toggleSpecialty(s)}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {teamSizes.map(t => (
                    <Card
                      key={t.value}
                      className={`cursor-pointer transition-all hover:scale-[1.02] ${
                        data.teamSize === t.value ? "border-primary bg-primary/5" : "border-border/50"
                      }`}
                      onClick={() => setData(p => ({ ...p, teamSize: t.value }))}
                    >
                      <CardContent className="p-4 text-center">
                        <Users className={`h-6 w-6 mx-auto mb-2 ${data.teamSize === t.value ? "text-primary" : "text-muted-foreground"}`} />
                        <div className="font-semibold text-sm">{t.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Studio Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click or drag to upload your logo</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG • Max 2MB</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-2 block">Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={data.primaryColor}
                      onChange={e => setData(p => ({ ...p, primaryColor: e.target.value }))}
                      className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                    />
                    <Input
                      value={data.primaryColor}
                      onChange={e => setData(p => ({ ...p, primaryColor: e.target.value }))}
                      className="w-32 font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      {["#C4973B", "#3B82F6", "#8B5CF6", "#EC4899", "#10B981"].map(c => (
                        <button
                          key={c}
                          onClick={() => setData(p => ({ ...p, primaryColor: c }))}
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            data.primaryColor === c ? "border-foreground scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center py-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">You're All Set!</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                  {data.studioName || "Your studio"} workspace is ready. Start managing your leads, clients, and projects.
                </p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  {[
                    { label: "Studio", value: data.studioName || "—" },
                    { label: "Team", value: teamSizes.find(t => t.value === data.teamSize)?.label || "—" },
                    { label: "Specialties", value: data.selectedSpecialties.length > 0 ? data.selectedSpecialties.slice(0, 2).join(", ") : "—" },
                  ].map(s => (
                    <div key={s.label} className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="font-medium truncate">{s.value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nav buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {step < 4 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="gap-1"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={loading} className="gap-1">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Launch Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
