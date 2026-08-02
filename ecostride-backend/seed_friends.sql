DROP TABLE IF EXISTS friends;
CREATE TABLE friends (
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, friend_id)
);

INSERT INTO friends (user_id, friend_id, created_at) VALUES 
('JYrPhjkWhxYbEEw3NYW90fpezSR2', 'mock_uid_101', 1700000000000),
('mock_uid_101', 'JYrPhjkWhxYbEEw3NYW90fpezSR2', 1700000000000),
('JYrPhjkWhxYbEEw3NYW90fpezSR2', 'mock_uid_102', 1700000000000),
('mock_uid_102', 'JYrPhjkWhxYbEEw3NYW90fpezSR2', 1700000000000),
('JYrPhjkWhxYbEEw3NYW90fpezSR2', 'mock_uid_103', 1700000000000),
('mock_uid_103', 'JYrPhjkWhxYbEEw3NYW90fpezSR2', 1700000000000);
