/**
 * Seed script: populates the database with comprehensive NCPOR sample data.
 * All records are clearly sample data. No invented statistics.
 * Run: node prisma/seed.js
 */
const { getDb, saveDb } = require('../src/config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const db = await getDb();
  console.log('Seeding database with comprehensive demo data...');

  // Clear existing data
  const tables = [
    'notifications', 'pending_changes', 'audit_log', 'dataset_download_log', 'scheduled_posts', 'generated_content',
    'question_submissions', 'glossary_terms', 'education_resources', 'events',
    'news_articles', 'media_tags', 'tags', 'media_items', 'albums',
    'expedition_members', 'publications', 'datasets', 'expeditions', 'stations', 'users'
  ];

  tables.forEach(t => db.run(`DELETE FROM ${t}`));

  // ─── USERS ───────────────────────────────────────────────
  const hashedPw = await bcrypt.hash('password123', 12);
  const users = {
    admin: uuidv4(),
    editor: uuidv4(),
    outreach: uuidv4(),
    contributor1: uuidv4(),
    contributor2: uuidv4(),
    reviewer: uuidv4(),
  };

  const userList = [
    [users.admin, 'admin@ncpor.gov.in', hashedPw, 'Dr. Ravichandran M.', 'ADMIN'],
    [users.editor, 'editor@ncpor.gov.in', hashedPw, 'Dr. Thamban Meloth', 'EDITOR'],
    [users.outreach, 'outreach@ncpor.gov.in', hashedPw, 'Priya Sharma', 'EDITOR'],
    [users.contributor1, 'contributor@ncpor.gov.in', hashedPw, 'Dr. Rahul Mohan', 'EDITOR'],
    [users.contributor2, 'scientist@ncpor.gov.in', hashedPw, 'Dr. Anoop Mahajan', 'EDITOR'],
    [users.reviewer, 'media@ncpor.gov.in', hashedPw, 'Sanjay Kumar', 'MEDIA'],
  ];
  userList.forEach(u => db.run('INSERT INTO users (id,email,password,name,role) VALUES (?,?,?,?,?)', u));

  // ─── STATIONS ────────────────────────────────────────────
  const stations = {
    himadri: uuidv4(),
    bharati: uuidv4(),
    maitri: uuidv4(),
    himansh: uuidv4(),
  };

  const stationList = [
    [stations.himadri, 'Himadri', 'हिमाद्री', 'Ny-Alesund, Svalbard, Norway', 'ARCTIC', 78.9256, 11.9384,
      'India\'s Arctic research station, established in 2008 at the International Arctic Research Base in Ny-Alesund, Svalbard. The station supports year-round research in atmospheric science, glaciology, and marine biology in the Kongsfjorden region.',
      'भारत का आर्कटिक अनुसंधान स्टेशन, 2008 में न्यू-ऑलेसुंड, स्वालबार्ड में स्थापित।', 2008, 'ACTIVE'],
    [stations.bharati, 'Bharati', 'भारती', 'Larsemann Hills, East Antarctica', 'ANTARCTIC', -69.4077, 76.1877,
      'India\'s newest Antarctic research station, commissioned in 2012 at Larsemann Hills. A state-of-the-art facility designed for year-round operations in one of the most extreme environments on Earth.',
      'भारत का नवीनतम अंटार्कटिक अनुसंधान स्टेशन, 2012 में लार्सेमन हिल्स में चालू।', 2012, 'ACTIVE'],
    [stations.maitri, 'Maitri', 'मैत्री', 'Schirmacher Oasis, East Antarctica', 'ANTARCTIC', -70.7667, 11.7333,
      'India\'s first permanent Antarctic research station, established in 1989 at the Schirmacher Oasis. Maitri has been the primary base for Indian scientific expeditions to Antarctica for over three decades.',
      'भारत का पहला स्थायी अंटार्कटिक अनुसंधान स्टेशन, 1989 में स्थापित।', 1989, 'ACTIVE'],
    [stations.himansh, 'Himansh', 'हिमांश', 'Spiti Valley, Himachal Pradesh, India', 'HIMALAYA', 32.7767, 78.0081,
      'India\'s high-altitude cryosphere research station in the western Himalaya, established in 2016 at an elevation of approximately 4,000 metres above sea level in the Spiti Valley.',
      'भारत का उच्च ऊंचाई वाला क्रायोस्फीयर अनुसंधान स्टेशन, 2016 में स्पिती घाटी में स्थापित।', 2016, 'ACTIVE'],
  ];
  stationList.forEach(s => db.run(
    'INSERT INTO stations (id,name,name_hi,location,region,latitude,longitude,description,description_hi,established_year,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)', s
  ));

  // ─── EXPEDITIONS ─────────────────────────────────────────
  const exps = {};
  const expList = [
    { key: 'isea43', title: '43rd Indian Scientific Expedition to Antarctica (ISEA-43)', title_hi: '43वां भारतीय अंटार्कटिक वैज्ञानिक अभियान', slug: 'isea-43',
      summary: 'Multi-disciplinary research expedition at Bharati and Maitri stations covering atmospheric sciences, glaciology, geology, and marine biology.',
      summary_hi: '43वें भारतीय अंटार्कटिक वैज्ञानिक अभियान ने भारती और मैत्री स्टेशनों पर बहु-विषयक अनुसंधान किया।',
      description: 'The 43rd Indian Scientific Expedition to Antarctica deployed teams at both Bharati and Maitri stations for comprehensive research. Key activities included ice core drilling, atmospheric aerosol monitoring, geological mapping of the Larsemann Hills region, and marine biodiversity assessments in coastal Antarctic waters. The expedition team comprised scientists from multiple Indian research institutions.',
      region: 'ANTARCTIC', station: stations.bharati, start: '2023-11-01', end: '2024-04-15', year: 2023, status: 'PUBLISHED', expStatus: 'COMPLETED',
      objectives: 'Ice core drilling and paleoclimate reconstruction; Atmospheric aerosol optical depth monitoring; Geological mapping of Larsemann Hills; Marine biodiversity assessment in coastal waters; Meteorological observations and weather forecasting',
      createdBy: users.editor },
    { key: 'isea42', title: '42nd Indian Scientific Expedition to Antarctica (ISEA-42)', title_hi: '42वां भारतीय अंटार्कटिक वैज्ञानिक अभियान', slug: 'isea-42',
      summary: 'Research expedition focused on atmospheric chemistry, seismology and ice sheet dynamics at Indian Antarctic stations.',
      summary_hi: '42वें अभियान ने वायुमंडलीय रसायन विज्ञान और हिमचादर गतिकी पर ध्यान केंद्रित किया।',
      description: 'The 42nd ISEA continued long-term monitoring programmes while initiating new research into ice sheet dynamics using GPS-based measurements. The expedition also carried out maintenance and upgrade work at both stations.',
      region: 'ANTARCTIC', station: stations.maitri, start: '2022-11-15', end: '2023-04-10', year: 2022, status: 'PUBLISHED', expStatus: 'COMPLETED',
      objectives: 'Ice sheet GPS monitoring; Seismic network maintenance; Atmospheric trace gas sampling; Station infrastructure upgrades',
      createdBy: users.editor },
    { key: 'arctic2024', title: 'Arctic Summer Research Campaign 2024', title_hi: 'आर्कटिक ग्रीष्मकालीन अनुसंधान अभियान 2024', slug: 'arctic-summer-2024',
      summary: 'Summer research campaign at Himadri station focusing on glacier mass balance, atmospheric black carbon, and Kongsfjorden marine ecology.',
      summary_hi: 'हिमाद्री स्टेशन पर ग्रीष्मकालीन अनुसंधान अभियान।',
      description: 'The 2024 Arctic summer campaign at Himadri station in Ny-Alesund involved multi-disciplinary research including glacier mass balance measurements on nearby glaciers, atmospheric black carbon and aerosol monitoring, Kongsfjorden marine ecosystem studies, and retrieval of data from the IndARC mooring system deployed in the fjord.',
      region: 'ARCTIC', station: stations.himadri, start: '2024-06-01', end: '2024-09-30', year: 2024, status: 'PUBLISHED', expStatus: 'COMPLETED',
      objectives: 'Glacier mass balance measurements; Atmospheric black carbon monitoring; Kongsfjorden marine ecosystem study; IndARC mooring data retrieval; Permafrost active layer monitoring',
      createdBy: users.editor },
    { key: 'arctic2023', title: 'Arctic Research Campaign 2023', title_hi: 'आर्कटिक अनुसंधान अभियान 2023', slug: 'arctic-2023',
      summary: 'Research campaign at Himadri focusing on Arctic amplification, snow chemistry, and fjord water column profiling.',
      summary_hi: 'हिमाद्री स्टेशन पर आर्कटिक प्रवर्धन पर अनुसंधान अभियान।',
      description: 'The 2023 Arctic campaign studied the phenomenon of Arctic amplification through coordinated atmospheric and surface observations at Himadri station.',
      region: 'ARCTIC', station: stations.himadri, start: '2023-05-15', end: '2023-09-20', year: 2023, status: 'PUBLISHED', expStatus: 'COMPLETED',
      objectives: 'Arctic amplification monitoring; Snow chemistry analysis; Fjord water column profiling; UV radiation measurements',
      createdBy: users.contributor1 },
    { key: 'himalaya2024', title: 'Himalayan Cryosphere Monitoring Programme 2024', title_hi: 'हिमालयी क्रायोस्फीयर निगरानी कार्यक्रम 2024', slug: 'himalaya-cryo-2024',
      summary: 'Year-round glacier and permafrost monitoring at Himansh station in the Spiti Valley of the western Himalaya.',
      summary_hi: 'स्पिती घाटी में हिमांश स्टेशन पर वर्षभर हिमनद और स्थायी तुषार निगरानी।',
      description: 'The Himalayan Cryosphere Monitoring Programme operates from the Himansh station and conducts long-term observations of glacier retreat, snow cover dynamics, permafrost temperature profiles, and hydrological runoff patterns in the Spiti Valley. The programme contributes to understanding the impacts of climate change on Himalayan water resources.',
      region: 'HIMALAYA', station: stations.himansh, start: '2024-03-01', end: '2024-11-30', year: 2024, status: 'PUBLISHED', expStatus: 'ONGOING',
      objectives: 'Glacier mass balance and retreat monitoring; Snow albedo measurements; Permafrost temperature profiling; Hydrological runoff quantification; Automatic weather station data collection',
      createdBy: users.contributor1 },
    { key: 'so2024', title: 'Southern Ocean Expedition 2024', title_hi: 'दक्षिणी महासागर अभियान 2024', slug: 'southern-ocean-2024',
      summary: 'Oceanographic expedition in the Indian sector of the Southern Ocean studying water mass circulation, biological productivity, and carbon cycling.',
      summary_hi: 'दक्षिणी महासागर के भारतीय क्षेत्र में समुद्रविज्ञान अभियान।',
      description: 'The Southern Ocean Expedition 2024 conducted comprehensive oceanographic surveys in the Indian sector, deploying CTD profiles, collecting water and sediment samples, and conducting biological net tows to study the role of the Southern Ocean in global carbon cycling and climate regulation.',
      region: 'SOUTHERN_OCEAN', station: null, start: '2024-01-10', end: '2024-03-25', year: 2024, status: 'PUBLISHED', expStatus: 'COMPLETED',
      objectives: 'CTD profiling across the Indian sector; Water mass circulation analysis; Phytoplankton productivity measurements; Carbon flux estimations; Sediment core collection',
      createdBy: users.editor },
    { key: 'isea44', title: '44th Indian Scientific Expedition to Antarctica (ISEA-44)', title_hi: '44वां भारतीय अंटार्कटिक वैज्ञानिक अभियान', slug: 'isea-44',
      summary: 'Upcoming expedition planned for the 2024-25 austral summer season at Bharati and Maitri stations.',
      summary_hi: '2024-25 ऑस्ट्रल ग्रीष्म ऋतु के लिए नियोजित आगामी अभियान।',
      description: 'The 44th ISEA is being planned with expanded research programmes including deep ice core drilling, establishment of new automatic weather stations, and enhanced marine biology surveys.',
      region: 'ANTARCTIC', station: stations.bharati, start: '2024-11-01', end: '2025-04-15', year: 2024, status: 'PUBLISHED', expStatus: 'PLANNED',
      objectives: 'Deep ice core drilling; New AWS deployment; Enhanced marine surveys; Microplastic monitoring; Geodetic measurements',
      createdBy: users.editor },
  ];

  for (const e of expList) {
    const id = uuidv4();
    exps[e.key] = id;
    db.run(`INSERT INTO expeditions (id,title,title_hi,slug,summary,summary_hi,description,description_hi,region,station_id,start_date,end_date,year,status,expedition_status,objectives,objectives_hi,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, e.title, e.title_hi, e.slug, e.summary, e.summary_hi, e.description, null, e.region, e.station, e.start, e.end, e.year, e.status, e.expStatus, e.objectives, null, e.createdBy]);
  }

  // ─── EXPEDITION MEMBERS ──────────────────────────────────
  const members = [
    [uuidv4(), exps.isea43, 'Dr. Thamban Meloth', 'Expedition Leader', 'NCPOR'],
    [uuidv4(), exps.isea43, 'Dr. Anoop Mahajan', 'Atmospheric Scientist', 'IITM Pune'],
    [uuidv4(), exps.isea43, 'Dr. Rahul Mohan', 'Marine Biologist', 'NCPOR'],
    [uuidv4(), exps.isea43, 'Sanjay Kumar', 'Geologist', 'NCPOR'],
    [uuidv4(), exps.isea43, 'Priya Sharma', 'Glaciologist', 'WIHG Dehradun'],
    [uuidv4(), exps.arctic2024, 'Dr. Anoop Mahajan', 'Campaign Lead', 'NCPOR'],
    [uuidv4(), exps.arctic2024, 'Dr. Rahul Mohan', 'Marine Biologist', 'NCPOR'],
    [uuidv4(), exps.himalaya2024, 'Dr. Thamban Meloth', 'Programme Coordinator', 'NCPOR'],
    [uuidv4(), exps.so2024, 'Dr. Rahul Mohan', 'Chief Scientist', 'NCPOR'],
    [uuidv4(), exps.so2024, 'Sanjay Kumar', 'Geochemist', 'NCPOR'],
  ];
  members.forEach(m => db.run('INSERT INTO expedition_members (id,expedition_id,name,role,institution) VALUES (?,?,?,?,?)', m));

  // ─── DATASETS ────────────────────────────────────────────
  const datasetList = [
    { title: 'Atmospheric Aerosol Optical Depth - Bharati Station 2023-24', title_hi: 'वायुमंडलीय एरोसोल ऑप्टिकल डेप्थ - भारती 2023-24', slug: 'aod-bharati-2023-24',
      desc: 'Aerosol optical depth (AOD) measurements collected at Bharati station during ISEA-43 using MICROTOPS-II sun photometer. Dataset includes AOD at multiple wavelengths, Angstrom exponent, and precipitable water vapour estimates.',
      discipline: 'Atmospheric Science', params: 'AOD, Angstrom Exponent, Precipitable Water Vapour', spatial: 'Larsemann Hills, East Antarctica (-69.4, 76.2)', start: '2023-11-15', end: '2024-03-31',
      format: 'CSV', size: 2048000, licence: 'CC-BY-4.0', citation: 'NCPOR (2024). Atmospheric Aerosol Optical Depth - Bharati Station 2023-24. NCPOR Data Repository.', expId: exps.isea43 },
    { title: 'Kongsfjorden Seawater Temperature and Salinity Profile 2024', title_hi: 'कोंग्सफ्जोर्डन समुद्री जल तापमान प्रोफ़ाइल 2024', slug: 'kongsfjorden-temp-sal-2024',
      desc: 'Vertical profiles of temperature, salinity, and dissolved oxygen in Kongsfjorden, Svalbard, collected from the IndARC mooring and ship-based CTD casts during the 2024 Arctic summer campaign.',
      discipline: 'Oceanography', params: 'Temperature, Salinity, Dissolved Oxygen, Depth', spatial: 'Kongsfjorden, Svalbard (78.9N, 12.0E)', start: '2024-06-15', end: '2024-09-15',
      format: 'NetCDF', size: 5120000, licence: 'CC-BY-4.0', citation: 'NCPOR (2024). Kongsfjorden Seawater Temperature and Salinity Profile. NCPOR Data Repository.', expId: exps.arctic2024 },
    { title: 'Maitri Station Meteorological Records 2022-23', title_hi: 'मैत्री स्टेशन मौसम संबंधी रिकॉर्ड 2022-23', slug: 'maitri-met-2022-23',
      desc: 'Hourly meteorological observations from the automatic weather station at Maitri, including air temperature, wind speed and direction, relative humidity, atmospheric pressure, and incoming solar radiation.',
      discipline: 'Atmospheric Science', params: 'Temperature, Wind Speed, Wind Direction, Humidity, Pressure, Solar Radiation', spatial: 'Schirmacher Oasis, Antarctica (-70.8, 11.7)', start: '2022-11-15', end: '2023-04-10',
      format: 'CSV', size: 1536000, licence: 'CC-BY-4.0', citation: 'NCPOR (2023). Maitri Station Meteorological Records 2022-23. NCPOR Data Repository.', expId: exps.isea42 },
    { title: 'Southern Ocean CTD Profiles - Indian Sector 2024', title_hi: 'दक्षिणी महासागर CTD प्रोफ़ाइल 2024', slug: 'so-ctd-2024',
      desc: 'CTD (Conductivity-Temperature-Depth) profiles collected at multiple stations across the Indian sector of the Southern Ocean during the 2024 expedition, from the subtropical front to the Antarctic continental shelf.',
      discipline: 'Oceanography', params: 'Temperature, Conductivity, Salinity, Depth, Fluorescence, Turbidity', spatial: 'Indian Ocean Sector, Southern Ocean (40S-65S, 55E-90E)', start: '2024-01-15', end: '2024-03-20',
      format: 'NetCDF', size: 12288000, licence: 'CC-BY-4.0', citation: 'NCPOR (2024). Southern Ocean CTD Profiles - Indian Sector 2024. NCPOR Data Repository.', expId: exps.so2024 },
    { title: 'Spiti Valley Glacier Mass Balance 2020-2024', title_hi: 'स्पिती घाटी हिमनद द्रव्यमान संतुलन 2020-2024', slug: 'spiti-glacier-mb-2020-24',
      desc: 'Annual and seasonal glacier mass balance measurements from benchmark glaciers near Himansh station in the Spiti Valley, based on stake network and snow pit observations.',
      discipline: 'Glaciology', params: 'Accumulation, Ablation, Net Balance, ELA, Stake Readings', spatial: 'Spiti Valley, Himachal Pradesh (32.8N, 78.0E)', start: '2020-09-01', end: '2024-09-30',
      format: 'CSV', size: 512000, licence: 'CC-BY-4.0', citation: 'NCPOR (2024). Spiti Valley Glacier Mass Balance 2020-2024. NCPOR Data Repository.', expId: exps.himalaya2024 },
    { title: 'Antarctic Surface Snow Chemistry - ISEA-43', title_hi: 'अंटार्कटिक सतही हिम रसायन - ISEA-43', slug: 'snow-chemistry-isea43',
      desc: 'Major ion chemistry (Na, K, Mg, Ca, Cl, SO4, NO3) of surface snow samples collected along a traverse route from Bharati station during ISEA-43.',
      discipline: 'Glaciology', params: 'Na+, K+, Mg2+, Ca2+, Cl-, SO4--, NO3-, pH, EC', spatial: 'Bharati to inland transect, East Antarctica', start: '2023-12-01', end: '2024-02-28',
      format: 'XLSX', size: 768000, licence: 'CC-BY-4.0', citation: 'NCPOR (2024). Antarctic Surface Snow Chemistry - ISEA-43. NCPOR Data Repository.', expId: exps.isea43 },
    { title: 'Kongsfjorden Marine Phytoplankton Abundance 2023', title_hi: 'कोंग्सफ्जोर्डन समुद्री फाइटोप्लैंकटन बहुतायत 2023', slug: 'kongsfjorden-phyto-2023',
      desc: 'Phytoplankton species composition, cell counts, and chlorophyll-a concentrations from water samples collected at multiple stations in Kongsfjorden during the 2023 Arctic summer.',
      discipline: 'Marine Biology', params: 'Species Composition, Cell Counts, Chlorophyll-a, Nutrients', spatial: 'Kongsfjorden, Svalbard', start: '2023-06-01', end: '2023-08-31',
      format: 'CSV', size: 384000, licence: 'CC-BY-4.0', citation: 'NCPOR (2023). Kongsfjorden Marine Phytoplankton Abundance. NCPOR Data Repository.', expId: exps.arctic2023 },
    { title: 'Larsemann Hills Geological Map Data', title_hi: 'लार्सेमन हिल्स भूवैज्ञानिक मानचित्र डेटा', slug: 'larsemann-geology',
      desc: 'Digitised geological map data of the Larsemann Hills region including lithological boundaries, structural features, and sample locations from field mapping carried out over multiple ISEA expeditions.',
      discipline: 'Geology', params: 'Lithology, Structural Features, Sample Locations, Rock Types', spatial: 'Larsemann Hills, East Antarctica', start: '2018-01-01', end: '2024-03-31',
      format: 'GeoJSON', size: 4096000, licence: 'CC-BY-4.0', citation: 'NCPOR (2024). Larsemann Hills Geological Map Data. NCPOR Data Repository.', expId: exps.isea43 },
  ];

  datasetList.forEach(d => {
    db.run(`INSERT INTO datasets (id,title,title_hi,slug,description,description_hi,discipline,parameters,spatial_coverage,temporal_coverage_start,temporal_coverage_end,format,file_size,file_path,licence,doi,citation,version,access_level,embargo_date,contact_name,contact_email,status,expedition_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), d.title, d.title_hi, d.slug, d.desc, null, d.discipline, d.params, d.spatial, d.start, d.end, d.format, d.size, null, d.licence, null, d.citation, '1.0', 'PUBLIC', null, 'Dr. Thamban Meloth', 'thamban@ncpor.gov.in', 'PUBLISHED', d.expId, users.editor]);
  });

  // ─── PUBLICATIONS ────────────────────────────────────────
  const pubList = [
    { title: 'Glacier Mass Balance Observations in Svalbard: A Decadal Assessment', slug: 'glacier-mass-balance-svalbard',
      abstract: 'A comprehensive assessment of glacier mass balance changes observed near Ny-Alesund, Svalbard, over the past decade, based on field measurements and remote sensing data. Results indicate sustained negative mass balance trends across the monitored glaciers.',
      type: 'PAPER', authors: 'Thamban M., Kumar S., Sharma P.', journal: 'Journal of Glaciology', year: 2024, volume: '70', issue: '2', pages: '145-162', keywords: 'glaciology, Svalbard, mass balance, Arctic, climate change', expId: exps.arctic2024 },
    { title: 'Atmospheric Black Carbon over the Indian Arctic Station: Seasonal Variability and Source Apportionment', slug: 'black-carbon-arctic',
      abstract: 'Analysis of year-round black carbon concentration measurements at Himadri station, identifying seasonal peaks and attributing sources using back-trajectory analysis and chemical markers.',
      type: 'PAPER', authors: 'Mahajan A., Thamban M., Mohan R.', journal: 'Atmospheric Environment', year: 2024, volume: '312', issue: '', pages: '119-134', keywords: 'black carbon, Arctic, atmospheric science, pollution, Svalbard', expId: exps.arctic2024 },
    { title: 'Marine Biodiversity in Kongsfjorden: A Decade of Observations', slug: 'kongsfjorden-biodiversity',
      abstract: 'A synthesis of marine biodiversity observations in Kongsfjorden over ten years of Indian Arctic research, documenting changes in phytoplankton communities, zooplankton diversity, and benthic fauna.',
      type: 'PAPER', authors: 'Mohan R., Sharma P., Kumar S.', journal: 'Polar Biology', year: 2023, volume: '46', issue: '8', pages: '891-908', keywords: 'marine biology, Arctic, Kongsfjorden, biodiversity, phytoplankton', expId: exps.arctic2023 },
    { title: 'Ice Core Evidence of Volcanic Signatures in East Antarctic Snow', slug: 'ice-core-volcanic',
      abstract: 'Identification and characterisation of volcanic aerosol signatures in shallow ice cores retrieved from the East Antarctic ice sheet near Bharati station, spanning the past two centuries.',
      type: 'PAPER', authors: 'Thamban M., Kumar S.', journal: 'Journal of Geophysical Research: Atmospheres', year: 2023, volume: '128', issue: '15', pages: 'e2023JD038421', keywords: 'ice core, volcanic aerosol, Antarctica, paleoclimate', expId: exps.isea42 },
    { title: 'NCPOR Annual Report 2023-24', title_hi: 'NCPOR वार्षिक रिपोर्ट 2023-24', slug: 'ncpor-annual-report-2023-24',
      abstract: 'Annual report covering NCPOR research activities, expedition summaries, publications, infrastructure developments, and institutional milestones during the financial year 2023-24.',
      type: 'ANNUAL_REPORT', authors: 'NCPOR', journal: null, year: 2024, volume: null, issue: null, pages: null, keywords: 'NCPOR, annual report, polar research, India', expId: null },
    { title: 'NCPOR Annual Report 2022-23', slug: 'ncpor-annual-report-2022-23',
      abstract: 'Annual report covering institutional activities and research outcomes during the financial year 2022-23.',
      type: 'ANNUAL_REPORT', authors: 'NCPOR', journal: null, year: 2023, volume: null, issue: null, pages: null, keywords: 'NCPOR, annual report', expId: null },
    { title: 'Southern Ocean Carbon Flux: Observations from the Indian Sector', slug: 'so-carbon-flux',
      abstract: 'Estimates of air-sea carbon dioxide flux in the Indian sector of the Southern Ocean based on underway pCO2 measurements and water column dissolved inorganic carbon analysis.',
      type: 'PAPER', authors: 'Mohan R., Mahajan A., Thamban M.', journal: 'Deep-Sea Research Part II', year: 2024, volume: '205', issue: '', pages: '105-120', keywords: 'Southern Ocean, carbon flux, pCO2, oceanography', expId: exps.so2024 },
    { title: 'Technical Manual: IndARC Mooring System Operation and Data Processing', slug: 'indarc-manual',
      abstract: 'Technical manual describing the design, deployment, recovery, and data processing procedures for the IndARC (Indian Arctic) mooring system deployed in Kongsfjorden, Svalbard.',
      type: 'TECHNICAL_REPORT', authors: 'Mohan R., Kumar S.', journal: null, year: 2023, volume: null, issue: null, pages: null, keywords: 'IndARC, mooring, Arctic, instrumentation, Kongsfjorden', expId: exps.arctic2023 },
    { title: 'Permafrost Dynamics in the Western Himalaya: Observations from Himansh Station', slug: 'permafrost-himalaya',
      abstract: 'Analysis of permafrost temperature profiles and active layer thickness measurements from boreholes at and around the Himansh station in the Spiti Valley.',
      type: 'PAPER', authors: 'Kumar S., Thamban M., Sharma P.', journal: 'Permafrost and Periglacial Processes', year: 2024, volume: '35', issue: '1', pages: '45-58', keywords: 'permafrost, Himalaya, active layer, climate change, Spiti', expId: exps.himalaya2024 },
    { title: 'Polar Science Newsletter, Volume 12', slug: 'newsletter-v12',
      abstract: 'Quarterly newsletter featuring highlights from recent expeditions, new publications, upcoming events, and profiles of NCPOR scientists.',
      type: 'NEWSLETTER', authors: 'NCPOR Outreach Division', journal: null, year: 2024, volume: '12', issue: '1', pages: null, keywords: 'newsletter, NCPOR, polar science', expId: null },
  ];

  pubList.forEach(p => {
    db.run(`INSERT INTO publications (id,title,title_hi,slug,abstract,abstract_hi,pub_type,authors,journal,year,volume,issue,pages,doi,keywords,pdf_path,status,expedition_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uuidv4(), p.title, p.title_hi||null, p.slug, p.abstract, null, p.type, p.authors, p.journal, p.year, p.volume, p.issue, p.pages, null, p.keywords, null, 'PUBLISHED', p.expId, users.editor]);
  });

  // ─── ALBUMS ──────────────────────────────────────────────
  const albums = {};
  const albumList = [
    { key: 'antarctic', name: 'Antarctic Landscapes', name_hi: 'अंटार्कटिक परिदृश्य', slug: 'antarctic-landscapes', desc: 'Photographs from Indian Antarctic expeditions showing landscapes, stations, and field work.' },
    { key: 'arctic', name: 'Arctic Research', name_hi: 'आर्कटिक अनुसंधान', slug: 'arctic-research', desc: 'Photographs from Himadri station and Arctic research campaigns in Svalbard.' },
    { key: 'wildlife', name: 'Polar Wildlife', name_hi: 'ध्रुवीय वन्यजीव', slug: 'polar-wildlife', desc: 'Wildlife observed during polar expeditions including penguins, seals, and seabirds.' },
    { key: 'stations', name: 'Research Stations', name_hi: 'अनुसंधान स्टेशन', slug: 'research-stations', desc: 'Photographs of India\'s polar and high-altitude research stations.' },
    { key: 'himalaya', name: 'Himalayan Cryosphere', name_hi: 'हिमालयी क्रायोस्फीयर', slug: 'himalayan-cryosphere', desc: 'Glaciers, snow cover, and landscapes from the Himansh station area in Spiti Valley.' },
    { key: 'so', name: 'Southern Ocean', name_hi: 'दक्षिणी महासागर', slug: 'southern-ocean', desc: 'Images from Southern Ocean research expeditions.' },
  ];
  albumList.forEach(a => {
    const id = uuidv4();
    albums[a.key] = id;
    db.run('INSERT INTO albums (id,name,name_hi,slug,description,created_by) VALUES (?,?,?,?,?,?)', [id, a.name, a.name_hi, a.slug, a.desc, users.editor]);
  });

  // ─── TAGS ────────────────────────────────────────────────
  const tags = {};
  const tagList = [
    ['Glaciology', 'हिमनद विज्ञान', 'discipline'], ['Atmospheric Science', 'वायुमंडलीय विज्ञान', 'discipline'],
    ['Marine Biology', 'समुद्री जीव विज्ञान', 'discipline'], ['Oceanography', 'समुद्र विज्ञान', 'discipline'],
    ['Geology', 'भूविज्ञान', 'discipline'], ['Climate Science', 'जलवायु विज्ञान', 'discipline'],
    ['Arctic', 'आर्कटिक', 'region'], ['Antarctic', 'अंटार्कटिक', 'region'],
    ['Himalaya', 'हिमालय', 'region'], ['Southern Ocean', 'दक्षिणी महासागर', 'region'],
    ['Field Work', 'क्षेत्रीय कार्य', 'activity'], ['Station Life', 'स्टेशन जीवन', 'activity'],
    ['Wildlife', 'वन्यजीव', 'subject'], ['Landscape', 'परिदृश्य', 'subject'],
    ['Instruments', 'उपकरण', 'subject'], ['Ice Core', 'हिम कोर', 'subject'],
  ];
  tagList.forEach(t => { const id = uuidv4(); tags[t[0]] = id; db.run('INSERT INTO tags (id,name,name_hi,category) VALUES (?,?,?,?)', [id, t[0], t[1], t[2]]); });

  // ─── MEDIA ITEMS ─────────────────────────────────────────
  const mediaList = [
    { title: 'Bharati Station at sunset', type: 'PHOTO', album: albums.antarctic, credit: 'NCPOR/ISEA-43', location: 'Larsemann Hills, Antarctica', date: '2024-01-15', desc: 'Bharati research station photographed during the austral summer with the midnight sun low on the horizon.', tagKeys: ['Antarctic', 'Station Life', 'Landscape'], expId: exps.isea43 },
    { title: 'Ice core drilling operations', type: 'PHOTO', album: albums.antarctic, credit: 'NCPOR/ISEA-43', location: 'East Antarctic Ice Sheet', date: '2024-01-20', desc: 'Scientists operating an ice core drill during ISEA-43, extracting ice samples for paleoclimate research.', tagKeys: ['Antarctic', 'Field Work', 'Ice Core', 'Glaciology'], expId: exps.isea43 },
    { title: 'Maitri Station panorama', type: 'PHOTO', album: albums.stations, credit: 'NCPOR', location: 'Schirmacher Oasis, Antarctica', date: '2023-02-10', desc: 'Panoramic view of Maitri station at the Schirmacher Oasis, showing the main station buildings and surrounding ice-free terrain.', tagKeys: ['Antarctic', 'Station Life', 'Landscape'], expId: exps.isea42 },
    { title: 'Himadri Station, Ny-Alesund', type: 'PHOTO', album: albums.stations, credit: 'NCPOR', location: 'Ny-Alesund, Svalbard', date: '2024-07-01', desc: 'India\'s Arctic research station Himadri at the International Arctic Research Base in Ny-Alesund during the Arctic summer.', tagKeys: ['Arctic', 'Station Life'], expId: exps.arctic2024 },
    { title: 'Kongsfjorden glacier front', type: 'PHOTO', album: albums.arctic, credit: 'NCPOR/Arctic Campaign 2024', location: 'Kongsfjorden, Svalbard', date: '2024-07-15', desc: 'Tidewater glacier calving front in Kongsfjorden, with small icebergs floating in the fjord waters.', tagKeys: ['Arctic', 'Glaciology', 'Landscape'], expId: exps.arctic2024 },
    { title: 'IndARC mooring deployment', type: 'PHOTO', album: albums.arctic, credit: 'NCPOR', location: 'Kongsfjorden, Svalbard', date: '2024-06-20', desc: 'Deployment of the IndARC mooring system from the research vessel in Kongsfjorden for long-term oceanographic monitoring.', tagKeys: ['Arctic', 'Oceanography', 'Instruments', 'Field Work'], expId: exps.arctic2024 },
    { title: 'Penguin colony near Bharati', type: 'PHOTO', album: albums.wildlife, credit: 'NCPOR/ISEA-43', location: 'Near Bharati Station, Antarctica', date: '2024-02-01', desc: 'Adelie penguin colony observed near Bharati station during the austral summer breeding season.', tagKeys: ['Antarctic', 'Wildlife', 'Marine Biology'], expId: exps.isea43 },
    { title: 'Seal resting on ice', type: 'PHOTO', album: albums.wildlife, credit: 'NCPOR/ISEA-43', location: 'Larsemann Hills coast, Antarctica', date: '2024-01-25', desc: 'Weddell seal resting on fast ice near the coast of Larsemann Hills.', tagKeys: ['Antarctic', 'Wildlife'], expId: exps.isea43 },
    { title: 'Himansh Station in winter', type: 'PHOTO', album: albums.himalaya, credit: 'NCPOR', location: 'Spiti Valley, Himachal Pradesh', date: '2024-01-10', desc: 'Himansh station surrounded by snow-covered Himalayan peaks during winter.', tagKeys: ['Himalaya', 'Station Life', 'Landscape'], expId: exps.himalaya2024 },
    { title: 'Spiti Valley glacier monitoring', type: 'PHOTO', album: albums.himalaya, credit: 'NCPOR', location: 'Spiti Valley, Himachal Pradesh', date: '2024-06-15', desc: 'Scientists conducting glacier mass balance measurements on a benchmark glacier near Himansh station.', tagKeys: ['Himalaya', 'Glaciology', 'Field Work'], expId: exps.himalaya2024 },
    { title: 'Southern Ocean research vessel', type: 'PHOTO', album: albums.so, credit: 'NCPOR/SO Expedition 2024', location: 'Southern Ocean, Indian Sector', date: '2024-02-10', desc: 'Research vessel during the Southern Ocean Expedition 2024, with CTD rosette being prepared for deployment.', tagKeys: ['Southern Ocean', 'Oceanography', 'Instruments'], expId: exps.so2024 },
    { title: 'CTD water sampling', type: 'PHOTO', album: albums.so, credit: 'NCPOR/SO Expedition 2024', location: 'Southern Ocean', date: '2024-02-15', desc: 'Scientists collecting water samples from the CTD rosette aboard the research vessel in the Southern Ocean.', tagKeys: ['Southern Ocean', 'Oceanography', 'Field Work'], expId: exps.so2024 },
    { title: 'ISEA-43 Expedition Documentary', type: 'VIDEO', album: albums.antarctic, credit: 'NCPOR Outreach', location: 'Bharati Station, Antarctica', date: '2024-04-20', desc: 'Documentary overview of the 43rd Indian Scientific Expedition to Antarctica, covering research activities and life at the station.', tagKeys: ['Antarctic', 'Station Life', 'Field Work'], expId: exps.isea43 },
    { title: 'Arctic Research Highlights 2024', type: 'VIDEO', album: albums.arctic, credit: 'NCPOR Outreach', location: 'Himadri Station, Svalbard', date: '2024-10-01', desc: 'Video summary of the 2024 Arctic summer research campaign at Himadri station.', tagKeys: ['Arctic', 'Field Work', 'Glaciology'], expId: exps.arctic2024 },
    { title: 'Atmospheric monitoring equipment', type: 'PHOTO', album: albums.stations, credit: 'NCPOR', location: 'Maitri Station, Antarctica', date: '2023-01-20', desc: 'Atmospheric monitoring instruments installed at Maitri station, including aerosol samplers and radiation sensors.', tagKeys: ['Antarctic', 'Atmospheric Science', 'Instruments'], expId: exps.isea42 },
    { title: 'Iceberg in Prydz Bay', type: 'PHOTO', album: albums.antarctic, credit: 'NCPOR/ISEA-42', location: 'Prydz Bay, Antarctica', date: '2023-02-05', desc: 'Large tabular iceberg in Prydz Bay observed during the ship transit to Bharati station.', tagKeys: ['Antarctic', 'Landscape'], expId: exps.isea42 },
  ];

  mediaList.forEach(m => {
    const id = uuidv4();
    const slug = m.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + id.slice(0, 6);
    db.run(`INSERT INTO media_items (id,title,slug,description,media_type,credit,location,taken_date,licence,album_id,expedition_id,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, m.title, slug, m.desc, m.type, m.credit, m.location, m.date, 'CC-BY-4.0', m.album, m.expId, 'PUBLISHED', users.outreach]);
    m.tagKeys.forEach(tk => {
      if (tags[tk]) db.run('INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?,?)', [id, tags[tk]]);
    });
  });

  // ─── NEWS ARTICLES ───────────────────────────────────────
  const newsList = [
    { title: 'ISEA-43 Team Returns Successfully from Antarctica', title_hi: 'ISEA-43 टीम अंटार्कटिका से सफलतापूर्वक लौटी', slug: 'isea-43-team-returns', date: '2024-04-20',
      summary: 'The 43rd Indian Scientific Expedition to Antarctica concluded with all team members returning safely after completing research at Bharati and Maitri stations.',
      body: 'The 43rd Indian Scientific Expedition to Antarctica (ISEA-43) concluded with all team members returning safely. The expedition carried out research in atmospheric sciences, glaciology, geology, and marine biology at both Bharati and Maitri stations. Key achievements include successful retrieval of ice core samples, deployment of new atmospheric monitoring equipment, and completion of geological mapping in the Larsemann Hills region.' },
    { title: 'NCPOR Signs MoU with Norwegian Polar Institute', title_hi: 'NCPOR ने नॉर्वेजियन पोलर इंस्टीट्यूट के साथ समझौता ज्ञापन पर हस्ताक्षर किए', slug: 'ncpor-npi-mou', date: '2024-05-10',
      summary: 'NCPOR and the Norwegian Polar Institute signed a memorandum of understanding to strengthen bilateral cooperation in Arctic and Antarctic research.',
      body: 'NCPOR and the Norwegian Polar Institute (NPI) signed a memorandum of understanding (MoU) in New Delhi to strengthen bilateral cooperation in polar research. The MoU covers joint research expeditions, exchange of scientists, sharing of data and infrastructure, and collaborative studies on Arctic climate change, glacier dynamics, and marine ecosystems.' },
    { title: '44th Indian Scientific Expedition to Antarctica Announced', title_hi: '44वें भारतीय अंटार्कटिक वैज्ञानिक अभियान की घोषणा', slug: 'isea-44-announced', date: '2024-08-15',
      summary: 'NCPOR announces the 44th Indian Scientific Expedition to Antarctica (ISEA-44) scheduled for the 2024-25 austral summer season.',
      body: 'The National Centre for Polar and Ocean Research has announced the 44th Indian Scientific Expedition to Antarctica. The expedition will deploy teams at both Bharati and Maitri stations for expanded research programmes including deep ice core drilling, new automatic weather station deployment, and enhanced marine biology surveys. Team selection is underway.' },
    { title: 'Southern Ocean Expedition Discovers New Phytoplankton Patterns', title_hi: 'दक्षिणी महासागर अभियान ने नए फाइटोप्लैंकटन पैटर्न की खोज की', slug: 'so-phytoplankton-discovery', date: '2024-06-01',
      summary: 'Scientists on the Southern Ocean Expedition 2024 report significant findings on phytoplankton distribution patterns in the Indian sector.',
      body: 'Scientists from the Southern Ocean Expedition 2024 have reported significant findings on phytoplankton distribution in the Indian sector. The study reveals previously undocumented patterns of phytoplankton blooms that may have implications for understanding carbon cycling in the Southern Ocean.' },
    { title: 'India Celebrates National Polar Science Day', title_hi: 'भारत ने राष्ट्रीय ध्रुवीय विज्ञान दिवस मनाया', slug: 'polar-science-day-2024', date: '2024-08-21',
      summary: 'NCPOR organised events across the country to celebrate National Polar Science Day, including lectures, exhibitions, and workshops for students.',
      body: 'National Polar Science Day was celebrated at NCPOR headquarters in Goa and at partner institutions across India. Events included public lectures by polar scientists, exhibitions showcasing India\'s polar research achievements, interactive workshops for school and college students, and a virtual tour of Antarctic research stations.' },
  ];
  newsList.forEach(n => db.run(`INSERT INTO news_articles (id,title,title_hi,slug,summary,summary_hi,body,publish_date,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [uuidv4(), n.title, n.title_hi, n.slug, n.summary, null, n.body, n.date, 'PUBLISHED', users.outreach]));

  // ─── EVENTS ──────────────────────────────────────────────
  const eventList = [
    { title: 'National Polar Science Day 2024', title_hi: 'राष्ट्रीय ध्रुवीय विज्ञान दिवस 2024', slug: 'polar-science-day-2024', desc: 'Annual celebration of India\'s achievements in polar research, featuring lectures, exhibitions, and interactive sessions for students and the public.', location: 'NCPOR, Vasco da Gama, Goa', start: '2024-08-21', end: '2024-08-21', type: 'PUBLIC_EVENT' },
    { title: 'ISEA-44 Departure Ceremony', title_hi: 'ISEA-44 प्रस्थान समारोह', slug: 'isea-44-departure', desc: 'Flag-off ceremony for the 44th Indian Scientific Expedition to Antarctica.', location: 'Goa Shipyard', start: '2024-11-01', end: '2024-11-01', type: 'CEREMONY' },
    { title: 'International Workshop on Polar Climate Change', title_hi: 'ध्रुवीय जलवायु परिवर्तन पर अंतर्राष्ट्रीय कार्यशाला', slug: 'polar-climate-workshop-2025', desc: 'Three-day international workshop bringing together polar scientists to discuss recent advances in understanding polar amplification and its global impacts.', location: 'NCPOR, Goa', start: '2025-02-15', end: '2025-02-17', type: 'WORKSHOP' },
    { title: 'World Ocean Day Outreach Programme', title_hi: 'विश्व महासागर दिवस आउटरीच कार्यक्रम', slug: 'world-ocean-day-2025', desc: 'Public outreach events for World Ocean Day including beach cleanups, marine science demonstrations, and student essay competitions.', location: 'NCPOR and schools across Goa', start: '2025-06-08', end: '2025-06-08', type: 'PUBLIC_EVENT' },
    { title: 'NCPOR Foundation Day Lecture Series', title_hi: 'NCPOR स्थापना दिवस व्याख्यान श्रृंखला', slug: 'foundation-day-2025', desc: 'Annual foundation day lecture series featuring invited talks by eminent scientists on the future of polar and ocean research.', location: 'NCPOR Auditorium, Goa', start: '2025-05-25', end: '2025-05-25', type: 'LECTURE' },
    { title: 'Arctic Science School for Students', title_hi: 'छात्रों के लिए आर्कटिक विज्ञान स्कूल', slug: 'arctic-science-school-2025', desc: 'Five-day intensive programme for undergraduate and postgraduate students on Arctic science, including lectures, hands-on data analysis, and virtual field visits.', location: 'NCPOR, Goa', start: '2025-07-07', end: '2025-07-11', type: 'WORKSHOP' },
  ];
  eventList.forEach(e => db.run(`INSERT INTO events (id,title,title_hi,slug,description,location,start_date,end_date,event_type,status,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [uuidv4(), e.title, e.title_hi, e.slug, e.desc, e.location, e.start, e.end, e.type, 'PUBLISHED', users.outreach]));

  // ─── EDUCATION RESOURCES ─────────────────────────────────
  const eduList = [
    { title: 'Polar Science Teaching Kit for Schools', title_hi: 'स्कूलों के लिए ध्रुवीय विज्ञान शिक्षण किट', slug: 'polar-science-kit', desc: 'Comprehensive teaching kit for middle and high school teachers, including lesson plans, activity sheets, and presentation slides covering polar ecosystems, climate science, and India\'s polar research programme.', type: 'TEACHING_KIT', audience: 'Middle and high school teachers and students' },
    { title: 'Introduction to Glaciology Workshop Materials', title_hi: 'हिमनद विज्ञान परिचय कार्यशाला सामग्री', slug: 'glaciology-workshop', desc: 'Workshop materials for a two-day introductory course on glaciology, including lecture notes, field measurement techniques, and data analysis exercises using real glacier mass balance data.', type: 'WORKSHOP', audience: 'Undergraduate and postgraduate students' },
    { title: 'Antarctica: A Continent for Science (Lecture Series)', title_hi: 'अंटार्कटिका: विज्ञान के लिए एक महाद्वीप', slug: 'antarctica-lecture-series', desc: 'Series of six recorded lectures covering the history of Antarctic exploration, the Antarctic Treaty System, India\'s Antarctic programme, and current research activities at Indian stations.', type: 'LECTURE', audience: 'College students and general public' },
    { title: 'Polar Science Quiz Bank', title_hi: 'ध्रुवीय विज्ञान प्रश्नोत्तरी बैंक', slug: 'polar-quiz-bank', desc: 'Collection of quiz questions on polar science, climate change, and Indian polar research for use in school and college competitions. Includes questions at basic, intermediate, and advanced levels.', type: 'QUIZ', audience: 'School and college students' },
    { title: 'School Outreach Programme: Adopt a Polar Station', title_hi: 'स्कूल आउटरीच कार्यक्रम: एक ध्रुवीय स्टेशन अपनाएं', slug: 'adopt-polar-station', desc: 'Year-long school programme where participating schools are paired with one of India\'s research stations. Students receive monthly updates, participate in Q&A sessions with scientists, and complete research projects.', type: 'PROGRAMME', audience: 'Schools (classes 6-12)' },
  ];
  eduList.forEach(e => db.run(`INSERT INTO education_resources (id,title,title_hi,slug,description,resource_type,target_audience,status,created_by) VALUES (?,?,?,?,?,?,?,?,?)`,
    [uuidv4(), e.title, e.title_hi, e.slug, e.desc, e.type, e.audience, 'PUBLISHED', users.outreach]));

  // ─── GLOSSARY TERMS ──────────────────────────────────────
  const glossaryList = [
    ['Cryosphere', 'क्रायोस्फीयर', 'The portions of Earth\'s surface where water is in solid form, including ice sheets, glaciers, sea ice, snow cover, and permafrost.', 'पृथ्वी की सतह के वे भाग जहाँ पानी ठोस रूप में है, जिसमें हिम चादर, हिमनद, समुद्री बर्फ, हिम आवरण और स्थायी तुषार शामिल हैं।', 'General'],
    ['Glacier', 'हिमनद', 'A persistent body of dense ice that is constantly moving under its own weight. Glaciers form where the accumulation of snow exceeds its ablation over many years.', 'घनी बर्फ का एक स्थायी पिंड जो अपने भार से लगातार गतिशील रहता है।', 'Glaciology'],
    ['Permafrost', 'स्थायी तुषार', 'Ground that remains at or below 0 degrees Celsius for at least two consecutive years, consisting of soil, rock, and included ice and organic material.', 'वह भूमि जो कम से कम दो लगातार वर्षों तक 0 डिग्री सेल्सियस या उससे नीचे रहती है।', 'Geology'],
    ['Mooring', 'मूरिंग', 'An oceanographic installation anchored to the sea floor, equipped with instruments to measure water properties at various depths over extended periods.', 'समुद्र तल पर लंगर डाला गया समुद्रविज्ञान उपकरण, विभिन्न गहराइयों पर जल गुणों को मापने के लिए उपकरणों से सुसज्जित।', 'Oceanography'],
    ['Albedo', 'अल्बीडो', 'The fraction of incoming solar radiation reflected by a surface. Fresh snow has very high albedo (up to 0.9), while open ocean water has low albedo (about 0.06).', 'किसी सतह द्वारा परावर्तित आने वाली सौर विकिरण का अंश।', 'Atmospheric Science'],
    ['Ice Core', 'हिम कोर', 'A cylinder of ice drilled from an ice sheet or glacier. Ice cores contain trapped air bubbles and chemical impurities that preserve records of past climate conditions.', 'हिम चादर या हिमनद से ड्रिल किया गया बर्फ का एक सिलेंडर जो पूर्व जलवायु का रिकॉर्ड संरक्षित रखता है।', 'Glaciology'],
    ['CTD', 'सीटीडी', 'An instrument package that measures Conductivity, Temperature, and Depth of ocean water. Often mounted on a rosette frame with water sampling bottles.', 'एक उपकरण पैकेज जो समुद्री जल की चालकता, तापमान और गहराई मापता है।', 'Oceanography'],
    ['Aerosol', 'एरोसोल', 'Tiny solid or liquid particles suspended in the atmosphere. Aerosols affect climate by scattering and absorbing solar radiation and by influencing cloud formation.', 'वायुमंडल में निलंबित छोटे ठोस या तरल कण।', 'Atmospheric Science'],
    ['Mass Balance', 'द्रव्यमान संतुलन', 'The difference between the amount of snow and ice gained by a glacier (accumulation) and the amount lost through melting and calving (ablation) over a given period.', 'किसी हिमनद द्वारा प्राप्त और खोई गई बर्फ की मात्रा के बीच का अंतर।', 'Glaciology'],
    ['Polar Amplification', 'ध्रुवीय प्रवर्धन', 'The phenomenon whereby global warming produces larger temperature increases in the polar regions than the global average, partly due to ice-albedo feedback mechanisms.', 'वह घटना जिसमें वैश्विक तापन ध्रुवीय क्षेत्रों में वैश्विक औसत से अधिक तापमान वृद्धि उत्पन्न करता है।', 'Climate Science'],
    ['Antarctic Treaty', 'अंटार्कटिक संधि', 'The international agreement signed in 1959 that designates Antarctica as a scientific preserve and bans military activity on the continent. India acceded to the treaty in 1983.', '1959 में हस्ताक्षरित अंतर्राष्ट्रीय समझौता जो अंटार्कटिका को वैज्ञानिक संरक्षित क्षेत्र के रूप में नामित करता है।', 'General'],
    ['Phytoplankton', 'फाइटोप्लैंकटन', 'Microscopic photosynthetic organisms that form the base of the marine food web. Phytoplankton are responsible for roughly half of global oxygen production.', 'सूक्ष्म प्रकाश संश्लेषी जीव जो समुद्री खाद्य श्रृंखला का आधार बनाते हैं।', 'Marine Biology'],
    ['Calving', 'हिमखंडन', 'The process by which chunks of ice break off from the edge of a glacier, ice shelf, or iceberg. Calving is a significant source of mass loss for marine-terminating glaciers.', 'वह प्रक्रिया जिसमें बर्फ के टुकड़े हिमनद या हिम शेल्फ के किनारे से टूटकर गिरते हैं।', 'Glaciology'],
    ['Equilibrium Line Altitude', 'संतुलन रेखा ऊंचाई', 'The elevation on a glacier where annual accumulation equals annual ablation. Above this line, the glacier gains mass; below it, the glacier loses mass.', 'हिमनद पर वह ऊंचाई जहाँ वार्षिक संचय वार्षिक अपक्षय के बराबर होता है।', 'Glaciology'],
    ['Fjord', 'फियॉर्ड', 'A long, narrow, deep inlet of the sea between steep cliffs or slopes, typically formed by glacial erosion. Kongsfjorden in Svalbard is a well-studied Arctic fjord.', 'खड़ी चट्टानों के बीच समुद्र की एक लंबी, संकरी, गहरी खाड़ी, आमतौर पर हिमनद अपरदन द्वारा निर्मित।', 'Geology'],
  ];
  glossaryList.forEach(g => db.run('INSERT INTO glossary_terms (id,term,term_hi,definition,definition_hi,category) VALUES (?,?,?,?,?,?)', [uuidv4(), ...g]));

  // ─── QUESTION SUBMISSIONS ────────────────────────────────
  const questionList = [
    { name: 'Arjun Patel', email: 'arjun@example.com', question: 'How cold does it get at Maitri station in Antarctica during winter?', response: 'Temperatures at Maitri station during the Antarctic winter can drop to approximately -30 to -35 degrees Celsius. The extreme cold is compounded by strong katabatic winds.', published: 1 },
    { name: 'Sneha Gupta', email: 'sneha@example.com', question: 'Can students visit India\'s research stations in the Arctic or Antarctic?', response: 'Direct visits by students are not currently possible due to logistical constraints. However, NCPOR offers virtual tours, the Adopt a Polar Station programme, and internship opportunities for advanced students.', published: 1 },
    { name: 'Vikram Singh', email: 'vikram@example.com', question: 'What is the IndARC mooring and how does it work?', response: null, published: 0 },
  ];
  questionList.forEach(q => db.run('INSERT INTO question_submissions (id,name,email,question,response,is_published) VALUES (?,?,?,?,?,?)',
    [uuidv4(), q.name, q.email, q.question, q.response, q.published]));

  // ─── AUDIT LOG ───────────────────────────────────────────
  const auditList = [
    [uuidv4(), users.editor, 'PUBLISH', 'expedition', exps.isea43, null, null],
    [uuidv4(), users.editor, 'PUBLISH', 'expedition', exps.arctic2024, null, null],
    [uuidv4(), users.outreach, 'CREATE', 'news_article', null, null, null],
    [uuidv4(), users.admin, 'UPDATE_ROLE', 'user', users.outreach, '{"role":"CONTRIBUTOR"}', '{"role":"OUTREACH_MANAGER"}'],
    [uuidv4(), users.editor, 'PUBLISH', 'dataset', null, null, null],
    [uuidv4(), users.outreach, 'PUBLISH', 'media_item', null, null, null],
  ];
  auditList.forEach(a => db.run('INSERT INTO audit_log (id,user_id,action,entity_type,entity_id,old_values,new_values) VALUES (?,?,?,?,?,?,?)', a));

  // ─── DOWNLOAD LOGS ───────────────────────────────────────
  for (let i = 0; i < 15; i++) {
    db.run('INSERT INTO dataset_download_log (id,dataset_id,ip_address,accepted_terms) VALUES (?,?,?,?)',
      [uuidv4(), null, `192.168.1.${100 + i}`, 1]);
  }

  // ─── DEMO PENDING CHANGES (Editor submissions awaiting approval) ─────
  const pendingChanges = [
    {
      id: uuidv4(), entity_type: 'expedition', entity_id: null, action: 'CREATE',
      payload: JSON.stringify({
        title: '45th Indian Scientific Expedition to Antarctica (ISEA-45)',
        slug: '45th-isea',
        summary: 'The 45th Indian expedition to Antarctica focusing on climate variability studies and biological surveys around Bharati station.',
        region: 'ANTARCTIC',
        year: 2026,
        start_date: '2026-11-15',
        end_date: '2027-04-30',
        expedition_status: 'PLANNED',
        objectives: 'Study ice sheet dynamics, monitor atmospheric changes, conduct biodiversity surveys in the Larsemann Hills region.',
      }),
      status: 'PENDING', submitted_by: users.editor,
    },
    {
      id: uuidv4(), entity_type: 'dataset', entity_id: null, action: 'CREATE',
      payload: JSON.stringify({
        title: 'Arctic Permafrost Temperature Profiles 2025',
        slug: 'arctic-permafrost-temp-2025',
        description: 'High-resolution permafrost temperature monitoring data from boreholes near Himadri station, Ny-Ålesund, Svalbard. Includes continuous temperature readings at depths from 0.5m to 25m.',
        discipline: 'Glaciology',
        parameters: 'Temperature, Depth, Soil moisture',
        spatial_coverage: '78.9°N, 11.9°E (Ny-Ålesund)',
        format: 'CSV',
        access_level: 'PUBLIC',
        licence: 'CC-BY-4.0',
        contact_name: 'Dr. Thamban Meloth',
        contact_email: 'thamban@ncpor.gov.in',
      }),
      status: 'PENDING', submitted_by: users.editor,
    },
    {
      id: uuidv4(), entity_type: 'publication', entity_id: null, action: 'CREATE',
      payload: JSON.stringify({
        title: 'Decadal Changes in Antarctic Sea Ice Extent and Its Impact on Coastal Ecosystems',
        slug: 'decadal-antarctic-sea-ice',
        authors: 'Dr. Thamban Meloth, Dr. Rahul Mohan, Dr. Anoop Mahajan',
        journal: 'Polar Science',
        year: 2026,
        pub_type: 'PAPER',
        abstract: 'This study analyses decade-long satellite observations of Antarctic sea ice extent and correlates changes with biodiversity surveys conducted during Indian expeditions.',
        doi: '10.1016/j.polar.2026.100XXX',
        keywords: 'sea ice, Antarctica, ecosystems, climate change, biodiversity',
      }),
      status: 'PENDING', submitted_by: users.contributor1,
    },
    {
      id: uuidv4(), entity_type: 'news', entity_id: null, action: 'CREATE',
      payload: JSON.stringify({
        title: 'NCPOR Scientists Discover New Mineral Species in Antarctic Rock Samples',
        slug: 'new-mineral-species-antarctica',
        summary: 'A team of NCPOR researchers has identified a previously unknown mineral species in rock samples collected during the 43rd Indian Antarctic Expedition.',
        body: 'Scientists at the National Centre for Polar and Ocean Research (NCPOR) have made a groundbreaking discovery...',
        publish_date: '2026-09-28',
      }),
      status: 'PENDING', submitted_by: users.outreach,
    },
  ];

  pendingChanges.forEach(pc => {
    db.run('INSERT INTO pending_changes (id, entity_type, entity_id, action, payload, status, submitted_by) VALUES (?,?,?,?,?,?,?)',
      [pc.id, pc.entity_type, pc.entity_id, pc.action, pc.payload, pc.status, pc.submitted_by]);
  });

  // ─── DEMO NOTIFICATIONS ──────────────────────────────────
  const notifList = [
    {
      userId: users.admin, fromUserId: users.editor, type: 'SUBMISSION',
      title: 'New Expedition Submission',
      message: 'Dr. Thamban Meloth has created a new Expedition and it needs your approval.',
      entityType: 'expedition', link: '/admin/approvals',
    },
    {
      userId: users.admin, fromUserId: users.editor, type: 'SUBMISSION',
      title: 'New Dataset Submission',
      message: 'Dr. Thamban Meloth has created a new Dataset and it needs your approval.',
      entityType: 'dataset', link: '/admin/approvals',
    },
    {
      userId: users.admin, fromUserId: users.contributor1, type: 'SUBMISSION',
      title: 'New Publication Submission',
      message: 'Dr. Rahul Mohan has created a new Publication and it needs your approval.',
      entityType: 'publication', link: '/admin/approvals',
    },
    {
      userId: users.admin, fromUserId: users.outreach, type: 'SUBMISSION',
      title: 'New News Submission',
      message: 'Priya Sharma has created a new News article and it needs your approval.',
      entityType: 'news', link: '/admin/approvals',
    },
  ];

  notifList.forEach(n => {
    db.run('INSERT INTO notifications (id, user_id, from_user_id, type, title, message, entity_type, link) VALUES (?,?,?,?,?,?,?,?)',
      [uuidv4(), n.userId, n.fromUserId, n.type, n.title, n.message, n.entityType, n.link]);
  });

  saveDb();
  console.log('');
  console.log('Seed complete with comprehensive demo data:');
  console.log('  Users: 6');
  console.log('  Stations: 4 (Himadri, Bharati, Maitri, Himansh)');
  console.log('  Expeditions: 7 (Antarctic, Arctic, Himalaya, Southern Ocean)');
  console.log('  Expedition Members: 10');
  console.log('  Datasets: 8');
  console.log('  Publications: 10 (papers, reports, newsletters)');
  console.log('  Albums: 6');
  console.log('  Media Items: 16 (14 photos, 2 videos) with tags');
  console.log('  Tags: 16');
  console.log('  News Articles: 5');
  console.log('  Events: 6');
  console.log('  Education Resources: 5');
  console.log('  Glossary Terms: 15');
  console.log('  Question Submissions: 3');
  console.log('  Audit Log: 6 entries');
  console.log('  Download Logs: 15');
  console.log('  Pending Changes: 4 (from editors awaiting admin approval)');
  console.log('  Notifications: 4 (for admin about editor submissions)');
  console.log('');
  console.log('  Login: any email above with password "password123"');
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });

