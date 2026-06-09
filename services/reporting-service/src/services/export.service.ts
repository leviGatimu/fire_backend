import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { prisma } from '@tzw/shared';
import { reportService } from './report.service';

export const exportService = {
  /** Streams a PDF summary report to the response. */
  async pdf(res: NodeJS.WritableStream) {
    const summary = await reportService.summary();
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('TZW LTD — Fire Safety Compliance Report', { align: 'center' });
    doc.moveDown(0.5).fontSize(10).fillColor('#666').text(`Generated ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown().fillColor('#000');

    doc.fontSize(14).text('Summary', { underline: true }).moveDown(0.5).fontSize(11);
    Object.entries(summary.cards).forEach(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
      doc.text(`${label}: ${v}`);
    });

    doc.moveDown().fontSize(14).text('By Type', { underline: true }).moveDown(0.5).fontSize(11);
    summary.charts.byType.forEach((t) => doc.text(`${t.label}: ${t.value}`));

    doc.moveDown().fontSize(14).text('By Status', { underline: true }).moveDown(0.5).fontSize(11);
    summary.charts.byStatus.forEach((s) => doc.text(`${s.label}: ${s.value}`));

    doc.end();
  },

  /** Builds an Excel workbook (extinguisher inventory) and returns the buffer. */
  async excel(): Promise<ExcelJS.Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TZW FEMS';
    const ws = wb.addWorksheet('Extinguishers');
    ws.columns = [
      { header: 'Serial Number', key: 'serialNumber', width: 18 },
      { header: 'Location', key: 'location', width: 35 },
      { header: 'Type', key: 'type', width: 16 },
      { header: 'Size', key: 'size', width: 12 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Installed', key: 'installationDate', width: 16 },
      { header: 'Expires', key: 'expiryDate', width: 16 },
    ];
    ws.getRow(1).font = { bold: true };

    const items = await prisma.fireExtinguisher.findMany({ orderBy: { serialNumber: 'asc' } });
    items.forEach((e) =>
      ws.addRow({
        ...e,
        installationDate: e.installationDate.toISOString().slice(0, 10),
        expiryDate: e.expiryDate.toISOString().slice(0, 10),
      }),
    );
    return wb.xlsx.writeBuffer();
  },
};
