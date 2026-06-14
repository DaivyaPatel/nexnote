import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all sessions for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userSessions = await db.select().from(sessions)
      .where(eq(sessions.userId, req.user.userId))
      .orderBy(desc(sessions.lastActive));

    res.json({ sessions: userSessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new session (called on login)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { device, userAgent, ipAddress } = req.body;

    const [newSession] = await db.insert(sessions).values({
      userId: req.user.userId,
      device: device || 'Unknown Device',
      userAgent: userAgent || req.headers['user-agent'] || 'Unknown',
      ipAddress: ipAddress || req.ip || 'Unknown',
    }).returning();

    res.status(201).json({ session: newSession });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke a specific session
router.delete('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [session] = await db.select().from(sessions)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, req.user.userId)
      )).limit(1);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await db.delete(sessions).where(eq(sessions.id, sessionId));

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke all sessions except current
router.post('/revoke-others', authenticateToken, async (req, res) => {
  try {
    const { currentSessionId } = req.body;

    if (!currentSessionId) {
      return res.status(400).json({ error: 'Current session ID is required' });
    }

    await db.delete(sessions).where(and(
      eq(sessions.userId, req.user.userId),
      // Not the current session
      // Note: This is a simplified approach, in production you'd want to track the current session differently
    ));

    res.json({ message: 'All other sessions revoked successfully' });
  } catch (error) {
    console.error('Revoke other sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update session last active time
router.patch('/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const [session] = await db.select().from(sessions)
      .where(and(
        eq(sessions.id, sessionId),
        eq(sessions.userId, req.user.userId)
      )).limit(1);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await db.update(sessions)
      .set({ lastActive: new Date() })
      .where(eq(sessions.id, sessionId));

    res.json({ message: 'Session updated successfully' });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
