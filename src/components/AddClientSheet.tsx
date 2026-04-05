import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  UserPlus, User, Heart, Phone, Mail, MapPin, CalendarDays,
  Sparkles, IndianRupee, Tag, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { type Client } from "@/data/clients-data";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  partnerName: z.string().trim().min(2, "Partner name is required").max(100),
  phone: z.string().trim().min(10, "Enter a valid phone number").max(15),
  email: z.string().trim().email("Enter a valid email").max(255),
  city: z.string().trim().min(2, "City is required").max(100),
  address: z.string().trim().max(200).optional(),
  source: z.string().min(1, "Select a source"),
  weddingDate: z.string().optional(),
  status: z.enum(["active", "past", "vip"]),
  notes: z.string().trim().max(500).optional(),
  tags: z.string().trim().max(200).optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

interface AddClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (client: Client) => void;
}

const sources = ["Instagram", "Referral", "Website", "Google", "WhatsApp", "Facebook", "Other"];

export function AddClientSheet({ open, onOpenChange, onAdd }: AddClientSheetProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      partnerName: "",
      phone: "",
      email: "",
      city: "",
      address: "",
      source: "",
      weddingDate: "",
      status: "active",
      notes: "",
      tags: "",
    },
  });

  const onSubmit = (values: ClientFormValues) => {
    const newClient: Client = {
      id: `c${Date.now()}`,
      name: values.name,
      partnerName: values.partnerName,
      phone: values.phone,
      email: values.email,
      city: values.city,
      address: values.address || undefined,
      status: values.status,
      totalSpend: 0,
      pendingAmount: 0,
      projects: 0,
      lastProject: "–",
      source: values.source,
      rating: 0,
      weddingDate: values.weddingDate || undefined,
      notes: values.notes || undefined,
      tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      activities: [
        {
          id: `a${Date.now()}`,
          type: "project",
          title: "Client created",
          description: `${values.name} & ${values.partnerName} added as a new client`,
          date: new Date().toISOString().slice(0, 10),
        },
      ],
      documents: [],
      createdAt: new Date().toISOString().slice(0, 10),
    };

    onAdd(newClient);
    toast.success("Client added successfully", {
      description: `${values.name} & ${values.partnerName}`,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-base font-display">
            <UserPlus className="h-5 w-5 text-primary" /> Add New Client
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Couple Info */}
            <div className="space-y-1 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Heart className="h-3 w-3" /> Couple Details
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Client Name *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Priya Sharma" className="pl-9 h-9 text-sm" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="partnerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Partner Name *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Rahul Kapoor" className="pl-9 h-9 text-sm" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Info */}
            <div className="space-y-1 mb-1 pt-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Contact Info
              </p>
            </div>

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Phone *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="+91 99887 76655" className="pl-9 h-9 text-sm" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Email *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="priya@gmail.com" className="pl-9 h-9 text-sm" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">City *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input placeholder="Delhi" className="pl-9 h-9 text-sm" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weddingDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Wedding Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input type="date" className="pl-9 h-9 text-sm" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address (optional)" className="h-9 text-sm" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Source & Status */}
            <div className="space-y-1 mb-1 pt-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Source & Status
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Lead Source *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sources.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags & Notes */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1.5">
                    <Tag className="h-3 w-3" /> Tags
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="premium, referral, candid (comma separated)" className="h-9 text-sm" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs flex items-center gap-1.5">
                    <FileText className="h-3 w-3" /> Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special preferences or requirements..." className="text-sm min-h-[80px] resize-none" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Submit */}
            <div className="flex gap-2 pt-3">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-xl gap-2">
                <UserPlus className="h-4 w-4" /> Add Client
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
