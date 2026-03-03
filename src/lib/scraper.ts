
import fs from 'fs';
import path from 'path';

const CKAN_API_URL = 'https://datenregister.berlin.de/api/3/action/package_search';
const DATA_DIR = path.join(process.cwd(), 'data/raw');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PROCESSED_DIR)) {
  fs.mkdirSync(PROCESSED_DIR, { recursive: true });
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface CkanResource {
  id: string;
  name: string;
  format: string;
  url: string;
  last_modified: string;
}

interface CkanPackage {
  id: string;
  title: string;
  resources: CkanResource[];
}

interface CkanResponse {
  success: boolean;
  result: {
    count: number;
    results: CkanPackage[];
  };
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

async function downloadResource(resource: CkanResource, datasetTitle: string, maxRetries: number = 3) {
  if (!resource.url || !resource.name || !resource.format) {
    console.warn(`Skipping resource with missing data: ${datasetTitle}`);
    return;
  }

  const safeTitle = (datasetTitle || 'dataset').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeResourceName = (resource.name || 'resource').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${safeTitle}_${safeResourceName}.${(resource.format || 'bin').toLowerCase()}`;
  const filePath = path.join(DATA_DIR, filename);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`Retrying resource: ${resource.name} (${resource.format}) [Attempt ${attempt}/${maxRetries}]`);
      } else {
        console.log(`Downloading resource: ${resource.name} (${resource.format})`);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(resource.url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404 || response.status === 410) {
          console.error(`Status ${response.status} for ${resource.url} - Skipping.`);
          return;
        }
        if (response.status === 429) {
          const waitTime = 5000 * attempt;
          console.warn(`Rate limited (429) on ${resource.name}. Waiting ${waitTime}ms...`);
          await sleep(waitTime);
          continue;
        }
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      fs.writeFileSync(filePath, buffer);
      console.log(`Saved to ${filePath}`);
      // Small pause after successful download
      await sleep(100);
      return; // Success
    } catch (error: any) {
      const waitTimeMs = 2000 * Math.pow(2, attempt - 1);
      console.warn(`Error on attempt ${attempt} for ${resource.name}: ${error.message}. Retrying in ${waitTimeMs}ms...`);
      if (attempt === maxRetries) {
        console.error(`Failed to download ${resource.name} after ${maxRetries} attempts.`);
        return;
      }
      await sleep(waitTimeMs);
    }
  }
}

export async function fetchSubsidies() {
  const SUBSIDIES_URL = 'https://www.berlin.de/sen/finanzen/service/zuwendungsdatenbank/index.php/index/all.csv?q=';
  const TARGET_PATH = path.join(DATA_DIR, 'subsidies.csv');

  console.log('Fetching Zuwendungsdatenbank (Subsidies)...');
  try {
    const response = await fetch(SUBSIDIES_URL);
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
  const THEFT_URL = 'https://www.polizei-berlin.eu/Fahrraddiebstahl/Fahrraddiebstahl.csv';
  const TARGET_PATH = path.join(DATA_DIR, 'Fahrraddiebstahl.csv');

  console.log('Fetching Latest Bicycle Theft Data...');
  try {
    const response = await fetch(THEFT_URL);
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
  const THEFT_URL = 'https://www.polizei-berlin.eu/Kfzdiebstahl/Kfzdiebstahl.csv';
  const TARGET_PATH = path.join(DATA_DIR, 'Kfzdiebstahl.csv');

  console.log('Fetching Latest Car Theft Data...');
  try {
    const response = await fetch(THEFT_URL);
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
  const MARKETS_URL = 'https://www.berlin.de/sen/web/service/maerkte-feste/wochen-troedelmaerkte/index.php/index/all.geojson?q=';
  const TARGET_PATH = path.join(PROCESSED_DIR, 'markets.geojson');

  console.log('Fetching Wochen- & Trödelmärkte (Markets)...');
  try {
    const response = await fetch(MARKETS_URL);
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
