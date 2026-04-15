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
  /** URL con crop portrait (440×640) centrado en el hotspot de Sanity — para las tarjetas verticales */
  imageSrc?: string;
  /** URL con crop landscape (840×400) centrado en el hotspot de Sanity — para el panel horizontal del mapa */
  imageSrcPanel?: string;
  /** CSS object-position fallback para cuando el CDN no ha procesado aún */
  imageObjectPosition?: string;
  gallery: string[];
  mapIcon: string;
  /** Approximate polygon centroid in SVG viewBox (0 0 1694 2528) */
  centroid: { x: number; y: number };
}

/**
 * Polygon definitions in SVG viewBox 0 0 1694 2528.
 *
 * Extraídos automáticamente del diseño gráfico `public/images/franja_g-dos.svg`
 * via `scripts/extract-parish-polygons.mjs` (selección por bbox + color target,
 * cierre morfológico, componente conectada más grande, Moore-Neighbor + DP).
 * Cada polígono se adapta a la forma exacta del relleno plano de la ilustración.
 */
export const PARISH_POLYGONS: readonly { id: string; points: string }[] = [
  {
    id: 'atuntaqui',
    points:
      '720,195 795,220 870,265 945,305 1000,355 1045,400 1075,445 1068,500 1058,555 1020,615 1015,640 940,660 920,700 895,720 860,725 830,745 800,775 765,805 745,830 620,845 500,845 385,810 320,770 290,740 290,695 300,655 320,615 360,580 395,540 430,485 450,430 460,385 475,340 510,315 570,280 650,240 695,210 720,195',
  },
  {
    id: 'andrade_marin',
    points:
      '1310,556 1369,606 1521,666 1520,713 1482,748 1473,779 1480,819 1532,850 1516,885 1455,860 1390,852 1318,847 1235,830 1185,864 1168,848 1104,806 1100,746 1054,717 1009,656 1040,570 1177,622 1223,612 1310,556',
  },
  {
    id: 'chaltura',
    points:
      '1019,624 1011,648 1054,708 1102,736 1109,802 1188,860 1220,852 1254,881 1244,952 1283,986 1288,1049 1309,1065 1170,1242 1088,1238 1030,1262 975,1285 1019,1244 1018,1200 982,1157 978,1110 959,1085 893,1065 832,988 768,988 653,956 540,905 555,847 588,824 711,861 742,842 766,792 810,779 851,725 913,708 950,645 1018,624',
  },
  {
    id: 'natabuela',
    points:
      '540,884 556,906 654,951 844,991 901,1063 976,1094 977,1134 1018,1190 1033,1246 1010,1285 960,1280 902,1331 833,1349 790,1406 748,1420 700,1460 636,1443 558,1477 515,1455 465,1393 428,1395 386,1356 326,1364 243,1301 196,1270 284,1141 345,1123 383,1093 431,976 448,958 478,962 539,884',
  },
  {
    id: 'san_roque',
    points:
      '961,1272 1025,1310 1047,1362 1156,1418 1222,1498 1283,1506 1313,1529 1364,1579 1370,1608 1288,1706 1250,1839 1237,1847 1173,1839 1125,1803 1085,1806 990,1776 950,1782 905,1754 858,1752 768,1717 743,1690 756,1671 691,1542 686,1492 753,1426 793,1413 833,1358 900,1342 931,1289 961,1272',
  },
  {
    id: 'imbaya',
    points:
      '1284,1702 1299,1720 1282,1774 1256,1801 1251,1840 1374,2027 1376,2059 1334,2148 1297,2168 1188,2185 1157,2252 1098,2283 1053,2336 1004,2336 907,2248 826,2208 726,2201 637,2122 598,2118 481,2050 488,1929 563,1869 654,1827 679,1764 744,1707 852,1753 910,1757 949,1784 1130,1806 1175,1842 1227,1847 1252,1821 1284,1702',
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
    color: '#166534',
    gallery: [],
    mapIcon: '🧵',
    centroid: { x: 711, y: 553 },
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
    color: '#1e3a5f',
    gallery: [],
    mapIcon: '🏛️',
    centroid: { x: 1277, y: 718 },
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
    color: '#9a3412',
    gallery: [],
    mapIcon: '🍽️',
    centroid: { x: 985, y: 945 },
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
    color: '#7e22ce',
    gallery: [],
    mapIcon: '🏺',
    centroid: { x: 621, y: 1197 },
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
    color: '#be185d',
    gallery: [],
    mapIcon: '🎺',
    centroid: { x: 1016, y: 1578 },
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
    color: '#0f766e',
    gallery: [],
    mapIcon: '🌿',
    centroid: { x: 934, y: 2010 },
  },
};
