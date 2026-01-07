import nodemailer from 'nodemailer';
import FileTemplate from '../email-template/fileTemplate';
import Otptemplate from '../email-template/otpTemplate';
/*
 * Configures a Nodemailer transporter for sending emails.
 * 
 * The transporter is set up to use Gmail as the email service provider, but it can be configured to use other services like SendGrid or Mailgun.
 * 
 * @param service - The email service provider (e.g., 'Gmail'). This can be changed to another service provider like SendGrid or Mailgun.
 * @param auth - Contains the authentication details for the email service:
 *    - user: The email address used for sending emails (retrieved from environment variables).
 *    - pass: The email password or an app-specific password (retrieved from environment variables).
 * 
 * This configuration allows the transporter to authenticate and send emails via the specified email service.
 */

// Create transporter only if credentials are available
// This prevents "Missing credentials" error at module load time
const getTransporter = () => {
  // Support both SMTP_USERNAME/SMTP_PASSWORD and SMTP_USER/SMTP_PASS
  const username = process.env.SMTP_USERNAME || process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;

  // Debug: Log environment variables (without exposing password)
  console.log('🔍 Checking SMTP credentials...');
  console.log('SMTP_USERNAME/SMTP_USER:', username ? `${username.substring(0, 3)}***` : 'NOT SET');
  console.log('SMTP_PASSWORD/SMTP_PASS:', password ? 'SET (hidden)' : 'NOT SET');

  if (!username || !password) {
    console.error('❌ SMTP credentials are missing!');
    console.error('Please check your .env file in the TS-API directory');
    console.error('Make sure .env file contains either:');
    console.error('  SMTP_USERNAME=your-email@gmail.com (or SMTP_USER)');
    console.error('  SMTP_PASSWORD=your-app-password (or SMTP_PASS)');
    throw new Error(
      'SMTP credentials are missing. Please set SMTP_USERNAME/SMTP_USER and SMTP_PASSWORD/SMTP_PASS in your .env file.\n' +
      'For Gmail, use an App Password (not regular password):\n' +
      '1. Go to https://myaccount.google.com/apppasswords\n' +
      '2. Generate App Password for "Mail"\n' +
      '3. Use that 16-character password in SMTP_PASSWORD or SMTP_PASS\n' +
      '4. Make sure .env file is in TS-API directory\n' +
      '5. Restart your server after updating .env file'
    );
  }

  return nodemailer.createTransport({
    service: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: username,
      pass: password,
    },
  });
};

/*
 * Function to send an OTP (One-Time Password) email.
 * 
 * @param email - The recipient's email address where the OTP will be sent.
 * @param otp - The generated one-time password that will be included in the email body.
 * 
 * @returns A promise that resolves when the OTP email has been successfully sent.
 * 
 * Process:
 * 1. Creates the email options with the following properties:
 *    - from: The sender email address, retrieved from environment variables.
 *    - to: The recipient email address passed as an argument.
 *    - subject: The subject of the email (in this case, 'Your OTP Code').
 *    - text: The body of the email, which includes the OTP and a note about its validity period (10 minutes).
 * 2. Uses the configured Nodemailer transporter to send the email with the specified options.
 */



export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  // Get transporter (will throw error if credentials missing)
  const transporter = getTransporter();
  
  const otptemp = Otptemplate(email, otp);
  // Setting up mail options, including the recipient email and message body
  const fromEmail = process.env.SMTP_USERNAME || process.env.SMTP_USER;
  const mailOptions = {
    from: fromEmail, // Sender email address
    to: email, // Recipient email address
    subject: 'Your OTP Code', // Email subject
    text: `Your OTP code is: ${otp}. It is valid for 3 minutes.`, // Plain text email content
    html: otptemp.html
  };

  // Sending the OTP email
  await transporter.sendMail(mailOptions);
}



/*
 * Function to send an email with a custom HTML template (e.g., for template downloads).
 * 
 * @param email - The recipient's email address where the email with the template will be sent.
 * @param url - The URL associated with the template (e.g., a download link).
 * @param templateName - The name of the template being sent.
 * @param name - The recipient's name (optional, can be an empty string).
 * 
 * @returns A promise that resolves when the email with the template has been successfully sent.
 * 
 * Process:
 * 1. Generates an HTML email template using the provided URL, template name, and recipient's name by calling the FileTemplate function.
 * 2. Creates the email options with the following properties:
 *    - from: The sender email address, retrieved from environment variables.
 *    - to: The recipient email address passed as an argument.
 *    - subject: The subject of the email (in this case, 'Template Download Successful').
 *    - html: The HTML content of the email, generated by the FileTemplate function.
 * 3. Uses the configured Nodemailer transporter to send the email with the specified options.
 */

export async function sendTemplateEmail(
  email: string,
  url: string,
  templateName: string,
  name: string | ""
): Promise<void> {
  // Get transporter (will throw error if credentials missing)
  const transporter = getTransporter();
  
  // Generate the HTML email template using the provided URL, template name, and recipient's name
  const emailTemplate = FileTemplate(name, url, templateName);

  // Setting up mail options, including the recipient email and HTML content
  const fromEmail = process.env.SMTP_USERNAME || process.env.SMTP_USER;
  const mailOptions = {
    from: fromEmail, // Sender email address
    to: email, // Recipient email address
    subject: 'Template Download Successful', // Email subject
    html: emailTemplate.html, // HTML email content (generated by the FileTemplate function)
  };

  // Sending the email with the template
  await transporter.sendMail(mailOptions);
}
