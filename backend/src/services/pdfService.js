import PDFDocument from 'pdfkit';

export function createTableQRPDF(stream, tableNumber, qrBuffer) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#061C15');

  doc.fillColor('#B1E09D')
     .font('Helvetica-Bold')
     .fontSize(44)
     .text('MOMOJI', 50, 100, { align: 'center' });

  doc.fillColor('#82A89C')
     .font('Helvetica')
     .fontSize(20)
     .text('Scan to View Menu & Order', 50, 160, { align: 'center' });

  const qrSize = 320;
  const x = (doc.page.width - qrSize) / 2;
  const y = (doc.page.height - qrSize) / 2;
  doc.image(qrBuffer, x, y, { width: qrSize, height: qrSize });

  doc.fillColor('#B1E09D')
     .font('Helvetica-Bold')
     .fontSize(36)
     .text(`TABLE ${tableNumber}`, 50, y + qrSize + 40, { align: 'center' });

  doc.end();
}

export function createAnalyticsPDF(stream, data) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(stream);

  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#061C15');

  doc.fillColor('#B1E09D')
     .font('Helvetica-Bold')
     .fontSize(32)
     .text('MOMOJI ANALYTICS', 50, 60, { align: 'center' });

  const dateText = data.startDate && data.endDate 
    ? `Report Period: ${data.startDate} to ${data.endDate}` 
    : `Generated on: ${new Date().toLocaleDateString()}`;

  doc.fillColor('#82A89C')
     .font('Helvetica')
     .fontSize(14)
     .text(dateText, 50, 105, { align: 'center' })
     .moveDown(2);

  doc.fillColor('#B1E09D')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text('Overview Dashboard')
     .moveDown(0.5);

  const avgOrderVal = data.totalOrders > 0 ? (data.totalRevenue / data.totalOrders).toFixed(2) : '0';

  const dashboardY = doc.y;
  doc.rect(50, dashboardY, 500, 100).fill('#0a271d');
  
  doc.fillColor('#FFFFFF')
     .font('Helvetica')
     .fontSize(12)
     .text(`Total Revenue:  INR ${data.totalRevenue.toFixed(2)}`, 70, dashboardY + 15)
     .text(`Total Orders:   ${data.totalOrders}`, 70, dashboardY + 35)
     .text(`Total Sessions: ${data.totalSessions}`, 70, dashboardY + 55)
     .text(`Average Order Value:  INR ${avgOrderVal}`, 70, dashboardY + 75);

  doc.moveDown(3);

  doc.fillColor('#B1E09D')
     .font('Helvetica-Bold')
     .fontSize(18)
     .text('Table Performance Summary')
     .moveDown(0.5);

  const colY = doc.y;
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .fillColor('#82A89C')
     .text('Table Number', 50, colY, { width: 150 })
     .text('Orders Placed', 200, colY, { width: 150 })
     .text('Total Revenue', 350, colY, { width: 150 });
  
  doc.strokeColor('#82A89C').lineWidth(1).moveTo(50, colY + 15).lineTo(550, colY + 15).stroke();
  
  let currentY = colY + 25;
  doc.font('Helvetica').fillColor('#FFFFFF');
  
  data.tableBreakdown.forEach(item => {
    if (currentY > doc.page.height - 80) {
      doc.addPage();
      doc.rect(0, 0, doc.page.width, doc.page.height).fill('#061C15');
      currentY = 50;
    }
    doc.text(`Table ${item.tableNumber}`, 50, currentY, { width: 150 })
       .text(`${item.orderCount}`, 200, currentY, { width: 150 })
       .text(`INR ${item.revenue.toFixed(2)}`, 350, currentY);
    currentY += 20;
  });

  doc.end();
}
