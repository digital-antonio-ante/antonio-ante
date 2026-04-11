export interface ParishData {
  id: string;
  name: string;
  type: 'Urbana' | 'Rural';
  description: string;
  shortDesc: string;
  population?: string;
  altitude?: string;
  activities: string[];
  projects: string[];
  /** CSS hex color — unique per parish */
  color: string;
  /** CDN URL de la imagen — inyectada en build time desde Sanity (asset->url). Fallback: sin imagen = gradiente del color de parroquia */
  imageSrc?: string;
  gallery: string[];
  mapIcon: string;
  /** Approximate polygon centroid in SVG viewBox (0 0 1694 2528) */
  centroid: { x: number; y: number };
}

/** Polygon definitions in SVG viewBox 0 0 1694 2528 */
export const PARISH_POLYGONS: readonly { id: string; points: string }[] = [
  {
    id: 'atuntaqui',
    points:
      '302,716 310,666 323,634 490,358 696,210 799,148 969,69 1156,124 1144,153 926,540 925,541 895,556 402,787 305,724',
  },
  {
    id: 'andrade_marin',
    points:
      '1020,601 1148,152 1164,113 1178,105 1610,101 1654,111 1534,850 1510,946 1290,1066 1186,1062 1160,1042 1020,602',
  },
  {
    id: 'chaltura',
    points:
      '971,640 1005,650 1049,710 1094,740 1161,825 1163,945 1277,975 1286,1065 1273,1095 1233,1155 1165,1245 1037,1246 1016,1215 998,1185 980,1125 976,1095 886,1065 842,1005 693,975 611,945 536,885 580,824 751,820 755,790 814,755 862,700 931,670 945,650',
  },
  {
    id: 'natabuela',
    points:
      '188,1268 200,1246 237,1182 423,975 488,944 517,932 518,932 664,1051 814,1175 803,1293 714,1445 682,1488 680,1490 312,1343',
  },
  {
    id: 'san_roque',
    points:
      '693,1536 728,1438 740,1422 1012,1193 1364,1578 1288,1925 1093,1880 918,1826 884,1810 759,1714 694,1537',
  },
  {
    id: 'imbaya',
    points:
      '487,1974 670,1799 860,1816 1086,1879 1318,1963 1333,1976 1340,2008 1341,2054 1326,2094 1296,2136 1043,2306 1010,2309 490,2016',
  },
] as const;

export const PARISHES: Record<string, ParishData> = {
  atuntaqui: {
    id: 'atuntaqui',
    name: 'Atuntaqui',
    type: 'Urbana',
    shortDesc: 'Capital textil del Ecuador',
    description:
      'Capital del cantón. Reconocida como el motor industrial y textil de la región, atrayendo a miles con su "Expo Atuntaqui" anual.',
    population: '~25.000 hab.',
    altitude: '2.406 m s. n. m.',
    activities: ['Industria Textil', 'Comercio', 'Gastronomía'],
    projects: [
      'Expo Atuntaqui Internacional',
      'Plan de Desarrollo Industrial',
      'Modernización Vial',
    ],
    color: '#27ae60',
    gallery: [],
    mapIcon: '🏢',
    centroid: { x: 689, y: 445 },
  },
  andrade_marin: {
    id: 'andrade_marin',
    name: 'Andrade Marín',
    type: 'Urbana',
    shortDesc: 'Patrimonio histórico-industrial',
    description:
      'La cuna del desarrollo industrial primigenio. Hoy es un polo residencial que alberga el Complejo Histórico Fábrica Imbabura.',
    population: '~8.500 hab.',
    altitude: '2.410 m s. n. m.',
    activities: ['Turismo Histórico', 'Educación', 'Servicios'],
    projects: ['Complejo Cultural Fábrica Imbabura', 'Mejoras en Vías Residenciales'],
    color: '#2ecc71',
    gallery: [],
    mapIcon: '🏭',
    centroid: { x: 1290, y: 563 },
  },
  chaltura: {
    id: 'chaltura',
    name: 'Chaltura',
    type: 'Rural',
    shortDesc: 'Capital mundial del cuy',
    description:
      'Conocida como "El Pueblo de la Gente Feliz". Destaca por su turismo gastronómico y hermosos paisajes agrícolas.',
    population: '~3.000 hab.',
    altitude: '2.340 m s. n. m.',
    activities: ['Gastronomía', 'Agricultura', 'Turismo'],
    projects: ['Festival Gastronómico del Cuy', 'Rutas de Arándanos'],
    color: '#c81d25',
    gallery: [],
    mapIcon: '👨‍🌾',
    centroid: { x: 961, y: 984 },
  },
  natabuela: {
    id: 'natabuela',
    name: 'Natabuela',
    type: 'Rural',
    shortDesc: 'Tierra de los abuelos',
    description:
      'Famosa por su cultura, tradiciones y el Centro Gerontológico más grande del Ecuador.',
    population: '~12.500 hab.',
    altitude: '2.400 m s. n. m.',
    activities: ['Cultura', 'Turismo', 'Agricultura'],
    projects: ['Centro Gerontológico Municipal', 'Festival de la Confraternidad', 'Mirador'],
    color: '#1a5f7a',
    gallery: [],
    mapIcon: '⛪',
    centroid: { x: 517, y: 1198 },
  },
  san_roque: {
    id: 'san_roque',
    name: 'San Roque',
    type: 'Urbana',
    shortDesc: 'Tradición y música',
    description:
      'Destacada por su arraigada tradición musical. Representa la alegría de su gente a través de sus bandas y festividades.',
    population: '~10.200 hab.',
    altitude: '2.450 m s. n. m.',
    activities: ['Música', 'Artesanía', 'Comercio'],
    projects: ['Renovación del Parque Central', 'Escuela de Artes Populares', 'Centro de Eventos'],
    color: '#e67e22',
    gallery: [],
    mapIcon: '🎸',
    centroid: { x: 925, y: 1624 },
  },
  imbaya: {
    id: 'imbaya',
    name: 'Imbaya',
    type: 'Rural',
    shortDesc: 'Ecoturismo y naturaleza',
    description:
      'El rincón ecológico del cantón. Destaca por sus paisajes naturales, cuerpos de agua y vocación hacia la preservación ambiental.',
    population: '~3.000 hab.',
    altitude: '2.300 m s. n. m.',
    activities: ['Ecoturismo', 'Agricultura', 'Pesca Deportiva'],
    projects: ['Protección de Humedales', 'Rutas Ecológicas y Senderismo'],
    color: '#16a085',
    gallery: [],
    mapIcon: '🏞️',
    centroid: { x: 1046, y: 1948 },
  },
};
