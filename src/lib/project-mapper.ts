import type { Project, ProjectSummary } from '../types/project.js';
import type { ProjectRow } from '../db/schema.js';
import { normalizeBgClassPreset } from './project-bg-presets.js';

function parseTagsJson(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson) as unknown;
    if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return [];
}

export function rowToProjectSummary(row: ProjectRow): ProjectSummary {
  return {
    slug: row.slug,
    title: row.title,
    image: row.image,
    tags: parseTagsJson(row.tagsJson),
    bgClass: normalizeBgClassPreset(row.bgClass),
    imagePosition: row.imagePosition ?? undefined,
    featured: row.featured,
    sortOrder: row.sortOrder,
  };
}

export function rowToProject(row: ProjectRow): Project {
  const tags = parseTagsJson(row.tagsJson);

  let images: string[] | undefined;
  if (row.imagesJson) {
    try {
      const parsed = JSON.parse(row.imagesJson) as unknown;
      if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
        images = parsed;
      }
    } catch {
      images = undefined;
    }
  }

  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    longDescription: row.longDescription,
    image: row.image,
    tags,
    bgClass: normalizeBgClassPreset(row.bgClass),
    imagePosition: row.imagePosition ?? undefined,
    client: row.client ?? undefined,
    role: row.role ?? undefined,
    timeline: row.timeline ?? undefined,
    liveUrl: row.liveUrl ?? undefined,
    images,
    featured: row.featured,
    sortOrder: row.sortOrder,
  };
}

export function projectToInsertValues(
  p: Project,
  options: { featured: boolean; sortOrder: number },
) {
  return {
    slug: p.slug,
    title: p.title,
    description: p.description,
    longDescription: p.longDescription,
    image: p.image,
    tagsJson: JSON.stringify(p.tags),
    bgClass: normalizeBgClassPreset(p.bgClass),
    imagePosition: p.imagePosition ?? null,
    client: p.client ?? null,
    role: p.role ?? null,
    timeline: p.timeline ?? null,
    liveUrl: p.liveUrl ?? null,
    imagesJson: p.images?.length ? JSON.stringify(p.images) : null,
    featured: options.featured,
    sortOrder: options.sortOrder,
  };
}
