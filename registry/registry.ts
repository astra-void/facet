import { defineRegistry } from "../packages/tools/cli/src/core/registry/schema";

/**
 * The authored registry. `pnpm registry:build` reads this, inlines each file's
 * source from `registry/src`, and emits the JSON the published CLI ships.
 *
 * Rules for entries:
 *  - `dependencies` lists npm packages the source imports, exactly. A component
 *    that imports a Lattice primitive must say so, or `facet add` installs a
 *    file that cannot compile.
 *  - A dependency carries a floor when the source needs behavior a specific
 *    version introduced, and the same package carries the *same* spec in every
 *    entry — `facet add` unions these strings, so two spellings of one package
 *    would both be handed to the package manager. `registry:check` enforces it.
 *  - `registryDependencies` lists other entries, never files. `utils` is a
 *    dependency of everything that imports `~/lib/utils`.
 *  - `tokens` lists the semantic tokens the classes name, so `facet doctor` can
 *    check them against the consumer's Vela theme.
 */
export default defineRegistry([
  {
    name: "utils",
    type: "registry:lib",
    description: "cn — class composition helper every component imports",
    files: [{ path: "lib/utils.ts", type: "registry:lib" }],
    dependencies: ["@facet-ui/react-variants@^0.1.1"],
  },
  {
    name: "text",
    type: "registry:lib",
    description: "TextSlot — wraps string children in a styled textlabel",
    files: [{ path: "lib/text.tsx", type: "registry:lib" }],
    dependencies: ["@lattice-ui/react-runtime@^0.8.0"],
  },
  {
    name: "button",
    type: "registry:ui",
    description: "Button with variant and size recipes",
    files: [{ path: "ui/button.tsx", type: "registry:ui" }],
    registryDependencies: ["utils", "text"],
    dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
    tokens: [
      "primary",
      "primary-foreground",
      "destructive",
      "destructive-foreground",
      "secondary",
      "secondary-foreground",
      "accent",
      "accent-foreground",
      "background",
      "input",
      "foreground",
    ],
  },
  {
    name: "label",
    type: "registry:ui",
    description: "Form label",
    files: [{ path: "ui/label.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
    tokens: ["foreground"],
  },
  {
    name: "separator",
    type: "registry:ui",
    description: "One-pixel divider, horizontal or vertical",
    files: [{ path: "ui/separator.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
    tokens: ["border"],
  },
  {
    name: "badge",
    type: "registry:ui",
    description: "Small status pill that hugs its label",
    files: [{ path: "ui/badge.tsx", type: "registry:ui" }],
    registryDependencies: ["utils", "text"],
    dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
    tokens: [
      "primary",
      "primary-foreground",
      "secondary",
      "secondary-foreground",
      "destructive",
      "destructive-foreground",
      "input",
      "foreground",
    ],
  },
  {
    name: "card",
    type: "registry:ui",
    description: "Card with header, title, description, content, and footer parts",
    files: [{ path: "ui/card.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
    tokens: ["card", "card-foreground", "border", "muted-foreground"],
  },
  {
    name: "skeleton",
    type: "registry:ui",
    description: "Placeholder block for content that has not arrived",
    files: [{ path: "ui/skeleton.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
    tokens: ["muted"],
  },
  {
    name: "kbd",
    type: "registry:ui",
    description: "Key cap for a keyboard shortcut",
    files: [{ path: "ui/kbd.tsx", type: "registry:ui" }],
    registryDependencies: ["utils", "text"],
    dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
    tokens: ["border", "muted", "muted-foreground"],
  },
  {
    name: "avatar",
    type: "registry:ui",
    description: "Avatar with image and text fallback parts",
    files: [{ path: "ui/avatar.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-avatar@^0.8.0",
    ],
    tokens: ["muted", "muted-foreground"],
  },
  {
    name: "checkbox",
    type: "registry:ui",
    description: "Checkbox with checked, indeterminate, and disabled states",
    files: [{ path: "ui/checkbox.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-checkbox@^0.8.0",
    ],
    tokens: ["input", "primary", "primary-foreground"],
  },
  {
    name: "switch",
    type: "registry:ui",
    description: "Toggle switch with an animated thumb",
    files: [{ path: "ui/switch.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-switch@^0.8.0",
    ],
    tokens: ["primary", "input", "background"],
  },
  {
    name: "progress",
    type: "registry:ui",
    description: "Progress bar, determinate or indeterminate",
    files: [{ path: "ui/progress.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-progress@^0.8.0",
    ],
    tokens: ["secondary", "primary"],
  },
  {
    name: "slider",
    type: "registry:ui",
    description: "Slider with track, range fill, and draggable thumb",
    files: [{ path: "ui/slider.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-slider@^0.8.0",
    ],
    tokens: ["secondary", "primary", "background"],
  },
  {
    name: "toggle-group",
    type: "registry:ui",
    description: "Group of two-state buttons, single or multiple pressed",
    files: [{ path: "ui/toggle-group.tsx", type: "registry:ui" }],
    registryDependencies: ["utils", "text"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-toggle-group@^0.8.0",
    ],
    tokens: ["muted", "accent", "accent-foreground", "foreground"],
  },
  {
    name: "tabs",
    type: "registry:ui",
    description: "Tabs with list, triggers, and switched content panels",
    files: [{ path: "ui/tabs.tsx", type: "registry:ui" }],
    registryDependencies: ["utils", "text"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-tabs@^0.8.0",
    ],
    tokens: ["muted", "muted-foreground", "background", "foreground"],
  },
  {
    name: "accordion",
    type: "registry:ui",
    description: "Accordion with collapsible items, single or multiple open",
    files: [{ path: "ui/accordion.tsx", type: "registry:ui" }],
    registryDependencies: ["utils", "text"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-accordion@^0.8.0",
    ],
    tokens: ["border", "foreground", "muted-foreground"],
  },
  {
    name: "text-field",
    type: "registry:ui",
    description: "Single-line input with label, description, and message parts",
    files: [{ path: "ui/text-field.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-text-field@^0.8.0",
    ],
    tokens: ["input", "foreground", "muted-foreground", "ring", "destructive"],
  },
  {
    name: "textarea",
    type: "registry:ui",
    description: "Multi-line input that grows with its text",
    files: [{ path: "ui/textarea.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-textarea@^0.8.0",
    ],
    tokens: ["input", "foreground", "muted-foreground", "ring", "destructive"],
  },
  {
    name: "radio-group",
    type: "registry:ui",
    description: "Radio group where exactly one item is checked",
    files: [{ path: "ui/radio-group.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-radio-group@^0.8.0",
    ],
    tokens: ["input", "primary"],
  },
  {
    name: "scroll-area",
    type: "registry:ui",
    description: "Scroll container with a styled overlay scrollbar",
    files: [{ path: "ui/scroll-area.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: [
      "@facet-ui/react-variants@^0.1.1",
      "@lattice-ui/react-runtime@^0.8.0",
      "@lattice-ui/react-scroll-area@^0.8.0",
    ],
    tokens: ["border"],
  },
  {
    name: "alert",
    type: "registry:ui",
    description: "Alert with title and description parts, default or destructive",
    files: [{ path: "ui/alert.tsx", type: "registry:ui" }],
    registryDependencies: ["utils"],
    dependencies: ["@facet-ui/react-variants@^0.1.1", "@lattice-ui/react-runtime@^0.8.0"],
    tokens: ["card", "card-foreground", "border", "destructive", "muted-foreground"],
  },
]);
