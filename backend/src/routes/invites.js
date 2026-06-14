import express from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { workspaceInvites, workspaces, workspaceMembers, users } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { sendWorkspaceInviteEmail, generateVerificationToken } from '../services/email.js';

const router = express.Router();

// Create a workspace invite
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { workspaceId, email, role } = req.body;

    if (!workspaceId || !email) {
      return res.status(400).json({ error: 'Workspace ID and email are required' });
    }

    // Check if user is owner of the workspace
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Only workspace owners can invite members' });
    }

    // Check if user is already a member
    const [existingMember] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, req.user.userId)
      )).limit(1);

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    // Generate invite token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const [invite] = await db.insert(workspaceInvites).values({
      workspaceId,
      email,
      role: role || 'viewer',
      token,
      expiresAt,
      createdBy: req.user.userId,
    }).returning();

    // Send invite email
    try {
      const [inviter] = await db.select().from(users).where(eq(users.id, req.user.userId)).limit(1);
      await sendWorkspaceInviteEmail(email, workspace.name, token, inviter.name);
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({ invite });
  } catch (error) {
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Accept a workspace invite
router.post('/accept', authRateLimit, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    const [invite] = await db.select().from(workspaceInvites).where(eq(workspaceInvites.token, token)).limit(1);

    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite token' });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    if (invite.acceptedAt) {
      return res.status(400).json({ error: 'Invite has already been accepted' });
    }

    // Add user to workspace
    await db.insert(workspaceMembers).values({
      workspaceId: invite.workspaceId,
      userId: req.user.userId,
      role: invite.role,
    });

    // Mark invite as accepted
    await db.update(workspaceInvites)
      .set({ acceptedAt: new Date() })
      .where(eq(workspaceInvites.id, invite.id));

    res.json({ message: 'Invite accepted successfully' });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all invites for a workspace
router.get('/workspace/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Check if user is owner of the workspace
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (workspace.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Only workspace owners can view invites' });
    }

    const invites = await db.select().from(workspaceInvites)
      .where(eq(workspaceInvites.workspaceId, workspaceId))
      .orderBy(desc(workspaceInvites.createdAt));

    res.json({ invites });
  } catch (error) {
    console.error('Get invites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke an invite
router.delete('/:inviteId', authenticateToken, async (req, res) => {
  try {
    const { inviteId } = req.params;

    const [invite] = await db.select().from(workspaceInvites).where(eq(workspaceInvites.id, inviteId)).limit(1);

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    // Check if user is owner of the workspace
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, invite.workspaceId)).limit(1);

    if (!workspace || workspace.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Only workspace owners can revoke invites' });
    }

    await db.delete(workspaceInvites).where(eq(workspaceInvites.id, inviteId));

    res.json({ message: 'Invite revoked successfully' });
  } catch (error) {
    console.error('Revoke invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
