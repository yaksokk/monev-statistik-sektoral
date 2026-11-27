-- Migrasi: item dokumen menjadi milik satu kegiatan (10 / 3 / 2).
-- Jalankan sekali di database yang sudah memakai skema setelah migrasi-hapus-tahap.sql
-- (item_dokumen masih 15 baris, urutan 1-15, tanpa kegiatan_id).
-- Database baru cukup memakai skema.sql dan data-awal.sql versi baru.
-- Backup dulu sebelum menjalankan.
--
-- Pemetaan: item 1-10 -> kegiatan pertama, 11-13 -> kedua, 14-15 -> ketiga
-- (kegiatan diurutkan menurut tanggal_mulai). Urutan dimulai dari 1 di tiap kegiatan.
-- Dokumen yang item-nya tidak cocok dengan kegiatannya dihapus dari tabel.
-- File di Storage tidak ikut terhapus; bersihkan lewat dashboard Supabase bila perlu.

begin;

do $$
begin
  if (select count(*) from kegiatan) <> 3 then
    raise exception 'Migrasi mengharapkan tepat 3 kegiatan, ditemukan %.', (select count(*) from kegiatan);
  end if;
  if (select count(*) from item_dokumen) <> 15 then
    raise exception 'Migrasi mengharapkan 15 item_dokumen, ditemukan %.', (select count(*) from item_dokumen);
  end if;
end $$;

-- ========== item_dokumen: tambah kegiatan_id ==========
alter table item_dokumen add column kegiatan_id uuid references kegiatan (id) on delete cascade;
alter table item_dokumen add column urutan_baru smallint;

update item_dokumen i
set kegiatan_id = m.kegiatan_id,
    urutan_baru = case m.rn when 1 then i.urutan
                            when 2 then i.urutan - 10
                            else i.urutan - 13 end
from (
  select i2.id as item_id, k.id as kegiatan_id, k.rn
  from item_dokumen i2
  join (
    select id, row_number() over (order by tanggal_mulai, id) as rn
    from kegiatan
  ) k on k.rn = case when i2.urutan <= 10 then 1
                     when i2.urutan <= 13 then 2
                     else 3 end
) m
where i.id = m.item_id;

alter table item_dokumen drop constraint if exists item_dokumen_urutan_key;
alter table item_dokumen drop constraint if exists item_dokumen_urutan_unik;
alter table item_dokumen drop column urutan;
alter table item_dokumen rename column urutan_baru to urutan;
alter table item_dokumen alter column urutan set not null;
alter table item_dokumen alter column kegiatan_id set not null;

alter table item_dokumen add constraint item_dokumen_kegiatan_urutan_unik unique (kegiatan_id, urutan);
alter table item_dokumen add constraint item_dokumen_id_kegiatan_unik unique (id, kegiatan_id);
create index if not exists item_dokumen_kegiatan_id_idx on item_dokumen (kegiatan_id);

-- ========== dokumen: buang yang tidak cocok, kunci pasangan item + kegiatan ==========
do $$
declare jumlah integer;
begin
  select count(*) into jumlah
  from dokumen d
  join item_dokumen i on i.id = d.item_id
  where i.kegiatan_id <> d.kegiatan_id;
  raise notice 'Dokumen tidak cocok item-kegiatan yang dihapus: %', jumlah;
end $$;

delete from dokumen d
using item_dokumen i
where i.id = d.item_id and i.kegiatan_id <> d.kegiatan_id;

alter table dokumen drop constraint if exists dokumen_item_id_fkey;
alter table dokumen add constraint dokumen_item_kegiatan_fkey
  foreign key (item_id, kegiatan_id)
  references item_dokumen (id, kegiatan_id) on delete cascade;

-- Cek hasil
select 'item_dokumen (total)' as tabel, count(*) as jumlah, 15 as seharusnya from item_dokumen
union all
select 'item ' || k.nama, count(i.id),
       case row_number() over (order by k.tanggal_mulai, k.id) when 1 then 10 when 2 then 3 else 2 end
from kegiatan k
left join item_dokumen i on i.kegiatan_id = k.id
group by k.id, k.nama, k.tanggal_mulai
union all
select 'dokumen tidak cocok', count(*), 0
from dokumen d join item_dokumen i on i.id = d.item_id
where i.kegiatan_id <> d.kegiatan_id;

commit;