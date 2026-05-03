# Covert Operations — Task List

> Wird als primäre Todo-Liste verwendet. Abgehakte Punkte sind implementiert und committed.

---

## Bugs (Kritisch)

- [ ] Wenn man einen Game-Modus ohne Shop gewählt hat (z.B. Direkt spielen), kommt man nach Game Over nicht mehr raus
- [ ] Änderungen für Flak-Waffe sind wieder raus (Regression)
- [ ] Low-Graphics-Modus sieht wieder wie vorher aus (Regression)
- [ ] Skalierung führt zu Problemen mit dem Level
- [ ] UI hat Probleme mit Fullscreen-Modus auf iPad
- [ ] UI hat allgemeine Probleme auf iPad
- [ ] Das Hilfe-Menü hat Probleme im Fullscreen
- [ ] Alle Menüs sind zu dunkel, 3D-Modelle im Hilfe-Screen immer noch nicht sichtbar
- [ ] Das HUD auf iPhone muss überarbeitet werden (z.B. kein Nachladen möglich)
- [ ] Das UI auf iPad ist zu nahe am Home-Indicator → Browser wird oft minimiert
- [ ] Akimbo funktioniert nicht mehr / Logik unklar
- [ ] Bullet Ballet funktioniert nicht
- [ ] Gun Kata funktioniert nicht
- [ ] Briefings und Hilfe-Screens an neue Steuerung anpassen (z.B. G = Granate stimmt nicht mehr)
- [ ] Wenn man auf Zurück drückt werden Credits etc. nicht auf Standard zurückgesetzt

---

## Menü-Reihenfolge (Redesign)

Die aktuelle Reihenfolge ist falsch. Neue Reihenfolge:

1. **Player Character Auswahl** — Anzüge als 3D-Modelle anzeigen (nicht als Farbmuster)
2. **Game-Modi Auswahl** — eigener Screen (wird ausgelagert)
3. **Mutatoren** — hier platziert, damit man bei bestimmten Modi den Shop auslassen kann
4. **Regeln** — Regeln wie viele Waffen man kaufen kann, Defaults, Import/Export
5. **Shop** — optional je nach Modus
6. **Map-Auswahl** — alle Karten aus dem Level-Editor basierend auf dem Game-Modus
7. **Briefing**

---

## Neue Features

- [ ] Option in Mutatoren: Autoreload aktivierbar
- [ ] Im Level-Editor kann man eingeben, in welchen Spielmodi eine Karte verfügbar ist (Standard: alle)

### Visuelle Effekte
- [x] Flak trifft Gegner → Mini-Explosion + Sekundär-Splitter (4 Shrapnel-Bullets in zufällige Richtungen)
- [x] Granate explodiert → Explosion + Funken + Decal + Sound (playExplosionSmall)
- [x] RPG/Bazooka → bereits via doSplash implementiert (Explosion + Funken + Decal + Sound)
- [x] Gegner stirbt durch mächtige Waffe (Flak oder Schaden ≥ 40) → zusätzliche Explosions-Partikel
- [x] Blut-Spots auf Gegnern bei Treffer → bereits via spawnDecal implementiert

### Startup-Animationen
- [ ] Beim Start werden Animationen angezeigt:
  1. Coded by Claude Code
  2. Loona! Designs
  3. Based on the Loona! Designs Flash Game "Covert Operations" & "Covert Operations Tournament"

### Haupt-Menü Redesign
- [ ] Modernes Design mit animiertem Hintergrund
- [ ] Menüelemente:
  - [ ] Singleplayer → Singleplayer-Menü
  - [ ] Multiplayer → Multiplayer-Menü
  - [ ] Level Editor
  - [ ] Demos
  - [ ] Track Player
  - [ ] Debug → Debug-Menü

### Singleplayer-Menü
- [ ] Modernes Design mit animiertem Hintergrund
- [ ] Menüelemente:
  - [ ] Story (folgt)
  - [ ] Missionen
  - [ ] Optionen
  - [ ] Zurück → Haupt-Menü

### Multiplayer-Menü
- [ ] Modernes Design mit animiertem Hintergrund
- [ ] Menüelemente:
  - [ ] Offline → (Ausrüstung & Start)
  - [ ] Gefecht → (Direkt Spielen)
  - [ ] Online → (Multiplayer/Lobby)
  - [ ] Optionen
  - [ ] Zurück → Haupt-Menü

