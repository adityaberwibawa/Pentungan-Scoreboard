# Berkontribusi di PentungScore

Repo ini hanya berisi proyek Expo (root = `package.json`, `src/`, `app.json`).
Alur kerja: **branch + pull request (PR)**. Tidak ada push langsung ke `master`
(`master` diproteksi dan selalu dalam kondisi bisa jalan).

## Alur kerja harian

1. Mulai dari yang terbaru:
   ```bash
   git checkout master && git pull
   ```
2. Buat branch kerja (satu branch = satu tugas kecil, 1–3 hari):
   ```bash
   git checkout -b fitur/nama-tugas   # fitur baru
   git checkout -b fix/nama-tugas     # perbaikan bug
   git checkout -b test/nama-tugas    # test / tooling
   ```
3. Kerja + commit kecil-kecil dengan format pesan:
   ```
   tipe: deskripsi singkat
   ```
   Tipe: `fitur`, `fix`, `test`, `rapi` (refactor/bersih-bersih), `dok` (dokumentasi).
   Contoh: `fitur: tambah pencarian game`, `fix: perbaiki total skor minus`.
4. Push branch dan buka PR ke `master`:
   ```bash
   git push -u origin fitur/nama-tugas
   ```
   Di halaman PR tulis: apa yang diubah + cara menguji.
5. Minta review rekan → setelah **Approve**, merge dengan **Squash and merge**
   (riwayat `master` tetap satu baris rapi per fitur) → hapus branch.
6. PR tertinggal dari `master`? Klik **Update branch** di halaman PR GitHub.

## Sebelum buka PR (wajib lolos, dari root repo)

```bash
bunx tsc --noEmit   # typecheck bersih
bunx jest           # semua test lolos
```

## Yang tidak boleh di-commit

- `node_modules/`, `dist/`, `.expo/`, file `*.log`
- File `.env` / API key / token / kredensial apa pun
- File di luar proyek app (mockup, PRD, aset mentah) — repo ini app-only
- File biner besar (video, zip)

## Menjalankan app

```bash
bun install         # install dependensi (sekali saja / tiap ganti branch)
bunx expo start     # scan QR dengan Expo Go, atau tekan a untuk Android
```

## Menyelesaikan konflik

Bila PR bentrok dengan `master`, Git menandai bagian `<<<<<<<` di file.
Buka file, pilih versi yang benar (atau gabungkan), lalu:

```bash
git add <file>
git commit
git push
```

PR otomatis ikut ter-update. Kalau ragu, panggil rekan untuk review bareng —
jangan force-push ke branch orang lain.
