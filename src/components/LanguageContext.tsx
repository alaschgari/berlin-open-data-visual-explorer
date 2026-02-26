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
    'built_by': { de: 'Entwickelt von', en: 'Developed by' },
    'nav_more': { de: 'Mehr', en: 'More' },
    'cat_finance': { de: 'Finanzen', en: 'Finance' },
    'cat_infrastructure': { de: 'Infrastruktur', en: 'Infrastructure' },
    'cat_society': { de: 'Gesellschaft', en: 'Society' },

    // Tabs
    'tab_subsidies': { de: 'Subventionen', en: 'Subsidies' },
    'tab_taxes': { de: 'Steuern', en: 'Taxes' },
    'tab_theft': { de: 'Diebstahl', en: 'Theft' },
    'tab_budget': { de: 'Haushalt', en: 'Budget' },
    'tab_demographics': { de: 'Demografie', en: 'Demographics' },
    'tab_business': { de: 'Gewerbe', en: 'Business' },
    'tab_wastewater': { de: 'Abwasser', en: 'Wastewater' },
    'tab_badestellen': { de: 'Badestellen', en: 'Swimming Spots' },
    'tab_traffic': { de: 'Verkehr', en: 'Traffic' },

    // Hub
    'hub_title': { de: 'Berlin Open Data', en: 'Berlin Open Data' },
    'hub_subtitle': { de: 'Analysieren und verstehen Sie die Daten der Hauptstadt in Echtzeit.', en: 'Analyze and understand the capital\'s data in real-time.' },
    'hub_search_placeholder': { de: 'Nach Modulen oder Themen suchen...', en: 'Search for modules or topics...' },
    'hub_highlight_tag': { de: 'Im Fokus', en: 'In Focus' },
    'back_to_hub': { de: 'Zurück zur Übersicht', en: 'Back to Overview' },

    'desc_subsidies': { de: 'Förderungen und Zuschüsse des Landes.', en: 'Funding and grants from the state.' },
    'desc_taxes': { de: 'Steuereinnahmen und -entwicklung.', en: 'Tax revenue and development.' },
    'desc_budget': { de: 'Verteilung und Planung der Haushaltsgelder.', en: 'Distribution and planning of budget funds.' },
    'desc_theft': { de: 'Hotspots und Statistiken zum Fahrraddiebstahl.', en: 'Hotspots and statistics for bicycle theft.' },
    'desc_demographics': { de: 'Einwohnerdichte, Alter und Struktur.', en: 'Population density, age and structure.' },
    'desc_badestellen': { de: 'Wasserqualität der lokalen Gewässer.', en: 'Water quality of local waters.' },
    'desc_business': { de: 'Lokales Gewerbe und Betriebsstruktur.', en: 'Local business and company structure.' },
    'desc_wastewater': { de: 'Abwasserbelastung und Gesundheitsdaten.', en: 'Wastewater pollution and health data.' },
    'desc_traffic': { de: 'Verkehrsaufkommen und -analysen.', en: 'Traffic volume and analyses.' },
    'desc_markets': { de: 'Standorte der Berliner Wochenmärkte.', en: 'Locations of Berlin\'s weekly markets.' },

    // Selectors
    'all_districts': { de: 'Alle Bezirke', en: 'All Districts' },

    // Budget Specific
    'budget_mode_historic': { de: 'Historische Analyse', en: 'Historical Analysis' },
    'budget_mode_explorer': { de: 'Detail-Explorer (2026/27)', en: 'Detail Explorer (2026/27)' },
    'no_data': { de: 'Keine Daten verfügbar', en: 'No data available' },
    'loading': { de: 'Lade Daten...', en: 'Loading data...' },
    'total_volume': { de: 'Gesamtvolumen', en: 'Total Volume' },
    'count_subsidies': { de: 'Anzahl Zuwendungen', en: 'Number of Subsidies' },
    'count_recipients': { de: 'Anzahl Empfänger', en: 'Number of Recipients' },
    'count_providers': { de: 'Anzahl Geber', en: 'Number of Providers' },
    'time_period': { de: 'Zeitraum', en: 'Time Period' },
    'largest_areas': { de: 'Größte Einzelbereiche', en: 'Largest Main Areas' },

    // Subsidies specific
    'top_recipients': { de: 'Top Empfänger', en: 'Top Recipients' },
    'top_providers': { de: 'Top Geldgeber', en: 'Top Providers' },
    'subsidies_title': { de: 'Subventions-Suche', en: 'Subsidies' },
    'top_areas': { de: 'Top Bereiche', en: 'Top Areas' },
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
    'by_recipient': { de: 'Nach Empfänger', en: 'By Recipient' },
    'by_district': { de: 'Nach Bezirk', en: 'By District' },
    'by_status': { de: 'Nach Status', en: 'By Status' },
    'year_area': { de: 'Jahr + Bereich', en: 'Year + Area' },
    'year_label': { de: 'Jahr', en: 'Year' },
    'recipient_label': { de: 'Empfänger', en: 'Recipient' },
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
    'smart_filters': { de: 'Smart Filter', en: 'Smart Filters' },
    'large_projects': { de: 'Großprojekte (>1 Mio. €)', en: 'Large Projects (>1M €)' },
    'small_funding': { de: 'Kleinförderung (<50k €)', en: 'Small Funding (<50k €)' },
    'active_providers': { de: 'Top Geber', en: 'Top Providers' },
    'random_discover': { de: 'Entdecker-Modus', en: 'Explorer Mode' },
    'recipient_insight': { de: 'Empfänger-Insight', en: 'Recipient Insight' },
    'trend_up': { de: 'Steigend', en: 'Increasing' },
    'trend_down': { de: 'Fallend', en: 'Decreasing' },
    'trend_stable': { de: 'Stabil', en: 'Stable' },
    'insight_summary': { de: 'Zusammenfassung', en: 'Summary' },
    'insight_text': { de: 'Dieser Empfänger wird in {count} Bereichen gefördert, am stärksten in {area}.', en: 'This recipient is funded in {count} areas, most heavily in {area}.' },

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
    'district_label': { de: 'Bezirk', en: 'District' },
    'status_label': { de: 'Status', en: 'Status' },
    'entries_label': { de: 'Einträge', en: 'entries' },
    'yes': { de: 'Ja', en: 'Yes' },
    'no': { de: 'Nein', en: 'No' },
    'unknown': { de: 'Unbekannt', en: 'Unknown' },
    'rank': { de: 'Rang', en: 'Rank' },
    'value': { de: 'Wert', en: 'Value' },
    'visualization': { de: 'Visualisierung', en: 'Visualization' },
    'sorted_by': { de: 'Sortiert nach', en: 'Sorted by' },

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
    'pop_kita': { de: 'Kita-Alter (1-6)', en: 'Preschool (1-6)' },
    'pop_school': { de: 'Schulalter (6-15)', en: 'School (6-15)' },
    'pop_seniors': { de: 'Senioren (65+)', en: 'Seniors (65+)' },
    'pop_women_ratio': { de: 'Frauenanteil', en: 'Women share' },
    'pop_men': { de: 'Männer', en: 'Men' },
    'pop_women': { de: 'Frauen', en: 'Women' },
    'pop_districts_loaded': { de: 'Planungsräume geladen', en: 'districts loaded' },
    'pop_legend_vlow': { de: 'Sehr gering', en: 'Very Low' },
    'pop_legend_low': { de: 'Gering', en: 'Low' },
    'pop_legend_normal': { de: 'Normal', en: 'Moderate' },
    'pop_legend_elevated': { de: 'Erhöht', en: 'Elevated' },
    'pop_legend_high': { de: 'Hoch', en: 'High' },
    'pop_legend_vhigh': { de: 'Sehr hoch', en: 'Very High' },
    'pop_area': { de: 'Planungsraum', en: 'Area / District' },
    'pop_source_note': {
        de: 'Quelle: Einwohnerregister Berlin (EWR) am 31.12.2024. Geodaten: ODIS Berlin 2021.',
        en: 'Source: Residents Register Berlin (EWR) as of 31.12.2024. Geo data: ODIS Berlin 2021.'
    },
    'pop_disclaimer': {
        de: 'Hinweis: Die Daten spiegeln den amtlichen Stand zum Jahresende 2024 wider.',
        en: 'Note: Data reflects official status as of end 2024.'
    },
    'pop_kiez_analysis': { de: 'Kiez-Analyse • Demografie', en: 'Neighborhood Analysis • Demographics' },
    'pop_neighborhood_district': { de: 'Kiez / Planungsraum', en: 'Neighborhood / District' },
    'pop_click_for_analysis': {
        de: 'Klicke auf die Karte, um detaillierte demografische Analysen für einen Kiez zu erhalten.',
        en: 'Click on the map to receive detailed demographic analyses for a neighborhood.'
    },

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
    'biz_industry': { de: 'Gewerbe', en: 'Business' },
    'biz_hits': { de: 'Treffer', en: 'Hits' },
    'biz_top_industry': { de: 'Top Branche', en: 'Top Industry' },
    'biz_no_info': { de: 'Keine Angabe', en: 'No info' },
    'biz_years_old': { de: 'Jahre alt', en: 'years old' },
    'biz_stability_score': { de: 'Stabilitäts-Score', en: 'Stability Score' },
    'biz_stability_high': { de: 'Hoch', en: 'High' },
    'biz_stability_medium': { de: 'Mittel', en: 'Medium' },
    'biz_stability_low': { de: 'Niedrig', en: 'Low' },
    'biz_startup_hub': { de: 'Startup-Hub', en: 'Startup Hub' },
    'biz_operations': { de: 'Betriebe', en: 'Operations' },
    'biz_avg_age': { de: 'Ø Alter', en: 'Average Age' },
    'biz_benchmark_vs': { de: 'Benchmark vs.', en: 'Benchmark vs.' },
    'biz_hit_count': { de: 'Trefferanzahl', en: 'Number of hits' },
    'biz_industry_count': { de: 'Anzahl Gewerbe', en: 'Number of businesses' },
    'biz_postcode': { de: 'PLZ', en: 'Postcode' },
    'biz_branch': { de: 'Branche', en: 'Industry' },
    'biz_type': { de: 'Gewerbeart', en: 'Business Type' },
    'biz_age': { de: 'Alter', en: 'Age' },
    'biz_no_entries': { de: 'Keine passenden Einträge gefunden.', en: 'No matching entries found.' },
    'biz_show_hits_limit': { de: 'Zeige die ersten 10,000 von {count} Treffern • Benutze die Suche zum Eingrenzen', en: 'Showing first 10,000 of {count} hits • Use search to narrow down' },
    'biz_companies_count': { de: 'Unternehmen', en: 'Companies' },
    'biz_retail': { de: 'Handel', en: 'Retail' },
    'biz_all': { de: 'Alle', en: 'All' },
    'biz_compare': { de: 'Vergleich', en: 'Compare' },
    'biz_point_mode': { de: 'POI Modus (Punkte)', en: 'POI Mode (Points)' },
    'biz_kiez_analysis': { de: 'Kiez-Analyse • Gewerbe', en: 'Neighborhood Analysis • Business' },
    'biz_stability_label': { de: 'Stabilitäts-Score', en: 'Stability Score' },
    'biz_startup_label': { de: 'Startup-Hub', en: 'Startup Hub' },
    'biz_benchmark_label': { de: 'Benchmark vs.', en: 'Benchmark vs.' },
    'biz_reset_filter': { de: 'Filter zurücksetzen', en: 'Reset Filter' },
    'biz_maturity': { de: 'Marktreife (Mitarbeiter)', en: 'Market Maturity (Employees)' },
    'biz_top_industries': { de: 'Top Branchen', en: 'Top Industries' },
    'biz_explore_data': { de: 'Gewerbedaten erkunden', en: 'Explore business data' },
    'biz_click_for_analysis': {
        de: 'Klicke auf die Karte, um die wirtschaftliche Struktur eines Kiezes zu analysieren.',
        en: 'Click on the map to analyze the economic structure of a neighborhood.'
    },
    'biz_show_on_map': { de: 'Auf ganzer Karte anzeigen', en: 'Show on map' },
    'biz_source_label': { de: 'Quelle', en: 'Source' },

    // Taxes
    'tax_title': { de: 'Steuereinnahmen', en: 'Tax Revenue' },
    'tax_subtitle': { de: 'Analyse der Berliner Einnahmequellen', en: 'Analysis of Berlin\'s income sources' },
    'tax_total_revenue': { de: 'Gesamteinnahmen', en: 'Total Revenue' },
    'tax_distribution': { de: 'Verteilung der Steuerarten', en: 'Distribution of Tax Types' },
    'tax_top_sources': { de: 'Top 10 Einnahmequellen', en: 'Top 10 Revenue Sources' },
    'tax_main_source': { de: 'Hauptquelle', en: 'Main Source' },
    'tax_planned': { de: 'Planung', en: 'Planned' },

    // Theft
    'theft_title': { de: 'Kriminalitäts-Atlas', en: 'Crime Atlas' },
    'theft_subtitle': { de: 'Bicycle & Car Theft Statistics', en: 'Bicycle & Car Theft Statistics' },
    'theft_risk_level': { de: 'Risikostufe', en: 'Risk Level' },
    'theft_incidents': { de: 'Vorfälle', en: 'Incidents' },
    'theft_damage': { de: 'Schadenssumme', en: 'Total Damage' },
    'theft_heatmap': { de: 'Heatmap anzeigen', en: 'Show Heatmap' },
    'theft_latest': { de: 'Aktuelle Vorfälle', en: 'Latest Incidents' },
    'theft_type_bicycle': { de: 'Fahrraddiebstahl', en: 'Bicycle Theft' },
    'theft_type_car': { de: 'Kfz-Diebstahl', en: 'Car Theft' },
    'theft_time': { de: 'Tatzeit', en: 'Time' },
    'theft_type_label': { de: 'Typ', en: 'Type' },
    'theft_detail_label': { de: 'Detail', en: 'Detail' },

    // Badestellen
    'swim_title': { de: 'Berliner Badegewässer', en: 'Berlin Bathing Waters' },
    'swim_subtitle': { de: 'Live-Qualität und Wassertemperatur der Badestellen', en: 'Live water quality and temperature' },
    'swim_water_temp': { de: 'Wasser-Temp.', en: 'Water Temp' },
    'swim_quality': { de: 'Wasserqualität', en: 'Water Quality' },
    'swim_last_sample': { de: 'Letzte Probe', en: 'Last Sample' },
    'swim_visibility': { de: 'Sichttiefe', en: 'Visibility' },
    'swim_eco': { de: 'E. coli', en: 'E. coli' },
    'swim_ente': { de: 'Enterokokken', en: 'Enterococci' },
    'swim_view_details': { de: 'Profil & Details', en: 'Profile & Details' },
    'swim_table_title': { de: 'Live-Daten Übersicht', en: 'Live Data Overview' },
    'swim_status_green': { de: 'Baden erlaubt', en: 'Swimming allowed' },
    'swim_status_yellow': { de: 'Warnung', en: 'Warning' },
    'swim_status_red': { de: 'Badeverbot', en: 'No swimming' },
    'swim_loading': { de: 'Rufe Live-Daten ab...', en: 'Fetching live data...' },
    'swim_temp_label': { de: 'Temperatur', en: 'Temperature' },
    'swim_status_good': { de: 'Gut (Grün)', en: 'Good (Green)' },
    'swim_status_warning': { de: 'Warnung (Gelb)', en: 'Warning (Yellow)' },
    'swim_status_ban': { de: 'Badeverbot (Rot)', en: 'No swimming (Red)' },

    // Traffic
    'traffic_title': { de: 'Verkehrs-Analyse', en: 'Traffic Analysis' },
    'traffic_subtitle': { de: 'Echtzeit-Verkehrsdaten von Telraam Sensoren (funktionieren nur bei Tageslicht)', en: 'Real-time traffic data from Telraam sensors (daylight only)' },
    'traffic_intensity': { de: 'Verkehrsdichte', en: 'Traffic Intensity' },
    'traffic_vru_safety': { de: 'Fuß/Rad Sicherheit', en: 'VRU Safety Index' },
    'traffic_speed_hotspots': { de: 'Geschwindigkeits-Hotspots', en: 'Speed Hotspots' },
    'traffic_temporal': { de: 'Zeitliches Profil', en: 'Temporal Profile' },
    'traffic_modal_split': { de: 'Verkehrsmittelwahl', en: 'Modal Split' },
    'traffic_v85': { de: 'v85 Geschwindigkeit', en: 'v85 Speed' },
    'traffic_v85_explanation': {
        de: 'Die Geschwindigkeit, die von 85% aller Fahrzeuge nicht überschritten wird. Ein Standardwert für den Verkehrsfluss.',
        en: 'The speed that 85% of all vehicles do not exceed. A standard metric for traffic flow.'
    },
    'traffic_segments': { de: 'Straßenabschnitte', en: 'Road Segments' },
    'traffic_loading': { de: 'Lade Verkehrsdaten...', en: 'Loading traffic data...' },
    'traffic_live_api': { de: 'Live API', en: 'Live API' },
    'traffic_no_data': { de: 'Keine Daten', en: 'No Data' },
    'traffic_time_range': { de: 'Zeitraum', en: 'Time Range' },
    'traffic_source': { de: 'Quelle', en: 'Source' },
    'traffic_history_title': { de: 'Verlauf: Segment #', en: 'History: Segment #' },
    'traffic_history_default': { de: 'Verkehrsverlauf (letzte 7 Tage)', en: 'Traffic History (Last 7 Days)' },
    'traffic_segment_data': { de: 'Segment-Daten', en: 'Segment Data' },
    'traffic_active': { de: 'aktiv', en: 'active' },
    'traffic_search_placeholder': { de: 'Segment ID suchen...', en: 'Search Segment ID...' },
    'traffic_group_speed': { de: 'Nach Geschwindigkeit gruppieren', en: 'Group by Speed' },
    'traffic_group_district': { de: 'Nach Bezirk gruppieren', en: 'Group by District' },
    'traffic_all_segments': { de: 'Alle Segmente', en: 'All Segments' },
    'traffic_district': { de: 'Bezirk', en: 'District' },
    'traffic_cars': { de: 'Autos', en: 'Cars' },
    'traffic_bikes': { de: 'Fahrräder', en: 'Bikes' },
    'traffic_peds': { de: 'Fußgänger', en: 'Pedestrians' },
    'traffic_heavy': { de: 'LKW/Schwerlast', en: 'Heavy/Trucks' },
    'traffic_speed_high': { de: 'Hoch (> 50 km/h)', en: 'High (> 50 km/h)' },
    'traffic_speed_medium': { de: 'Mittel (30-50 km/h)', en: 'Medium (30-50 km/h)' },
    'traffic_speed_low': { de: 'Niedrig (< 30 km/h)', en: 'Low (< 30 km/h)' },
    'traffic_select_row': { de: 'Wähle eine Zeile, um das Segment auf der Karte hervorzuheben.', en: 'Select a row to highlight the segment on the map.' },
    'traffic_unknown': { de: 'Unbekannt', en: 'Unknown' },
    'traffic_select_segment': { de: 'Wähle ein Segment für den Verlauf', en: 'Select a segment to view traffic history' },
    'traffic_night_gap': { de: 'Lücken nachts (kein Tageslicht)', en: 'Night gaps (no daylight)' },
    'traffic_vol': { de: 'Vol', en: 'Vol' },

    // Markets
    'tab_markets': { de: 'Märkte', en: 'Markets' },
    'markets_title': { de: 'Wochen- & Trödelmärkte', en: 'Weekly & Flea Markets' },
    'markets_subtitle': { de: 'Übersicht der Berliner Wochen- und Trödelmärkte', en: 'Overview of Berlin weekly and flea markets' },
    'markets_days': { de: 'Tage', en: 'Days' },
    'markets_times': { de: 'Zeiten', en: 'Hours' },
    'markets_operator': { de: 'Betreiber', en: 'Operator' },
    'markets_accessible': { de: 'Barrierefrei', en: 'Accessible' },
    'markets_period': { de: 'Zeitraum', en: 'Period' },
    'markets_loading': { de: 'Lade Marktdaten...', en: 'Loading market data...' },
    'markets_search': { de: 'Markt suchen...', en: 'Search markets...' },
    'markets_website': { de: 'Website besuchen', en: 'Visit Website' },
    'markets_count': { de: 'Märkte', en: 'Markets' },
    'markets_closed': { de: 'Geschlossen', en: 'Closed' },
    'markets_map_label': { de: 'Märkte-Karte', en: 'Markets map' },
    'traffic_map_label': { de: 'Verkehrssegment-Karte', en: 'Traffic segments map' }
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
