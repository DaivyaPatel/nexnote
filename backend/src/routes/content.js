import express from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { nodeContent, nodes, workspaceMembers } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all content for a node
router.get('/node/:nodeId', authenticateToken, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const userId = req.user.userId;

    const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

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

    const content = await db.select().from(nodeContent)
      .where(eq(nodeContent.nodeId, nodeId))
      .orderBy(nodeContent.createdAt);

    res.json({ content });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add content to a node
router.post('/node/:nodeId', authenticateToken, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { contentType, content } = req.body;
    const userId = req.user.userId;

    if (!contentType || !content) {
      return res.status(400).json({ error: 'contentType and content are required' });
    }

    const validTypes = ['text', 'image', 'video', 'audio', 'link', 'file'];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, node.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const [newContent] = await db.insert(nodeContent).values({
      nodeId,
      contentType,
      content,
    }).returning();

    res.status(201).json({ content: newContent });
  } catch (error) {
    console.error('Add content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update content
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const [existingContent] = await db.select().from(nodeContent).where(eq(nodeContent.nodeId, id)).limit(1);

    if (!existingContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const [node] = await db.select().from(nodes).where(eq(nodes.id, existingContent.nodeId)).limit(1);

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, node.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const [updatedContent] = await db.update(nodeContent)
      .set({ content })
      .where(eq(nodeContent.nodeId, id))
      .returning();

    res.json({ content: updatedContent });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete content
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const [existingContent] = await db.select().from(nodeContent).where(eq(nodeContent.nodeId, id)).limit(1);

    if (!existingContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const [node] = await db.select().from(nodes).where(eq(nodes.id, existingContent.nodeId)).limit(1);

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, node.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await db.delete(nodeContent).where(eq(nodeContent.nodeId, id));

    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
