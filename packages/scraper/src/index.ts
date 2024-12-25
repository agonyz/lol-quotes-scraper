import axios from 'axios';
import * as cheerio from 'cheerio';
import { Client } from 'pg';
const scrapeChampions = async () => {
  try {
    const { data } = await axios.get(
      'https://leagueoflegends.fandom.com/wiki/List_of_champions',
    );
    const $ = cheerio.load(data);
    const champions: string[] = [];

    $('table.article-table tbody tr').each((i, row) => {
      const name = $(row)
        .find('td')
        .first()
        .find('[data-champion]')
        .attr('data-champion');

      const link = $(row).find('td').first().find('a').attr('href');
      if (name && link) {
        champions.push(name);
      }
    });
    await saveChampionsToDB(champions);

    console.log('Scraping completed and data saved to the database.');
  } catch (error) {
    console.error('Error during scraping:', error);
  }
};

const saveChampionsToDB = async (champions: string[]) => {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  for (const champion of champions) {
    try {
      await client.query(
        'INSERT INTO champions(name) VALUES($1) ON CONFLICT (name) DO NOTHING',
        [champion],
      );
    } catch (error) {
      console.error('Error saving champion:', error);
    }
  }

  await client.end();
};

scrapeChampions();
