-- Migration: Remove individual chat tables
-- This removes the deprecated individual chat functionality
-- Only group chats (linked to worklets) are supported going forward

-- Drop old individual chat tables if they exist
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_rooms;

-- Drop old group chat tables that used separate group_chats table
-- (Now we link messages directly to worklets via WorkletID)
DROP TABLE IF EXISTS group_chat_members;
DROP TABLE IF EXISTS group_chats;
