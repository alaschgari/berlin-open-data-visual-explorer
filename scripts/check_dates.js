const fs = require('fs');
const Papa = require('papaparse');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'raw', 'Fahrraddiebstahl.csv');
console.log('Reading:', filePath);

const fileContent = fs.readFileSync(filePath, 'latin1');

let minDate = null;
let maxDate = null;
let count = 0;

Papa.parse(fileContent, {
    header: true,
    step: function (results) {
        if (results.data.TATZEIT_ANFANG_DATUM) {
            const parts = results.data.TATZEIT_ANFANG_DATUM.split('.');
            if (parts.length === 3) {
                const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (!isNaN(date.getTime())) {
                    if (!minDate || date < minDate) minDate = date;
                    if (!maxDate || date > maxDate) maxDate = date;
                }
            }
        }
        count++;
    },
    complete: function () {
        console.log('Total records checked:', count);
        console.log('Min Date:', minDate ? minDate.toISOString().split('T')[0] : 'None');
        console.log('Max Date:', maxDate ? maxDate.toISOString().split('T')[0] : 'None');
    }
});
