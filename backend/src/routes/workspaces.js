import express from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { workspaces, workspaceMembers, users } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all workspaces for the current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const userWorkspaces = await db.select({
      id: workspaces.id,
      name: workspaces.name,
      icon: workspaces.icon,
      createdAt: workspaces.createdAt,
      ownerId: workspaces.ownerId,
      role: workspaceMembers.role,
    }).from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId));

    res.json({ workspaces: userWorkspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single workspace by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, id),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Get workspace members
    const members = await db.select({
      userId: users.id,
      email: users.email,
      name: users.name,
      avatarUrl: users.avatarUrl,
      role: workspaceMembers.role,
    }).from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .where(eq(workspaceMembers.workspaceId, id));

    res.json({ workspace, members });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new workspace
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, icon } = req.body;
    const userId = req.user.userId;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const [newWorkspace] = await db.insert(workspaces).values({
      ownerId: userId,
      name,
      icon,
    }).returning();

    // Add the creator as an owner
    await db.insert(workspaceMembers).values({
      workspaceId: newWorkspace.id,
      userId,
      role: 'owner',
    });

    res.status(201).json({ workspace: newWorkspace });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a workspace
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;
    const userId = req.user.userId;

    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, id),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can update workspaces' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (icon !== undefined) updateData.icon = icon;

    const [updatedWorkspace] = await db.update(workspaces)
      .set(updateData)
      .where(eq(workspaces.id, id))
      .returning();

    res.json({ workspace: updatedWorkspace });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a workspace
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, id),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can delete workspaces' });
    }

    await db.delete(workspaces).where(eq(workspaces.id, id));

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Delete workspace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a member to a workspace
router.post('/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const userId = req.user.userId;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, id),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can add members' });
    }

    // Find the user by email
    const [userToAdd] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const [existingMember] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, id),
        eq(workspaceMembers.userId, userToAdd.id)
      )).limit(1);

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member' });
    }

    await db.insert(workspaceMembers).values({
      workspaceId: id,
      userId: userToAdd.id,
      role,
    });

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a member from a workspace
router.delete('/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id, userId: memberUserId } = req.params;
    const userId = req.user.userId;

    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, id),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || member.role !== 'owner') {
      return res.status(403).json({ error: 'Only owners can remove members' });
    }

    await db.delete(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, id),
        eq(workspaceMembers.userId, memberUserId)
      ));

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
