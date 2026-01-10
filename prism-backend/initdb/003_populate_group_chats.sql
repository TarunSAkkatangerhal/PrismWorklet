-- Populate group chats for all existing worklets
-- This creates group chats and adds members for worklets that were created before the chat feature

-- Step 1: Create group chats for all worklets that don't have one yet
INSERT INTO group_chats (worklet_id, group_name, created_by, created_at)
SELECT 
    w.id,
    CONCAT('Worklet-', w.id),
    COALESCE(
        (SELECT user_id FROM user_worklet_association 
         WHERE worklet_id = w.id AND role_in_worklet = 'Mentor' 
         LIMIT 1),
        1  -- Fallback to user_id 1 if no mentor found
    ),
    NOW()
FROM worklets w
WHERE NOT EXISTS (
    SELECT 1 FROM group_chats gc WHERE gc.worklet_id = w.id
);

-- Step 2: Add all worklet members to their respective group chats
INSERT INTO group_chat_members (group_id, user_id, is_admin, joined_at)
SELECT DISTINCT
    gc.group_id,
    uwa.user_id,
    CASE WHEN uwa.role_in_worklet = 'Mentor' THEN TRUE ELSE FALSE END,
    NOW()
FROM group_chats gc
JOIN user_worklet_association uwa ON gc.worklet_id = uwa.worklet_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM group_chat_members gcm 
    WHERE gcm.group_id = gc.group_id 
    AND gcm.user_id = uwa.user_id
);

-- Step 3: Verify results
SELECT 
    'Group Chats Created' as info,
    COUNT(*) as count
FROM group_chats
UNION ALL
SELECT 
    'Group Members Added' as info,
    COUNT(*) as count
FROM group_chat_members;

-- Step 4: Show summary by worklet
SELECT 
    gc.group_id,
    gc.group_name,
    w.title as worklet_title,
    COUNT(gcm.member_id) as member_count,
    GROUP_CONCAT(DISTINCT u.email SEPARATOR ', ') as members
FROM group_chats gc
JOIN worklets w ON gc.worklet_id = w.id
LEFT JOIN group_chat_members gcm ON gc.group_id = gcm.group_id
LEFT JOIN users u ON gcm.user_id = u.user_id
GROUP BY gc.group_id, gc.group_name, w.title
ORDER BY gc.group_id;
