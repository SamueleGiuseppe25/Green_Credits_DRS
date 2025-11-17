Map small enhancements (feat/wallet-returnpoints)

- Increased map container height on `MapPage.tsx` from `h-[420px]` to `h-[540px]` to create a more dashboard-like layout. Sidebar list `max-h` updated accordingly.
- Type-based styling added in `ReturnPointsMap.tsx`:
  - Helper `getPointColor(type)` maps types to the existing palette:
    - RVM → `#22d3ee` (cyan/teal)
    - Manual → `#fbbf24` (amber)
    - Fallback → `#60a5fa` (blue)
  - Selected point `CircleMarker` uses the mapped color (stroke + subtle fill).
  - Popup title shows a small colored dot matching the type.
- Optional mini legend added at the bottom of the sidebar to show color → type mapping.

No dependency changes. Frontend-only edits.*** End Patch***  }``` />
## Map feature overview

- Library: Leaflet + react-leaflet (no API key required)
- Files:
  - `src/components/ReturnPointsMap.tsx`: map component rendering markers for return points
  - `src/views/MapPage.tsx`: sidebar list + details and integration with the map

### Data wiring

- Uses the existing `useReturnPoints` hook (no additional fetch)
- Props to `ReturnPointsMap`:
  - `points: ReturnPoint[]`
  - `selectedPointId?: number`
  - `onSelectPoint: (id: number) => void`

### Selection sync

- Clicking a marker calls `onSelectPoint(id)` to select it in the sidebar
- Clicking a list item sets `selectedPointId`, and the map pans/zooms to that point
- Selected marker is visually highlighted with an overlaid `CircleMarker`

### Map behavior

- If there are points, the map fits bounds to include them
- If not, it defaults to Dublin center/zoom
- Popups show: name, type, retailer (if any), eircode (if any)

### Notes / TODOs

- Potential improvements:
  - Marker clustering for dense areas
  - Custom marker icons per type (RVM/Manual or retailer branding)
  - User location marker and “near me” search using query params
  - Persist selected point in URL query param for deep linking


