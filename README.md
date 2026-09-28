# Logesh Kumar: portfolio

An immersive, scroll-driven 3D portfolio: an engineer character walks through a
software-engineering world (system graph → experience pipelines → project
gallery → Postman MCP pipeline → research → contact) while the page tells the story.

Next.js 14 (App Router) · TypeScript · Tailwind · three.js + React Three Fiber · Lenis.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Set `NEXT_PUBLIC_SITE_URL` is not needed: the canonical domain is `profile.site` in `constants/index.ts`.

## Where things live

| Path | What |
| --- | --- |
| `constants/index.ts` | **All portfolio content** (the source of truth). |
| `components/story/` | Page chapters. Each screen is a `Beat` (`data-beat`) that drives the camera. |
| `components/experience/` | Loader, scroll controller (Lenis), navigation/HUD, sound, cursor. |
| `components/world/` | The 3D world: `WorldCanvas`, `CameraController`, `choreography.ts` (per-beat character mark + camera shot), `stations.ts` (layout), `scenes/`. |
| `components/world/character/` | Character system: rig contract, procedural animation, materials, model drivers. |
| `lib/audio/` | Original generative score (Web Audio) and the music config. |

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
