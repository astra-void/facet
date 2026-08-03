export { type ClassValue as ClassName, cn } from "@facet-ui/react-variants";

// This file is yours once copied. `cn` is re-exported rather than reimplemented
// so upgrades stay cheap, but wrapping it here is a supported customization —
// project-wide class conventions belong in this file, not in each component.
//
// `ClassValue` is re-exported as `ClassName` on purpose: Vela inlines its
// runtime into every file it transforms, and that runtime declares its own
// local `ClassValue`. Importing the original name into a component would be a
// TS2440 name collision.
