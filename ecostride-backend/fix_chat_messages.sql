PRAGMA foreign_keys=off;

CREATE TABLE chat_messages_new (
  id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

INSERT INTO chat_messages_new SELECT * FROM chat_messages;

DROP TABLE chat_messages;

ALTER TABLE chat_messages_new RENAME TO chat_messages;

CREATE INDEX idx_chat_guild ON chat_messages(guild_id);
CREATE INDEX idx_chat_user ON chat_messages(user_id);
CREATE INDEX idx_chat_created_at ON chat_messages(created_at);

PRAGMA foreign_keys=on;
