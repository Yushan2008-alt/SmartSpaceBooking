/**
 * Menghitung jam_selesai otomatis berdasarkan jam_mulai dan durasi_jam.
 * Contoh: '09:00' + 3 jam -> '12:00'
 */
export function calculateEndTime(jamMulai: string, durasiJam: number): string {
  const [hour, minute] = jamMulai.split(':').map(Number);
  const totalHours = hour + durasiJam;
  const formattedHour = String(totalHours).padStart(2, '0');
  const formattedMinute = String(minute).padStart(2, '0');
  return `${formattedHour}:${formattedMinute}`;
}
