/**
 * Phase 0 Security Rules Verification Spec (Dirty Dozen Assertions).
 * Used as a static verification suite against security_spec.md invariants.
 */
export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expected: 'PERMISSION_DENIED';
  guardRule: string;
}

export const DIRTY_DOZEN_CASES: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Self-Admin Escalation on User Create',
    collectionPath: '/users/{userId}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    guardRule: "incoming().role == 'user' && incoming().plan == 'free' && incoming().status == 'active'"
  },
  {
    id: 2,
    name: 'Shadow Ghost Field Injection on Conversation Create',
    collectionPath: '/conversations/{conversationId}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    guardRule: "data.keys().hasOnly([...])"
  },
  {
    id: 3,
    name: 'Unverified Email Admin Spoof',
    collectionPath: '/admins/{userId}',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    guardRule: "request.auth.token.email == 'abhinavsingha369@gmail.com' && request.auth.token.email_verified == true"
  },
  {
    id: 4,
    name: 'Cross-Tenant User PII Read',
    collectionPath: '/users/{userId}',
    operation: 'get',
    expected: 'PERMISSION_DENIED',
    guardRule: 'isOwner(userId) || isAdmin()'
  },
  {
    id: 5,
    name: 'Cross-Tenant Conversation List Scraping',
    collectionPath: '/conversations',
    operation: 'list',
    expected: 'PERMISSION_DENIED',
    guardRule: 'resource.data.userId == request.auth.uid || isAdmin()'
  },
  {
    id: 6,
    name: 'Orphaned Message Write to Another Users Conversation',
    collectionPath: '/conversations/{conversationId}/messages/{messageId}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    guardRule: 'get(/databases/$(database)/documents/conversations/$(conversationId)).data.userId == request.auth.uid'
  },
  {
    id: 7,
    name: 'ID Path Poisoning',
    collectionPath: '/savedOutputs/{outputId}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    guardRule: 'isValidId(outputId)'
  },
  {
    id: 8,
    name: 'Client Timestamp Forgery',
    collectionPath: '/savedOutputs/{outputId}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    guardRule: 'incoming().createdAt == request.time && incoming().updatedAt == request.time'
  },
  {
    id: 9,
    name: 'Immutable OwnerId Tampering on Update',
    collectionPath: '/conversations/{conversationId}',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    guardRule: 'incoming().userId == existing().userId'
  },
  {
    id: 10,
    name: 'Non-Admin Agent System Prompt Tampering',
    collectionPath: '/agents/{agentId}',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    guardRule: 'isAdmin()'
  },
  {
    id: 11,
    name: 'Non-Admin Feedback Status Resolution',
    collectionPath: '/feedback/{feedbackId}',
    operation: 'update',
    expected: 'PERMISSION_DENIED',
    guardRule: 'isAdmin()'
  },
  {
    id: 12,
    name: 'Resource Exhaustion Oversized Content',
    collectionPath: '/conversations/{conversationId}/messages/{messageId}',
    operation: 'create',
    expected: 'PERMISSION_DENIED',
    guardRule: 'data.content is string && data.content.size() >= 1 && data.content.size() <= 32000'
  }
];
