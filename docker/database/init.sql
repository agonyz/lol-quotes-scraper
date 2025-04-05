CREATE TABLE IF NOT EXISTS champions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS quote_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE
    );

CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    champion_id INT REFERENCES champions(id) ON DELETE CASCADE,
    quote TEXT NOT NULL UNIQUE,
    quote_type_id INT REFERENCES quote_types(id) ON DELETE CASCADE
);

-- insert only 4 quote types for now
INSERT INTO quote_types (type_name)
VALUES
    ('pick'),
    ('ban'),
    ('joke'),
    ('taunt')
