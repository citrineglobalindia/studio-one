import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Aperture } from "lucide-react";

export default function TermsPage() {
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
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Terms & Conditions</h1>
        <p className="text-sm mb-10" style={{ color: "rgba(226,232,240,0.5)" }}>Last updated: April 13, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "rgba(226,232,240,0.7)" }}>
          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using StudioAi ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
            <p>StudioAi is a cloud-based studio management platform designed for photography and videography businesses. The Platform provides tools for client management, project tracking, invoicing, team coordination, and AI-powered workflows.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the confidentiality of your credentials</li>
              <li>You must notify us immediately of any unauthorized use of your account</li>
              <li>One person or legal entity may not maintain more than one free account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Subscription & Payments</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Paid features require a valid subscription plan</li>
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>We reserve the right to modify pricing with 30 days' prior notice</li>
              <li>Failure to pay may result in suspension or termination of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Platform for any unlawful purpose</li>
              <li>Upload or transmit viruses, malware, or harmful code</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Platform</li>
              <li>Use the Platform to send spam or unsolicited communications</li>
              <li>Resell or redistribute Platform access without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p>All content, design, code, and branding of StudioAi are the property of StudioAi Technologies Pvt. Ltd. You retain ownership of all data you upload to the Platform. By using the Platform, you grant us a limited license to process your data solely to provide the services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Data Ownership</h2>
            <p>You own all client data, project information, and business data you enter into the Platform. We do not claim ownership over your content. You may export your data at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, StudioAi shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities arising from your use of the Platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Service Availability</h2>
            <p>We strive for 99.9% uptime but do not guarantee uninterrupted service. We may perform scheduled maintenance with prior notice. We are not liable for downtime caused by factors beyond our control.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Termination</h2>
            <p>Either party may terminate the agreement at any time. Upon termination, your right to use the Platform ceases immediately. We will retain your data for 30 days after termination to allow data export, after which it will be permanently deleted.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts in India.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">12. Contact</h2>
            <p>For questions regarding these Terms & Conditions, please contact us at:</p>
            <p className="mt-2">
              <span className="text-white font-medium">Email:</span> legal@studioai.com<br />
              <span className="text-white font-medium">Address:</span> StudioAi Technologies Pvt. Ltd., India
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
