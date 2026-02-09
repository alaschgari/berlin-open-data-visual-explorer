
import { processFiles } from '../src/lib/parser';

async function main() {
    console.log("Starting cleaned reprocessing...");
    await processFiles();
    console.log("Done.");
}

main().catch(console.error);
