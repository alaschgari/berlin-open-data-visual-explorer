# Vorschläge: Hierarchischer Budget Tree Explorer

Anstatt einer flächenbasierten Darstellung (Treemap) schlage ich eine strukturierte, textbasierte Hierarchie vor, die an einen modernen Datei-Explorer erinnert. Dies maximiert die Übersichtlichkeit und Präzision.

## 1. UI-Konzept: "OS-Style" Datei-Browser
Die Darstellung erfolgt in einer interaktiven Tabelle oder Liste mit folgenden Merkmalen:

*   **Expandierbare Zeilen**: Jede Ebene (Einzelplan → Kapitel → Titel) hat ein Chevron-Icon (›) zum Auf- und Zuklappen.
*   **Visuelle Einrückung**: Die Hierarchie wird durch subtile Einrückungen und vertikale Führungslinien verdeutlicht.
*   **Datenspalten**:
    *   **Name**: Bezeichnung des Haushaltsbereichs.
    *   **Betrag (2026/27)**: Der absolute Euro-Wert.
    *   **Anteil**: Ein kleiner, dezenter Balken innerhalb der Zelle, der den prozentualen Anteil an der übergeordneten Ebene zeigt (ohne die Flächendominanz einer Treemap).

## 2. Funktionalität & Interaktion
*   **Inhaltssuche**: Ein Suchfeld oben filtert den Baum in Echtzeit. Gefundene Elemente werden hervorgehoben und deren Pfad automatisch expandiert.
*   **Status-Erhaltung**: Beim Wechsel zwischen den Jahren (2026/2027) bleibt die bereits expandierte Struktur erhalten, nur die Zahlen aktualisieren sich.
*   **Schnell-Aktionen**: Buttons zum "Alle Aufklappen" oder "Alle Zuklappen" für schnelles Navigieren.

## 3. Technischer Ansatz
*   **React State**: Management der `expandedKeys` in einem Set für O(1) Zugriff.
*   **Animation**: Weiche Übergänge beim Aufklappen (Slide-Down-Effekt mit CSS oder Framer Motion).
*   **Performance**: Da die Budgetdaten zwar tief, aber für moderne Browser nicht "unendlich" groß sind, nutzen wir eine optimierte Map-Funktion zur flachen Darstellung des Baums.

---

### Vergleich: Alt vs. Neu
| Feature | Treemap (Aktuell) | Tree Explorer (Vorschlag) |
| :--- | :--- | :--- |
| **Fokus** | Visuelle Gewichtung (Fläche) | Strukturelle Präzision (Text) |
| **Navigation** | Zoom/Drill-Down | Expand/Collapse |
| **Lesbarkeit** | Eingeschränkt bei kleinen Boxen | Exzellent durch Listenform |
| **Suche** | Schwierig | Sehr einfach durch Text-Filter |

**Wie klingen diese Vorschläge für dich? Soll ich eine erste Version dieser Baumstruktur als Alternative zur Treemap implementieren?**
