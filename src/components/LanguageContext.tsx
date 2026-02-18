'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'de' | 'en';

interface Translations {
    [key: string]: {
        de: string;
        en: string;
    };
}

const translations: Translations = {
    // Header
    'brand_name': { de: 'BERLIN OPEN DATA', en: 'BERLIN OPEN DATA' },
    'brand_sub': { de: 'Public Services Analytics', en: 'Public Services Analytics' },
    'last_sync': { de: 'Stand', en: 'Sync' },
    'locale': { de: 'DE', en: 'EN' },

    // Tabs
    'tab_subsidies': { de: 'Subventionen', en: 'Subsidies' },
    'tab_taxes': { de: 'Steuern', en: 'Taxes' },
    'tab_theft': { de: 'Diebstahl', en: 'Theft' },
    'tab_budget': { de: 'Haushalt', en: 'Budget' },
    'tab_demographics': { de: 'Demografie', en: 'Demographics' },
    'tab_business': { de: 'Gewerbe', en: 'Business' },
    'tab_wastewater': { de: 'Abwasser', en: 'Wastewater' },

    // Selectors
    'all_districts': { de: 'Alle Bezirke', en: 'All Districts' },

    // Budget Specific
    'budget_mode_historic': { de: 'Historische Analyse', en: 'Historical Analysis' },
    'budget_mode_explorer': { de: 'Planung 2026/27 (Neu)', en: 'Budget 2026/27 (New)' },
    'no_data': { de: 'Keine Daten verfügbar', en: 'No data available' },
    'loading': { de: 'Lade Daten...', en: 'Loading data...' },
    'total_volume': { de: 'Gesamtvolumen', en: 'Total Volume' },
    'count_subsidies': { de: 'Anzahl Zuwendungen', en: 'Number of Subsidies' },
    'largest_areas': { de: 'Größte Einzelbereiche', en: 'Largest Main Areas' },

    // Subsidies specific
    'top_recipients': { de: 'Top 100 Empfänger', en: 'Top 100 Recipients' },
    'subsidies_title': { de: 'Subventionen', en: 'Subsidies' },
    'list_view': { de: 'Liste', en: 'List' },
    'map_view': { de: 'Karte', en: 'Map' },
    'placeholder_search': { de: 'Name oder Zweck...', en: 'Name or purpose...' },
    'search_button': { de: 'Suchen', en: 'Search' },
    'export_button': { de: 'CSV Export', en: 'CSV Export' },
    'no_results': { de: 'Keine Treffer gefunden.', en: 'No results found.' },
    'details_for': { de: 'Bescheide für', en: 'Resolutions for' },
    'sort_by_amount': { de: 'Nach Betrag sortieren', en: 'Sort by amount' },
    'by_year': { de: 'Nach Jahr', en: 'By Year' },
    'by_area': { de: 'Nach Bereich', en: 'By Area' },
    'by_provider': { de: 'Nach Geber', en: 'By Provider' },
    'year_area': { de: 'Jahr + Bereich', en: 'Year + Area' },
    'year_label': { de: 'Jahr', en: 'Year' },
    'area_label': { de: 'Bereich', en: 'Area' },
    'purpose_label': { de: 'Zweck', en: 'Purpose' },
    'provider_label': { de: 'Geber', en: 'Provider' },
    'amount_label': { de: 'Betrag', en: 'Amount' },
    'total_label': { de: 'Gesamt', en: 'Total' },
    'resolutions': { de: 'Bescheide', en: 'Resolutions' },
    'volume': { de: 'Volumen', en: 'Volume' },
    'na': { de: 'N/A', en: 'N/A' },
    'mio_euro': { de: 'Mio. €', en: 'M €' },
    'mrd_euro': { de: 'Mrd. €', en: 'Bn €' },
    'euro': { de: '€', en: '€' },

    // Budget UI
    'budget_plan': { de: 'Haushaltsplan', en: 'Budget Plan' },
    'budget_hierarchy': { de: 'Budget-Hierarchie', en: 'Budget Hierarchy' },
    'budget_subtitle': { de: 'Interaktive Struktur der Berliner Haushaltsplanung', en: 'Interactive structure of Berlin\'s budget planning' },
    'click_to_expand': { de: 'Click zum Ausklappen', en: 'Click to expand' },
    'yoy_comparison': { de: 'YoY Vergleich', en: 'YoY Comparison' },
    'vs_prev_year': { de: 'Gegenüber Vorjahr', en: 'Vs Previous Year' },
    'increase': { de: 'Steigerung', en: 'Increase' },
    'saving': { de: 'Einsparung', en: 'Saving' },
    'unchanged': { de: 'Unverändert', en: 'Unchanged' },
    'select_element_comparison': { de: 'Wähle ein Element für den YoY-Vergleich', en: 'Select an element for YoY comparison' },
    'smart_explanation': { de: 'KI-Erläuterung', en: 'AI Explanation' },
    'smart_explanation_sub': { de: 'Kontext & Details zum gewählten Budgetposten', en: 'Context & details for the selected budget item' },
    'disclaimer_ai': { de: 'Kann Fehler enthalten', en: 'May contain errors' },
    'deep_research': { de: 'Tiefenrecherche', en: 'Deep Research' },
    'on_google': { de: 'auf Google', en: 'on Google' },
    'no_explanation': { de: 'Wähle einen Posten für eine Erläuterung', en: 'Select an item for an explanation' },

    // Common UI
    'search': { de: 'Suchen', en: 'Search' },
    'filter': { de: 'Filtern', en: 'Filter' },
    'export': { de: 'Exportieren', en: 'Export' },
    'details': { de: 'Details', en: 'Details' },
    'close': { de: 'Schließen', en: 'Close' },
    'back': { de: 'Zurück', en: 'Back' },
    'stand': { de: 'Stand', en: 'As of' },
    'source': { de: 'Quelle', en: 'Source' },
    'mio': { de: 'Mio.', en: 'M' },
    'bn': { de: 'Mrd.', en: 'Bn' },
    'loading_map': { de: 'Lade Kartendaten...', en: 'Loading map data...' },
    'error_map': { de: 'Fehler beim Laden der Karte', en: 'Error loading map' },

    // Population / Demographics
    'pop_title': { de: 'Demografische Analyse', en: 'Demographic Analysis' },
    'pop_subtitle': { de: 'Visualisierung der Berliner Planungsräume (LOR)', en: 'Visualization of Berlin Planning Areas (LOR)' },
    'pop_total': { de: 'Einwohner', en: 'Inhabitants' },
    'pop_density': { de: 'Dichte (Pers./km²)', en: 'Density (Pers./km²)' },
    'pop_age_groups': { de: 'Altersstruktur', en: 'Age Structure' },
    'pop_gender': { de: 'Geschlechterverteilung', en: 'Gender Distribution' },
    'pop_top_10': { de: 'Top 10 Planungsräume', en: 'Top 10 Planning Areas' },
    'pop_select_district': { de: 'Wähle einen Bezirk', en: 'Select a District' },
    'pop_click_info': { de: 'Klicke auf die Karte für Details', en: 'Click on map for details' },

    // Business
    'biz_title': { de: 'Unternehmens-Landschaft', en: 'Business Landscape' },
    'biz_subtitle': { de: 'Analyse der Gewerbestandorte nach LOR-Ebene', en: 'Analysis of business locations by LOR' },
    'biz_explorer': { de: 'Business Explorer', en: 'Business Explorer' },
    'biz_stats': { de: 'Strukturdaten und Trends', en: 'Structural Data & Trends' },
    'biz_search_placeholder': { de: 'Nach Branchen oder Firmen suchen...', en: 'Search for branches or companies...' },
    'biz_density': { de: 'Wirtschaftsdichte', en: 'Business Density' },
    'biz_growth': { de: 'Wachstum', en: 'Growth' },
    'biz_companies': { de: 'Unternehmen', en: 'Companies' },
    'biz_employees': { de: 'Beschäftigte', en: 'Employees' },
    'biz_top_locs': { de: 'Top Standorte (LOR)', en: 'Top Locations (LOR)' },

    // Taxes
    'tax_title': { de: 'Steuereinnahmen', en: 'Tax Revenue' },
    'tax_subtitle': { de: 'Analyse der Berliner Einnahmequellen', en: 'Analysis of Berlin\'s income sources' },
    'tax_total_revenue': { de: 'Gesamteinnahmen', en: 'Total Revenue' },
    'tax_distribution': { de: 'Verteilung der Steuerarten', en: 'Distribution of Tax Types' },
    'tax_top_sources': { de: 'Top 10 Einnahmequellen', en: 'Top 10 Revenue Sources' },
    'tax_main_source': { de: 'Hauptquelle', en: 'Main Source' },

    // Theft
    'theft_title': { de: 'Kriminalitäts-Atlas', en: 'Crime Atlas' },
    'theft_subtitle': { de: 'Bicycle & Car Theft Statistics', en: 'Bicycle & Car Theft Statistics' },
    'theft_risk_level': { de: 'Risikostufe', en: 'Risk Level' },
    'theft_incidents': { de: 'Vorfälle', en: 'Incidents' },
    'theft_damage': { de: 'Schadenssumme', en: 'Total Damage' },
    'theft_heatmap': { de: 'Heatmap anzeigen', en: 'Show Heatmap' },
    'theft_latest': { de: 'Aktuelle Vorfälle', en: 'Latest Incidents' }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('de');

    const t = (key: string) => {
        if (!translations[key]) return key;
        return translations[key][language];
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
