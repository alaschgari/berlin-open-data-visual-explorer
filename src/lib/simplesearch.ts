
/**
 * Generic Client for Berlin SimpleSearch API
 * Based on documentation: https://www.berlin.de/lageso/gesundheit/gesundheitsschutz/badegewaesser/liste-der-badestellen/index.php/api
 */

export interface SearchOptions {
    q?: string;
    page?: number;
    order?: string;
    q_geo?: string;
    q_radius?: number;
    [key: string]: any; // Allows for additional column-based filters
}

export interface SimpleSearchResponse<T> {
    messages: {
        messages: string[];
        success: boolean | null;
    };
    results: {
        count: number;
        items_per_page: number;
    };
    index: T[];
    item: T | null;
}

export class SimpleSearchClient {
    private apiEndpoint: string;

    constructor(baseUrl: string) {
        // Normalize base URL and append index.php if not present
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
        this.apiEndpoint = `${normalizedBase}index.php`;
    }

    /**
     * Fetch search results (index method)
     * @param mode 'index' for paginated, 'all' for complete data
     * @param format Output format (json, geojson, xml, csv, etc.)
     * @param options Query parameters
     */
    async fetchIndex<T>(
        mode: 'index' | 'all' = 'index',
        format: string = 'json',
        options: SearchOptions = {}
    ): Promise<SimpleSearchResponse<T> | any> {
        const url = new URL(`${this.apiEndpoint}/index/${mode}.${format}`);

        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.append(key, value.toString());
            }
        });

        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`SimpleSearch API error: ${response.statusText}`);
        }

        if (format === 'json' || format === 'geojson' || format === 'jrss') {
            return await response.json();
        }

        return await response.text();
    }

    /**
     * Fetch a single entry (detail method)
     * @param id The item ID
     * @param format Output format (json, xml)
     */
    async fetchDetail<T>(id: string | number, format: string = 'json'): Promise<SimpleSearchResponse<T>> {
        const url = `${this.apiEndpoint}/detail/${id}.${format}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`SimpleSearch API error: ${response.statusText}`);
        }
        return await response.json();
    }
}
