import PDFDocument from "pdfkit";

/**
 * Draw a styled rounded rectangle
 */
const drawCard = (doc, x, y, width, height, fillColor = "#F8FAFC", strokeColor = "#E2E8F0") => {
  doc
    .save()
    .roundedRect(x, y, width, height, 6)
    .fillAndStroke(fillColor, strokeColor)
    .restore();
};

/**
 * Format currency in INR
 */
const formatINR = (amount) => `INR ${(Number(amount) || 0).toLocaleString("en-IN")}`;

/**
 * Format travel date
 */
const formatTravelDate = (dateVal) => {
  if (!dateVal) return "N/A";
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(dateVal);
  }
};

/**
 * Build the ticket document content onto the PDFDocument instance
 */
const buildTicketDocument = (doc, booking) => {
  const primaryColor = "#0F172A"; // Slate 900
  const accentColor = "#06B6D4"; // Cyan 500
  const successColor = "#059669"; // Emerald 600
  const darkTextColor = "#1E293B"; // Slate 800
  const mutedTextColor = "#64748B"; // Slate 500

  const bookingId = booking.bookingId || "BUSEASE-TICKET";
  const transactionRef = booking.transactionReference || "N/A";
  const startLoc = booking.startLocation || booking.bus?.startLocation?.startLocation || "Origin";
  const endLoc = booking.endLocation || booking.bus?.endLocation?.endLocation || "Destination";
  const travelDate = formatTravelDate(booking.selectedDate || booking.bus?.date);
  const busNumber = booking.bus?.busNumber || "BusEase Express";
  const passengerEmail = booking.user?.email || booking.userEmail || "Customer";
  const passengerName = booking.user?.username || booking.userName || "Passenger";
  const seats = Array.isArray(booking.seats) && booking.seats.length > 0
    ? booking.seats.map((s) => (typeof s === "object" ? s.seatNumber : s)).join(", ")
    : "N/A";
  const seatCount = Array.isArray(booking.seats) ? booking.seats.length : 1;
  const totalAmount = booking.amount || 0;

  // Header Banner
  doc.rect(0, 0, 612, 100).fill(primaryColor);

  // Logo / App Name
  doc
    .fillColor("#FFFFFF")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("BusEase", 40, 28);

  doc
    .fillColor(accentColor)
    .fontSize(10)
    .font("Helvetica")
    .text("Official E-Ticket & Boarding Pass", 40, 56);

  // Status Badge
  doc
    .save()
    .roundedRect(440, 32, 132, 28, 4)
    .fill(successColor)
    .restore();

  doc
    .fillColor("#FFFFFF")
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("CONFIRMED & PAID", 440, 41, { width: 132, align: "center" });

  // Route Section Card
  drawCard(doc, 40, 115, 532, 75, "#F1F5F9", "#CBD5E1");

  doc
    .fillColor(mutedTextColor)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("ROUTE", 56, 126);

  doc
    .fillColor(darkTextColor)
    .fontSize(16)
    .font("Helvetica-Bold")
    .text(`${startLoc}  ->  ${endLoc}`, 56, 142);

  doc
    .fillColor(mutedTextColor)
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("TRAVEL DATE", 400, 126);

  doc
    .fillColor(accentColor)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(travelDate, 400, 142);

  // Booking & Journey Details Table Card
  drawCard(doc, 40, 202, 532, 145, "#FFFFFF", "#E2E8F0");

  const col1 = 56;
  const col2 = 220;
  const col3 = 390;

  // Row 1
  let currentY = 216;
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("BOOKING ID", col1, currentY);
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("BUS NUMBER", col2, currentY);
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("SEAT NUMBER(S)", col3, currentY);

  currentY += 13;
  doc.fillColor(darkTextColor).fontSize(11).font("Helvetica-Bold").text(bookingId, col1, currentY);
  doc.fillColor(darkTextColor).fontSize(11).font("Helvetica-Bold").text(busNumber, col2, currentY);
  doc.fillColor(accentColor).fontSize(12).font("Helvetica-Bold").text(seats, col3, currentY);

  // Divider
  currentY += 22;
  doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(col1, currentY).lineTo(556, currentY).stroke();

  // Row 2
  currentY += 10;
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("PASSENGER", col1, currentY);
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("EMAIL", col2, currentY);
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("TOTAL PASSENGERS", col3, currentY);

  currentY += 13;
  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica").text(passengerName, col1, currentY);
  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica").text(passengerEmail, col2, currentY, { width: 160, ellipsis: true });
  doc.fillColor(darkTextColor).fontSize(10).font("Helvetica").text(`${seatCount} Passenger(s)`, col3, currentY);

  // Divider
  currentY += 22;
  doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(col1, currentY).lineTo(556, currentY).stroke();

  // Row 3
  currentY += 10;
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("TRANSACTION REFERENCE", col1, currentY);
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("PAYMENT STATUS", col2, currentY);
  doc.fillColor(mutedTextColor).fontSize(8).font("Helvetica-Bold").text("ISSUED ON", col3, currentY);

  currentY += 13;
  doc.fillColor(darkTextColor).fontSize(9).font("Helvetica").text(transactionRef, col1, currentY, { width: 150, ellipsis: true });
  doc.fillColor(successColor).fontSize(9).font("Helvetica-Bold").text("Paid (Demo Payment)", col2, currentY);
  doc.fillColor(darkTextColor).fontSize(9).font("Helvetica").text(new Date().toLocaleDateString("en-US"), col3, currentY);

  // Fare Breakdown Card
  drawCard(doc, 40, 360, 532, 120, "#FAFAFA", "#E2E8F0");

  doc
    .fillColor(primaryColor)
    .fontSize(11)
    .font("Helvetica-Bold")
    .text("Fare Breakdown & Summary", 56, 372);

  const subtotal = booking.seats && Array.isArray(booking.seats)
    ? booking.seats.reduce((sum, s) => sum + (Number(s.price) || 0), 0)
    : Math.round(totalAmount * 0.75);
  const serviceFee = seatCount * 50;
  const convenienceFee = Math.round(subtotal * 0.02);
  const gstAmount = Math.max(0, totalAmount - (subtotal + serviceFee + convenienceFee));

  let fareY = 394;
  const renderFareRow = (label, val, isBold = false) => {
    doc
      .fillColor(isBold ? darkTextColor : mutedTextColor)
      .fontSize(9)
      .font(isBold ? "Helvetica-Bold" : "Helvetica")
      .text(label, 56, fareY);

    doc
      .fillColor(isBold ? primaryColor : darkTextColor)
      .fontSize(9)
      .font(isBold ? "Helvetica-Bold" : "Helvetica")
      .text(val, 480, fareY, { width: 76, align: "right" });
    fareY += 14;
  };

  renderFareRow(`Base Fare (${seatCount} Seat${seatCount > 1 ? "s" : ""})`, formatINR(subtotal));
  renderFareRow("Service & Station Fee", formatINR(serviceFee));
  renderFareRow("GST & Statutory Taxes", formatINR(gstAmount + convenienceFee));

  doc.strokeColor("#CBD5E1").lineWidth(1).moveTo(56, fareY + 2).lineTo(556, fareY + 2).stroke();
  fareY += 6;
  renderFareRow("Total Amount Paid", formatINR(totalAmount), true);

  // Important Terms & Boarding Instructions
  drawCard(doc, 40, 492, 532, 135, "#FFFFFF", "#E2E8F0");

  doc
    .fillColor(primaryColor)
    .fontSize(10)
    .font("Helvetica-Bold")
    .text("Important Boarding Instructions & Policies", 56, 504);

  const guidelines = [
    "* Please arrive at the boarding point at least 15 minutes before scheduled departure.",
    "* Carry a valid government-issued photo ID along with this e-ticket (digital or printed).",
    "* Permitted luggage: 1 standard bag (up to 15 kg) and 1 personal handbag per passenger.",
    "* Cancellation and refund requests are subject to operator terms before trip departure.",
  ];

  let guideY = 524;
  doc.fontSize(8.5).font("Helvetica").fillColor(darkTextColor);
  for (const item of guidelines) {
    doc.text(item, 56, guideY, { width: 500, lineGap: 2 });
    guideY += 16;
  }

  // Security Simulation Barcode Box
  drawCard(doc, 40, 638, 532, 60, "#F8FAFC", "#E2E8F0");

  doc
    .fillColor(mutedTextColor)
    .fontSize(7.5)
    .font("Helvetica-Bold")
    .text("SECURITY VERIFICATION BARCODE & TICKET TOKEN", 56, 646);

  // Mock Barcode vertical lines
  let barX = 56;
  doc.save().fillColor("#334155");
  for (let i = 0; i < 48; i++) {
    const barWidth = ((i * 7) % 3) + 1;
    doc.rect(barX, 658, barWidth, 24).fill();
    barX += barWidth + 3 + (i % 4 === 0 ? 3 : 1);
  }
  doc.restore();

  doc
    .fillColor(mutedTextColor)
    .fontSize(8)
    .font("Courier")
    .text(`TOKEN: ${bookingId}-${Date.now().toString(36).toUpperCase()}`, 340, 665, { width: 216, align: "right" });

  // Footer
  doc
    .fillColor(mutedTextColor)
    .fontSize(8)
    .font("Helvetica")
    .text("BusEase Support: support@busease.com | Website: www.busease.com | Safe Journeys!", 40, 720, {
      width: 532,
      align: "center",
    });
};

/**
 * Generate PDF buffer for high-volume jobs or email attachments
 * @param {Object} bookingData
 * @returns {Promise<Buffer>}
 */
export const generateTicketPdfBuffer = (bookingData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "LETTER", margin: 0 });
      const buffers = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      buildTicketDocument(doc, bookingData);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Stream PDF ticket directly into an Express Response for high-throughput downloads
 * @param {Object} bookingData
 * @param {import('express').Response} res
 */
export const streamTicketPdf = (bookingData, res) => {
  const doc = new PDFDocument({ size: "LETTER", margin: 0 });

  doc.on("error", (err) => {
    console.error("[PDF_STREAM_ERROR]", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Error generating ticket PDF" });
    }
  });

  doc.pipe(res);
  buildTicketDocument(doc, bookingData);
  doc.end();
};
