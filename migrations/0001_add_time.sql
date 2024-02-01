alter table sources
	add column last_fetch_at datetime not null
	default '0000-00-00 00:00:00';
