import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportInventoryPDF = (items) => {
  const doc = new jsPDF();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const timeStr = now.toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit'
  });

  // ── Header ──
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('InvenTrack', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Inventory Management System', 14, 26);
  doc.text(`Generated: ${dateStr} at ${timeStr}`, 14, 33);

  // ── Summary Cards ──
  const totalItems = items.length;
  const totalQty = items.reduce((s, i) => s + (i.quantity || 0), 0);
  const working = items.filter(i => i.condition === 'Working').length;
  const faulty = items.filter(i => i.condition === 'Faulty').length;
  const repair = items.filter(i => i.condition === 'Repair').length;

  const summaryY = 50;
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Inventory Summary', 14, summaryY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105); // slate-600

  const summaries = [
    `Total Items: ${totalItems}`,
    `Total Quantity: ${totalQty}`,
    `Working: ${working}`,
    `Faulty: ${faulty}`,
    `Repair: ${repair}`,
  ];
  summaries.forEach((text, i) => {
    doc.text(text, 14 + (i % 3) * 65, summaryY + 10 + Math.floor(i / 3) * 7);
  });

  // ── Table ──
  const tableRows = items.map((item) => [
    item.brand || '',
    item.model || '',
    item.category || '',
    String(item.quantity || 0),
    item.condition || 'N/A',
    item.room?.name || 'Unassigned',
    item.purchaseDate
      ? new Date(item.purchaseDate).toLocaleDateString('en-IN')
      : 'N/A',
  ]);

  autoTable(doc, {
    startY: summaryY + 25,
    head: [['Brand', 'Model', 'Category', 'Qty', 'Condition', 'Room', 'Purchase Date']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    styles: {
      cellPadding: 3,
      lineWidth: 0.1,
      lineColor: [226, 232, 240], // slate-200
    },
    margin: { left: 14, right: 14 },
  });

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Page ${i} of ${pageCount}  •  InvenTrack Report`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  doc.save(`InvenTrack_Report_${now.toISOString().slice(0, 10)}.pdf`);
};
