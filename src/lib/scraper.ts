
import fs from 'fs';
import path from 'path';

const CKAN_API_URL = 'https://datenregister.berlin.de/api/3/action/package_search';
const DATA_DIR = path.join(process.cwd(), 'data/raw');
const PROCESSED_DIR = path.join(process.cwd(), 'data/processed');

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
  const queries = ['Doppelhaushalt Berlin', 'Monatsschreibung'];
  // Add targeted queries for each district
  districts.forEach(d => {
    queries.push(`Kamerale Monatsdaten ${d}`);
    queries.push(`Haushaltsplan ${d}`);
    queries.push(`aktuelle kamerale Monatsschreibung ${d}`);
  });

  try {
    let totalDownloadCount = 0;

    for (const query of queries) {
      console.log(`Searching for: ${query}`);
      const url = `${CKAN_API_URL}?q=${encodeURIComponent(query)}&rows=1000`;
      const response = await fetch(url);
      if (!response.ok) continue;

      const data: CkanResponse = await response.json();
      if (!data.success) continue;

      console.log(`Query "${query}" found ${data.result.results.length} datasets.`);

      // Ensure raw data directory exists
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      for (const dataset of data.result.results) {
        console.log(`Processing dataset: ${dataset.title}`);

        for (const resource of dataset.resources) {
          const fmt = resource.format ? resource.format.toUpperCase() : '';
          console.log(`Checking resource: ${resource.name}, format: ${fmt}`);
          if (['CSV', 'JSON', 'XLS', 'XLSX'].includes(fmt)) {
            await downloadResource(resource, dataset.title);
            totalDownloadCount++;
          }
        }
      }
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

async function downloadResource(resource: CkanResource, datasetTitle: string) {
  try {
    if (!resource.url || !resource.name || !resource.format) {
      console.warn(`Skipping resource with missing data: ${datasetTitle}`);
      return;
    }
    console.log(`Downloading resource: ${resource.name} (${resource.format})`);

    const response = await fetch(resource.url);
    if (!response.ok) {
      console.error(`Failed to download ${resource.url}: ${response.statusText}`);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize filenames
    const safeTitle = datasetTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const safeResourceName = resource.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}_${safeResourceName}.${resource.format.toLowerCase()}`;
    const filePath = path.join(DATA_DIR, filename);

    fs.writeFileSync(filePath, buffer);
    console.log(`Saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving resource ${resource.name}:`, error);
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
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(TARGET_PATH, Buffer.from(buffer));
    console.log(`Saved markets data to ${TARGET_PATH}`);
    return true;
  } catch (error) {
    console.error('Error fetching markets data:', error);
    return false;
  }
}
