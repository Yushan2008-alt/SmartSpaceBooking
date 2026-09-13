-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('member', 'admin_space');

-- CreateEnum
CREATE TYPE "SpaceTipe" AS ENUM ('desk', 'meeting_room', 'private_office');

-- CreateEnum
CREATE TYPE "ReservasiStatus" AS ENUM ('belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan');

-- CreateTable
CREATE TABLE "app_maker" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "app_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_maker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'member',
    "maker_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nama_member" TEXT NOT NULL,
    "instansi" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "telp" TEXT NOT NULL,
    "foto" TEXT,
    "maker_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space_owner" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "nama_coworking" TEXT NOT NULL,
    "nama_pemilik" TEXT NOT NULL,
    "telp" TEXT NOT NULL,
    "maker_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "space" (
    "id" SERIAL NOT NULL,
    "nama_space" TEXT NOT NULL,
    "harga_per_jam" INTEGER NOT NULL,
    "tipe" "SpaceTipe" NOT NULL,
    "kapasitas" INTEGER NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "foto" TEXT,
    "maker_id" INTEGER NOT NULL,
    "space_owner_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "space_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diskon" (
    "id" SERIAL NOT NULL,
    "nama_diskon" TEXT NOT NULL,
    "persentase_diskon" INTEGER NOT NULL,
    "tanggal_awal" TIMESTAMP(3) NOT NULL,
    "tanggal_akhir" TIMESTAMP(3) NOT NULL,
    "maker_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diskon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservasi" (
    "id" SERIAL NOT NULL,
    "kode_booking" TEXT NOT NULL,
    "id_member" INTEGER NOT NULL,
    "id_space" INTEGER NOT NULL,
    "id_diskon" INTEGER,
    "tanggal_reservasi" DATE NOT NULL,
    "jam_mulai" TEXT NOT NULL,
    "jam_selesai" TEXT NOT NULL,
    "durasi_jam" INTEGER NOT NULL,
    "harga_per_jam" INTEGER NOT NULL,
    "total_harga_awal" INTEGER NOT NULL,
    "potongan_diskon" INTEGER NOT NULL DEFAULT 0,
    "total_bayar" INTEGER NOT NULL,
    "status" "ReservasiStatus" NOT NULL DEFAULT 'belum_dikonfirm',
    "maker_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detail_reservasi" (
    "id" SERIAL NOT NULL,
    "id_reservasi" INTEGER NOT NULL,
    "id_space" INTEGER NOT NULL,
    "id_diskon" INTEGER,
    "total_harga" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "detail_reservasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_maker_username_key" ON "app_maker"("username");

-- CreateIndex
CREATE UNIQUE INDEX "app_maker_email_key" ON "app_maker"("email");

-- CreateIndex
CREATE UNIQUE INDEX "app_maker_app_key_key" ON "app_maker"("app_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_maker_id_key" ON "users"("username", "maker_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_user_id_key" ON "member"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "space_owner_user_id_key" ON "space_owner"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "diskon_nama_diskon_maker_id_key" ON "diskon"("nama_diskon", "maker_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservasi_kode_booking_key" ON "reservasi"("kode_booking");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "app_maker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "app_maker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_owner" ADD CONSTRAINT "space_owner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space_owner" ADD CONSTRAINT "space_owner_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "app_maker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space" ADD CONSTRAINT "space_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "app_maker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "space" ADD CONSTRAINT "space_space_owner_id_fkey" FOREIGN KEY ("space_owner_id") REFERENCES "space_owner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diskon" ADD CONSTRAINT "diskon_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "app_maker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_id_member_fkey" FOREIGN KEY ("id_member") REFERENCES "member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_id_space_fkey" FOREIGN KEY ("id_space") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_id_diskon_fkey" FOREIGN KEY ("id_diskon") REFERENCES "diskon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservasi" ADD CONSTRAINT "reservasi_maker_id_fkey" FOREIGN KEY ("maker_id") REFERENCES "app_maker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_reservasi" ADD CONSTRAINT "detail_reservasi_id_reservasi_fkey" FOREIGN KEY ("id_reservasi") REFERENCES "reservasi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_reservasi" ADD CONSTRAINT "detail_reservasi_id_space_fkey" FOREIGN KEY ("id_space") REFERENCES "space"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detail_reservasi" ADD CONSTRAINT "detail_reservasi_id_diskon_fkey" FOREIGN KEY ("id_diskon") REFERENCES "diskon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

