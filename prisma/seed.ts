import { PrismaClient, Role, SpaceTipe } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Resilient connection string handling for local DNS
const rawUrl = process.env.DATABASE_URL || '';
const dbUrl = rawUrl.includes('aws-0-ap-southeast-1.pooler.supabase.com') && !process.env.VERCEL
  ? rawUrl.replace('aws-0-ap-southeast-1.pooler.supabase.com:6543', '52.77.146.31:5432') + '&sslaccept=accept_invalid_certs'
  : rawUrl;

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function main() {
  console.log('🌱 Starting database seeding...');

  const hashedAdminPassword = await bcrypt.hash('Admin123!', 10);
  const hashedMemberPassword = await bcrypt.hash('Secret123!', 10);

  // 1. Seed Admin Space User & SpaceOwner
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin_moklet' },
    update: {},
    create: {
      username: 'admin_moklet',
      password: hashedAdminPassword,
      role: Role.admin_space,
      spaceOwner: {
        create: {
          nama_coworking: 'Moklet Hub Coworking Space',
          nama_pemilik: 'Ahmad Bidin, S.Kom',
          telp: '081298765432',
        },
      },
    },
    include: {
      spaceOwner: true,
    },
  });
  console.log(`✅ Admin Space created: ${adminUser.username} (${adminUser.spaceOwner?.nama_coworking})`);

  // 2. Seed Spaces
  const space1 = await prisma.space.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nama_space: 'Personal Desk Alpha 01',
      harga_per_jam: 25000,
      tipe: SpaceTipe.desk,
      kapasitas: 1,
      deskripsi: 'WiFi 100Mbps, Stopkontak individual, Free flow coffee & tea',
      foto: 'desk_alpha_01.jpg',
      space_owner_id: adminUser.spaceOwner?.id,
    },
  });

  const space2 = await prisma.space.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nama_space: 'Meeting Room Platinum',
      harga_per_jam: 100000,
      tipe: SpaceTipe.meeting_room,
      kapasitas: 8,
      deskripsi: 'Smart TV 55 Inch, Whiteboard, Video Conference System, AC',
      foto: 'meeting_platinum.jpg',
      space_owner_id: adminUser.spaceOwner?.id,
    },
  });
  console.log(`✅ Spaces created: ${space1.nama_space}, ${space2.nama_space}`);

  // 3. Seed Member User & Profile
  const memberUser = await prisma.user.upsert({
    where: { username: 'johndoe' },
    update: {},
    create: {
      username: 'johndoe',
      password: hashedMemberPassword,
      role: Role.member,
      member: {
        create: {
          nama_member: 'John Doe',
          instansi: 'SMK Telkom Malang',
          alamat: 'Jl. Danau Ranau No. 1, Sawojajar, Malang',
          telp: '081234567890',
          foto: 'member_john.jpg',
        },
      },
    },
    include: {
      member: true,
    },
  });
  console.log(`✅ Member created: ${memberUser.username} (${memberUser.member?.nama_member})`);

  // 4. Seed Diskon / Promo
  const diskon = await prisma.diskon.upsert({
    where: { nama_diskon: 'DISKONHEMAT20' },
    update: {},
    create: {
      nama_diskon: 'DISKONHEMAT20',
      persentase_diskon: 20,
      tanggal_awal: new Date('2026-01-01T00:00:00Z'),
      tanggal_akhir: new Date('2026-12-31T23:59:59Z'),
    },
  });
  console.log(`✅ Promo created: ${diskon.nama_diskon} (${diskon.persentase_diskon}%)`);

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
