import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Aperture } from "lucide-react";

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0f0c29 0%, #1a0a2e 25%, #16213e 60%, #0d1b2a 100%)", color: "#e2e8f0" }}>
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: "rgba(15,12,41,0.7)", borderColor: "rgba(168,85,247,0.15)" }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4 px-6 h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate("/landing")} className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #3b82f6)" }}>
              <Aperture className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">Studio<span style={{ color: "#a855f7" }}>Ai</span></span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: "rgba(226,232,240,0.5)" }}>Last updated: April 13, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "rgba(226,232,240,0.7)" }}>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly when you create an account, use our services, or contact us. This includes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Personal details (name, email, phone number)</li>
              <li>Studio and business information</li>
              <li>Client data you enter into the platform</li>
              <li>Payment and billing information</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide, maintain, and improve our services</li>
              <li>To process transactions and send related information</li>
              <li>To send notifications, updates, and support messages</li>
              <li>To analyze usage patterns and improve user experience</li>
              <li>To detect, prevent, and address technical issues or fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Data Storage & Security</h2>
            <p>Your data is stored on secure cloud servers with encryption at rest and in transit. We implement industry-standard security measures including SSL/TLS encryption, access controls, and regular security audits to protect your information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Data Sharing</h2>
            <p>We do not sell, trade, or rent your personal information to third parties. We may share data only in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations or court orders</li>
              <li>With service providers who assist in operating our platform (under strict confidentiality agreements)</li>
              <li>To protect the rights, property, or safety of StudioAi, our users, or the public</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access, update, or delete your personal information</li>
              <li>Export your data in a portable format</li>
              <li>Opt out of marketing communications</li>
              <li>Request restriction of processing of your data</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Cookies & Tracking</h2>
            <p>We use cookies and similar technologies to enhance your experience, analyze traffic, and personalize content. You can manage cookie preferences through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Data Retention</h2>
            <p>We retain your information for as long as your account is active or as needed to provide services. Upon account deletion, we will remove your data within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us at:</p>
            <p className="mt-2">
              <span className="text-white font-medium">Email:</span> privacy@studioai.com<br />
              <span className="text-white font-medium">Address:</span> StudioAi Technologies Pvt. Ltd., India
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
