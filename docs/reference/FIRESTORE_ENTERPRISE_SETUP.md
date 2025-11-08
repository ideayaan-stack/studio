# Firestore Enterprise Edition Setup Guide

Since you're using Firestore Enterprise Edition (not test mode), here's how to ensure your app stays free and supports 200 concurrent users.

## Understanding Firestore Pricing (Free Tier)

Firestore Enterprise Edition still has a **generous free tier**:

### Free Tier Limits (Spark Plan - Free Forever)
- **Storage**: 1 GB total
- **Document Reads**: 50,000/day
- **Document Writes**: 20,000/day
- **Document Deletes**: 20,000/day
- **Network Egress**: 10 GB/month

### For 200 Concurrent Users

With proper optimization, the free tier can easily support 200 users:

**Daily Usage Estimates:**
- **Reads**: ~200 users × 50 reads/day = 10,000 reads/day ✅ (within 50K limit)
- **Writes**: ~200 users × 20 writes/day = 4,000 writes/day ✅ (within 20K limit)
- **Storage**: ~1MB per user = 200MB total ✅ (within 1GB limit)

## Optimizations to Stay Free

### 1. Efficient Queries
✅ **Already implemented:**
- Role-based filtering reduces unnecessary reads
- Queries are scoped to user's team/role
- Real-time listeners only subscribe to relevant data

### 2. Index Management
Create composite indexes only for queries you actually use:

```bash
# Deploy indexes
firebase deploy --only firestore:indexes
```

**Common indexes needed:**
- `messages`: `teamId` + `timestamp`
- `tasks`: `teamId` + `status`
- `files`: `teamId` + `uploadDate`

### 3. Pagination (Future Enhancement)
For large datasets, implement pagination:
- Limit query results to 20-50 items per page
- Use `startAfter()` for pagination
- Only load visible data

### 4. Cache Strategy
- Use Firestore's built-in offline persistence
- Cache frequently accessed data
- Reduce redundant reads

## Monitoring Usage

### Check Current Usage
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Usage and billing**
4. Check **Firestore** usage metrics

### Set Up Alerts
1. In Firebase Console → **Usage and billing**
2. Click **Set budget alerts**
3. Set alerts at:
   - 50% of free tier (warning)
   - 80% of free tier (critical)

## Cost Optimization Tips

### 1. Minimize Real-time Listeners
- Only subscribe to data the user is actively viewing
- Unsubscribe when navigating away
- Use one-time reads for static data

### 2. Batch Operations
- Group multiple writes into batches (max 500 operations)
- Reduces write count

### 3. Delete Unused Data
- Regularly clean up old messages/files
- Archive instead of delete if needed for history

### 4. Optimize Document Structure
- Keep documents small (< 1MB)
- Store file URLs, not file data
- Use subcollections for large datasets

## If You Exceed Free Tier

If you approach limits, consider:

1. **Blaze Plan (Pay-as-you-go)**
   - Still free for usage within Spark limits
   - Only pay for overages
   - $0.06 per 100K document reads
   - $0.18 per 100K document writes

2. **Optimize Further**
   - Implement pagination
   - Add data archiving
   - Use Cloud Functions for batch operations

## Current App Optimizations

✅ **Already implemented:**
- Role-based query filtering
- Team-scoped data access
- Efficient Firestore queries
- Real-time updates only for active views
- Proper index usage

## Recommended Settings

### Firestore Settings
1. **Location**: Choose closest to your users (e.g., `us-central1`)
2. **Mode**: Native mode (not Datastore mode)
3. **Backup**: Enable daily backups (optional, may have cost)

### Security Rules
✅ Already deployed with proper access control

## Monitoring Dashboard

Create a simple usage monitor in your app (Core users only):

```typescript
// Example: Check document counts
const stats = {
  users: (await db.collection('users').count().get()).data().count,
  teams: (await db.collection('teams').count().get()).data().count,
  tasks: (await db.collection('tasks').count().get()).data().count,
  messages: (await db.collection('messages').count().get()).data().count,
};
```

## Summary

Your app is **already optimized** for the free tier:
- ✅ Efficient queries
- ✅ Role-based filtering
- ✅ Proper data scoping
- ✅ Real-time updates only where needed

**For 200 concurrent users**, you should stay well within free tier limits with normal usage patterns.

