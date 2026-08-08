import { sep } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findClientEntry, planProvider, providerSnippet } from "../packages/tools/cli/src/core/project/entry";
import type { RegistryProvider } from "../packages/tools/cli/src/core/registry/schema";
import { createProject, type Fixture } from "./support/project";

let fixture: Fixture | undefined;

afterEach(async () => {
  await fixture?.cleanup();
  fixture = undefined;
});

const PORTAL_PROVIDER: RegistryProvider = {
  name: "PortalProvider",
  package: "@lattice-ui/react-layer",
  props: { container: "player-gui" },
  reason: "Lattice reads the portal target from it",
};

/** The shape a roblox-ts client entry actually has. */
const ENTRY = `import React, { StrictMode } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";

function App() {
  return <frame />;
}

const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui");
const root = createRoot(new Instance("Folder"));

root.render(
  <StrictMode>
    {createPortal(<screengui>{<App />}</screengui>, playerGui)}
  </StrictMode>,
);
`;

describe("findClientEntry", () => {
  it("finds the file that mounts the tree, and ignores the ones that do not", async () => {
    fixture = await createProject({
      "src/client/main.client.tsx": ENTRY,
      "src/shared/ui/button.tsx": "export function Button() { return <frame />; }\n",
    });

    const entries = await findClientEntry(fixture.root);
    expect(entries.map((entry) => entry.path)).toEqual(["src/client/main.client.tsx".split("/").join(sep)]);
  });

  it("does not walk into node_modules, where every dependency renders something", async () => {
    fixture = await createProject({
      "src/client/main.client.tsx": ENTRY,
      "node_modules/@rbxts/react-roblox/src/demo.tsx": ENTRY,
    });

    const entries = await findClientEntry(fixture.root);
    expect(entries).toHaveLength(1);
  });

  it("returns every candidate when a project mounts more than one tree", async () => {
    fixture = await createProject({
      "src/client/main.client.tsx": ENTRY,
      "src/client/hud.client.tsx": ENTRY,
    });

    expect(await findClientEntry(fixture.root)).toHaveLength(2);
  });
});

describe("planProvider", () => {
  it("wraps the render argument and adds the import, leaving the rest byte for byte", () => {
    const plan = planProvider({ path: "src/client/main.client.tsx", source: ENTRY }, PORTAL_PROVIDER);

    expect(plan.kind).toBe("ready");
    if (plan.kind !== "ready") return;

    expect(plan.content).toBe(`import React, { StrictMode } from "@rbxts/react";
import { createPortal, createRoot } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";
import { PortalProvider } from "@lattice-ui/react-layer";

function App() {
  return <frame />;
}

const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui");
const root = createRoot(new Instance("Folder"));

root.render(
  <PortalProvider container={playerGui as BasePlayerGui}>
    <StrictMode>
      {createPortal(<screengui>{<App />}</screengui>, playerGui)}
    </StrictMode>
  </PortalProvider>,
);
`);
  });

  it("reuses the PlayerGui expression when the entry never names it", () => {
    const source = `import { createRoot } from "@rbxts/react-roblox";
import { Players } from "@rbxts/services";

const root = createRoot(Players.LocalPlayer.WaitForChild("PlayerGui"));
root.render(<App />);
`;

    const plan = planProvider({ path: "src/client/main.client.tsx", source }, PORTAL_PROVIDER);
    expect(plan.kind).toBe("ready");
    if (plan.kind !== "ready") return;

    expect(plan.content).toContain('container={Players.LocalPlayer.WaitForChild("PlayerGui") as BasePlayerGui}');
  });

  it("is a no-op once the provider is imported", () => {
    const source = `import { PortalProvider } from "@lattice-ui/react-layer";
const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui");
root.render(<PortalProvider container={playerGui as BasePlayerGui}><App /></PortalProvider>);
`;

    expect(planProvider({ path: "entry.tsx", source }, PORTAL_PROVIDER).kind).toBe("present");
  });

  // The point of parsing rather than pattern-matching: every case the CLI is
  // not sure about has to come back as a reason, not a mangled file.
  it("refuses a file that mounts two trees rather than picking one", () => {
    const source = `const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui");
hud.render(<Hud />);
menu.render(<Menu />);
`;

    const plan = planProvider({ path: "entry.tsx", source }, PORTAL_PROVIDER);
    expect(plan.kind).toBe("manual");
    if (plan.kind !== "manual") return;
    expect(plan.reason).toContain("2 render calls");
  });

  it("refuses a file with no PlayerGui to pass, rather than inventing one", () => {
    const source = `import { createRoot } from "@rbxts/react-roblox";
const root = createRoot(new Instance("Folder"));
root.render(<App />);
`;

    const plan = planProvider({ path: "entry.tsx", source }, PORTAL_PROVIDER);
    expect(plan.kind).toBe("manual");
    if (plan.kind !== "manual") return;
    expect(plan.reason).toContain("PlayerGui");
  });

  it("refuses a file that does not parse, rather than throwing out of the command", () => {
    const plan = planProvider({ path: "entry.tsx", source: "root.render(<App /" }, PORTAL_PROVIDER);
    expect(plan.kind).toBe("manual");
  });

  it("wraps a provider that needs no props at all", () => {
    const source = `import { createRoot } from "@rbxts/react-roblox";
root.render(<App />);
`;
    const plan = planProvider(
      { path: "entry.tsx", source },
      { name: "MotionProvider", package: "@lattice-ui/react-motion", reason: "motion policy" },
    );

    expect(plan.kind).toBe("ready");
    if (plan.kind !== "ready") return;
    expect(plan.content).toContain("<MotionProvider>\n  <App />\n</MotionProvider>");
  });
});

describe("providerSnippet", () => {
  it("says the same thing the edit would have written", () => {
    expect(providerSnippet(PORTAL_PROVIDER)).toContain("<PortalProvider container={playerGui as BasePlayerGui}>");
  });
});
