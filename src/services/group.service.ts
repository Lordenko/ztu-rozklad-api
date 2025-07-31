import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchTitle(url: string): Promise<string> {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  return $('title').text();
}
