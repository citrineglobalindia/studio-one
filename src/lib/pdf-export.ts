import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type PdfExportOptions = {
  filename?: string;
  /** A4, Letter, etc. A4 default. */
  format?: "a4" | "letter";
  /** portrait | landscape. portrait default. */
  orientation?: "portrait" | "landscape";
};

/**
 * Export a DOM node (rendered via the DocumentBuilder template) into a
 * downloadable PDF. Multi-page handled by slicing the rendered canvas
 * vertically to fit on each page.
 */
export async function exportNodeToPDF(
  node: HTMLElement,
  opts: PdfExportOptions = {}
): Promise<void> {
  const { filename = "document.pdf", format = "a4", orientation = "portrait" } = opts;

  // Render node to canvas. scale=2 keeps text crisp at print resolution.
  const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const pdf = new jsPDF({ orientation, unit: "mm", format });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightRemaining = imgHeight;
  let position = 0;
  const imageData = canvas.toDataURL("image/jpeg", 0.95);

  // First page
  pdf.addImage(imageData, "JPEG", 0, position, imgWidth, imgHeight);
  heightRemaining -= pageHeight;

  // Subsequent pages: shift the image up by pageHeight for each additional page
  while (heightRemaining > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imageData, "JPEG", 0, position, imgWidth, imgHeight);
    heightRemaining -= pageHeight;
  }

  pdf.save(filename);
}
