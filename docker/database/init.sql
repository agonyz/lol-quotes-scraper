CREATE TABLE IF NOT EXISTS champions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS quotes (
    id SERIAL PRIMARY KEY,
    champion_id INT REFERENCES champions(id) ON DELETE CASCADE,
    quote TEXT NOT NULL
);