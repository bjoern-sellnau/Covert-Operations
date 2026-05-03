# Covert Operations — Task List

> Wird als primäre Todo-Liste verwendet. Abgehakte Punkte sind implementiert und committed.

---

## Hilfe-Menü

- [x] Hilfe-Menü einbauen (Basis-Implementierung vorhanden)
  - [x] Infos über jede Waffe mit rotierendem 3D-Modell
  - [x] Infos über jedes Pickup mit rotierendem 3D-Modell
  - [x] Infos über jeden Charakter mit rotierendem 3D-Modell
  - [x] Steuerungsübersicht
  - [x] Spieltipps
  - [x] **Die 3D-Renderings sind zu dunkel** — Beleuchtung in HelpScreen-Canvas anpassen
  - [x] **Buttons unten auf iPad (Safari) abgeschnitten** — Layout-Fix für kleine/touch Viewports

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
- [x] **Wo ist dieser?** — HUD-Button „AUD" (neben REC), startet/stoppt Aufnahme des kompletten Audio-Outputs

---

## Performance

- [x] FPS-Counter im HUD
- [x] Grafikqualität-Option (Niedrig / Mittel / Hoch)
- [x] Niedrig: nur globales Ambient-Licht, keine Schatten
- [x] Niedrig: alle Reflexionen (metalness = 0) und castShadow/receiveShadow deaktiviert
- [x] Auflösung reduziert auf 0.75 DPR bei Niedrig

---

## Spielmechanik & Bugs

- [x] **Figuren sind falsch rotiert** — Player/Enemy-Meshes drehen sich in falsche Richtung
- [x] **Weapon-HUD ist manchmal abgeschnitten** — Portrait: linke Seite vertikal, Landscape: unten horizontal (Safe-Area)
- [x] Blut Ultra: zu wenige Partikel (45 → 80)
- [x] **Level-Größe** — größere Arena, eventuell Tile-basiert oder Fog of War

---

## Bullet Ballet / Gun Kata

- [x] **Bullet Ballet in Mutatoren konfigurierbar machen**
  - [x] Dauer einstellbar
  - [x] Kugelanzahl einstellbar
  - [x] Geschwindigkeit einstellbar
- [x] **Neue Fähigkeit: Gun Kata** (inspiriert von Equilibrium)
  - [x] Ebenfalls in Slowmo
  - [x] Gleiches Konfigurations-Setup wie Bullet Ballet

---

## Sound

- [x] **Kill-Multiplikator-Sounds anpassen** — alle klingen gleich, verschiedene Töne pro Multiplikator-Stufe

---

## Menü & Navigation

- [x] **Menü-Reihenfolge anpassen:**
  1. Charakter-Auswahl (Player-Skin)
  2. Mutatoren
  3. Shop (nur bei aktiven Modi)
  4. Hinweise / Briefing
- [x] **Player-Charakter-Auswahl** (mehrere Skins):
  - [x] Doom Guy
  - [x] Halo (Master Chief)
  - [x] Unreal Tournament
  - [x] Palantir Suit — Orange/Silber (default)
  - [x] Palantir Stealth Suit — Grau mit orangenen Akzenten

---

## Steuerung

- [x] **iPad mit Magic Keyboard Case (kein Mobile-Mode)**
  - [x] First-Person-Modus: Richtungswechsel per Trackpad (wie auf dem Mac)

---

## Offene Fragen / Klärungsbedarf

- [ ] **Wie läuft das Munitionssystem beim Kaufsystem genau?** — Dokumentieren oder neu designen: Munition beim Kauf, Nachladen zwischen Wellen, Kosten pro Magazin etc.

---

## Bereits umgesetzt (Archiv)

- [x] Plasma/Bazooka Re-Fire-Bug behoben (kein Überschreiben laufender Projektile)
- [x] Neue Sounds: Rüstung, Fokus, Quad-Damage, Berserker, Kill-Multiplikator, Feind-Schuss
- [x] Pickup-Sounds verdrahtet (PickupSystem)
- [x] Kill-Multiplikator-Jingle + Feind-Schuss-Sound in GameScene
- [x] Arena skaliert mit `charScale`-Setting
- [x] Shop CharacterPanel neu gestaltet (nach Slot gruppiert, Live-Munitionsanzeige)
- [x] Feind-Marker (Pfeile für Gegner außerhalb des Bildschirms), als Option
- [x] Minimap-Overlay, als Option
- [x] Kugel-Zeit (Bullet Time) visueller Effekt per Mutator
