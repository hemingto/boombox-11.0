import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface StorageUnitRow {
  storageUnitNumber: string;
  barcode: string;
  status: string;
}

async function seedStorageUnits() {
  try {
    console.log('🚀 Starting storage unit seeding...');

    // Read the CSV file
    const csvPath = '/Users/calvinhemington/Downloads/Boomboxes (1-160) - Storage Unit Upload (4).csv';
    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    // Parse CSV
    const records: StorageUnitRow[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`📄 Found ${records.length} storage units in CSV`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const record of records) {
      const { storageUnitNumber, barcode, status } = record;

      // Check if storage unit already exists
      const existingUnit = await prisma.storageUnit.findUnique({
        where: { storageUnitNumber },
      });

      if (existingUnit) {
        // Update existing unit
        await prisma.storageUnit.update({
          where: { storageUnitNumber },
          data: {
            status,
            barcode: barcode || null,
            cleaningPhotos: [],
            lastCleanedAt: null,
          },
        });
        updated++;
        console.log(`✏️  Updated: ${storageUnitNumber} (${status})`);
      } else {
        // Create new unit
        await prisma.storageUnit.create({
          data: {
            storageUnitNumber,
            barcode: barcode || null,
            status,
            cleaningPhotos: [],
            lastCleanedAt: null,
          },
        });
        created++;
        console.log(`✅ Created: ${storageUnitNumber} (${status})`);
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ✏️  Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('✨ Storage unit seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding storage units:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedStorageUnits()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