### Debug-Menü
- [ ] Modernes Design mit animiertem Hintergrund
- [ ] Menüelemente:
  - [ ] Show Bounding Boxes
  - [ ] Cleanup Settings
  - [ ] Reset
  - [ ] Zurück → Haupt-Menü (Debug bleibt aktiv bis manuell deaktiviert)

### Kauf-Menü 2.0
- [ ] Grundprinzip: Waffen einmalig kaufen → freischalten
  - [ ] Ausnahme: Pistole max. 2×, UZI max. 2×
- [ ] Unter "Munition": für alle Waffen Munition kaufen

### Game-Modi
- [ ] **Arena-Modus**:
  - [ ] Kein Shop
  - [ ] Keine droppenden Waffenkisten (per Mutator änderbar)
  - [ ] Klassisches Unreal-Tournament-Gameplay — keine Waves

---

## Demo Recorder / Player

- [x] Demo Recorder einbauen (20 fps Aufnahme, `DemoRecorder.tsx`)
- [x] Demo Player einbauen (`DemoViewer.tsx`, 2D-Canvas-Wiedergabe)
- [x] Demos exportieren (JSON-Download)
- [x] Demos importieren (JSON-Upload)
- [x] Demos als Videosequenzen für Missionen nutzen (Cutscene-System)
- [x] Demo-Funktion auch im Level-Editor einbauen
- [x] **Wo ist diese Funktion?** — Hauptmenü → „▶ Demos", HUD-Button „REC"

---

## Audio Track Recorder

- [x] Shared AudioContext + Master-Bus (`audioCore.ts`)
- [x] Audio-Aufnahme via MediaRecorder (HUD-Button „AUD", Download als .webm/.ogg)
- [x] **Aufgenommene Tracks als Custom Tracks in den Optionen auswählbar** — Import-System + Track-Store + Options-Integration

---

## Performance

- [x] FPS-Counter im HUD
- [x] Grafikqualität-Option (Niedrig / Mittel / Hoch)
- [x] Niedrig: nur globales Ambient-Licht, keine Schatten
- [x] Niedrig: alle Reflexionen (metalness = 0) und castShadow/receiveShadow deaktiviert
- [x] Auflösung reduziert auf 0.75 DPR bei Niedrig

---

## Spielmechanik & Bugs (erledigt)

- [x] **Figuren sind falsch rotiert** — Player/Enemy-Meshes drehen sich in falsche Richtung
- [x] **Weapon-HUD ist manchmal abgeschnitten** — Portrait: linke Seite vertikal, Landscape: unten horizontal (Safe-Area)
- [x] Blut Ultra: zu wenige Partikel (45 → 80)
- [x] **Level-Größe** — größere Arena, Fog of War, dynamisches arenaHalf

---

## Bullet Ballet / Gun Kata

- [x] **Bullet Ballet in Mutatoren konfigurierbar machen**
- [x] **Neue Fähigkeit: Gun Kata** (inspiriert von Equilibrium)

---

## Sound

- [x] **Kill-Multiplikator-Sounds anpassen** — verschiedene Töne pro Stufe

---

## Menü & Navigation (erledigt)

- [x] **Player-Charakter-Auswahl** (5 Skins: Palantir, Stealth, Doom Guy, Master Chief, Unreal Tournament)
- [x] **iPad Magic Keyboard Trackpad FPS** — Fallback ohne Pointer Lock

---

## Bereits umgesetzt (Archiv)

- [x] Plasma/Bazooka Re-Fire-Bug behoben
- [x] Neue Sounds: Rüstung, Fokus, Quad-Damage, Berserker, Kill-Multiplikator, Feind-Schuss
- [x] Pickup-Sounds verdrahtet (PickupSystem)
- [x] Kill-Multiplikator-Jingle + Feind-Schuss-Sound in GameScene
- [x] Arena skaliert mit `charScale`-Setting
- [x] Shop CharacterPanel neu gestaltet (nach Slot gruppiert, Live-Munitionsanzeige)
- [x] Feind-Marker (Pfeile für Gegner außerhalb des Bildschirms), als Option
- [x] Minimap-Overlay, als Option
- [x] Kugel-Zeit (Bullet Time) visueller Effekt per Mutator
- [x] Fahrstuhl-Entity im Level-Editor
- [x] Dynamische Arena-Größe (arenaHalf, 18–60, Editor-Slider)
- [x] Hilfe-Menü EDITOR-Tab
- [x] Distinct Kill-Streak-Jingles (Spree→Godlike) + Kill-Combo-Jingles
