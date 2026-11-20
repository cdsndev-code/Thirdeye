// Same tables as the bot. Safe to run many times.
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS settings(
  guild_id BIGINT PRIMARY KEY, log_channel BIGINT, appeal_link TEXT,
  antispam INTEGER DEFAULT 1, antiraid INTEGER DEFAULT 1, verify_channel BIGINT, verify_role BIGINT
);
ALTER TABLE settings ADD COLUMN IF NOT EXISTS level_enabled INTEGER DEFAULT 1;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS level_channel BIGINT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS staff_channel BIGINT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS warn_limit INTEGER DEFAULT 3;
CREATE TABLE IF NOT EXISTS chain(guild_id BIGINT, role_id BIGINT, rank INTEGER, PRIMARY KEY(guild_id, role_id));
CREATE TABLE IF NOT EXISTS cases(
  guild_id BIGINT, case_no INTEGER, user_id BIGINT, mod_id BIGINT, action TEXT, reason TEXT, created BIGINT,
  PRIMARY KEY(guild_id, case_no)
);
CREATE TABLE IF NOT EXISTS custom_commands(
  guild_id BIGINT, name TEXT, response TEXT, as_embed INTEGER DEFAULT 0, created_by BIGINT, created BIGINT,
  PRIMARY KEY(guild_id, name)
);
CREATE TABLE IF NOT EXISTS levels(
  guild_id BIGINT, user_id BIGINT, xp BIGINT DEFAULT 0, messages BIGINT DEFAULT 0, PRIMARY KEY(guild_id, user_id)
);
CREATE INDEX IF NOT EXISTS levels_xp_idx ON levels(guild_id, xp DESC);
CREATE TABLE IF NOT EXISTS level_rewards(guild_id BIGINT, level INTEGER, role_id BIGINT, PRIMARY KEY(guild_id, level));
CREATE TABLE IF NOT EXISTS staff_log(
  guild_id BIGINT, entry_no INTEGER, user_id BIGINT, mod_id BIGINT, action TEXT,
  reason TEXT, old_role TEXT, new_role TEXT, created BIGINT, PRIMARY KEY(guild_id, entry_no)
);
CREATE TABLE IF NOT EXISTS embed_templates(
  guild_id BIGINT, kind TEXT, title TEXT, description TEXT, color INTEGER, footer TEXT, image_url TEXT,
  PRIMARY KEY(guild_id, kind)
);
CREATE TABLE IF NOT EXISTS ticket_config(
  guild_id BIGINT PRIMARY KEY, category_id BIGINT, staff_role_id BIGINT, panel_channel_id BIGINT,
  panel_message_id BIGINT, max_open INTEGER DEFAULT 1, close_delay INTEGER DEFAULT 5,
  dm_enabled INTEGER DEFAULT 1, enabled INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS ticket_categories(
  guild_id BIGINT, key TEXT, label TEXT, description TEXT, position INTEGER DEFAULT 0, PRIMARY KEY(guild_id, key)
);
CREATE TABLE IF NOT EXISTS ticket_texts(guild_id BIGINT, key TEXT, value TEXT, PRIMARY KEY(guild_id, key));
CREATE TABLE IF NOT EXISTS tickets(
  channel_id BIGINT PRIMARY KEY, guild_id BIGINT, owner_id BIGINT, claimed_by BIGINT,
  category_label TEXT, reason TEXT, created BIGINT, closed BIGINT, closed_by BIGINT, close_reason TEXT
);
`;
