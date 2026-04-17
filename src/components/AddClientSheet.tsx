import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Sparkles, IndianRupee, FileText,
} from "lucide-react";

const clientSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    partner_name: z.string().trim().max(100).optional().or(z.literal("")),
    phone: z.string().trim().min(10, "Enter a valid phone number").max(15),
    email: z.string().trim().email("Enter a valid email").max(255).optional().or(z.literal("")),
    city: z.string().trim().max(100).optional().or(z.literal("")),
    source: z.string().min(1, "Select a source"),
    event_types: z.array(z.string()).default([]),
    other_event_type: z.string().trim().max(50).optional().or(z.literal("")),
    event_date: z.string().optional().or(z.literal("")),
    delivery_date: z.string().optional().or(z.literal("")),
    budget: z.string().optional().or(z.literal("")),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  })
  .refine(
    (v) => {
      // If "Other" is ticked, require the custom text
      if (v.event_types.includes("Other")) {
        return !!v.other_event_type && v.other_event_type.trim().length > 0;
      }
      return true;
    },
    { message: "Please specify the other event type", path: ["other_event_type"] }
  );

type ClientFormValues = z.infer<typeof clientSchema>;

interface AddClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (client: any) => void;
}

const sources = ["Instagram", "Referral", "Website", "Google", "WhatsApp", "Facebook", "Other"];
const EVENT_TYPES = ["Wedding", "Pre-Wedding", "Engagement", "Reception", "Corporate", "Birthday", "Other"];

export function AddClientSheet({ open, onOpenChange, onAdd }: AddClientSheetProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      partner_name: "",
      phone: "",
      email: "",
      city: "",
      source: "",
      event_types: [],
      other_event_type: "",
      event_date: "",
      delivery_date: "",
      budget: "",
      notes: "",
    },
  });

  const selectedTypes = form.watch("event_types");
  const showOtherInput = selectedTypes.includes("Other");

  const onSubmit = (values: ClientFormValues) => {
    // If "Other" was chosen, replace the literal "Other" token with the custom text.
    const finalTypes = values.event_types.map((t) =>
      t === "Other" ? (values.other_event_type.trim() || "Other") : t
    );

    onAdd({
      name: values.name,
      partner_name: values.partner_name || null,
      phone: values.phone || null,
      email: values.email || null,
      city: values.city || null,
      source: values.source || null,
      // New array column:
      event_types: finalTypes,
      // Legacy single-string column — keep writing a joined value so existing
      // tables / filters that still read event_type keep working.
      event_type: finalTypes.length > 0 ? finalTypes.join(", ") : null,
      event_date: values.event_date || null,
      delivery_date: values.delivery_date || null,
      budget: values.budget ? parseFloat(values.budget) : null,
      notes: values.notes || null,
      // status is set by DB default ('active') — no longer collected from the form
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
              <FormField control={form.control} name="name" render={({ field }) => (
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
              )} />
              <FormField control={form.control} name="partner_name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Partner Name</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Rahul Kapoor" className="pl-9 h-9 text-sm" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            </div>

            {/* Contact Info */}
            <div className="space-y-1 mb-1 pt-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> Contact Info
              </p>
            </div>

            <FormField control={form.control} name="phone" render={({ field }) => (
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
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="priya@gmail.com" className="pl-9 h-9 text-sm" {...field} />
                  </div>
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Location & Dates */}
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">City</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Delhi" className="pl-9 h-9 text-sm" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
              <FormField control={form.control} name="event_date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Event Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input type="date" className="pl-9 h-9 text-sm" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="delivery_date" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Delivery Date</FormLabel>
                  <FormControl>
                    <Input type="date" className="h-9 text-sm" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
              <FormField control={form.control} name="budget" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Budget (₹)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input type="number" placeholder="300000" className="pl-9 h-9 text-sm" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            </div>

            {/* Source & Event Types */}
            <div className="space-y-1 mb-1 pt-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Source & Events
              </p>
            </div>

            <FormField control={form.control} name="source" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Lead Source *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sources.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

            {/* Event Types — multi-select checkboxes */}
            <FormField
              control={form.control}
              name="event_types"
              render={() => (
                <FormItem>
                  <FormLabel className="text-xs">Event Types</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {EVENT_TYPES.map((evt) => (
                      <FormField
                        key={evt}
                        control={form.control}
                        name="event_types"
                        render={({ field }) => {
                          const checked = field.value?.includes(evt);
                          return (
                            <label
                              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer select-none transition-colors ${
                                checked
                                  ? "bg-primary/10 border-primary/40 text-primary"
                                  : "bg-card border-border hover:border-primary/20"
                              }`}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => {
                                  const current = field.value ?? [];
                                  if (value) {
                                    field.onChange([...current, evt]);
                                  } else {
                                    field.onChange(current.filter((v) => v !== evt));
                                    // If Other was unchecked, clear its text too
                                    if (evt === "Other") {
                                      form.setValue("other_event_type", "");
                                    }
                                  }
                                }}
                              />
                              <span>{evt}</span>
                            </label>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Other event type text input — only shown when "Other" is checked */}
            {showOtherInput && (
              <FormField control={form.control} name="other_event_type" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Specify other event type *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Baby Shower, Anniversary..." className="h-9 text-sm" {...field} />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> Notes
                </FormLabel>
                <FormControl>
                  <Textarea placeholder="Any special preferences or requirements..." className="text-sm min-h-[80px] resize-none" {...field} />
                </FormControl>
                <FormMessage className="text-[10px]" />
              </FormItem>
            )} />

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
