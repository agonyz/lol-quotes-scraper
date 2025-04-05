import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from './utils/db.util';
import {
  scrapeBanQuote,
  scrapeJokeQuotes,
  scrapePickQuote,
  scrapeTauntQuotes,
} from './utils/quoteScraper.util';

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
      championAudioUrl = `https://leagueoflegends.fandom.com/wiki/nunu/LoL/Audio#Classic`;
    }
    const { data } = await axios.get(championAudioUrl);
    const $ = cheerio.load(data as string);

    const results: {
      pick?: string;
      ban?: string;
      joke?: string[];
      taunt?: string[];
    } = {};

    // scrape the pick and ban quotes
    $('dl').each((i, dl) => {
      const pickQuote = scrapePickQuote($, dl);
      if (pickQuote) results.pick = pickQuote;

      const banQuote = scrapeBanQuote($, dl);
      if (banQuote) results.ban = banQuote;
    });

    // scrape taunt and joke quotes
    const tauntQuotes = scrapeTauntQuotes($);
    if (tauntQuotes) results.taunt = tauntQuotes;

    const jokeQuotes = scrapeJokeQuotes($);
    if (jokeQuotes) results.joke = jokeQuotes;

    // save quotes to the DB
    for (const [type, quotes] of Object.entries(results)) {
      if (quotes) {
        if (Array.isArray(quotes)) {
          // multiple quotes (joke, taunt)
          for (const quote of quotes) {
            await saveChampionQuoteToDB(champion.id, quote, type);
          }
        } else {
          // single quote (pick, ban)
          await saveChampionQuoteToDB(champion.id, quotes, type);
        }
      }
    }
  } catch (error) {
    console.error(`Error scraping quote for ${champion.name}`);
  }
};

const saveChampionQuoteToDB = async (
  championId: number,
  quote: string,
  quoteType: string,
) => {
  const client = await pool.connect();
  try {
    // get the quote_type_id for the quoteType
    const result = await client.query(
      'SELECT id FROM quote_types WHERE type_name = $1 LIMIT 1',
      [quoteType],
    );
    const quoteTypeId = result.rows[0]?.id;

    if (!quoteTypeId) {
      console.error(`Invalid quote type: ${quoteType}`);
      return;
    }

    await client.query(
      //'INSERT INTO quotes(champion_id, quote, quote_type_id) VALUES($1, $2, $3) ON CONFLICT (quote)', this will fail due to some quotes being doubled -> need to find a solution
      'INSERT INTO quotes(champion_id, quote, quote_type_id) VALUES($1, $2, $3) ON CONFLICT (quote) DO NOTHING',
      [championId, quote, quoteTypeId],
    );
    console.log(
      `Quote saved for champion ID ${championId} with type ${quoteType}`,
    );
  } catch (error) {
    console.error(`Error saving quote for champion ID ${championId}:`, error);
  } finally {
    client.release();
  }
};

scrapeChampions();
