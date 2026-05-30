import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import { projects } from '../src/db/schema';

/** Multi-paragraph case studies (\n\n) for ProjectDetail split rendering. */
const updates: Record<
  string,
  {
    longDescription: string;
    description?: string;
    client?: string;
    role?: string;
    timeline?: string;
  }
> = {
  isometricon: {
    description:
      'AI-powered 3D icon generator with pay-as-you-go billing for designers and product teams.',
    longDescription: `Isometricon is an AI-powered 3D icon generator for designers and developers who need production-ready assets without a full 3D pipeline. Users describe what they need in plain language and receive stylized isometric icons ready for product UI, marketing, and presentations.

As CTO, I led the full product stack — from the Next.js application and billing (Polar, Mayar) to generation pipelines powered by Fal.ai, Gemini, and Replicate. Storage runs on Cloudflare R2 with Supabase and Clerk for auth and data. The model is pay-as-you-go so teams generate on demand without paying for unused subscription capacity.

The goal was speed without sacrificing craft: a fast generation flow, consistent visual style across outputs, and infrastructure that scales with real usage instead of fixed overhead.`,
    client: 'Isometricon',
    role: 'CTO & Product Lead',
    timeline: '2024 – Present',
  },
  'absenin-id': {
    description:
      'Digital attendance platform with QR and Face ID verification, location lock, and a full HR dashboard.',
    client: 'Absenin.id',
    role: 'Full-Stack Developer',
    timeline: '2025 – Present',
    longDescription: `Absenin.id is a digital attendance platform for teams that need more than a simple check-in. Employees verify presence through QR codes or Face ID, with location lock so check-ins only count when someone is on site. HR gets a real-time dashboard to track attendance, exceptions, and team coverage.

I built the product end-to-end — UI on Next.js, backend on Convex, authentication with Clerk, and face matching through AWS Rekognition. Mobile-first flows were a priority: check-in had to feel fast on a phone, while employers still get trustworthy, auditable records.

The result replaces manual logs and informal messaging with a system teams can run daily without friction — accurate presence data employers can trust.`,
  },
  'voucher-kalanaraspa': {
    description:
      'E-commerce voucher site for purchasing and redeeming Kalanara Spa service packages online.',
    client: 'Kalanara Spa',
    role: 'Design & Development',
    timeline: '2025',
    longDescription: `Kalanara Spa needed a straightforward way for customers to buy service vouchers online — browse packages, pay digitally, and redeem at the spa without phone back-and-forth.

I designed and built the voucher website around that flow: clear service listings, a simple purchase path, and branding aligned with a wellness business rather than a generic template store.

The site at voucher.kalanaraspa.com gives the spa an owned digital channel for promotions and prepaid packages, separate from walk-in-only bookings.`,
  },
};

async function main() {
  const db = getDb();

  for (const [slug, patch] of Object.entries(updates)) {
    const result = await db
      .update(projects)
      .set(patch)
      .where(eq(projects.slug, slug))
      .returning({ slug: projects.slug, title: projects.title });

    if (result.length === 0) {
      console.warn(`  skip: slug not found — ${slug}`);
    } else {
      console.log(`  updated: ${slug}`);
    }
  }

  console.log('Case study copy update complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
