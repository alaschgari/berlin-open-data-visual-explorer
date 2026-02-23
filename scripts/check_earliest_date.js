const BIKE_THEFT_URL = 'https://www.polizei-berlin.eu/Fahrraddiebstahl/Fahrraddiebstahl.csv';
const CAR_THEFT_URL = 'https://www.polizei-berlin.eu/Kfzdiebstahl/Kfzdiebstahl.csv';

async function findEarliestDate(url, delimiter) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const decoder = new TextDecoder('windows-1252');
        const csvText = decoder.decode(arrayBuffer);
        const lines = csvText.split('\n');
        const header = lines[0].split(delimiter);
        const dateIndex = header.indexOf('TATZEIT_ANFANG_DATUM');

        if (dateIndex === -1) {
            console.log(`Date column not found in ${url}`);
            return null;
        }

        let minDate = null;
        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(delimiter);
            const dateStr = cols[dateIndex];
            if (!dateStr) continue;
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                if (!isNaN(date.getTime())) {
                    if (!minDate || date < minDate) {
                        minDate = date;
                    }
                }
            }
        }
        return minDate;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function main() {
    const earliestBike = await findEarliestDate(BIKE_THEFT_URL, ',');
    const earliestCar = await findEarliestDate(CAR_THEFT_URL, '|');

    console.log('Earliest Bicycle Theft:', earliestBike?.toLocaleDateString('de-DE'));
    console.log('Earliest Car Theft:', earliestCar?.toLocaleDateString('de-DE'));
}

main();
