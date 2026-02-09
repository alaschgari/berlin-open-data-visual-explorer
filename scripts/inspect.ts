
import * as XLSX from 'xlsx';
import path from 'path';

const file = path.join(process.cwd(), 'data/raw', 'kamerale_monatsdaten_bezirk_lichtenberg_2022_kamerale_monatsdaten_dezember_2022_xlsx.xlsx');

try {
    const workbook = XLSX.readFile(file);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

    console.log('Sheet Name:', sheetName);
    console.log('First 5 rows:');
    console.log(JSON.stringify(data.slice(0, 10), null, 2));
} catch (error) {
    console.error('Error reading file:', error);
}
