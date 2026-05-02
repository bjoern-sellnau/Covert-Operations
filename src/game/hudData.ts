// Shared data written by the Canvas (EnemyProjector) and read by the DOM HUD overlay.
// Using a plain mutable object avoids React re-render overhead for per-frame updates.
export const hudData = {
  enemyMarkers: [] as Array<{
    id:      string
    screenX: number   // 0–1 normalised (0 = left, 1 = right)
    screenY: number   // 0–1 normalised (0 = top,  1 = bottom)
    inView:  boolean
    angle:   number   // atan2 from screen-centre, radians (used for edge arrow rotation)
  }>
}
