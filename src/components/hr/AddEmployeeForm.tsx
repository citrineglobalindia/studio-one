import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, MapPin, ShieldCheck, Briefcase, Upload, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface AddEmployeeFormProps {
  onSubmit: (data: EmployeeFormData) => void;
  onCancel: () => void;
}

export interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  state: string;
  district: string;
  taluk: string;
  city: string;
  pincode: string;
  aadhaar: string;
  pan: string;
  experience: string;
  serviceAreas: string;
  department: string;
  designation: string;
  username: string;
  password: string;
  documents: Record<string, string>;
}

const initialForm: EmployeeFormData = {
  name: "", email: "", phone: "", whatsapp: "", address: "",
  state: "", district: "", taluk: "", city: "", pincode: "",
  aadhaar: "", pan: "",
  experience: "", serviceAreas: "", department: "", designation: "",
  username: "", password: "",
  documents: {},
};

const states = ["Tamil Nadu", "Karnataka", "Kerala", "Andhra Pradesh", "Telangana", "Maharashtra", "Delhi", "Gujarat", "Rajasthan", "Uttar Pradesh"];
const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations", "Photography", "Editing", "Design"];

const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
      <Icon className="h-4.5 w-4.5 text-primary" />
    </div>
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
  </div>
);

const RequiredLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-sm font-medium text-foreground">
    {children} <span className="text-destructive">*</span>
  </Label>
);

const OptionalLabel = ({ children }: { children: React.ReactNode }) => (
  <Label className="text-sm font-medium text-foreground">{children}</Label>
);

const documentTypes = [
  "Self Acknowledgement Document",
  "Personal PAN Card",
  "Aadhaar Card",
  "Passport Size Photo",
  "Address Proof",
];

export const AddEmployeeForm = ({ onSubmit, onCancel }: AddEmployeeFormProps) => {
  const [form, setForm] = useState<EmployeeFormData>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

  const update = (field: keyof EmployeeFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleDocUpload = (docName: string) => {
    setUploadedDocs((prev) => ({ ...prev, [docName]: `${docName.replace(/\s/g, "_").toLowerCase()}.pdf` }));
    toast.success(`${docName} uploaded`);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Full Name is required"); return; }
    if (!form.email.trim()) { toast.error("Email ID is required"); return; }
    if (!form.phone.trim()) { toast.error("Phone Number is required"); return; }
    if (!form.address.trim()) { toast.error("Address is required"); return; }
    if (!form.state) { toast.error("State is required"); return; }
    if (!form.district.trim()) { toast.error("District is required"); return; }
    if (!form.taluk.trim()) { toast.error("Taluk is required"); return; }
    if (!form.city.trim()) { toast.error("City is required"); return; }
    if (!form.pincode.trim()) { toast.error("Pincode is required"); return; }
    if (!form.aadhaar.trim()) { toast.error("Aadhaar Number is required"); return; }
    if (!form.pan.trim()) { toast.error("PAN Number is required"); return; }
    if (!form.experience.trim()) { toast.error("Years of Experience is required"); return; }
    if (!form.serviceAreas.trim()) { toast.error("Primary Service Areas is required"); return; }
    if (!form.department) { toast.error("Department is required"); return; }
    if (!form.designation.trim()) { toast.error("Designation is required"); return; }
    if (!form.username.trim()) { toast.error("Username is required"); return; }
    if (!form.password.trim()) { toast.error("Password is required"); return; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    onSubmit({ ...form, documents: uploadedDocs });
  };

  return (
    <div className="space-y-6">
      {/* Personal Details */}
      <Card className="border border-border/50 bg-muted/30">
        <CardContent className="p-6">
          <SectionHeader icon={User} title="Personal Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <RequiredLabel>Full Name</RequiredLabel>
              <Input placeholder="Enter full name" value={form.name} onChange={(e) => update("name", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Email ID</RequiredLabel>
              <Input type="email" placeholder="Enter email" value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Phone Number</RequiredLabel>
              <Input placeholder="10-digit mobile number" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <OptionalLabel>WhatsApp Number</OptionalLabel>
              <Input placeholder="WhatsApp number" value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <RequiredLabel>Address</RequiredLabel>
              <Textarea placeholder="Enter full address" value={form.address} onChange={(e) => update("address", e.target.value)} className="bg-background min-h-[80px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Details */}
      <Card className="border border-border/50 bg-muted/30">
        <CardContent className="p-6">
          <SectionHeader icon={MapPin} title="Location Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <RequiredLabel>State</RequiredLabel>
              <Select value={form.state} onValueChange={(v) => update("state", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select State" /></SelectTrigger>
                <SelectContent>
                  {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>District</RequiredLabel>
              <Input placeholder="Enter district" value={form.district} onChange={(e) => update("district", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Taluk</RequiredLabel>
              <Input placeholder="Enter taluk" value={form.taluk} onChange={(e) => update("taluk", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>City</RequiredLabel>
              <Input placeholder="Enter city" value={form.city} onChange={(e) => update("city", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Pincode</RequiredLabel>
              <Input placeholder="6-digit pincode" value={form.pincode} onChange={(e) => update("pincode", e.target.value)} className="bg-background" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification */}
      <Card className="border border-border/50 bg-muted/30">
        <CardContent className="p-6">
          <SectionHeader icon={ShieldCheck} title="Identity Verification" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <RequiredLabel>Aadhaar Number</RequiredLabel>
              <Input placeholder="12-digit Aadhaar number" value={form.aadhaar} onChange={(e) => update("aadhaar", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>PAN Number</RequiredLabel>
              <Input placeholder="PAN (E.G., ABCDE1234F)" value={form.pan} onChange={(e) => update("pan", e.target.value.toUpperCase())} className="bg-background" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Details */}
      <Card className="border border-border/50 bg-muted/30">
        <CardContent className="p-6">
          <SectionHeader icon={Briefcase} title="Professional Details" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <RequiredLabel>Years of Experience</RequiredLabel>
              <Input placeholder="Years in market research/field" value={form.experience} onChange={(e) => update("experience", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Primary Service Areas</RequiredLabel>
              <Input placeholder="E.g. Bangalore, Mysore" value={form.serviceAreas} onChange={(e) => update("serviceAreas", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Department</RequiredLabel>
              <Select value={form.department} onValueChange={(v) => update("department", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Designation</RequiredLabel>
              <Input placeholder="Enter designation" value={form.designation} onChange={(e) => update("designation", e.target.value)} className="bg-background" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Documents */}
      <Card className="border border-border/50 bg-muted/30">
        <CardContent className="p-6">
          <SectionHeader icon={Upload} title="Upload Documents" />
          <p className="text-xs text-muted-foreground mb-4">All documents are securely stored. Max 5MB per file (PDF/JPG/PNG).</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documentTypes.map((doc) => (
              <div key={doc} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <span className="text-sm text-foreground">
                  {doc} <span className="text-destructive">*</span>
                </span>
                {uploadedDocs[doc] ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 text-xs">Uploaded</Badge>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleDocUpload(doc)} className="gap-1.5">
                    <Upload className="h-3.5 w-3.5" /> Upload
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Login Credentials */}
      <Card className="border border-border/50 bg-muted/30">
        <CardContent className="p-6">
          <SectionHeader icon={KeyRound} title="Login Credentials" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <RequiredLabel>Username</RequiredLabel>
              <Input placeholder="Enter username" value={form.username} onChange={(e) => update("username", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel>Password</RequiredLabel>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  className="bg-background pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>Add Employee</Button>
      </div>
    </div>
  );
};
