# opencode-tps

A plugin for [OpenCode](https://opencode.ai) that displays a live **tokens-per-second** (`tok/s`) meter in the terminal UI, plus a persistent `avg / max / min` summary that stays on screen after each response completes.

![tok/s Meter Demo](./assets/plugin-tps.gif)

> Fork of [williamcr01/opencode-tps](https://github.com/williamcr01/opencode-tps) with a persistent post-response summary, scale-consistent numbers, and a tuned token estimator.

## What it does

While the model is streaming, the meter shows a live `tok/s` reading (5-second rolling window) in the bottom-right of the prompt.

When the response completes, the meter freezes a summary for that message:

```
tok/s 38.2 avg · ↑51.0 ↓22.4
```

- **`avg`** — uses the real output-token count from the model's usage report whenever the API exposes it (`info.tokens.output`), falling back to an estimate otherwise.
- **`max` / `min`** — peak and floor of the per-second live readings during the response. The model API doesn't expose per-second real-token counts, so these are estimate-derived and then rescaled by the message's real/estimate ratio, keeping all three numbers on the same scale.

The summary stays on screen until the next assistant response starts streaming, then it's replaced by a fresh live reading.

## Installation

### Via OpenCode CLI

```bash
opencode plugin @mesaleh/opencode-tps
```

### Via npm

1. Add the plugin to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@mesaleh/opencode-tps"]
}
```

2. Install the package:

```bash
cd ~/.opencode
npm install @mesaleh/opencode-tps
```

## Requirements

- OpenCode >= 1.3.14
- OpenCode TUI (Web UI does not support this plugin)

## How it works

The plugin subscribes to `message.part.delta`, `message.updated`, and `message.part.updated` events from OpenCode:

- **During streaming:** estimates tokens per delta (~5.5 bytes per token) and renders a live `tok/s` value over a 5-second rolling window. The slot shows `tok/s -` when no tokens are being generated.
- **Per-message accumulator:** in parallel with the rolling window, the plugin tracks first-delta timestamp, cumulative estimated tokens, and the observed max/min of the live reading (after a 3-second warm-up so a single early sample can't pin an artificial floor).
- **On completion:** computes `avg = tokens / duration`, preferring the real output-token count from the message info when available. Rescales `max` and `min` by the same real/estimate ratio so all three displayed numbers share a scale.
- **Across tool calls:** the live rolling window clears on tool transitions, but the per-message accumulator keeps going, so the final `avg` reflects the whole response.

## License

MIT — see [LICENSE](./LICENSE). Original work © williamcr01.
