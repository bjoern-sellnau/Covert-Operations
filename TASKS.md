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
- [ ] Demos als Videosequenzen für Missionen nutzen (Cutscene-System)
- [ ] Demo-Funktion auch im Level-Editor einbauen
- [x] **Wo ist diese Funktion?** — Hauptmenü → „▶ Demos", HUD-Button „REC"

---

## Audio Track Recorder

- [x] Shared AudioContext + Master-Bus (`audioCore.ts`)
- [x] Audio-Aufnahme via MediaRecorder (HUD-Button „AUD", Download als .webm/.ogg)
- [ ] **Aufgenommene Tracks als Custom Tracks in den Optionen auswählbar** — Import-System + Track-Store + Options-Integration
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

- [ ] **Figuren sind falsch rotiert** — Player/Enemy-Meshes drehen sich in falsche Richtung
- [ ] **Weapon-HUD ist manchmal abgeschnitten** — Layout-Fix für das Waffen-Panel im HUD
- [x] Blut Ultra: zu wenige Partikel (45 → 80)
- [ ] **Level-Größe** — größere Arena, eventuell Tile-basiert oder Fog of War

---

## Bullet Ballet / Gun Kata

- [ ] **Bullet Ballet in Mutatoren konfigurierbar machen**
  - [ ] Dauer einstellbar
  - [ ] Kugelanzahl einstellbar
  - [ ] Geschwindigkeit einstellbar
- [ ] **Neue Fähigkeit: Gun Kata** (inspiriert von Equilibrium)
  - [ ] Ebenfalls in Slowmo
  - [ ] Gleiches Konfigurations-Setup wie Bullet Ballet

---

## Sound

- [ ] **Kill-Multiplikator-Sounds anpassen** — alle klingen gleich, verschiedene Töne pro Multiplikator-Stufe

---

## Menü & Navigation

- [ ] **Menü-Reihenfolge anpassen:**
  1. Charakter-Auswahl (Player-Skin)
  2. Mutatoren
  3. Shop (nur bei aktiven Modi)
  4. Hinweise / Briefing
- [ ] **Player-Charakter-Auswahl** (mehrere Skins):
  - [ ] Doom Guy
  - [ ] Halo (Master Chief)
  - [ ] Unreal Tournament
  - [ ] Palantir Suit — Orange/Silber (default)
  - [ ] Palantir Stealth Suit — Grau mit orangenen Akzenten

---

## Steuerung

- [ ] **iPad mit Magic Keyboard Case (kein Mobile-Mode)**
  - [ ] First-Person-Modus: Richtungswechsel per Trackpad (wie auf dem Mac)

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
