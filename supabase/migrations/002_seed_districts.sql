-- HackMitra 31 Karnataka Districts Seed Migration
-- Table: public.districts

insert into public.districts (
  id, name, kannada_name, slug, headquarters, division, kdem_cluster,
  monitored_colleges_count, nain_centers_count, coverage_status, audit_frequency_hours
) values
  -- Belagavi Division (7)
  ('bagalkot', 'Bagalkot', 'ಬಾಗಲಕೋಟೆ', 'bagalkot', 'Bagalkote', 'Belagavi', 'Hubballi-Dharwad-Belagavi', 4, 1, 'verified_zero', 12),
  ('belagavi', 'Belagavi', 'ಬೆಳಗಾವಿ', 'belagavi', 'Belagavi', 'Belagavi', 'Hubballi-Dharwad-Belagavi', 9, 2, 'verified_active', 12),
  ('dharwad', 'Dharwad', 'ಧಾರವಾಡ', 'dharwad', 'Dharwad (Twin City: Hubballi)', 'Belagavi', 'Hubballi-Dharwad-Belagavi', 8, 2, 'verified_active', 12),
  ('gadag', 'Gadag', 'ಗದಗ', 'gadag', 'Gadag-Betageri', 'Belagavi', 'Hubballi-Dharwad-Belagavi', 3, 1, 'verified_zero', 12),
  ('haveri', 'Haveri', 'ಹಾವೇರಿ', 'haveri', 'Haveri', 'Belagavi', 'Hubballi-Dharwad-Belagavi', 3, 1, 'seeking_leads', 24),
  ('uttara-kannada', 'Uttara Kannada', 'ಉತ್ತರ ಕನ್ನಡ', 'uttara-kannada', 'Karwar', 'Belagavi', 'Mangaluru Coastal', 4, 1, 'verified_zero', 12),
  ('vijayapura', 'Vijayapura', 'ವಿಜಯಪುರ', 'vijayapura', 'Vijayapura (Bijapur)', 'Belagavi', 'Hubballi-Dharwad-Belagavi', 5, 1, 'verified_zero', 12),

  -- Kalaburagi Division (7)
  ('ballari', 'Ballari', 'ಬಳ್ಳಾರಿ', 'ballari', 'Ballari', 'Kalaburagi', 'Kalyana Karnataka', 5, 1, 'verified_zero', 12),
  ('bidar', 'Bidar', 'ಬೀದರ್', 'bidar', 'Bidar', 'Kalaburagi', 'Kalyana Karnataka', 4, 1, 'verified_zero', 12),
  ('kalaburagi', 'Kalaburagi', 'ಕಲಬುರಗಿ', 'kalaburagi', 'Kalaburagi (Gulbarga)', 'Kalaburagi', 'Kalyana Karnataka', 7, 2, 'verified_active', 12),
  ('koppal', 'Koppal', 'ಕೊಪ್ಪಳ', 'koppal', 'Koppal', 'Kalaburagi', 'Kalyana Karnataka', 2, 1, 'seeking_leads', 24),
  ('raichur', 'Raichur', 'ರಾಯಚೂರು', 'raichur', 'Raichur', 'Kalaburagi', 'Kalyana Karnataka', 4, 1, 'verified_zero', 12),
  ('vijayanagara', 'Vijayanagara', 'ವಿಜಯನಗರ', 'vijayanagara', 'Hosapete', 'Kalaburagi', 'Kalyana Karnataka', 3, 1, 'seeking_leads', 24),
  ('yadgir', 'Yadgir', 'ಯಾದಗಿರಿ', 'yadgir', 'Yadgir', 'Kalaburagi', 'Kalyana Karnataka', 2, 0, 'seeking_leads', 24),

  -- Mysuru Division (8)
  ('chamarajanagar', 'Chamarajanagar', 'ಚಾಮರಾಜನಗರ', 'chamarajanagar', 'Chamarajanagar', 'Mysuru', 'Mysuru Cluster', 2, 0, 'seeking_leads', 24),
  ('chikkamagaluru', 'Chikkamagaluru', 'ಚಿಕ್ಕಮಗಳೂರು', 'chikkamagaluru', 'Chikkamagaluru', 'Mysuru', 'Central Karnataka', 4, 1, 'verified_zero', 12),
  ('dakshina-kannada', 'Dakshina Kannada', 'ದಕ್ಷಿಣ ಕನ್ನಡ', 'dakshina-kannada', 'Mangaluru', 'Mysuru', 'Mangaluru Coastal', 12, 3, 'verified_active', 12),
  ('hassan', 'Hassan', 'ಹಾಸನ', 'hassan', 'Hassan', 'Mysuru', 'Mysuru Cluster', 5, 1, 'verified_zero', 12),
  ('kodagu', 'Kodagu', 'ಕೊಡಗು', 'kodagu', 'Madikeri', 'Mysuru', 'Mysuru Cluster', 2, 0, 'seeking_leads', 24),
  ('mandya', 'Mandya', 'ಮಂಡ್ಯ', 'mandya', 'Mandya', 'Mysuru', 'Mysuru Cluster', 4, 1, 'verified_zero', 12),
  ('mysuru', 'Mysuru', 'ಮೈಸೂರು', 'mysuru', 'Mysuru', 'Mysuru', 'Mysuru Cluster', 10, 3, 'verified_active', 12),
  ('udupi', 'Udupi', 'ಉಡುಪಿ', 'udupi', 'Udupi (Manipal)', 'Mysuru', 'Mangaluru Coastal', 6, 2, 'verified_active', 12),

  -- Bengaluru Division (9)
  ('bengaluru-rural', 'Bengaluru Rural', 'ಬೆಂಗಳೂರು ಗ್ರಾಮಾಂತರ', 'bengaluru-rural', 'Doddaballapura', 'Bengaluru', 'Bengaluru Urban', 5, 1, 'verified_zero', 12),
  ('bengaluru-urban', 'Bengaluru Urban', 'ಬೆಂಗಳೂರು ನಗರ', 'bengaluru-urban', 'Bengaluru', 'Bengaluru', 'Bengaluru Urban', 28, 6, 'verified_active', 12),
  ('chikkaballapura', 'Chikkaballapura', 'ಚಿಕ್ಕಬಳ್ಳಾಪುರ', 'chikkaballapura', 'Chikkaballapura', 'Bengaluru', 'Central Karnataka', 3, 1, 'verified_zero', 12),
  ('chitradurga', 'Chitradurga', 'ಚಿತ್ರದುರ್ಗ', 'chitradurga', 'Chitradurga', 'Bengaluru', 'Central Karnataka', 4, 1, 'verified_zero', 12),
  ('davanagere', 'Davanagere', 'ದಾವಣಗೆರೆ', 'davanagere', 'Davanagere', 'Bengaluru', 'Central Karnataka', 6, 1, 'verified_active', 12),
  ('kolar', 'Kolar', 'ಕೋಲಾರ', 'kolar', 'Kolar', 'Bengaluru', 'Central Karnataka', 3, 1, 'verified_zero', 12),
  ('ramanagara', 'Ramanagara', 'ರಾಮನಗರ', 'ramanagara', 'Ramanagara', 'Bengaluru', 'Bengaluru Urban', 4, 1, 'verified_zero', 12),
  ('shivamogga', 'Shivamogga', 'ಶಿವಮೊಗ್ಗ', 'shivamogga', 'Shivamogga (Shimoga)', 'Bengaluru', 'Central Karnataka', 5, 2, 'verified_active', 12),
  ('tumakuru', 'Tumakuru', 'ತುಮಕೂರು', 'tumakuru', 'Tumakuru (Tumkur)', 'Bengaluru', 'Central Karnataka', 6, 2, 'verified_zero', 12)
on conflict (id) do update set
  name = excluded.name,
  kannada_name = excluded.kannada_name,
  slug = excluded.slug,
  headquarters = excluded.headquarters,
  division = excluded.division,
  kdem_cluster = excluded.kdem_cluster,
  monitored_colleges_count = excluded.monitored_colleges_count,
  nain_centers_count = excluded.nain_centers_count,
  coverage_status = excluded.coverage_status,
  audit_frequency_hours = excluded.audit_frequency_hours,
  updated_at = now();
