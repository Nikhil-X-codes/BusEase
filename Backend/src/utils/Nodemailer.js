import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { generateTicketPdfBuffer } from './pdfGenerator.js';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

const sendTemplateEmail = async ({ email, subject, title, content, text, attachments = [] }) => {
    if (!email) {
        console.warn('[EMAIL] Skipped sending email: recipient email is missing.');
        return;
    }
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[EMAIL] Skipped sending email: EMAIL_USER or EMAIL_PASS not configured in environment.');
        return;
    }

    const senderAddress = process.env.EMAIL_FROM || `"BusEase Support" <${process.env.EMAIL_USER}>`;
    console.log(`[EMAIL] Dispatching email: "${subject}" to recipient: "${email}" via sender: "${process.env.EMAIL_USER}"`);

    await transporter.sendMail({
        from: senderAddress,
        to: email,
        subject,
        text,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#17212b"><div style="background:#07131d;color:#67e8f9;padding:24px"><h1 style="margin:0">BusEase</h1></div><div style="padding:24px"><h2>${title}</h2>${content}<hr style="border:0;border-top:1px solid #ddd;margin:24px 0"><p style="font-size:12px;color:#667085">This is an automated BusEase message. Contact support if you need help.</p></div></div>`,
        attachments,
    });
};

const generateOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const sendOTPEmail = async (email, otp) => {
    await sendTemplateEmail({
        email,
        subject: 'Password Reset Request',
        title: 'Password reset request',
        content: `<p>Use this one-time verification code to reset your password:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${escapeHtml(otp)}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this message.</p>`,
        text: `Your BusEase password reset code is ${otp}. It expires in 10 minutes.`,
    });
};

const sendBookingCancellationEmail = async (email, transactionReference, reason, refundAmount) => {
    await sendTemplateEmail({
        email,
        subject: `Booking Cancelled - ${transactionReference}`,
        title: 'Booking cancelled',
        content: `<p>Your booking <strong>${escapeHtml(transactionReference)}</strong> has been cancelled.</p><p>Reason: ${escapeHtml(reason)}</p><p>Simulated refund amount: <strong>INR ${escapeHtml(refundAmount)}</strong>.</p>`,
        text: `Your BusEase booking ${transactionReference} was cancelled. Reason: ${reason}. Simulated refund amount: INR ${refundAmount}.`,
    });
};

const sendWelcomeEmail = (email, username) => sendTemplateEmail({
    email,
    subject: 'Welcome to BusEase!',
    title: `Welcome, ${escapeHtml(username)}!`,
    content: '<p>Your BusEase account is ready. Search a route, choose your seats, and complete a demonstration booking.</p>',
    text: `Welcome to BusEase, ${username}! Your account is ready.`,
});

const sendBookingConfirmationEmail = async (email, booking) => {
    const rawSeats = booking.seats || [];
    const seats = rawSeats.map((seat) => (typeof seat === 'object' ? seat.seatNumber : seat)).join(', ') || 'N/A';
    const attachments = [];
    
    // Format travel date
    let formattedDate = 'N/A';
    if (booking.selectedDate) {
        try {
            const d = new Date(booking.selectedDate);
            if (!Number.isNaN(d.getTime())) {
                formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
            }
        } catch {
            formattedDate = String(booking.selectedDate);
        }
    }

    try {
        const pdfPayload = {
            ...booking.toObject ? booking.toObject() : booking,
            userEmail: email,
            userName: booking.user?.username || 'Passenger',
        };
        const pdfBuffer = await generateTicketPdfBuffer(pdfPayload);
        attachments.push({
            filename: `BusEase-Ticket-${booking.bookingId || 'booking'}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
        });
    } catch (error) {
        console.error('[EMAIL] Failed to generate PDF attachment for booking confirmation:', error.message);
    }

    return sendTemplateEmail({
        email,
        subject: `Booking Confirmed - ${booking.bookingId || 'BusEase'}`,
        title: 'Booking confirmed',
        content: `<p>Your booking reference is <strong>${escapeHtml(booking.bookingId)}</strong>.</p><p><strong>${escapeHtml(booking.startLocation || 'Origin')} to ${escapeHtml(booking.endLocation || 'Destination')}</strong><br>Travel date: <strong>${escapeHtml(formattedDate)}</strong><br>Seats: <strong>${escapeHtml(seats)}</strong><br>Amount: <strong>INR ${escapeHtml(booking.amount)}</strong></p><p><em>Your official e-ticket PDF is attached to this email.</em></p><p>Payments in this application are simulation-only.</p>`,
        text: `Booking confirmed: ${booking.bookingId}. ${booking.startLocation} to ${booking.endLocation}. Travel date: ${formattedDate}. Seats: ${seats}. Amount: INR ${booking.amount}. Your official e-ticket PDF is attached.`,
        attachments,
    });
};

const sendPaymentReceiptEmail = (email, booking) => sendTemplateEmail({
    email,
    subject: `Payment Receipt - ${booking.bookingId || 'BusEase'}`,
    title: 'Payment receipt',
    content: `<p>Transaction reference: <strong>${escapeHtml(booking.transactionReference)}</strong></p><p>Booking ID: <strong>${escapeHtml(booking.bookingId)}</strong></p><p>Amount recorded: <strong>INR ${escapeHtml(booking.amount)}</strong></p><p>Status: <strong>Simulated payment confirmed</strong></p>`,
    text: `Payment receipt ${booking.transactionReference}. Booking ID: ${booking.bookingId}. Amount: INR ${booking.amount}. Status: Simulated payment confirmed.`,
});

export {
    generateOTP,
    sendOTPEmail,
    sendBookingCancellationEmail,
    sendWelcomeEmail,
    sendBookingConfirmationEmail,
    sendPaymentReceiptEmail,
};