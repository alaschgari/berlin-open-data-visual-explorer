
import fs from 'fs';
import path from 'path';

const file = 'data/raw/doppelhaushalt_2022_2023__2_nachtrag__doppelhaushalt_2022_2023__2__nachtrag_.csv';
const content = fs.readFileSync(file, 'latin1');
const lines = content.split('\n');

const colIndex = 25; // 0-indexed column 26
const values = new Set();

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols[colIndex]) {
        values.add(cols[colIndex].trim());
    }
}

console.log('Unique values in BetragTyp column:', Array.from(values));
