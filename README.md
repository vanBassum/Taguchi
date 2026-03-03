# Taguchi Experiment Planner

Lightweight React app for building Taguchi-style experiment plans from orthogonal arrays, entering run results, and comparing factor-level performance.

https://vanbassum.github.io/Taguchi

## What this app does

- Lets you choose a predefined orthogonal array (for example 2-level, 3-level, 4-level, or 5-level designs).
- Lets you name parameters and define level values for each parameter.
- Generates the run matrix from the selected array.
- Lets you enter a numeric score for each run.
- Calculates **Average** or **Sum** score by parameter level.
- Saves projects locally as presets.
- Generates a shareable URL that encodes the full project state.

## How it works (user flow)

1. **Pick or create a project** in the Presets card.
2. **Define factors** in the Parameters card:
	 - Left column = parameter name.
	 - Level columns = level values for each parameter.
3. **Choose an orthogonal array** from the dropdown.
	 - The app reshapes the parameter table to match the array.
	 - Existing values are preserved where possible.
4. **Enter run scores** in the Runs card.
	 - Each run row is generated from the selected orthogonal array.
5. **Read results** in the Average/Sum card.
	 - Toggle between `Average` and `Sum` metrics.
	 - Cells use a heat-style background to highlight relative values.
6. **Save or share**:
	 - Save pending edits to the selected preset.
	 - Copy a share URL to transfer the project state.

## Presets and persistence

- Presets are stored in browser `localStorage` under `taguchi-presets-v1`.
- A preset includes:
	- Selected orthogonal array ID
	- Parameter names and level values
	- Run scores
	- Preset metadata (name + short GUID)
- If you delete the last preset, a default `New project` preset is recreated automatically.

## Share URL format

The app can serialize project state into a URL query parameter `s`.

- Payload shape (`SharedFormState`) includes:
	- version `v`
	- definition ID `d`
	- rows (`p` + `l`)
	- score list
	- optional preset name/guid metadata
- Encoding strategy:
	- Tries LZW-compressed bytes + Base64URL (`l...`) when smaller
	- Falls back to JSON bytes + Base64URL (`j...`)
- On load, if `s` exists:
	- state is parsed and validated
	- it is imported or matched to existing preset by GUID
	- conflicts trigger an overwrite/keep dialog
- After reading shared state, the app removes `s` from the current browser URL to keep the address clean.

## Conflict handling on import

When opening a shared link:

- If the shared GUID matches a local preset and content is different, a conflict dialog appears.
- You can:
	- **Keep existing** local project
	- **Overwrite** local project with imported data
- If GUID does not exist locally, a new imported preset is created.

## Orthogonal array catalog

Definitions live in `src/models/orthogonal-arrays.json` and are loaded as typed definitions.

Current catalog includes multiple families such as:

- `L4`, `L8`, `L9`, `L16`, `L18`, `L25`
- Parameter counts from 2 to 5
- Level counts from 2 to 5



## Development

### Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- shadcn/ui-style component primitives

### Prerequisites

- Node.js 20+
- pnpm

### Run locally

```bash
pnpm install
pnpm dev
```

### Build

```bash
pnpm build
```

