insert into public.translations (locale, key, value, created_at, updated_at)
values
  ('en', 'dock-pagebuilder', 'Page Builder', now(), now()),
  ('pl', 'dock-pagebuilder', 'Kreator stron', now(), now()),
  ('vn', 'dock-pagebuilder', 'Trình tạo trang', now(), now())
on conflict (locale, key)
do update set value = excluded.value, updated_at = now();
