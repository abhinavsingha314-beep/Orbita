# ORBITA AI Security Specification (Phase 0 TDD)

## 1. Core Data Invariants
1. **Identity Isolation**: Users can only create, read, update, or delete their own `conversations`, `messages`, `savedOutputs`, `usage`, `favoritePrompts`, private `promptTemplates`, and `feedback` items.
2. **PII Isolation**: `/users/{userId}` documents contain `email` and are strictly readable only by the document owner (`userId == request.auth.uid`) or a verified administrator (`isAdmin()`). `list` on `/users` is strictly restricted to `isAdmin()`.
3. **Zero Self-Privilege Escalation**: During `/users/{userId}` creation, non-admins can only create `role: 'user'`, `plan: 'free'`, and `status: 'active'`. Non-admins cannot alter `role`, `plan`, `status`, `uid`, `email`, or `createdAt` on update.
4. **Master Gate on Subcollections**: `/conversations/{conversationId}/messages/{messageId}` verifies via `get()` that the parent `/conversations/{conversationId}` exists and belongs to `request.auth.uid`.
5. **Strict Schema & Size Bounds**: Every string field enforces `.size()` limits matching `firebase-blueprint.json`, every keyset enforces `hasAll` + `hasOnly` on create and `affectedKeys().hasOnly(...)` on update, and timestamps must equal `request.time`.
6. **Verified Auth Gate**: All standard writes require `request.auth != null && request.auth.token.email_verified == true`.
7. **Admin Bootstrapping**: `isAdmin()` validates `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` OR (`request.auth.token.email == 'abhinavsingha369@gmail.com' && request.auth.token.email_verified == true`).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Self-Admin Escalation**: `POST /users/u1` with `{ role: "admin", plan: "enterprise" }` by non-admin -> `PERMISSION_DENIED`.
2. **Shadow Ghost Field Injection**: `POST /conversations/c1` with extra `{ isApproved: true }` -> `PERMISSION_DENIED`.
3. **Unverified Email Spoof**: Request with `email: "abhinavsingha369@gmail.com"` and `email_verified: false` -> `PERMISSION_DENIED`.
4. **Cross-Tenant PII Read**: User B calls `get(/users/userA)` -> `PERMISSION_DENIED`.
5. **Cross-Tenant List Scraping**: User B runs `list(/conversations)` without `where("userId", "==", userB)` -> `PERMISSION_DENIED`.
6. **Orphaned Message Write**: User B writes to `/conversations/convBelongsToUserA/messages/m1` -> `PERMISSION_DENIED`.
7. **ID Path Poisoning**: User writes `/savedOutputs/invalid$id!with/junk` or 500-char ID -> `PERMISSION_DENIED`.
8. **Timestamp Forgery**: User submits `createdAt` in the past/future instead of `request.time` -> `PERMISSION_DENIED`.
9. **Immutable Owner Tampering**: User updates `conversations/c1` changing `userId` to another UID -> `PERMISSION_DENIED`.
10. **Non-Admin Agent Tampering**: Standard user attempts to update `/agents/sales` `systemInstructions` -> `PERMISSION_DENIED`.
11. **Non-Admin Feedback Resolution**: Standard user updates `/feedback/f1` setting `status: "resolved"` -> `PERMISSION_DENIED`.
12. **Resource Exhaustion Payload**: User submits a 100KB `title` or `content` > 32KB -> `PERMISSION_DENIED`.
