import { facetTheme } from "@facet-ui/theme";
import { defineConfig } from "vela-rbxts";

export default defineConfig({
  theme: {
    extend: {
      ...facetTheme({ base: "zinc", mode: "dark" }),
    },
  },
});
