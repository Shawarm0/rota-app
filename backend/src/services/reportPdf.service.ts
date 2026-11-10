import PDFDocument from "pdfkit";
import { createRequire } from "module";

// DejaVu Sans covers accented Latin, Greek, Cyrillic and Vietnamese names; PDFKit's built-in Helvetica only
// covers Western European characters
const require = createRequire(import.meta.url);
const FONTS = {
  regular: require.resolve("dejavu-fonts-ttf/ttf/DejaVuSans.ttf"),
  bold: require.resolve("dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf"),
};

interface ReportTotals {
  totalShifts: number;
  rotaHours: number;
  extraHours: number;
  totalHours: number;
}

interface PdfReport {
  businessName: string;
  storesLabel: string;
  generatedBy: string;
  from: string;
  to: string;
  rows: (ReportTotals & { name: string; store: string | null })[];
  byStore: (ReportTotals & { store: string })[];
  // Worked out from exact minutes, so they match every table's figures
  totals: ReportTotals;
}

const COLOURS = {
  accent: "#4F46E5",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  stripe: "#F9FAFB",
  extra: "#D97706",
};
const MARGIN = 48;
const ROW_HEIGHT = 22;
const FOOTER_SPACE = 40;

interface Column {
  label: string;
  width: number;
  align?: "left" | "right";
}

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const hours = (value: number) => value.toFixed(2);

