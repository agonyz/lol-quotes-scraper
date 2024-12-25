## lol-quotes-scraper

Scraper used to gather league of legends champion quotes from the wiki.

### commands
- `docker compose run scraper npm run db:test` // Test db conneciton
- `docker compose run scraper npm run scraper:start` // Start scraper
- `docker compose up --build -d` // Build (after changes)

### Usage
Set up the containers:
- `docker compose up -d`

Test the database connectivity:
- `docker compose run scraper npm run db:test`

Start the scraper and import results into the database:
- `docker compose run scraper npm run scraper:start`