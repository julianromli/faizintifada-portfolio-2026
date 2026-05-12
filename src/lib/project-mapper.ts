import type { Project } from '../types/project';
import type { ProjectRow } from '../db/schema';

export function rowToProject(row: ProjectRow): Project {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tagsJson) as unknown;
    if (Array.isArray(parsed) && parsed.every((t) => typeof t === 'string')) {
      tags = parsed;
    }
  } catch {
    tags = [];
  }

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
    bgClass: row.bgClass,
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
    bgClass: p.bgClass,
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
