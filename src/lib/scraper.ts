
import fs from 'fs';
import path from 'path';

const CKAN_API_URL = 'https://datenregister.berlin.de/api/3/action/package_search';
const DATA_DIR = path.join(process.cwd(), 'data/raw');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

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
  console.log('Fetching data from Berlin Open Data...');

  // Full list of Berlin districts for targeted search
  const districts = [
    'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
    'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln',
    'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
  ];

  // Search queries
  const queries = ['Doppelhaushalt Berlin'];
  // Add targeted queries for each district
  districts.forEach(d => {
    // Note: General "Doppelhaushalt" files are sufficient as they contain all districts.
  });

  try {
    let totalDownloadCount = 0;

    const allResources: { resource: CkanResource, datasetTitle: string }[] = [];
    for (const query of queries) {
      console.log(`Searching for: ${query}`);
      const url = `${CKAN_API_URL}?q=${encodeURIComponent(query)}&rows=1000`;
      await sleep(500);
      const response = await fetch(url);
      if (!response.ok) continue;
      const data: CkanResponse = await response.json();
      if (!data.success) continue;

      for (const dataset of data.result.results) {
        for (const resource of dataset.resources) {
          const fmt = resource.format ? resource.format.toUpperCase() : '';
          if (['CSV', 'JSON', 'XLS', 'XLSX'].includes(fmt)) {
            allResources.push({ resource, datasetTitle: dataset.title });
          }
        }
      }
    }

    // Filter resources: If multiple resources for the same biennium exist, pick the latest Nachtrag
    const filteredResources = allResources.filter((r, index, self) => {
      const name = r.resource.name.toLowerCase();
      const title = r.datasetTitle.toLowerCase();

      // Years pattern e.g. 2024/2025 or 2024_2025
      const yearsMatch = (title + name).match(/20\d{2}[_\/]?20\d{2}/);
      if (!yearsMatch) return true;
      const years = yearsMatch[0].replace(/[\/]/g, '_');

      // Check if there is a "better" one for these years
      const isBase = !name.includes('nachtrag') && !title.includes('nachtrag');
      const getNachtragNum = (s: string) => {
        const m = s.match(/(\d+)\.?\s*nachtrag/);
        return m ? parseInt(m[1]) : (s.includes('nachtrag') ? 1 : 0);
      };

      const currentNachtrag = getNachtragNum(title + " " + name);

      const competitors = self.filter(other => {
        const otherFull = (other.datasetTitle + " " + other.resource.name).toLowerCase();
        return otherFull.includes(years) && other.resource.format === r.resource.format;
      });

      const maxNachtrag = Math.max(...competitors.map(c => getNachtragNum((c.datasetTitle + " " + c.resource.name).toLowerCase())));

      return currentNachtrag === maxNachtrag;
    });

    for (const { resource, datasetTitle } of filteredResources) {
      await downloadResource(resource, datasetTitle);
      totalDownloadCount++;
    }

    // Also fetch the subsidies database
    await fetchSubsidies();

    // Fetch latest vehicle theft data
    await fetchBicycleTheftData();
    await fetchCarTheftData();

    // Fetch weekly & flea markets
    await fetchMarketsData();

    return { success: true, count: totalDownloadCount };

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

  const safeTitle = datasetTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeResourceName = resource.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${safeTitle}_${safeResourceName}.${resource.format.toLowerCase()}`;
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
