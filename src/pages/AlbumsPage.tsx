import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookImage, Plus, Eye, MessageSquare, Printer, Check, Clock, RefreshCw, Truck,
  Upload, FileText, Download, Trash2, Search, Filter, X, ChevronDown,
  AlertTriangle, Calendar, User, Folder, ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Album {
  id: string;
  client_name: string;
  project_name: string;
  album_type: string;
  status: string;
  notes: string | null;
  pdf_file_name: string | null;
  pdf_file_path: string | null;
  pdf_file_size: number | null;
  pages: number | null;
  designer: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; style: string; icon: typeof Clock }> = {
  uploaded: { label: "Uploaded", style: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Upload },
  design: { label: "In Design", style: "bg-sky-500/10 text-sky-500 border-sky-500/20", icon: BookImage },
  "client-review": { label: "Client Review", style: "bg-primary/10 text-primary border-primary/20", icon: Eye },
  revision: { label: "Revision", style: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: RefreshCw },
  approved: { label: "Approved", style: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Check },
  printing: { label: "Printing", style: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Printer },
  shipped: { label: "Shipped", style: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", icon: Truck },
  delivered: { label: "Delivered", style: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: Check },
};

const typeLabels: Record<string, string> = {
  "flush-mount": "Flush Mount",
  "coffee-table": "Coffee Table Book",
  photobook: "Photo Book",
  canvas: "Canvas Print",
  magazine: "Magazine Style",
};

const clientProjects = [
  { client: "Priya & Rahul", projects: ["Wedding Ceremony", "Mehendi", "Sangeet", "Haldi"] },
  { client: "Meera & Aditya", projects: ["Wedding", "Reception", "Pre-Wedding Shoot"] },
  { client: "Kavya & Arjun", projects: ["Wedding", "Engagement"] },
  { client: "Nisha & Dev", projects: ["Wedding", "Haldi", "Sangeet"] },
  { client: "Ananya & Vikram", projects: ["Destination Wedding"] },
  { client: "Sneha & Rohan", projects: ["Pre-Wedding Shoot"] },
];

const designers = ["Priya Verma", "Neha Gupta", "Suresh Nair"];

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClient, setFilterClient] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const [addSheet, setAddSheet] = useState(false);
  const [detailSheet, setDetailSheet] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  // New album form
  const [newAlbum, setNewAlbum] = useState({
    client_name: "", project_name: "", album_type: "flush-mount",
    designer: "", notes: "", pages: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Available projects for selected client
  const availableProjects = useMemo(() => {
    const cp = clientProjects.find(c => c.client === newAlbum.client_name);
    return cp?.projects || [];
  }, [newAlbum.client_name]);

  // Fetch albums
  const fetchAlbums = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("albums").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load albums"); console.error(error); }
    else setAlbums(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAlbums(); }, []);

  // Filter logic
  const filtered = useMemo(() => {
    let list = albums;
    if (activeTab !== "all") {
      if (activeTab === "in-progress") list = list.filter(a => ["uploaded", "design", "revision"].includes(a.status));
      else if (activeTab === "review") list = list.filter(a => a.status === "client-review");
      else if (activeTab === "completed") list = list.filter(a => ["approved", "printing", "shipped", "delivered"].includes(a.status));
    }
    if (filterStatus !== "all") list = list.filter(a => a.status === filterStatus);
    if (filterClient !== "all") list = list.filter(a => a.client_name === filterClient);
    if (search) list = list.filter(a =>
      a.client_name.toLowerCase().includes(search.toLowerCase()) ||
      a.project_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.pdf_file_name?.toLowerCase().includes(search.toLowerCase()))
    );
    return list;
  }, [albums, search, filterStatus, filterClient, activeTab]);

  // Stats
  const stats = useMemo(() => ({
    total: albums.length,
    uploaded: albums.filter(a => a.status === "uploaded").length,
    inDesign: albums.filter(a => ["design", "revision"].includes(a.status)).length,
    review: albums.filter(a => a.status === "client-review").length,
    approved: albums.filter(a => a.status === "approved").length,
    printing: albums.filter(a => a.status === "printing").length,
    delivered: albums.filter(a => ["shipped", "delivered"].includes(a.status)).length,
  }), [albums]);

  // Upload PDF & create album
  const handleCreateAlbum = async () => {
    if (!newAlbum.client_name || !newAlbum.project_name) {
      toast.error("Client and project are required");
      return;
    }
    if (!selectedFile) {
      toast.error("Please select a PDF file");
      return;
    }

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split(".").pop();
      const filePath = `${newAlbum.client_name.replace(/\s+/g, "-")}/${newAlbum.project_name.replace(/\s+/g, "-")}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("album-pdfs")
        .upload(filePath, selectedFile, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      // Insert album record
      const { error: insertError } = await supabase.from("albums").insert({
        client_name: newAlbum.client_name,
        project_name: newAlbum.project_name,
        album_type: newAlbum.album_type,
        designer: newAlbum.designer || null,
        notes: newAlbum.notes || null,
        pages: newAlbum.pages || null,
        pdf_file_name: selectedFile.name,
        pdf_file_path: filePath,
        pdf_file_size: selectedFile.size,
        status: "uploaded",
      });

      if (insertError) throw insertError;

      toast.success("Album uploaded successfully!");
      setAddSheet(false);
      setNewAlbum({ client_name: "", project_name: "", album_type: "flush-mount", designer: "", notes: "", pages: 0 });
      setSelectedFile(null);
      fetchAlbums();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Get public URL for PDF
  const getPdfUrl = (path: string) => {
    const { data } = supabase.storage.from("album-pdfs").getPublicUrl(path);
    return data.publicUrl;
  };

  // Update album status
  const updateStatus = async (albumId: string, status: string) => {
    const { error } = await supabase.from("albums").update({ status }).eq("id", albumId);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Status updated to ${statusConfig[status]?.label || status}`);
    fetchAlbums();
    if (selectedAlbum?.id === albumId) {
      setSelectedAlbum(prev => prev ? { ...prev, status } : null);
    }
  };

  // Delete album
  const deleteAlbum = async (album: Album) => {
    if (album.pdf_file_path) {
      await supabase.storage.from("album-pdfs").remove([album.pdf_file_path]);
    }
    const { error } = await supabase.from("albums").delete().eq("id", album.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Album deleted");
    setDetailSheet(false);
    fetchAlbums();
  };

  // Replace PDF
  const replacePdf = async (album: Album, file: File) => {
    setUploading(true);
    try {
      // Remove old file
      if (album.pdf_file_path) {
        await supabase.storage.from("album-pdfs").remove([album.pdf_file_path]);
      }
      const fileExt = file.name.split(".").pop();
      const filePath = `${album.client_name.replace(/\s+/g, "-")}/${album.project_name.replace(/\s+/g, "-")}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("album-pdfs")
        .upload(filePath, file, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.from("albums").update({
        pdf_file_name: file.name,
        pdf_file_path: filePath,
        pdf_file_size: file.size,
        status: "uploaded",
      }).eq("id", album.id);
      if (updateError) throw updateError;

      toast.success("PDF replaced successfully");
      fetchAlbums();
      setSelectedAlbum(prev => prev ? { ...prev, pdf_file_name: file.name, pdf_file_path: filePath, pdf_file_size: file.size, status: "uploaded" } : null);
    } catch (err: any) {
      toast.error(err.message || "Replace failed");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openDetail = (album: Album) => { setSelectedAlbum(album); setDetailSheet(true); };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookImage className="h-6 w-6 text-primary" /> Albums & Prints
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} albums · {stats.inDesign} in progress · {stats.review} in review
          </p>
        </div>
        <Button onClick={() => setAddSheet(true)} className="gap-2">
          <Upload className="h-4 w-4" /> Upload Album PDF
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = albums.filter(a => a.status === key).length;
          const StatusIcon = config.icon;
          return (
            <Card key={key} className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => setFilterStatus(filterStatus === key ? "all" : key)}>
              <CardContent className="p-3 text-center">
                <StatusIcon className={`h-4 w-4 mx-auto mb-1 ${config.style.includes("text-") ? config.style.split(" ").find(c => c.startsWith("text-")) : "text-muted-foreground"}`} />
                <p className="text-lg font-bold text-foreground">{count}</p>
                <p className="text-[10px] text-muted-foreground truncate">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/30 w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="text-xs">All Albums</TabsTrigger>
          <TabsTrigger value="in-progress" className="text-xs">In Progress</TabsTrigger>
          <TabsTrigger value="review" className="text-xs">Client Review</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search albums, clients, files..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Clients" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clientProjects.map(cp => <SelectItem key={cp.client} value={cp.client}>{cp.client}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Albums List */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading albums...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <BookImage className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No albums found</p>
            <p className="text-sm text-muted-foreground mt-1">Upload a PDF album to get started</p>
            <Button className="mt-4 gap-2" onClick={() => setAddSheet(true)}>
              <Upload className="h-4 w-4" /> Upload Album
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((album, i) => {
              const config = statusConfig[album.status] || statusConfig.uploaded;
              const StatusIcon = config.icon;
              return (
                <motion.div key={album.id} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}>
                  <Card className="border-border/50 hover:border-primary/30 transition-all cursor-pointer group"
                    onClick={() => openDetail(album)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${config.style.split(" ").slice(0, 2).join(" ")}`}>
                          <FileText className="h-5 w-5" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="text-sm font-semibold text-foreground truncate">{album.client_name}</h3>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${config.style}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Folder className="h-3 w-3" /> {album.project_name}
                            <span>·</span>
                            <span>{typeLabels[album.album_type] || album.album_type}</span>
                            {album.pages ? <><span>·</span><span>{album.pages} pages</span></> : null}
                          </p>
                          {album.pdf_file_name && (
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                              <FileText className="h-3 w-3" /> {album.pdf_file_name}
                              <span className="text-muted-foreground/50">({formatFileSize(album.pdf_file_size)})</span>
                            </p>
                          )}
                        </div>

                        {/* Right side */}
                        <div className="text-right shrink-0 hidden sm:block">
                          {album.designer && (
                            <div className="flex items-center gap-1.5 justify-end mb-1">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                  {album.designer.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] text-muted-foreground">{album.designer}</span>
                            </div>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(album.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={detailSheet} onOpenChange={setDetailSheet}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selectedAlbum && (() => {
            const config = statusConfig[selectedAlbum.status] || statusConfig.uploaded;
            const StatusIcon = config.icon;
            return (
              <>
                <SheetHeader>
                  <SheetTitle className="text-left text-lg flex items-center gap-2">
                    <BookImage className="h-5 w-5 text-primary" />
                    Album Details
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-5">
                  {/* Client & Project */}
                  <div className="bg-muted/30 rounded-xl p-4">
                    <h3 className="text-base font-semibold text-foreground">{selectedAlbum.client_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Folder className="h-3.5 w-3.5" /> {selectedAlbum.project_name}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className={config.style}>
                        <StatusIcon className="h-3 w-3 mr-1" />{config.label}
                      </Badge>
                      <Badge variant="outline" className="bg-muted/50">
                        {typeLabels[selectedAlbum.album_type] || selectedAlbum.album_type}
                      </Badge>
                      {selectedAlbum.pages ? <Badge variant="outline" className="bg-muted/50">{selectedAlbum.pages} pages</Badge> : null}
                    </div>
                  </div>

                  {/* PDF File Info */}
                  {selectedAlbum.pdf_file_path && (
                    <Card className="border-border/50">
                      <CardContent className="p-4">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" /> PDF File
                        </h4>
                        <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{selectedAlbum.pdf_file_name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatFileSize(selectedAlbum.pdf_file_size)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="gap-1.5 flex-1" asChild>
                            <a href={getPdfUrl(selectedAlbum.pdf_file_path)} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3.5 w-3.5" /> View PDF
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 flex-1" asChild>
                            <a href={getPdfUrl(selectedAlbum.pdf_file_path)} download={selectedAlbum.pdf_file_name}>
                              <Download className="h-3.5 w-3.5" /> Download
                            </a>
                          </Button>
                        </div>
                        <div className="mt-2">
                          <input type="file" accept=".pdf" ref={detailFileInputRef} className="hidden"
                            onChange={e => { if (e.target.files?.[0] && selectedAlbum) replacePdf(selectedAlbum, e.target.files[0]); }} />
                          <Button variant="ghost" size="sm" className="gap-1.5 w-full text-muted-foreground"
                            onClick={() => detailFileInputRef.current?.click()} disabled={uploading}>
                            <RefreshCw className={`h-3.5 w-3.5 ${uploading ? "animate-spin" : ""}`} /> Replace PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Meta Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Designer", value: selectedAlbum.designer || "Not assigned" },
                      { label: "Uploaded", value: new Date(selectedAlbum.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                      { label: "Last Updated", value: new Date(selectedAlbum.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
                      { label: "Album Type", value: typeLabels[selectedAlbum.album_type] || selectedAlbum.album_type },
                    ].map(m => (
                      <div key={m.label} className="bg-muted/30 rounded-lg p-3">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Notes */}
                  {selectedAlbum.notes && (
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                      <p className="text-sm text-foreground">{selectedAlbum.notes}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Status Actions */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(statusConfig)
                        .filter(([key]) => key !== selectedAlbum.status)
                        .map(([key, cfg]) => {
                          const Icon = cfg.icon;
                          return (
                            <Button key={key} size="sm" variant="outline" className="gap-1.5 text-xs"
                              onClick={() => updateStatus(selectedAlbum.id, key)}>
                              <Icon className="h-3 w-3" /> {cfg.label}
                            </Button>
                          );
                        })}
                    </div>
                  </div>

                  <Separator />

                  {/* Delete */}
                  <Button variant="destructive" size="sm" className="gap-1.5"
                    onClick={() => deleteAlbum(selectedAlbum)}>
                    <Trash2 className="h-3.5 w-3.5" /> Delete Album
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Add Album Sheet */}
      <Sheet open={addSheet} onOpenChange={setAddSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" /> Upload Album PDF
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Client Select */}
            <div>
              <label className="text-sm font-medium text-foreground">Client *</label>
              <Select value={newAlbum.client_name} onValueChange={v => setNewAlbum(p => ({ ...p, client_name: v, project_name: "" }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clientProjects.map(cp => <SelectItem key={cp.client} value={cp.client}>{cp.client}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Project Select */}
            <div>
              <label className="text-sm font-medium text-foreground">Project *</label>
              <Select value={newAlbum.project_name} onValueChange={v => setNewAlbum(p => ({ ...p, project_name: v }))}
                disabled={!newAlbum.client_name}>
                <SelectTrigger className="mt-1"><SelectValue placeholder={newAlbum.client_name ? "Select project" : "Select client first"} /></SelectTrigger>
                <SelectContent>
                  {availableProjects.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* PDF Upload Area */}
            <div>
              <label className="text-sm font-medium text-foreground">Album PDF *</label>
              <input type="file" accept=".pdf" ref={fileInputRef} className="hidden"
                onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
              {selectedFile ? (
                <div className="mt-2 border border-border rounded-lg p-3 flex items-center gap-3 bg-muted/30">
                  <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => setSelectedFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-all">
                  <Upload className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-medium">Click to upload PDF</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Max 20MB · PDF files only</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Album Type</label>
                <Select value={newAlbum.album_type} onValueChange={v => setNewAlbum(p => ({ ...p, album_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Pages</label>
                <Input className="mt-1" type="number" value={newAlbum.pages || ""} onChange={e => setNewAlbum(p => ({ ...p, pages: parseInt(e.target.value) || 0 }))} placeholder="e.g. 40" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Designer</label>
              <Select value={newAlbum.designer} onValueChange={v => setNewAlbum(p => ({ ...p, designer: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Assign designer" /></SelectTrigger>
                <SelectContent>
                  {designers.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea className="mt-1 min-h-[80px]" value={newAlbum.notes} onChange={e => setNewAlbum(p => ({ ...p, notes: e.target.value }))} placeholder="Special instructions, client preferences..." />
            </div>

            <Button className="w-full mt-4 gap-2" onClick={handleCreateAlbum} disabled={uploading}>
              {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload & Create Album"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
