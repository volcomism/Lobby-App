CREATE TABLE hosts
  ( email TEXT PRIMARY KEY
  , name TEXT NOT NULL
);

CREATE TABLE people
  ( id INTEGER PRIMARY KEY ASC
  , first_name TEXT NOT NULL
  , last_name TEXT NOT NULL
  , visit_reason TEXT NOT NULL
  , company_name TEXT
  , job_title TEXT
  , email TEXT
  , host TEXT
  , badge_number TEXT
  , signin_time DATETIME NOT NULL
  , signout_time DATETIME
);

CREATE TABLE settings
  ( id INTEGER PRIMARY KEY ASC
  , user_timeout INTEGER NOT NULL
  , admin_password TEXT NOT NULL
  , company_name TEXT NOT NULL
  , company_location TEXT NOT NULL
  , ds_env TEXT NOT NULL
  , ds_account_name TEXT NOT NULL
  , ds_account_password TEXT NOT NULL
  , ds_account_key TEXT NOT NULL
);

CREATE TABLE reasons
  ( id INTEGER PRIMARY KEY ASC
  , reason TEXT UNIQUE
  , access_key TEXT
  , show_company INTEGER DEFAULT 0
  , template_guid TEXT
  , show_host INTEGER DEFAULT 0
  , show_badge INTEGER DEFAULT 0
);

CREATE TABLE sessions
  ( sid TEXT PRIMARY KEY
  , data TEXT
);

