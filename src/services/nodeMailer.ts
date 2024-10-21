import nodemailer from 'nodemailer';

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail', // You can use Gmail or any other service
  auth: {
    user: process.env.SMTP_USERNAME, // Your email address
    pass: process.env.SMTP_PASSWORD, // Your email password or app-specific password
  },
});

// Function to send OTP email
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const mailOptions = {
    from: process.env.SMTP_USERNAME,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}
