import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from './utils/db';

interface Champion {
  id: number;
  name: string;
}

const scrapeChampions = async () => {
  try {
    const champions = await scrapeChampionList();
    await saveChampionsToDB(champions);
    const championsFromDB = await getChampionsFromDB();
    await scrapeAndSaveQuotes(championsFromDB);
    console.log('Scraping completed and data saved to the database.');
  } catch (error) {
    console.error('Error during scraping:', error);
  }
};

const scrapeChampionList = async (): Promise<string[]> => {
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

  return champions;
};

const saveChampionsToDB = async (champions: string[]) => {
  const client = await pool.connect();
  try {
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
  } finally {
    client.release();
  }
};

const getChampionsFromDB = async (): Promise<Champion[]> => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, name FROM champions');
    return result.rows;
  } finally {
    client.release();
  }
};

const scrapeAndSaveQuotes = async (championsFromDB: Champion[]) => {
  const scrapePromises = championsFromDB.map((champion) =>
    scrapeChampionQuotes(champion),
  );

  await Promise.all(scrapePromises);
};

const scrapeChampionQuotes = async (champion: Champion) => {
  try {
    let championAudioUrl = `https://leagueoflegends.fandom.com/wiki/${champion.name}/LoL/Audio`;
    if (champion.name === 'Nunu & Willump') {
      championAudioUrl = `https://leagueoflegends.fandom.com/wiki/nunu/LoL/Audio`;
    }
    const { data } = await axios.get(championAudioUrl);
    const $ = cheerio.load(data);

    // only gather the pick quote for now
    // looks a bit complicated, but would otherwise not work due to quotes like kindred's
    const quoteElement = $('ul li i').eq(1).parent();
    let quoteText = '';
    quoteElement.children().each((i, e) => {
      const tagName = $(e).get(0).tagName.toLowerCase();
      if (tagName === 'sup') return;

      if (i > 0) {
        let text = $(e).text().trim();
        quoteText += text + ' ';
      }
    });

    quoteText = quoteText.trim().replace(/"/g, '');
    await saveChampionQuoteToDB(champion.id, quoteText);
  } catch (error) {
    console.error(`Error scraping quote for ${champion.name}`);
  }
};

const saveChampionQuoteToDB = async (championId: number, quote: string) => {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO quotes(champion_id, quote) VALUES($1, $2)',
      [championId, quote],
    );
    console.log(`Quote saved for champion ID ${championId}`);
  } catch (error) {
    console.error(`Error saving quote for champion ID ${championId}:`, error);
  } finally {
    client.release();
  }
};

scrapeChampions();
