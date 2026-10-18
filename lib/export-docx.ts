import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
} from "docx";
import type { DocSection } from "./plan-document";

function kvTable(rows: [string, string][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 28, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
            }),
            new TableCell({
              width: { size: 72, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: value || "" })] })],
            }),
          ],
        })
    ),
  });
}

function dataTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    children: headers.map(
      (h) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
        })
    ),
  });
  const bodyRows = rows.map(
    (r) =>
      new TableRow({
        children: r.map(
          (v) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: v || "" })] })],
            })
        ),
      })
  );
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [headerRow, ...bodyRows] });
}

export async function buildPlanDocxBuffer(sections: DocSection[]): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  for (const s of sections) {
    if (s.type === "h1") {
      children.push(new Paragraph({ text: s.text, heading: HeadingLevel.HEADING_1 }));
    } else if (s.type === "h2") {
      children.push(new Paragraph({ text: s.text, heading: HeadingLevel.HEADING_2 }));
    } else if (s.type === "p") {
      children.push(new Paragraph({ children: [new TextRun({ text: s.text })] }));
    } else if (s.type === "note") {
      children.push(
        new Paragraph({ children: [new TextRun({ text: s.text, size: 18, color: "999999" })] })
      );
    } else if (s.type === "kv") {
      children.push(kvTable(s.rows));
      children.push(new Paragraph({ text: "" }));
    } else if (s.type === "table") {
      children.push(dataTable(s.headers, s.rows));
      children.push(new Paragraph({ text: "" }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
