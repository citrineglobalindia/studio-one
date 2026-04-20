import { forwardRef } from "react";
import { format } from "date-fns";

/** A single line item in the pricing table (quote/invoice). */
export type DocumentLineItem = {
  name: string;
  qty: number;
  unit_price: number;
  amount?: number; // if omitted, computed from qty * unit_price
};

export type DocumentKind = "quotation" | "invoice" | "contract";

export type DocumentTemplateStyle = "minimal" | "elegant" | "bold";

export type DocumentData = {
  kind: DocumentKind;
  style: DocumentTemplateStyle;

  /* Studio branding */
  studioName: string;
  studioLogoUrl?: string | null;
  studioAddress?: string | null;
  studioEmail?: string | null;
  studioPhone?: string | null;
  studioWebsite?: string | null;
  studioGst?: string | null;
  /** HEX primary color (e.g. #a855f7). Defaults to a nice purple. */
  brandColor?: string | null;

  /* Document meta */
  documentNumber: string;
  title: string;
  issueDate: string; // ISO date
  dueDate?: string | null;
  validUntil?: string | null;
  status?: string | null;

  /* Client */
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;

  /* Event / project context */
  eventType?: string | null;
  eventDate?: string | null;
  venue?: string | null;

  /* Content */
  coverImageUrl?: string | null; // large hero image at top of page 1
  introText?: string | null;     // optional intro paragraph
  lineItems?: DocumentLineItem[];
  taxPercent?: number | null;
  discountValue?: number | null;
  discountType?: "flat" | "percent" | null;
  totalAmount?: number | null;
  amountPaid?: number | null;
  /** Free-form body text — used mostly for contracts. */
  body?: string | null;
  terms?: string | null;
  notes?: string | null;
  /** Optional gallery photos to append at the end (proposal-style). */
  gallery?: string[];
};

const KIND_LABEL: Record<DocumentKind, string> = {
  quotation: "QUOTATION",
  invoice: "INVOICE",
  contract: "CONTRACT",
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try { return format(new Date(iso), "d MMM yyyy"); } catch { return iso; }
}

