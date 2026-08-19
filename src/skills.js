import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILLS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "skills");
const FRONTMATTER_PATTERN = /^---\n([\s\S]*?)\n---\n?/;

/**
 * Parses the leading `---` frontmatter block of a markdown document.
 * Only flat `key: value` pairs are supported, which is all the skill
 * format needs. Returns the fields plus the remaining markdown body.
 */
const parseFrontmatter = (raw) => {
  const match = raw.match(FRONTMATTER_PATTERN);
  if (!match) return { fields: {}, body: raw.trim() };

  const fields = match[1].split("\n").reduce((acc, line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return acc;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!key) return acc;
    return { ...acc, [key]: value };
  }, {});

  return { fields, body: raw.slice(match[0].length).trim() };
};

const toSkill = (filename, raw) => {
  const { fields, body } = parseFrontmatter(raw);
  const fallbackId = filename.replace(/\.md$/, "");
  return {
    id: fields.id || fallbackId,
    title: fields.title || fallbackId,
    description: fields.description || "",
    body,
  };
};

/**
 * Reads every markdown skill from disk. Called per request so that
 * dropping a new file into skills/ takes effect without a restart.
 */
export const loadSkills = async () => {
  const entries = await readdir(SKILLS_DIR);
  const markdownFiles = entries.filter((name) => name.endsWith(".md")).sort();

  const skills = await Promise.all(
    markdownFiles.map(async (filename) => {
      const raw = await readFile(join(SKILLS_DIR, filename), "utf8");
      return toSkill(filename, raw);
    }),
  );

  return skills;
};

/**
 * Case-insensitive substring match across id, title, and description.
 * An empty query returns everything, which makes the tool useful for
 * discovery as well as lookup.
 */
export const searchSkills = (skills, query) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return skills;

  return skills.filter((skill) =>
    [skill.id, skill.title, skill.description]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
};

export const findSkillById = (skills, id) =>
  skills.find((skill) => skill.id === id) || null;