// A printable hours report for a date range: header, summary figures, hours by store and a staff table
export function renderHoursReportPdf(report: PdfReport): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true, info: { Title: `Hours report ${report.from} to ${report.to}` } });
  doc.registerFont("Body", FONTS.regular);
  doc.registerFont("Body-Bold", FONTS.bold);
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageWidth = doc.page.width - MARGIN * 2;
  const bottom = () => doc.page.height - MARGIN - FOOTER_SPACE;

  // Header
  doc.rect(0, 0, doc.page.width, 6).fill(COLOURS.accent);
  doc.fillColor(COLOURS.text).font("Body-Bold").fontSize(22).text("Hours Report", MARGIN, MARGIN);
  doc.font("Body").fontSize(11).fillColor(COLOURS.muted).text(report.businessName, MARGIN, doc.y + 2);
  doc.moveDown(0.6);
  doc.fillColor(COLOURS.text).font("Body-Bold").fontSize(11)
    .text(`${formatDate(report.from)} – ${formatDate(report.to)}`, { continued: true })
    .font("Body").fillColor(COLOURS.muted).text(`   ·   ${report.storesLabel}`);
  const generated = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" });
  doc.fontSize(9).text(`Generated ${generated} by ${report.generatedBy}`);
  doc.moveDown(1.2);

  // Summary figures
  const staffWorked = report.rows.filter((r) => r.totalShifts > 0).length;
  const cards = [
    { label: "Total hours", value: hours(report.totals.totalHours) },
    { label: "Rota hours", value: hours(report.totals.rotaHours) },
    { label: "Extra hours", value: hours(report.totals.extraHours) },
    { label: "Shifts", value: String(report.totals.totalShifts) },
    { label: "Staff worked", value: String(staffWorked) },
  ];
  const gap = 10;
  const cardWidth = (pageWidth - gap * (cards.length - 1)) / cards.length;
  const cardTop = doc.y;
  cards.forEach((card, i) => {
    const x = MARGIN + i * (cardWidth + gap);
    doc.roundedRect(x, cardTop, cardWidth, 54, 6).lineWidth(1).strokeColor(COLOURS.border).stroke();
    doc.font("Body").fontSize(8).fillColor(COLOURS.muted).text(card.label.toUpperCase(), x + 10, cardTop + 10, { width: cardWidth - 20 });
    doc.font("Body-Bold").fontSize(16).fillColor(i === 2 ? COLOURS.extra : COLOURS.text).text(card.value, x + 10, cardTop + 26, { width: cardWidth - 20 });
  });
  doc.y = cardTop + 54 + 24;

  const sectionTitle = (title: string, note?: string) => {
    if (doc.y + 60 > bottom()) doc.addPage();
    doc.font("Body-Bold").fontSize(12).fillColor(COLOURS.text).text(title, MARGIN, doc.y);
    if (note) doc.font("Body").fontSize(8.5).fillColor(COLOURS.muted).text(note);
    doc.moveDown(0.5);
  };

  // Draws a table, starting a new page (and repeating the header) when it runs out of room
  const table = (columns: Column[], rows: string[][], totals?: string[]) => {
    const drawRow = (cells: string[], y: number, opts: { header?: boolean; total?: boolean; stripe?: boolean }) => {
      if (opts.header) doc.rect(MARGIN, y, pageWidth, ROW_HEIGHT).fill("#F3F4F6");
      else if (opts.stripe) doc.rect(MARGIN, y, pageWidth, ROW_HEIGHT).fill(COLOURS.stripe);
      if (opts.total) doc.moveTo(MARGIN, y).lineTo(MARGIN + pageWidth, y).lineWidth(1.2).strokeColor(COLOURS.text).stroke();
      let x = MARGIN;
      cells.forEach((cell, i) => {
        const col = columns[i];
        const isExtra = col.label.startsWith("Extra") && !opts.header && cell !== "—";
        doc
          .font(opts.header || opts.total ? "Body-Bold" : "Body")
          .fontSize(opts.header ? 8 : 9.5)
          .fillColor(opts.header ? COLOURS.muted : isExtra ? COLOURS.extra : COLOURS.text)
          .text(opts.header ? cell.toUpperCase() : cell, x + 8, y + (opts.header ? 7.5 : 6.5), {
            width: col.width - 16,
            align: col.align ?? "left",
            lineBreak: false,
            ellipsis: true,
          });
        x += col.width;
      });
    };

    const header = columns.map((c) => c.label);
    let y = doc.y;
    drawRow(header, y, { header: true });
    y += ROW_HEIGHT;
    rows.forEach((cells, i) => {
      if (y + ROW_HEIGHT > bottom()) {
        doc.addPage();
        y = MARGIN;
        drawRow(header, y, { header: true });
        y += ROW_HEIGHT;
      }
      drawRow(cells, y, { stripe: i % 2 === 1 });
      y += ROW_HEIGHT;
    });
    if (totals) {
      if (y + ROW_HEIGHT > bottom()) {
        doc.addPage();
        y = MARGIN;
      }
      drawRow(totals, y, { total: true });
      y += ROW_HEIGHT;
    }
    doc.y = y + 22;
  };

  const extraCell = (value: number) => (value ? hours(value) : "—");
  const totalCells = [String(report.totals.totalShifts), hours(report.totals.rotaHours), extraCell(report.totals.extraHours), hours(report.totals.totalHours)];

  // Hours by store, when more than one store is involved
  if (report.byStore.length > 1) {
    sectionTitle("Hours by store", "Counted at the store each shift was worked.");
    table(
      [
        { label: "Store", width: pageWidth * 0.36 },
        { label: "Shifts", width: pageWidth * 0.14, align: "right" },
        { label: "Rota hrs", width: pageWidth * 0.16, align: "right" },
        { label: "Extra hrs", width: pageWidth * 0.16, align: "right" },
        { label: "Total hrs", width: pageWidth * 0.18, align: "right" },
      ],
      report.byStore.map((s) => [s.store, String(s.totalShifts), hours(s.rotaHours), extraCell(s.extraHours), hours(s.totalHours)]),
      ["Total", ...totalCells],
    );
  }

  // Staff
  sectionTitle("Staff", "Extra hours are claimed, covered and additional shifts.");
  if (report.rows.length === 0) {
    doc.font("Body").fontSize(10).fillColor(COLOURS.muted).text("No staff or shifts in this period.");
  } else {
    table(
      [
        { label: "Employee", width: pageWidth * 0.27 },
        { label: "Home store", width: pageWidth * 0.19 },
        { label: "Shifts", width: pageWidth * 0.1, align: "right" },
        { label: "Rota hrs", width: pageWidth * 0.14, align: "right" },
        { label: "Extra hrs", width: pageWidth * 0.15, align: "right" },
        { label: "Total hrs", width: pageWidth * 0.15, align: "right" },
      ],
      report.rows.map((r) => [r.name, r.store ?? "—", String(r.totalShifts), hours(r.rotaHours), extraCell(r.extraHours), hours(r.totalHours)]),
      report.rows.length > 1 ? ["Total", "", ...totalCells] : undefined,
    );
  }

  // Footer on every page
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i);
    const y = doc.page.height - MARGIN - 12;
    doc.moveTo(MARGIN, y - 8).lineTo(doc.page.width - MARGIN, y - 8).lineWidth(0.5).strokeColor(COLOURS.border).stroke();
    doc.font("Body").fontSize(8).fillColor(COLOURS.muted);
    doc.text(`${report.businessName} · Hours report`, MARGIN, y, { lineBreak: false });
    doc.text(`Page ${i + 1} of ${range.count}`, MARGIN, y, { width: pageWidth, align: "right", lineBreak: false });
  }

  doc.end();
  return done;
}
