import express from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { authenticateToken, generateTokens } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { sendVerificationEmail, generateVerificationToken, sendPasswordResetEmail, generateResetToken } from '../services/email.js';

const router = express.Router();

// Register
router.post('/register', authRateLimit, async (req, res) => {
  try {
    const { email, password, name, avatarUrl } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = generateVerificationToken();

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash,
      name,
      avatarUrl,
      verificationToken,
    }).returning();

    // Send verification email
    try {
      await sendVerificationEmail(email, name, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Continue with registration even if email fails
    }

    const { accessToken, refreshToken } = generateTokens(newUser.id);

    await db.update(users)
      .set({ refreshToken })
      .where(eq(users.id, newUser.id));

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
        emailVerified: newUser.emailVerified,
      },
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);

    await db.update(users)
      .set({ refreshToken })
      .where(eq(users.id, user.id));

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      await db.update(users)
        .set({ refreshToken: null })
        .where(eq(users.refreshToken, refreshToken));
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token
router.post('/refresh', authRateLimit, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const [user] = await db.select().from(users).where(eq(users.refreshToken, refreshToken)).limit(1);

    if (!user) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    try {
      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      await db.update(users)
        .set({ refreshToken: null })
        .where(eq(users.id, user.id));
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    await db.update(users)
      .set({ refreshToken: newRefreshToken })
      .where(eq(users.id, user.id));

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
      emailVerified: users.emailVerified,
    }).from(users).where(eq(users.id, req.user.userId)).limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify email
router.post('/verify-email', authRateLimit, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const [user] = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1);

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    await db.update(users)
      .set({ 
        emailVerified: new Date(),
        verificationToken: null 
      })
      .where(eq(users.id, user.id));

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend verification email
router.post('/resend-verification', authRateLimit, authenticateToken, async (req, res) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    const verificationToken = generateVerificationToken();

    await db.update(users)
      .set({ verificationToken })
      .where(eq(users.id, user.id));

    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot password
router.post('/forgot-password', authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a password reset link has been sent' });
    }

    const resetToken = generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.update(users)
      .set({ 
        resetToken,
        resetTokenExpires 
      })
      .where(eq(users.id, user.id));

    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If the email exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset password
router.post('/reset-password', authRateLimit, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    const [user] = await db.select().from(users).where(eq(users.resetToken, token)).limit(1);

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    if (!user.resetTokenExpires || new Date(user.resetTokenExpires) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.update(users)
      .set({ 
        passwordHash,
        resetToken: null,
        resetTokenExpires: null 
      })
      .where(eq(users.id, user.id));

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
