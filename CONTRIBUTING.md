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
   Pengecualian untuk PR tugas kuliah: lihat "Aturan Tugas Kelompok" di bawah
   (merge commit, branch jangan dihapus).
6. PR tertinggal dari `master`? Klik **Update branch** di halaman PR GitHub.

## Aturan Tugas Kelompok (materi kuliah)

Setiap pertemuan ada materi yang sama dan setiap anggota wajib praktik.
Yang dinilai dosen adalah **partisipasi tiap anggota di tiap materi**
(bukan siapa yang di-merge), sedangkan ketua kelompok memilih **satu versi
terbaik** untuk di-merge ke `master`. Aturan berikut melengkapi alur di atas.

1. **Satu orang satu branch per materi.** Format:
   ```bash
   git checkout -b nama/fitur/materi   # contoh: bowo/fitur/auth
   ```
   Jangan push ke branch orang lain, jangan force-push ke branch orang lain.
2. **Definisi "mencoba".** Setiap branch materi wajib berisi:
   - Minimal 3–4 commit atomik mengikuti progres sub-materi
     (bukan satu commit besar di akhir),
   - Commit dari akun git masing-masing (`git config user.name` /
     `user.email` wajib milik sendiri),
   - 1 PR ke `master` (draft/WIP boleh) dengan template:
     spek materi, yang sudah jalan, yang belum jalan,
     hasil `bunx tsc --noEmit` + `bunx jest`.
3. **Merge PR tugas: merge commit, bukan squash.** Riwayat commit per orang
   harus utuh agar jejak kontribusi tiap anggota terbaca.
   (PR non-tugas tetap squash sesuai alur harian.)
4. **Branch yang tidak terpilih jangan dihapus** sampai nilai keluar —
   branch + commit + PR tersebut adalah bukti kontribusi ke dosen.
5. **Peran ketua kelompok:**
   - Bandingkan PR tiap anggota secara adil (kode + hasil uji jalan),
   - Merge 1 versi terbaik ke `master`,
   - Lindungi branch yang kalah (jangan dihapus, jangan di-squash),
   - Bantu anggota yang stuck sampai bisa push versinya sendiri —
     versi belum sempurna tetap sah sebagai bukti mencoba dan tidak
     merusak `master` karena yang di-merge tetap versi terbaik.

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
