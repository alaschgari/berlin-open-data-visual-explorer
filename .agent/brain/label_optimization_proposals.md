# Vorschläge: Optimierung der Label-Länge

Wie du richtig bemerkt hast, sind viele Einträge im Berliner Haushalt sehr redundant (z.B. wiederholt sich "Senatsverwaltung für..." in jedem Unterpunkt). Hier sind meine Vorschläge, um das Interface aufgeräumter zu gestalten:

## 1. Intelligente Präfix-Entfernung (Dynamic Stripping)
Die logischste Lösung: Wenn ein Unterelement mit dem exakten Namen des übergeordneten Elements beginnt, schneiden wir diesen Teil für die Anzeige ab.

*   **Vorher**:
    *   Bildung, Jugend und Familie
        *   Senatsverwaltung für Bildung, Jugend und Familie - Kitas
        *   Senatsverwaltung für Bildung, Jugend und Familie - Schulen
*   **Nachher** (im Explorer):
    *   Bildung, Jugend und Familie
        *   › Kitas
        *   › Schulen

## 2. Bekannte Abkürzungen (Alias System)
Wir können eine Liste der Berliner Senatsverwaltungen hinterlegen und diese durch ihre offiziellen Kürzel ersetzen.

*   **Beispiele**:
    *   "Senatsverwaltung für Bildung, Jugend und Familie" → **SenBJF**
    *   "Senatsverwaltung für Finanzen" → **SenFin**
    *   "Senatsverwaltung für Inneres und Sport" → **SenInnSport**

## 3. "Clean Titles" Logik
Viele Titel enthalten Trennstriche ("-") oder Doppelpunkte. Wir könnten die Anzeige so optimieren, dass nur der Teil *nach* dem letzten Trenner fett hervorgehoben wird, da dies meist die spezifische Information ist.

## 4. UI-Lösung: Tooltips & "Expand on Hover"
*   In der Liste zeigen wir eine gekürzte Version (z.B. max. 40 Zeichen mit "...").
*   Beim Drüberfahren (Hover) wird der vollständige, offizielle Name in einem kleinen eleganten Tooltip angezeigt.

---

### Mein Favorit
Ich empfehle eine **Kombination aus 1 und 3**: Wir entfernen redundante Präfixe des Elternelements und fokussieren uns auf den Teil nach dem Bindestrich. Das erhält den Kontext, ohne den Text zu wiederholen.

**Wie findest du diese Ansätze? Welchen soll ich (nach deiner Bestätigung) umsetzen?**
