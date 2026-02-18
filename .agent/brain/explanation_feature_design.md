# Konzept: Smart Budget Explanations

Um den Berliner Haushalt verständlicher zu machen, integrieren wir ein kontextsensitives Info-Panel. Wenn ein Nutzer ein Element im Baum anklickt, analysiert das System den Namen nach Schlüsselwörtern und liefert eine verständliche Erklärung + Beispiele.

## 1. UI Integration
Wir ersetzen den statischen "INFO" Block im `BudgetExplorerView` durch ein dynamisches `BudgetExplanation` Panel.

*   **Zustand**: Reagiert auf das `selectedNode` Property.
*   **Design**: Premium Karten-Look mit Icons für "Erklärung" und "Beispiele".

## 2. Knowledge Base (Auszug)

| Keyword | Erklärung | Beispiele |
| :--- | :--- | :--- |
| **Kitas** | Ausgaben für die frühkindliche Bildung und Betreuung in Tageseinrichtungen. | Personalkosten für Erzieher, Essenszuschüsse, Sanierung von Gebäuden. |
| **Polizei** | Mittel für die Aufrechterhaltung der öffentlichen Sicherheit und Ordnung. | Neue Einsatzfahrzeuge, IT-Infrastruktur, Schutzausrüstung. |
| **Digitalisierung** | Investitionen in moderne Verwaltungsprozesse und digitale Infrastruktur. | Breitbandausbau an Schulen, Online-Bürgerservices (OZG), Software-Lizenzen. |
| **Personal** | Kosten für die im öffentlichen Dienst beschäftigten Personen. | Gehälter, Rentenversicherungsbeiträge, Beihilfen. |
| **Investitionen** | Ausgaben, die langfristige Werte schaffen (Baumaßnahmen, Gerät). | Neubau von Radwegen, Kauf von U-Bahn Waggons, Schulsanierung. |

## 3. Fallback Logik
Wenn kein spezifisches Keyword gefunden wird, generiert das System eine allgemeine Erklärung basierend auf der Ebene (z.B. "Dieser Einzelplan umfasst alle Ausgaben für den Bereich [Name] im Jahr [Jahr]").

---

**Soll ich dieses System mit einer ersten Auswahl an 15-20 Kernthemen so umsetzen?**
