import express from 'express';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { nodeLinks, nodes, workspaceMembers } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all links from a node (outgoing links)
router.get('/node/:nodeId/outgoing', authenticateToken, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const userId = req.user.userId;

    const [sourceNode] = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

    if (!sourceNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, sourceNode.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    const links = await db.select().from(nodeLinks).where(eq(nodeLinks.sourceId, nodeId));

    // Get the target nodes
    const targetNodeIds = links.map((link) => link.targetId);
    const targetNodes = await db.select().from(nodes)
      .where(or(...targetNodeIds.map((id) => eq(nodes.id, id))));

    const linksWithNodes = links.map((link) => ({
      ...link,
      targetNode: targetNodes.find((n) => n.id === link.targetId),
    }));

    res.json({ links: linksWithNodes });
  } catch (error) {
    console.error('Get outgoing links error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all links to a node (backlinks)
router.get('/node/:nodeId/backlinks', authenticateToken, async (req, res) => {
  try {
    const { nodeId } = req.params;
    const userId = req.user.userId;

    const [targetNode] = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);

    if (!targetNode) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, targetNode.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    const links = await db.select().from(nodeLinks).where(eq(nodeLinks.targetId, nodeId));

    // Get the source nodes
    const sourceNodeIds = links.map((link) => link.sourceId);
    const sourceNodes = await db.select().from(nodes)
      .where(or(...sourceNodeIds.map((id) => eq(nodes.id, id))));

    const linksWithNodes = links.map((link) => ({
      ...link,
      sourceNode: sourceNodes.find((n) => n.id === link.sourceId),
    }));

    res.json({ links: linksWithNodes });
  } catch (error) {
    console.error('Get backlinks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a link between nodes
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    const userId = req.user.userId;

    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'sourceId and targetId are required' });
    }

    if (sourceId === targetId) {
      return res.status(400).json({ error: 'Cannot link a node to itself' });
    }

    const [sourceNode] = await db.select().from(nodes).where(eq(nodes.id, sourceId)).limit(1);
    const [targetNode] = await db.select().from(nodes).where(eq(nodes.id, targetId)).limit(1);

    if (!sourceNode || !targetNode) {
      return res.status(404).json({ error: 'One or both nodes not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, sourceNode.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member) {
      return res.status(403).json({ error: 'Access denied to workspace' });
    }

    // Check if link already exists
    const [existingLink] = await db.select().from(nodeLinks)
      .where(and(
        eq(nodeLinks.sourceId, sourceId),
        eq(nodeLinks.targetId, targetId)
      )).limit(1);

    if (existingLink) {
      return res.status(409).json({ error: 'Link already exists' });
    }

    const [newLink] = await db.insert(nodeLinks).values({
      sourceId,
      targetId,
    }).returning();

    res.status(201).json({ link: newLink });
  } catch (error) {
    console.error('Create link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a link
router.delete('/:sourceId/:targetId', authenticateToken, async (req, res) => {
  try {
    const { sourceId, targetId } = req.params;
    const userId = req.user.userId;

    const [sourceNode] = await db.select().from(nodes).where(eq(nodes.id, sourceId)).limit(1);

    if (!sourceNode) {
      return res.status(404).json({ error: 'Source node not found' });
    }

    // Check if user is a member of the workspace
    const [member] = await db.select().from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, sourceNode.workspaceId),
        eq(workspaceMembers.userId, userId)
      )).limit(1);

    if (!member || (member.role !== 'owner' && member.role !== 'editor')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    await db.delete(nodeLinks)
      .where(and(
        eq(nodeLinks.sourceId, sourceId),
        eq(nodeLinks.targetId, targetId)
      ));

    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Delete link error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
