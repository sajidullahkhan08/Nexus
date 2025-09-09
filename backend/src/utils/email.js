const nodemailer = require('nodemailer');

const createTransporter = () => {
  // Check if email configuration is available
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is not properly set up');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Add timeout and other options for better reliability
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Nexus Platform" <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html || options.message
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.email);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Email could not be sent');
  }
};

const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Welcome to Nexus Platform!</h2>
      <p>Hi ${user.name},</p>
      <p>Welcome to Nexus Platform - the premier collaboration platform for investors and entrepreneurs.</p>
      <p>As a ${user.role}, you now have access to:</p>
      <ul>
        ${user.role === 'entrepreneur' ? `
          <li>Connect with potential investors</li>
          <li>Schedule meetings and pitch sessions</li>
          <li>Share documents securely</li>
          <li>Manage your startup profile</li>
        ` : `
          <li>Discover promising startups</li>
          <li>Schedule due diligence meetings</li>
          <li>Review business documents</li>
          <li>Manage your investment portfolio</li>
        `}
      </ul>
      <p>Get started by completing your profile and exploring the platform.</p>
      <p>Best regards,<br>The Nexus Platform Team</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'Welcome to Nexus Platform',
    html
  });
};

const sendMeetingInvitation = async (meeting, participant) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Meeting Invitation</h2>
      <p>Hi ${participant.name},</p>
      <p>You've been invited to a meeting:</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>${meeting.title}</h3>
        <p><strong>Date:</strong> ${new Date(meeting.startTime).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${new Date(meeting.startTime).toLocaleTimeString()} - ${new Date(meeting.endTime).toLocaleTimeString()}</p>
        <p><strong>Description:</strong> ${meeting.description || 'No description provided'}</p>
      </div>
      <p>Please respond to this invitation through the platform.</p>
      <p>Best regards,<br>The Nexus Platform Team</p>
    </div>
  `;

  await sendEmail({
    email: participant.email,
    subject: `Meeting Invitation: ${meeting.title}`,
    html
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563EB;">Password Reset Request</h2>
      <p>Hi ${user.name},</p>
      <p>You requested a password reset for your Nexus Platform account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour. If you didn't request this reset, please ignore this email.</p>
      <p>Best regards,<br>The Nexus Platform Team</p>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject: 'Password Reset Request',
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendMeetingInvitation,
  sendPasswordResetEmail
};