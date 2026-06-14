import express from 'express';
import { eq, and, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { nodes, workspaces, workspaceMembers } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all nodes in a workspace
router.get('/workspace/:workspaceId', authenticateToken, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.userId;

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    const workspaceNodes = await db.select().from(nodes)
      .where(eq(nodes.workspaceId, workspaceId))
      .orderBy(asc(nodes.position));

    res.json({ nodes: workspaceNodes });
  } catch (error) {
    console.error('Get nodes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single node by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [node] = await db.select().from(nodes).where(eq(nodes.id, id)).limit(1);

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, node.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    res.json({ node });
  } catch (error) {
    console.error('Get node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new node
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { workspaceId, parentId, title, type, position, collapsed } = req.body;
    const userId = req.user.userId;

    if (!workspaceId || !title || !type) {
      return res.status(400).json({ error: 'workspaceId, title, and type are required' });
    }

    if (!['section', 'task', 'note'].includes(type)) {
      return res.status(400).json({ error: 'Type must be section, task, or note' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    // If parentId is provided, verify it exists and is in the same workspace
    if (parentId) {
      const [parentNode] = await db.select().from(nodes)
        .where(and(
          eq(nodes.id, parentId),
          eq(nodes.workspaceId, workspaceId)
        )).limit(1);

      if (!parentNode) {
        return res.status(404).json({ error: 'Parent node not found' });
      }
    }

    const [newNode] = await db.insert(nodes).values({
      workspaceId,
      parentId: parentId || null,
      title,
      type,
      position: position || 0,
      collapsed: collapsed || false,
      createdBy: userId,
    }).returning();

    res.status(201).json({ node: newNode });
  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a node
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, position, collapsed, parentId } = req.body;
    const userId = req.user.userId;

    const [existingNode] = await db.select().from(nodes).where(eq(nodes.id, id)).limit(1);

    if (!existingNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, existingNode.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // If parentId is being changed, verify it exists and is in the same workspace
    if (parentId && parentId !== existingNode.parentId) {
      const [parentNode] = await db.select().from(nodes)
        .where(and(
          eq(nodes.id, parentId),
          eq(nodes.workspaceId, existingNode.workspaceId)
        )).limit(1);

      if (!parentNode) {
        return res.status(404).json({ error: 'Parent node not found' });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (position !== undefined) updateData.position = position;
    if (collapsed !== undefined) updateData.collapsed = collapsed;
    if (parentId !== undefined) updateData.parentId = parentId;
    updateData.updatedAt = new Date();

    const [updatedNode] = await db.update(nodes)
      .set(updateData)
      .where(eq(nodes.id, id))
      .returning();

    res.json({ node: updatedNode });
  } catch (error) {
    console.error('Update node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a node
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existingNode] = await db.select().from(nodes).where(eq(nodes.id, id)).limit(1);

    if (!existingNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, existingNode.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await db.delete(nodes).where(eq(nodes.id, id));

    res.json({ message: 'Node deleted successfully' });
  } catch (error) {
    console.error('Delete node error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get children of a node
router.get('/:id/children', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [parentNode] = await db.select().from(nodes).where(eq(nodes.id, id)).limit(1);

    if (!parentNode) {
      return res.status(404).json({ error: 'Parent node not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, parentNode.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    const children = await db.select().from(nodes)
      .where(eq(nodes.parentId, id))
      .orderBy(asc(nodes.position));

    res.json({ nodes: children });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
