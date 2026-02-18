# Multi-language Support (EN/DE)

Add English support to the Berlin Open Data Analytics dashboard while maintaining the premium look and feel.

## Proposed Changes

### [NEW] [LanguageContext.tsx](file:///Users/alaschgari/berlin-open-data/src/components/LanguageContext.tsx)
- [x] Create a `LanguageProvider` and `useLanguage` hook.
- [x] Define dictionaries for 'de' and 'en'.

### [MODIFY] [layout.tsx](file:///Users/alaschgari/berlin-open-data/src/app/layout.tsx)
- [x] Wrap the application in the `LanguageProvider`.

### [MODIFY] [page.tsx](file:///Users/alaschgari/berlin-open-data/src/app/page.tsx)
- [x] Add a language toggle in the header.
- [x] Use the `useLanguage` hook to translate static text (Tab names, Header, Footer).

### [MODIFY] [DistrictSelector.tsx](file:///Users/alaschgari/berlin-open-data/src/components/DistrictSelector.tsx)
- [x] Translate "All Districts".

### [MODIFY] [SubsidiesView.tsx](file:///Users/alaschgari/berlin-open-data/src/components/SubsidiesView.tsx)
- [x] Translate all UI strings, table headers, and status messages.

### [MODIFY] [BudgetExplorerView.tsx](file:///Users/alaschgari/berlin-open-data/src/components/BudgetExplorerView.tsx)
- [x] Translate analytics labels and explanations UI.

### [MODIFY] [BicycleTheftMapClient.tsx](file:///Users/alaschgari/berlin-open-data/src/components/BicycleTheftMapClient.tsx)
- [x] Translate stats and tooltip labels.

## Verification Plan

### [x] Manual Verification
- [x] Toggle between DE and EN in the header.
- [x] Verify that all tabs and core dashboard text correctly switch languages.
- [x] Verify that district names remain (as they are proper names) but labels like "All Districts" change.
