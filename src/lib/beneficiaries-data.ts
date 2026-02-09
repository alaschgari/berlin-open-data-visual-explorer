
export interface Beneficiary {
    id: string;
    name: string;
    purpose: string;
    amount: number;
    year: number;
    district: string;
}

export const MOCK_BENEFICIARIES: Beneficiary[] = [
    { id: "1", name: "Sportverein Berlin-Mitte e.V.", purpose: "Förderung des Jugendsports", amount: 45000, year: 2023, district: "Mitte" },
    { id: "2", name: "Kulturzentrum Kreuzberg", purpose: "Kulturelle Projekte und Integration", amount: 120000, year: 2023, district: "Friedrichshain-Kreuzberg" },
    { id: "3", name: "Nachbarschaftsheim Neukölln", purpose: "Soziale Betreuung und Nachbarschaftshilfe", amount: 85000, year: 2023, district: "Neukölln" },
    { id: "4", name: "Kindergarten Spatzennest", purpose: "Kindertagesbetreuung Zuschuss", amount: 250000, year: 2023, district: "Pankow" },
    { id: "5", name: "Theater am Park", purpose: "Spielbetrieb und Instandhaltung", amount: 320000, year: 2023, district: "Marzahn-Hellersdorf" },
    { id: "6", name: "Jugendhilfe gGmbH", purpose: "Betreuung unbegleiteter Minderjähriger", amount: 560000, year: 2023, district: "Berlin" },
    { id: "7", name: "Grünflächenpflege Schmidt", purpose: "Parkpflegeauftrag", amount: 15000, year: 2023, district: "Lichtenberg" },
    { id: "8", name: "Musikschule Charlottenburg", purpose: "Instrumentenbeschaffung", amount: 22000, year: 2023, district: "Charlottenburg-Wilmersdorf" },
    { id: "9", name: "Seniorentreff Steglitz", purpose: "Veranstaltungsreihe", amount: 5000, year: 2023, district: "Steglitz-Zehlendorf" },
    { id: "10", name: "Fahrrad-Initiative e.V.", purpose: "Verkehrssicherheitsprojekte", amount: 12500, year: 2023, district: "Tempelhof-Schöneberg" },
    { id: "11", name: "TSV Spandau 1860", purpose: "Sanierung Sporthalle", amount: 210000, year: 2023, district: "Spandau" },
    { id: "12", name: "Bürgerstiftung Treptow", purpose: "Gemeinnützige Projekte", amount: 35000, year: 2023, district: "Treptow-Köpenick" },
    { id: "13", name: "Wohnungsbaugesellschaft Mitte", purpose: "Fassadensanierung", amount: 450000, year: 2023, district: "Mitte" },
    { id: "14", name: "TechHub Incubator", purpose: "Start-up Förderung", amount: 100000, year: 2023, district: "Berlin" },
    { id: "15", name: "Berliner Tafel e.V.", purpose: "Logistikunterstützung", amount: 75000, year: 2023, district: "Berlin" },
];
