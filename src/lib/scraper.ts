import fs from 'fs';
import path from 'path';
import { getLatestResourceUrl } from './ckan';
import { CKAN_PACKAGES } from './constants';

const DATA_DIR = path.join(process.cwd(), 'data/raw');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

const ALLOWED_HOSTS = new Set(['www.berlin.de', 'berlin.de', 'www.polizei-berlin.eu', 'polizei-berlin.eu']);

// Only follow CKAN-provided resource URLs that point at an official Berlin.de host,
// to avoid a compromised/spoofed CKAN registry response causing a server-side fetch
// of an attacker-controlled URL.
function resolveResourceUrl(candidate: string | null, fallback: string): string {
  if (!candidate) return fallback;
  try {
    const host = new URL(candidate).hostname;
    return ALLOWED_HOSTS.has(host) ? candidate : fallback;
  } catch {
    return fallback;
  }
}

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}



export async function fetchBerlinData() {
  console.log('Fetching daily data from Berlin Open Data...');

  try {
    // Fetch latest vehicle theft data
    await fetchBicycleTheftData();
    await fetchCarTheftData();

    console.log('Daily sync summary: Theft data updated successfully.');

    return { success: true, count: 2 };

  } catch (error) {
    console.error('Error fetching data:', error);
    return { success: false, error };
  }
}

export async function fetchSubsidies() {
  const DEFAULT_URL = 'https://www.berlin.de/sen/finanzen/service/zuwendungsdatenbank/index.php/index/all.csv?q=';
  const TARGET_PATH = path.join(DATA_DIR, 'subsidies.csv');

  console.log('Fetching Zuwendungsdatenbank (Subsidies)...');
  try {
    const url = resolveResourceUrl(await getLatestResourceUrl(CKAN_PACKAGES.SUBSIDIES, 'CSV'), DEFAULT_URL);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(TARGET_PATH, Buffer.from(buffer));
    console.log(`Saved subsidies to ${TARGET_PATH}`);
    return true;
  } catch (error) {
    console.error('Error fetching subsidies:', error);
    return false;
  }
}

export async function fetchBicycleTheftData() {
  const DEFAULT_URL = 'https://www.polizei-berlin.eu/Fahrraddiebstahl/Fahrraddiebstahl.csv';
  const TARGET_PATH = path.join(DATA_DIR, 'Fahrraddiebstahl.csv');

  console.log('Fetching Latest Bicycle Theft Data...');
  try {
    const url = resolveResourceUrl(await getLatestResourceUrl(CKAN_PACKAGES.BICYCLE_THEFT, 'CSV'), DEFAULT_URL);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(TARGET_PATH, Buffer.from(buffer));
    console.log(`Saved latest bicycle theft data to ${TARGET_PATH}`);
    return true;
  } catch (error) {
    console.error('Error fetching bicycle theft data:', error);
    return false;
  }
}

export async function fetchCarTheftData() {
  const DEFAULT_URL = 'https://www.polizei-berlin.eu/Kfzdiebstahl/Kfzdiebstahl.csv';
  const TARGET_PATH = path.join(DATA_DIR, 'Kfzdiebstahl.csv');

  console.log('Fetching Latest Car Theft Data...');
  try {
    const url = resolveResourceUrl(await getLatestResourceUrl(CKAN_PACKAGES.CAR_THEFT, 'CSV'), DEFAULT_URL);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(TARGET_PATH, Buffer.from(buffer));
    console.log(`Saved latest car theft data to ${TARGET_PATH}`);
    return true;
  } catch (error) {
    console.error('Error fetching car theft data:', error);
    return false;
  }
}

export async function fetchMarketsData() {
  const DEFAULT_URL = 'https://www.berlin.de/sen/web/service/maerkte-feste/wochen-troedelmaerkte/index.php/index/all.geojson?q=';
  const TARGET_PATH = path.join(PROCESSED_DIR, 'markets.geojson');

  console.log('Fetching Wochen- & Trödelmärkte (Markets)...');
  try {
    const url = resolveResourceUrl(await getLatestResourceUrl(CKAN_PACKAGES.MARKETS, 'GeoJSON'), DEFAULT_URL);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching markets data: HTTP ${response.status}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(TARGET_PATH, Buffer.from(buffer));
    console.log(`Saved markets data to ${TARGET_PATH}`);
    return true;
  } catch (error) {
    console.error('Error fetching markets data:', error);
    return false;
  }
}
