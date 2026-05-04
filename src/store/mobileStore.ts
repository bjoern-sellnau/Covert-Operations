// Mutable mobile input state — read every frame in GameScene, written by MobileControls touch handlers.
// Plain object (no Zustand) to avoid subscription overhead in the 60 Hz loop.
export const mobileInput = {
  dx:             0,     // -1 … 1  joystick X
  dz:             0,     // -1 … 1  joystick Z
  fire:           false,
  btDown:         false,
  grenadeJust:    false, // one-shot — set by touch, cleared by game loop
  diveJust:       false, // one-shot
  reloadJust:     false, // one-shot
  weaponPrevJust: false, // one-shot
  weaponNextJust: false, // one-shot
  cameraModeJust: false, // one-shot
}
