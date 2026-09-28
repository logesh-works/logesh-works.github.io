# Logesh Kumar: portfolio

An immersive, scroll-driven 3D portfolio. One engineer character stands on a
studio stage; scrolling moves the camera around him along a spline while fixed
text blocks swap per stop. The frame (header, toolbar, menu, panels, loader)
follows the layout system documented in [docs/design-spec.md](docs/design-spec.md).

Next.js 14 (App Router) · TypeScript · Tailwind · three.js + React Three Fiber · Lenis.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

The canonical domain is `profile.site` in `constants/index.ts`.

## Where things live

| Path | What |
| --- | --- |
| `constants/index.ts` | **All portfolio content** (the source of truth). |
| `docs/design-spec.md` | Design tokens, grid, type scale, motion and component specs. |
| `app/globals.css` | Tokens, type scale, keyframes and component styles from the spec. |
| `components/home/` | Home page: `Intro` (wordmark), `ScrollTrack` (camera stops), `Blocks` (fixed copy per stop), `HomeFooter`. |
| `components/hud/` | Frame: `Header`, `Toolbar`, `SiteMenu`, `Panels` (timeline, profile), `Pill`, `SoundToggle`, `SoundEngine`, `Tutorials`. |
| `components/experience/` | Loader, lazy stage mount, scroll controller (Lenis → step position). |
| `components/world/` | The 3D stage: `WorldCanvas`, `cameraPath.ts` (one shot per stop), `CameraController`, `scenes/Stage` (cyclorama, lights, dust), `scenes/PostFX`. |
| `components/world/character/` | Character system: rig contract, procedural animation, looks, model drivers. |
| `lib/audio/` | Original generative score (Web Audio), music config, sound on/off. |

To add or reorder a stop: add a chapter in `constants` (`chapters`), a shot in
`components/world/cameraPath.ts`, and a `Block` in `components/home/Blocks.tsx`.

## Replacing the character with a sculpted model

The current character is a code-built stand-in. To use a proper rigged model
(one you own or have licensed):

1. Export a rigged GLB (Mixamo auto-rig works) with at least `idle` and `walk` clips;
   optional `type`, `inspect`, `present`, `lookUp`, `confident`.
2. Compress it: `npx @gltf-transform/cli optimize in.glb public/models/engineer.glb --compress meshopt --texture-compress webp`.
3. Set `model` in `components/world/character/config.ts` (url, scale, clip names, head bone).

Walking, gaze, choreography and camera work unchanged.

## Replacing the music

`track: null` in `lib/audio/config.ts` plays the original generative score. To use a
licensed track, put it in `public/audio/` and set `track: { url: "/audio/…" }`. The
sound toggle, fades and music-synced visuals apply to it. Only use audio you hold
the rights to.
