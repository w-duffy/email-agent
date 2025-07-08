import { db } from './db.js';
import { agent_actions, agentActionEnum } from './schema.js';

export interface LogAgentActionParams {
  threadId: number;
  action: typeof agentActionEnum.enumValues[number];
  emailId?: number;
  draftResponseId?: number;
  actorUserId?: number;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export async function logAgentAction({
  threadId,
  action,
  emailId,
  draftResponseId,
  actorUserId,
  metadata,
  ipAddress
}: LogAgentActionParams) {
  return await db.insert(agent_actions).values({
    thread_id: threadId,
    action,
    email_id: emailId,
    draft_response_id: draftResponseId,
    actor_user_id: actorUserId,
    metadata,
    ip_address: ipAddress
  }).returning();
}
