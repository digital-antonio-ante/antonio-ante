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
}

/**
 * Colores de identidad — derivados del mapa ilustrado del cantón.
 *
 * Cada parroquia se pinta en el mapa con su propio degradado; el color de aquí
 * es ese mismo tono llevado al punto en que alcanza contraste AA (≥ 4,5:1) sobre
 * texto blanco, porque se usa como fondo de las etiquetas de tipo. Así, al pulsar
 * una zona del mapa, el panel se tiñe del mismo color que se acaba de pulsar.
 *
 * Imbaya es la excepción: su amarillo (#fdc800) es inutilizable bajo texto blanco,
 * así que toma el ámbar oscuro equivalente en lugar del rojo del final de su
 * degradado, que se confundiría con Atuntaqui.
 */
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
    color: '#c60000',
    gallery: [],
    mapIcon: '🧵',
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
    color: '#bd3770',
    gallery: [],
    mapIcon: '🏛️',
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
    color: '#00873a',
    gallery: [],
    mapIcon: '🍽️',
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
    color: '#1b5d80',
    gallery: [],
    mapIcon: '🏺',
  },
  san_roque: {
    id: 'san_roque',
    name: 'San Roque',
    type: 'Rural',
    shortDesc: 'Tradición y música',
    description:
      'Destacada por su arraigada tradición musical. Representa la alegría de su gente a través de sus bandas y festividades.',
    population: '~10.200 hab.',
    altitude: '2.450 m s. n. m.',
    activities: ['Música', 'Artesanía', 'Comercio'],
    projects: ['Renovación del Parque Central', 'Escuela de Artes Populares', 'Centro de Eventos'],
    color: '#0b5c2e',
    gallery: [],
    mapIcon: '🎺',
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
    color: '#b45309',
    gallery: [],
    mapIcon: '🌿',
  },
};
