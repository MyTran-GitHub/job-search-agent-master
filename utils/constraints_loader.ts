import { parse as parseYaml } from "yaml";
import type { Constraints } from "./schema_validator.js";
import { ConstraintsSchema } from "./schema_validator.js";
import { parseYamlFrontmatter } from "./fs_helpers.js";

export async function loadConstraints(content: string): Promise<Constraints> {
  const yaml = parseYamlFrontmatter(content);

  // If simple parser got nested objects wrong, try full YAML block parse
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    try {
      const parsed = parseYaml(match[1]) as Record<string, unknown>;
      if (parsed && typeof parsed.visa === "object") {
        return ConstraintsSchema.parse(parsed);
      }
    } catch {
      // fall through
    }
  }

  return ConstraintsSchema.parse(yaml);
}
