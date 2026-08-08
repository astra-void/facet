# facet-rbxts

The [Facet](https://facet.astra-void.xyz) CLI — copy UI components into your
[roblox-ts](https://roblox-ts.com/) project.

Facet is not a component library. You do not install a `Button`; you run one command and a
`button.tsx` appears in your project, imports resolved and theme wired up. It is yours from that
moment.

```bash
npx facet-rbxts init
npx facet-rbxts add button
```

The package installs as `facet-rbxts` and the command is `facet`.

## Commands

| Command | What it does |
| --- | --- |
| `facet init` | Writes `facet.json`, creates `vela.config.ts` if absent, installs build dependencies |
| `facet add <names...>` | Copies components in, with their registry dependencies |
| `facet list` | Shows every component in the registry |
| `facet remove <names...>` | Deletes copied components |
| `facet diff [name]` | Shows how a copied component differs from the registry |
| `facet doctor` | Checks the project matches what components assume |

| Option | |
| --- | --- |
| `--cwd <dir>` | Run against another directory |
| `--registry <url>` | Read from another registry — a fork, or a private one |
| `--overwrite` | (add) Replace files that already exist |
| `--dry-run` | (add) Resolve and report, write nothing |
| `--no-deps` | Skip package installs |
| `--force` | (init) Overwrite `facet.json` |
| `--yes`, `-y` | (init) Accept every default; (add) wire providers without asking |

## Providers

Some components need a context provider above your whole app — `dialog` portals through Lattice's
`PortalProvider`, and throws when it opens without one. `facet add` finds the file under `src/` that
mounts your React tree, offers to wrap it, and prints the lines to paste when it is not sure:

```
PortalProvider has to wrap your app — Lattice reads the portal target from it
  Add it to src/client/main.client.tsx? (Y/n)
```

It parses the file rather than pattern-matching it, and refuses to edit anything ambiguous — two
render calls, no `PlayerGui` to pass, no entry it can find. `facet doctor` reports a provider that
went missing afterwards.

## Requirements

A roblox-ts project using [`@rbxts/react`](https://github.com/littensy/rbxts-react) and
[Vela](https://github.com/astra-void/vela-rbxts). Components are styled entirely through Vela's
`className`, so without the transformer registered in your tsconfig every class is inert — `init`
checks for this and tells you what to add.

## Where components come from

The registry is fetched at runtime from `https://facet.astra-void.xyz/r`, not bundled into this
package: adding a component does not require a CLI release, and everyone gets the same files
regardless of which CLI version they installed. Point `--registry` or `facet.json`'s `registry` field
elsewhere to use a fork.

## License

MIT
