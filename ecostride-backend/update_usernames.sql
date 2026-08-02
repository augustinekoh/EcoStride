CREATE TABLE IF NOT EXISTS friends (
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(friend_id) REFERENCES users(id)
);

UPDATE users 
SET username = CASE 
    WHEN email LIKE '%@%' THEN substr(email, 1, instr(email, '@') - 1)
    ELSE 'User_' || substr(player_id, 1, 4)
END
WHERE username IS NULL OR username = '';
