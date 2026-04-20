import { useRef, useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Loader2, Download, Upload, Image as ImageIcon, Palette, FileText, X } from "lucide-react";
import { DocumentTemplate, DocumentData, DocumentTemplateStyle } from "./DocumentTemplate";
import { exportNodeToPDF } from "@/lib/pdf-export";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Initial data for the document. Builder lets user tweak before export. */
  initialData: Omit<DocumentData, "style" | "brandColor" | "studioName" | "studioLogoUrl" | "studioAddress" | "studioEmail" | "studioPhone" | "studioWebsite" | "studioGst">;
  /** Callback to save cover image URL back to the parent record. */
  onPersistCover?: (url: string | null) => Promise<void> | void;
};

const TEMPLATE_STYLES: { value: DocumentTemplateStyle; label: string; description: string }[] = [
  { value: "minimal", label: "Minimal", description: "Clean white with accent line" },
  { value: "elegant", label: "Elegant", description: "Black + accent typography" },
  { value: "bold", label: "Bold", description: "Full color header banner" },
];

const BRAND_COLORS = [
  { value: "#a855f7", label: "Purple" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#ec4899", label: "Pink" },
  { value: "#10b981", label: "Green" },
  { value: "#f59e0b", label: "Amber" },
  { value: "#ef4444", label: "Red" },
  { value: "#0ea5e9", label: "Sky" },
  { value: "#111827", label: "Black" },
];

export function DocumentBuilder({ open, onOpenChange, initialData, onPersistCover }: Props) {
  const { organization } = useOrg();
  const previewRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [style, setStyle] = useState<DocumentTemplateStyle>("minimal");
  const [brandColor, setBrandColor] = useState<string>(organization?.primary_color || "#a855f7");
  const [logoUrl, setLogoUrl] = useState<string | null>(organization?.logo_url || null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(initialData.coverImageUrl || null);
  const [gallery, setGallery] = useState<string[]>(initialData.gallery || []);
  const [introText, setIntroText] = useState<string>(initialData.introText || "");
  const [uploading, setUploading] = useState<null | "logo" | "cover" | "gallery">(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (organization) {
      setBrandColor(organization.primary_color || "#a855f7");
      setLogoUrl(organization.logo_url || null);
    }
  }, [organization]);

  useEffect(() => {
    setCoverImageUrl(initialData.coverImageUrl || null);
    setIntroText(initialData.introText || "");
    setGallery(initialData.gallery || []);
  }, [initialData]);

  const uploadFile = async (file: File, kind: "logo" | "cover" | "gallery"): Promise<string | null> => {
    if (!organization) { toast.error("No studio loaded"); return null; }
    setUploading(kind);
    const ext = file.name.split(".").pop() || "png";
    const path = `${organization.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("studio-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error(error.message);
      setUploading(null);
      return null;
    }
    const { data } = supabase.storage.from("studio-assets").getPublicUrl(path);
    setUploading(null);
    return data.publicUrl;
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "logo");
    if (url && organization) {
      setLogoUrl(url);
      // Also persist to the organizations row so it sticks across docs
      await supabase.from("organizations").update({ logo_url: url }).eq("id", organization.id);
      toast.success("Logo saved");
    }
    e.target.value = "";
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file, "cover");
    if (url) {
      setCoverImageUrl(url);
      if (onPersistCover) await onPersistCover(url);
      toast.success("Cover image added");
    }
    e.target.value = "";
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const uploaded: string[] = [];
    for (const f of files.slice(0, 6 - gallery.length)) {
      const url = await uploadFile(f, "gallery");
      if (url) uploaded.push(url);
    }
    if (uploaded.length > 0) {
      setGallery(prev => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} photo${uploaded.length === 1 ? "" : "s"} added`);
    }
    e.target.value = "";
  };

  const removeGalleryImage = (url: string) => {
    setGallery(prev => prev.filter(g => g !== url));
  };

  const removeCover = async () => {
    setCoverImageUrl(null);
    if (onPersistCover) await onPersistCover(null);
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const filename = `${initialData.kind}-${initialData.documentNumber || "document"}.pdf`;
      await exportNodeToPDF(previewRef.current, { filename });
      toast.success("PDF downloaded");
    } catch (e: any) {
      toast.error(e.message || "Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const documentData: DocumentData = {
    ...initialData,
    style,
    brandColor,
    studioName: organization?.name || "Studio",
    studioLogoUrl: logoUrl,
    studioAddress: organization?.address || organization?.city || null,
    studioEmail: organization?.email || null,
    studioPhone: organization?.phone || null,
    studioWebsite: organization?.website || null,
    studioGst: organization?.gst_number || null,
    coverImageUrl,
    introText: introText || null,
    gallery,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[92vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-4 pb-2 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> PDF Builder — {initialData.kind}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pick a template, add your logo &amp; cover photo, customize the look, then download as PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-0">
          {/* Controls panel */}
          <aside className="border-r overflow-y-auto p-4 bg-muted/30">
            <Tabs defaultValue="style">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="style">Style</TabsTrigger>
                <TabsTrigger value="brand">Brand</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="space-y-3 mt-4">
                <Label className="text-xs">Template</Label>
                <div className="space-y-2">
                  {TEMPLATE_STYLES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setStyle(t.value)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        style === t.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="font-medium text-sm">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="brand" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2">
                    <Palette className="h-3 w-3" /> Accent color
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {BRAND_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setBrandColor(c.value)}
                        className={`h-10 rounded-lg border-2 transition-all ${
                          brandColor === c.value ? "border-foreground scale-105" : "border-transparent"
                        }`}
                        style={{ background: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="mt-2 h-9 p-1"
                  />
                </div>

                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2">
                    <ImageIcon className="h-3 w-3" /> Studio logo
                  </Label>
                  {logoUrl ? (
                    <div className="flex items-center gap-2">
                      <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain bg-white rounded-lg border p-1" />
                      <Button
                        variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}
                        disabled={uploading === "logo"}
                      >
                        {uploading === "logo" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Replace"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline" size="sm" className="w-full"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading === "logo"}
                    >
                      {uploading === "logo" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                      Upload logo
                    </Button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs">Intro / personal message</Label>
                  <Textarea
                    value={introText}
                    onChange={(e) => setIntroText(e.target.value)}
                    placeholder="Dear client, thank you for considering us for your special day…"
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2">
                    <ImageIcon className="h-3 w-3" /> Cover photo (hero image)
                  </Label>
                  {coverImageUrl ? (
                    <div className="relative">
                      <img src={coverImageUrl} alt="Cover" className="w-full h-24 object-cover rounded-lg border" />
                      <Button
                        variant="destructive" size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={removeCover}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline" size="sm" className="w-full"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploading === "cover"}
                    >
                      {uploading === "cover" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                      Upload cover
                    </Button>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </div>

                <div>
                  <Label className="text-xs flex items-center gap-1 mb-2">
                    <ImageIcon className="h-3 w-3" /> Portfolio gallery (max 6)
                  </Label>
                  {gallery.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {gallery.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-16 object-cover rounded border" />
                          <button
                            onClick={() => removeGalleryImage(url)}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {gallery.length < 6 && (
                    <Button
                      variant="outline" size="sm" className="w-full"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={uploading === "gallery"}
                    >
                      {uploading === "gallery" ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                      Add photos
                    </Button>
                  )}
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleGalleryUpload}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </aside>

          {/* Preview panel */}
          <div className="overflow-y-auto bg-muted/50 p-6">
            <div className="mx-auto" style={{ width: "794px", maxWidth: "100%" }}>
              <div style={{ transformOrigin: "top center" }} className="shadow-lg rounded overflow-hidden bg-white">
                <DocumentTemplate ref={previewRef} data={documentData} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t p-3 shrink-0 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Preview shown at actual A4 size. Scroll to view full document.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={handleDownload} disabled={exporting} className="gap-2">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
