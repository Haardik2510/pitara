import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Pitara <bookings@pitara.com>'; // Update this once you verify your domain

/**
 * Sends a confirmation email to the user when they submit a film.
 */
export async function sendSubmissionEmail(email: string, name: string, filmTitle: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Film Submission Received: ${filmTitle}`,
      html: `
        <div style="background: #0a0b35; color: #f5eed8; font-family: 'Inter', sans-serif; padding: 40px; border: 1px solid #c0b080;">
          <h1 style="font-family: 'Bebas Neue', sans-serif; color: #FFE100; letter-spacing: 4px;">SUBMISSION RECEIVED</h1>
          <p>Hi ${name},</p>
          <p>We've received your submission for <strong>${filmTitle}</strong>.</p>
          <p>Our curation team will review it shortly. You will be notified via this email regarding the status of your screening.</p>
          <div style="margin-top: 30px; border-top: 1px solid rgba(255, 225, 0, 0.2); padding-top: 20px;">
            <p style="font-size: 12px; color: #CC3A00;">— THE PITARA COLLECTIVE</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Mail error:', error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Mail exception:', err);
    return { success: false, error: err };
  }
}

/**
 * Sends a receipt email when a user books a ticket (pending verification).
 */
export async function sendBookingReceiptEmail(email: string, name: string, bookingRef: string, screeningTitle: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Booking Received: ${screeningTitle}`,
      html: `
        <div style="background: #0a0b35; color: #f5eed8; font-family: 'Inter', sans-serif; padding: 40px; border: 1px solid #c0b080;">
          <h1 style="font-family: 'Bebas Neue', sans-serif; color: #FFE100; letter-spacing: 4px;">BOOKING RECEIVED</h1>
          <p>Hi ${name},</p>
          <p>We've received your booking request for <strong>${screeningTitle}</strong>.</p>
          <p><strong>Booking Reference:</strong> ${bookingRef}</p>
          <p>We are currently verifying your payment screenshot. Once confirmed, you will receive your final digital ticket via email.</p>
          <div style="margin-top: 30px; border-top: 1px solid rgba(255, 225, 0, 0.2); padding-top: 20px;">
            <p style="font-size: 12px; color: #CC3A00;">— THE PITARA COLLECTIVE</p>
          </div>
        </div>
      `,
    });

    if (error) {
       console.error('Mail error:', error);
       return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Mail exception:', err);
    return { success: false, error: err };
  }
}