function fmtMoney(n?: number | null) {
  if (n === undefined || n === null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function calcSubtotal(items?: DocumentLineItem[]): number {
  if (!items) return 0;
  return items.reduce((s, i) => s + (i.amount ?? i.qty * i.unit_price), 0);
}

/**
 * DocumentTemplate renders an A4-sized branded document that can be exported to PDF.
 * The outer div has a fixed pixel width so html2canvas captures consistent dimensions
 * regardless of the surrounding page.
 */
export const DocumentTemplate = forwardRef<HTMLDivElement, { data: DocumentData }>(
  function DocumentTemplate({ data }, ref) {
    const brand = data.brandColor || "#a855f7";
    const kindLabel = KIND_LABEL[data.kind];
    const subtotal = calcSubtotal(data.lineItems);
    const discountAmt =
      data.discountValue && data.discountType === "percent"
        ? subtotal * (data.discountValue / 100)
        : data.discountValue || 0;
    const afterDiscount = subtotal - discountAmt;
    const taxAmt = data.taxPercent ? afterDiscount * (data.taxPercent / 100) : 0;
    const computedTotal = afterDiscount + taxAmt;
    const total = data.totalAmount ?? computedTotal;
    const balance = total - (data.amountPaid ?? 0);

    const bgAccent =
      data.style === "bold" ? brand :
      data.style === "elegant" ? "#1a1a1a" :
      "#ffffff";

    return (
      <div
        ref={ref}
        className="bg-white text-gray-900"
        style={{
          width: "794px",           // A4 at 96dpi
          minHeight: "1123px",
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: "11pt",
          lineHeight: 1.5,
          boxSizing: "border-box",
          padding: 0,
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "36px 48px 24px",
            background: data.style === "bold" ? bgAccent : "#ffffff",
            color: data.style === "bold" ? "#ffffff" : "#111",
            borderBottom: data.style === "minimal" ? `4px solid ${brand}` : "none",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
            {data.studioLogoUrl ? (
              <img
                src={data.studioLogoUrl}
                alt="Logo"
                crossOrigin="anonymous"
                style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8, background: "#fff", padding: 4 }}
              />
            ) : (
              <div
                style={{
                  width: 56, height: 56, borderRadius: 12, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: data.style === "bold" ? "rgba(255,255,255,0.2)" : brand,
                  color: "#fff", fontWeight: 800, fontSize: "24px",
                }}
              >
                {(data.studioName || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.1 }}>{data.studioName}</div>
              <div style={{ fontSize: "10pt", opacity: 0.75, marginTop: 2 }}>
                {[data.studioAddress, data.studioPhone, data.studioEmail].filter(Boolean).join(" · ")}
              </div>
              {data.studioWebsite && (
                <div style={{ fontSize: "10pt", opacity: 0.75 }}>{data.studioWebsite}</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "24px", fontWeight: 800, letterSpacing: "2px",
                color: data.style === "bold" ? "#fff" : brand,
              }}
            >
              {kindLabel}
            </div>
            <div style={{ fontSize: "10pt", opacity: 0.8, marginTop: 4 }}>#{data.documentNumber}</div>
            <div style={{ fontSize: "10pt", opacity: 0.8 }}>Issued {fmtDate(data.issueDate)}</div>
            {data.dueDate && (
              <div style={{ fontSize: "10pt", opacity: 0.8 }}>Due {fmtDate(data.dueDate)}</div>
            )}
            {data.validUntil && (
              <div style={{ fontSize: "10pt", opacity: 0.8 }}>Valid until {fmtDate(data.validUntil)}</div>
            )}
          </div>
        </header>

        {/* Cover image */}
        {data.coverImageUrl && (
          <div style={{ padding: "0 48px", marginTop: 24 }}>
            <img
              src={data.coverImageUrl}
              alt="Cover"
              crossOrigin="anonymous"
              style={{
                width: "100%", height: 280, objectFit: "cover",
                borderRadius: 12, border: "1px solid #e5e7eb",
              }}
            />
          </div>
        )}

        {/* Title + client */}
        <section style={{ padding: "32px 48px 0" }}>
          <div style={{ fontSize: "20px", fontWeight: 700, color: "#111" }}>{data.title}</div>
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6b7280", marginBottom: 6 }}>
                Billed to
              </div>
              <div style={{ fontWeight: 600, fontSize: "12pt" }}>{data.clientName}</div>
              {data.clientEmail && <div style={{ fontSize: "10pt", color: "#4b5563" }}>{data.clientEmail}</div>}
              {data.clientPhone && <div style={{ fontSize: "10pt", color: "#4b5563" }}>{data.clientPhone}</div>}
              {data.clientAddress && <div style={{ fontSize: "10pt", color: "#4b5563", marginTop: 4 }}>{data.clientAddress}</div>}
            </div>
            {(data.eventType || data.eventDate || data.venue) && (
              <div>
                <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6b7280", marginBottom: 6 }}>
                  Event details
                </div>
                {data.eventType && <div style={{ fontWeight: 600, fontSize: "12pt" }}>{data.eventType}</div>}
                {data.eventDate && <div style={{ fontSize: "10pt", color: "#4b5563" }}>{fmtDate(data.eventDate)}</div>}
                {data.venue && <div style={{ fontSize: "10pt", color: "#4b5563" }}>{data.venue}</div>}
              </div>
            )}
          </div>
        </section>

        {/* Intro */}
        {data.introText && (
          <section style={{ padding: "24px 48px 0" }}>
            <p style={{ fontSize: "11pt", color: "#374151", whiteSpace: "pre-wrap" }}>{data.introText}</p>
          </section>
        )}

        {/* Line items */}
        {data.lineItems && data.lineItems.length > 0 && (
          <section style={{ padding: "24px 48px 0" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5pt" }}>
              <thead>
                <tr style={{ background: "#f9fafb", color: "#374151" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: `2px solid ${brand}` }}>Description</th>
                  <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: `2px solid ${brand}`, width: 80 }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", borderBottom: `2px solid ${brand}`, width: 120 }}>Unit price</th>
                  <th style={{ textAlign: "right", padding: "10px 12px", borderBottom: `2px solid ${brand}`, width: 120 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "10px 12px" }}>{item.name}</td>
                    <td style={{ textAlign: "center", padding: "10px 12px" }}>{item.qty}</td>
                    <td style={{ textAlign: "right", padding: "10px 12px" }}>{fmtMoney(item.unit_price)}</td>
                    <td style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600 }}>
                      {fmtMoney(item.amount ?? item.qty * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
              <div style={{ minWidth: 280 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11pt" }}>
                  <span style={{ color: "#6b7280" }}>Subtotal</span>
                  <span>{fmtMoney(subtotal)}</span>
                </div>
                {discountAmt > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11pt" }}>
                    <span style={{ color: "#6b7280" }}>Discount</span>
                    <span>-{fmtMoney(discountAmt)}</span>
                  </div>
                )}
                {data.taxPercent ? (
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11pt" }}>
                    <span style={{ color: "#6b7280" }}>GST ({data.taxPercent}%)</span>
                    <span>{fmtMoney(taxAmt)}</span>
                  </div>
                ) : null}
                <div
                  style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "10px 0", marginTop: 6, borderTop: `2px solid ${brand}`,
                    fontSize: "14pt", fontWeight: 800, color: brand,
                  }}
                >
                  <span>Total</span>
                  <span>{fmtMoney(total)}</span>
                </div>
                {typeof data.amountPaid === "number" && data.amountPaid > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11pt", color: "#059669" }}>
                      <span>Paid</span>
                      <span>{fmtMoney(data.amountPaid)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "11pt", fontWeight: 700 }}>
                      <span>Balance due</span>
                      <span>{fmtMoney(balance)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Body (contracts) */}
        {data.body && (
          <section style={{ padding: "24px 48px 0", whiteSpace: "pre-wrap", fontSize: "11pt", color: "#374151" }}>
            <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6b7280", marginBottom: 8 }}>
              Scope of work
            </div>
            {data.body}
          </section>
        )}

        {/* Terms */}
        {data.terms && (
          <section style={{ padding: "24px 48px 0", fontSize: "10pt", color: "#4b5563" }}>
            <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6b7280", marginBottom: 8 }}>
              Terms &amp; conditions
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{data.terms}</div>
          </section>
        )}

        {/* Notes */}
        {data.notes && (
          <section style={{ padding: "20px 48px 0", fontSize: "10pt", color: "#4b5563" }}>
            <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6b7280", marginBottom: 6 }}>
              Notes
            </div>
            <div style={{ whiteSpace: "pre-wrap" }}>{data.notes}</div>
          </section>
        )}

        {/* Signature area for contracts */}
        {data.kind === "contract" && (
          <section style={{ padding: "40px 48px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
            <div>
              <div style={{ borderBottom: "1px solid #9ca3af", height: 48 }}></div>
              <div style={{ fontSize: "10pt", color: "#6b7280", marginTop: 6 }}>Studio signature</div>
              <div style={{ fontWeight: 600, fontSize: "11pt", marginTop: 2 }}>{data.studioName}</div>
            </div>
            <div>
              <div style={{ borderBottom: "1px solid #9ca3af", height: 48 }}></div>
              <div style={{ fontSize: "10pt", color: "#6b7280", marginTop: 6 }}>Client signature</div>
              <div style={{ fontWeight: 600, fontSize: "11pt", marginTop: 2 }}>{data.clientName}</div>
            </div>
          </section>
        )}

        {/* Gallery */}
        {data.gallery && data.gallery.length > 0 && (
          <section style={{ padding: "32px 48px 0" }}>
            <div style={{ fontSize: "9pt", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6b7280", marginBottom: 10 }}>
              Our work
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {data.gallery.slice(0, 6).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  crossOrigin="anonymous"
                  alt={`Gallery ${i + 1}`}
                  style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer
          style={{
            padding: "48px 48px 36px",
            marginTop: 32,
            borderTop: "1px solid #e5e7eb",
            fontSize: "9pt",
            color: "#6b7280",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>{data.studioName} · Thank you for choosing us</div>
          {data.studioGst && <div>GST: {data.studioGst}</div>}
        </footer>
      </div>
    );
  }
);
