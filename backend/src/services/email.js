import nodemailer from 'nodemailer';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: process.env.EMAIL_PORT || 2525,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, name, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@nexnote.com',
    to: email,
    subject: 'Verify your NexNote account',
    html: `
      <h1>Welcome to NexNote, ${name}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ff6b6b; color: white; text-decoration: none; border-radius: 4px;">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', email);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@nexnote.com',
    to: email,
    subject: 'Reset your NexNote password',
    html: `
      <h1>Reset your password</h1>
      <p>You requested a password reset for your NexNote account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ff6b6b; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const sendWorkspaceInviteEmail = async (email, workspaceName, inviteToken, inviterName) => {
  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite?token=${inviteToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@nexnote.com',
    to: email,
    subject: `You're invited to join ${workspaceName} on NexNote`,
    html: `
      <h1>You're invited!</h1>
      <p>${inviterName} has invited you to join the workspace <strong>${workspaceName}</strong> on NexNote.</p>
      <p>Click the link below to accept the invitation:</p>
      <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ff6b6b; color: white; text-decoration: none; border-radius: 4px;">Accept Invitation</a>
      <p>This invitation will expire in 7 days.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Workspace invite email sent to:', email);
  } catch (error) {
    console.error('Error sending workspace invite email:', error);
    throw error;
  }
};

export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
