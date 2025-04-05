import cheerio from 'cheerio';

export const scrapePickQuote = ($: cheerio.Root, dl: cheerio.Element) => {
  const title = $(dl).find('dt').first().text().trim();
  if (title === 'Pick') {
    const ul = $(dl).nextAll('ul').first();
    const quoteElement = ul.find('li i').eq(1).parent();

    let quoteText = '';
    quoteElement.children().each((i, e) => {
      const tagName = $(e).get(0).tagName.toLowerCase();
      if (tagName === 'sup') return;

      if (i > 0) {
        let text = $(e).text().trim();
        quoteText += text + ' ';
      }
    });

    return quoteText.trim().replace(/"/g, '');
  }
  return null;
};

export const scrapeBanQuote = ($: cheerio.Root, dl: cheerio.Element) => {
  const title = $(dl).find('dt').first().text().trim();
  if (title === 'Ban') {
    const ul = $(dl).nextAll('ul').first();
    return ul.find('li i').first().text().trim().replace(/"/g, '');
  }
  return null;
};

export const scrapeTauntQuotes = ($: cheerio.Root) => {
  const tauntSection = $('h2 span#Taunt').closest('h2').first();
  const tauntQuotes: string[] = [];
  if (tauntSection.length > 0) {
    tauntSection
      .nextUntil('dl, h2')
      .find('ul li i')
      .each((i, el) => {
        let quoteText = $(el).text().trim();
        // limit to 3 quotes for now
        if (quoteText && tauntQuotes.length < 3) {
          tauntQuotes.push(quoteText);
        }
      });
  }
  return tauntQuotes.length > 0
    ? [...new Set(tauntQuotes)].map((quote) => quote.replace(/"/g, ''))
    : null;
};

export const scrapeJokeQuotes = ($: cheerio.Root) => {
  const jokeSection = $('h2 span#Joke').closest('h2').first();
  const jokeQuotes: string[] = [];
  if (jokeSection.length > 0) {
    jokeSection
      .nextUntil('dl, h2') // stop at the first dl or h2
      .find('ul li i')
      .each((i, el) => {
        let quoteText = $(el).text().trim();
        // limit to 3 quotes for now
        if (quoteText && jokeQuotes.length < 3) {
          jokeQuotes.push(quoteText);
        }
      });
  }
  return jokeQuotes.length > 0
    ? [...new Set(jokeQuotes)].map((quote) => quote.replace(/"/g, ''))
    : null;
};
