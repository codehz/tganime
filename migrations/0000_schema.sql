-- Migration number: 0000 	 2023-12-02T03:26:46.329Z
pragma foreign_keys=on

create table sources (id TEXT PRIMARY KEY, chat_id INTEGER NOT NULL, thread_id INTEGER NOT NULL, title TEXT NOT NULL, url TEXT NOT NULL) WITHOUT ROWID;

create table sent (id INTEGER PRIMARY KEY, source_id text NOT NULL, nonce text NOT NULL, FOREIGN KEY(source_id) REFERENCES sources (id) ON DELETE CASCADE);

create unique index source_url_unique on sources (chat_id, url);

create unique index source_title_unique on sources (chat_id, title);

create index source_url_index on sources (url);

create unique index sent_nonce_unique on sent (source_id, nonce);