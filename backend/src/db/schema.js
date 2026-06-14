import { pgTable, serial, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  refreshToken: text('refresh_token'),
  emailVerified: timestamp('email_verified'),
  verificationToken: text('verification_token'),
  resetToken: text('reset_token'),
  resetTokenExpires: timestamp('reset_token_expires'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device: text('device'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  lastActive: timestamp('last_active').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const workspaceMembers = pgTable('workspace_members', {
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'owner', 'editor', 'viewer'
});

export const nodes = pgTable('nodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references(() => nodes.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'section', 'task', 'note'
  position: integer('position').notNull().default(0),
  collapsed: boolean('collapsed').default(false),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const nodeContent = pgTable('node_content', {
  nodeId: uuid('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  contentType: text('content_type').notNull(), // 'text', 'image', 'video', 'audio', 'link', 'file'
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
});

export const nodeTags = pgTable('node_tags', {
  nodeId: uuid('node_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
});

export const nodeLinks = pgTable('node_links', {
  sourceId: uuid('source_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
  targetId: uuid('target_id').notNull().references(() => nodes.id, { onDelete: 'cascade' }),
});

export const workspaceInvites = pgTable('workspace_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('viewer'),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  workspaceMembers: many(workspaceMembers),
  createdNodes: many(nodes),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerId],
    references: [users.id],
  }),
  members: many(workspaceMembers),
  nodes: many(nodes),
  tags: many(tags),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [workspaceMembers.userId],
    references: [users.id],
  }),
}));

export const nodesRelations = relations(nodes, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [nodes.workspaceId],
    references: [workspaces.id],
  }),
  parent: one(nodes, {
    fields: [nodes.parentId],
    references: [nodes.id],
  }),
  children: many(nodes),
  createdBy: one(users, {
    fields: [nodes.createdBy],
    references: [users.id],
  }),
  content: many(nodeContent),
  tags: many(nodeTags),
  links: many(nodeLinks),
}));

export const nodeContentRelations = relations(nodeContent, ({ one }) => ({
  node: one(nodes, {
    fields: [nodeContent.nodeId],
    references: [nodes.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [tags.workspaceId],
    references: [workspaces.id],
  }),
  nodes: many(nodeTags),
}));

export const nodeTagsRelations = relations(nodeTags, ({ one }) => ({
  node: one(nodes, {
    fields: [nodeTags.nodeId],
    references: [nodes.id],
  }),
  tag: one(tags, {
    fields: [nodeTags.tagId],
    references: [tags.id],
  }),
}));

export const nodeLinksRelations = relations(nodeLinks, ({ one }) => ({
  source: one(nodes, {
    fields: [nodeLinks.sourceId],
    references: [nodes.id],
  }),
  target: one(nodes, {
    fields: [nodeLinks.targetId],
    references: [nodes.id],
  }),
}));
