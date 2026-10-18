import PDFDocument from "pdfkit";
import type { DocSection } from "./plan-document";

const FONT_NAME = "NotoSansJP";
const MARGIN = 40;

export async function buildPlanPdfBuffer(sections: DocSection[], fontBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: MARGIN, size: "A4", bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.registerFont(FONT_NAME, fontBuffer);
      doc.font(FONT_NAME);

      const pageWidth = doc.page.width - MARGIN * 2;

      function ensureSpace(height: number) {
        if (doc.y + height > doc.page.height - MARGIN) {
          doc.addPage();
        }
      }

      function drawKvTable(rows: [string, string][]) {
        const labelWidth = pageWidth * 0.3;
        const valueWidth = pageWidth * 0.7 - 12;
        doc.fontSize(9);
        for (const [label, value] of rows) {
          const labelH = doc.heightOfString(label, { width: labelWidth - 8 });
          const valueH = doc.heightOfString(value || "", { width: valueWidth - 8 });
          const rowH = Math.max(labelH, valueH, 14) + 10;
          ensureSpace(rowH);
          const y0 = doc.y;
          doc.rect(MARGIN, y0, pageWidth, rowH).stroke("#dddddd");
          doc.rect(MARGIN, y0, labelWidth, rowH).fillAndStroke("#f7f8f9", "#dddddd");
          doc.fillColor("#222222").text(label, MARGIN + 4, y0 + 4, { width: labelWidth - 8 });
          doc.text(value || "", MARGIN + labelWidth + 8, y0 + 4, { width: valueWidth - 8 });
          doc.y = y0 + rowH;
        }
        doc.x = MARGIN;
        doc.moveDown(0.5);
      }

      function drawDataTable(headers: string[], rows: string[][]) {
        const colWidth = pageWidth / headers.length;
        doc.fontSize(8);

        function drawRow(cells: string[], isHeader: boolean) {
          const heights = cells.map((c) => doc.heightOfString(c || "", { width: colWidth - 8 }));
          const rowH = Math.max(...heights, 12) + 8;
          ensureSpace(rowH);
          const y0 = doc.y;
          cells.forEach((c, i) => {
            const x = MARGIN + i * colWidth;
            doc.rect(x, y0, colWidth, rowH).fillAndStroke(isHeader ? "#f0eae6" : "#ffffff", "#dddddd");
            doc.fillColor("#222222").text(c || "", x + 4, y0 + 4, { width: colWidth - 8 });
          });
          doc.y = y0 + rowH;
        }

        drawRow(headers, true);
        for (const r of rows) drawRow(r, false);
        doc.x = MARGIN;
        doc.moveDown(0.5);
      }

      for (const s of sections) {
        doc.x = MARGIN;
        if (s.type === "h1") {
          ensureSpace(30);
          doc.x = MARGIN;
          doc.fontSize(16).fillColor("#e8604c").text(s.text, MARGIN, doc.y, { width: pageWidth });
          doc.fillColor("#222222");
          doc.moveDown(0.3);
        } else if (s.type === "h2") {
          ensureSpace(22);
          doc.x = MARGIN;
          doc.fontSize(12).fillColor("#e8604c").text(s.text, MARGIN, doc.y, { width: pageWidth });
          doc.fillColor("#222222");
          doc.moveDown(0.2);
        } else if (s.type === "p") {
          doc.fontSize(9).fillColor("#222222").text(s.text, MARGIN, doc.y, { width: pageWidth });
          doc.moveDown(0.3);
        } else if (s.type === "note") {
          doc.fontSize(8).fillColor("#888888").text(s.text, MARGIN, doc.y, { width: pageWidth });
          doc.fillColor("#222222");
          doc.moveDown(0.3);
        } else if (s.type === "kv") {
          drawKvTable(s.rows);
        } else if (s.type === "table") {
          drawDataTable(s.headers, s.rows);
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
