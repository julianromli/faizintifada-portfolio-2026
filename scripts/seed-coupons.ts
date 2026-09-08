import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { getDb } from '../src/db/client';
import { coupons as couponsTable } from '../src/db/schema';
import { couponToInsertValues } from '../src/lib/coupon-mapper';
import { seedCoupons } from '../src/data/coupons';

async function main() {
  const db = getDb();

  for (const item of seedCoupons) {
    const values = couponToInsertValues(item);
    const existing = await db
      .select({ id: couponsTable.id })
      .from(couponsTable)
      .where(eq(couponsTable.code, values.code))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(couponsTable)
        .set({
          code: values.code,
          discountType: values.discountType,
          discountValue: values.discountValue,
          active: values.active,
          expiresAt: values.expiresAt,
        })
        .where(eq(couponsTable.id, existing[0]!.id));
    } else {
      await db.insert(couponsTable).values(values);
    }

    console.log(`${values.code}: ${values.discountValue}% off (${values.active ? 'active' : 'inactive'})`);
  }

  console.log(`Seeded ${seedCoupons.length} coupon(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
