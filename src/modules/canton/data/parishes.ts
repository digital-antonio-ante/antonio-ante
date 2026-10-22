/** Un plan concreto para el visitante: qué hacer, no a qué se dedica la parroquia. */
export interface PlanParroquia {
  emoji: string;
  titulo: string;
  detalle: string;
}

export interface ParishData {
  id: string;
  name: string;
  type: 'Urbana' | 'Rural';
  /**
   * Una o dos frases para quien piensa venir. Es también la meta description
   * de la ficha y el texto del panel del mapa en la portada.
   */
  description: string;
  shortDesc: string;
  population?: string;
  altitude?: string;
  /** Temas cortos: «Compras», «Historia»… */
  idealPara: string[];
  /** ¿Qué hacer aquí? */
  planes: PlanParroquia[];
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
 *
 * Textos (oct-2026): solo lo que respaldan fuentes públicas — páginas de
 * parroquias del Municipio, PDOT de Imbaya 2024-2027, Ministerio de Cultura y
 * prensa. Nada de superlativos sin fuente (ver tests/textos-verificados.test.ts).
 */
export const PARISHES: Record<string, ParishData> = {
  atuntaqui: {
    id: 'atuntaqui',
    name: 'Atuntaqui',
    type: 'Urbana',
    // «Siempre de moda» ya va dibujado en su lockup: aquí no se repite.
    shortDesc: 'Centro de la moda',
    description:
      'Más de 150 almacenes de ropa hecha en el cantón, la Expo de Carnaval y la fritada con helado de crema del centro.',
    population: '23.851 hab.',
    altitude: '2.406 m s. n. m.',
    idealPara: ['Compras', 'Gastronomía', 'Fiestas'],
    planes: [
      {
        emoji: '🛍️',
        titulo: 'Compra ropa en el centro textil',
        detalle:
          'Más de 150 almacenes con ropa confeccionada en el cantón. En Carnaval llega la Expo, con desfiles y más de 160 expositores.',
      },
      {
        emoji: '🍦',
        titulo: 'Prueba la fritada y los helados de crema',
        detalle: 'Con los dulces de siempre: suspiros, mojicones, panuchas y rosquetes.',
      },
      {
        emoji: '⛪',
        titulo: 'Visita el Santuario del Señor del Santo Sepulcro',
        detalle: 'El templo principal de Atuntaqui, levantado desde finales del siglo XIX.',
      },
      {
        emoji: '🎭',
        titulo: 'Vive el Fin de Año',
        detalle:
          'Del 27 de diciembre al 7 de enero, la fiesta de Inocentes y Fin de Año —Patrimonio Cultural Inmaterial— llena las calles de comparsas.',
      },
    ],
    color: '#c60000',
    gallery: [],
    mapIcon: '🧵',
  },
  andrade_marin: {
    id: 'andrade_marin',
    name: 'Andrade Marín',
    type: 'Urbana',
    shortDesc: 'Cuna de la Fábrica Imbabura',
    description:
      'Recorre gratis la antigua Fábrica Imbabura, hoy complejo cultural y museo, y llega a ella en el Tren Tayta Imbabura desde Ibarra.',
    population: '3.891 hab.',
    altitude: '2.410 m s. n. m.',
    idealPara: ['Historia', 'Museos', 'Tren'],
    planes: [
      {
        emoji: '🏭',
        titulo: 'Recorre la Fábrica Imbabura',
        detalle:
          'Construida en 1924, es el único Patrimonio Cultural Industrial del Ecuador. Hoy es museo: maquinaria textil de principios del siglo XX, salas de historia y el Teatro LIA. Entrada gratuita.',
      },
      {
        emoji: '🚂',
        titulo: 'Llega en el Tren Tayta Imbabura',
        detalle:
          'Sale de Ibarra y termina en la antigua fábrica. Consulta los horarios antes de viajar.',
      },
      {
        emoji: '⛪',
        titulo: 'Santuario de la Virgen de Lourdes',
        detalle: 'El santuario mariano de la parroquia.',
      },
      {
        emoji: '⛰️',
        titulo: 'Tolas Orozcotola y Pupotola',
        detalle:
          'Montículos prehispánicos que, según la tradición local, guardan al rey Cacha y a su hija Pacha.',
      },
    ],
    color: '#bd3770',
    gallery: [],
    mapIcon: '🏛️',
  },
  chaltura: {
    id: 'chaltura',
    name: 'Chaltura',
    type: 'Rural',
    shortDesc: 'Capital del cuy',
    description:
      'El pueblo de la gente feliz: cuy frito en paila, con papas, mote y choclo, en la ruta del cuy y el Complejo La Hornilla.',
    population: '3.068 hab.',
    altitude: '2.340 m s. n. m.',
    idealPara: ['Gastronomía', 'Fin de semana'],
    planes: [
      {
        emoji: '🍽️',
        titulo: 'Come cuy en la ruta del cuy',
        detalle:
          'Cuy frito en paila con papas, tostado, mote y choclo. En el Complejo La Hornilla, junto al Parque de la Familia, atienden más de una decena de emprendimientos.',
      },
      {
        emoji: '🎪',
        titulo: 'Ven a la Feria Gastronómica',
        detalle: 'En septiembre, productores y cocineros de la zona llenan el parque central.',
      },
      {
        emoji: '🍨',
        titulo: 'Pasea por el parque y sus heladerías',
        detalle:
          'El parque central con su iglesia y el Parque de la Familia, para bajar el almuerzo.',
      },
    ],
    color: '#00873a',
    gallery: [],
    mapIcon: '🍽️',
  },
  natabuela: {
    id: 'natabuela',
    name: 'Natabuela',
    type: 'Rural',
    shortDesc: 'Pueblo de los antepasados',
    description:
      'Su nombre une «antepasados» y «comunidad». Vive su Inti Raymi en junio, las fiestas de San Francisco en octubre y el Camino Real en las faldas del Imbabura.',
    population: '5.651 hab.',
    altitude: '2.400 m s. n. m.',
    idealPara: ['Cultura viva', 'Fiestas', 'Caminatas'],
    planes: [
      {
        emoji: '☀️',
        titulo: 'Inti Raymi del pueblo Natabuela',
        detalle: 'En junio, danzas circulares y chicha de jora para celebrar la cosecha.',
      },
      {
        emoji: '🎆',
        titulo: 'Fiestas de San Francisco',
        detalle:
          'A inicios de octubre: pregón, quema de chamiza, paseo del chagra y toros populares.',
      },
      {
        emoji: '🥾',
        titulo: 'Camina el Camino Real',
        detalle:
          'En las faldas del Imbabura, la ruta por la que pasaron las tropas de Bolívar y Sucre.',
      },
      {
        emoji: '🌽',
        titulo: 'Prueba la cocina del maíz',
        detalle: 'Cuy con papas, mote, aguacate y queso, fritada y chicha de jora.',
      },
    ],
    color: '#1b5d80',
    gallery: [],
    mapIcon: '🏺',
  },
  san_roque: {
    id: 'san_roque',
    name: 'San Roque',
    type: 'Rural',
    shortDesc: 'Tejidos y tradición',
    description:
      'Tapices de cabuya, ponchos de lana y el Inti Raymi de sus comunidades, en las faldas del volcán Imbabura.',
    population: '10.142 hab.',
    altitude: '2.450 m s. n. m.',
    idealPara: ['Artesanía', 'Cultura viva', 'Montaña'],
    planes: [
      {
        emoji: '🧶',
        titulo: 'Conoce los tejidos de cabuya',
        detalle: 'Tapices, alfombras y hamacas tejidos en telares de madera.',
      },
      {
        emoji: '🧣',
        titulo: 'Lleva artesanía de lana',
        detalle: 'Ponchos, chalinas y tapices de los talleres de la parroquia.',
      },
      {
        emoji: '☀️',
        titulo: 'Inti Raymi en las comunidades',
        detalle:
          'La Esperanza lo celebra en junio, Pucará en julio y Agualongo de Paredes en agosto.',
      },
      {
        emoji: '🌋',
        titulo: 'Mira el Imbabura de cerca',
        detalle: 'La parroquia sube por las faldas del volcán hasta más de 4.600 metros.',
      },
    ],
    color: '#0b5c2e',
    gallery: [],
    mapIcon: '🧶',
  },
  imbaya: {
    id: 'imbaya',
    name: 'Imbaya',
    type: 'Rural',
    shortDesc: 'Valle de tierra fértil',
    description:
      'Un valle de clima cálido entre los ríos Ambi, Chorlaví y Tahuando: papas asadas, tripa mishky y la vida tranquila del campo.',
    population: '1.279 hab.',
    altitude: '2.300 m s. n. m.',
    idealPara: ['Campo', 'Gastronomía', 'Tranquilidad'],
    planes: [
      {
        emoji: '🥔',
        titulo: 'Papas asadas y tripa mishky',
        detalle: 'Los platos del centro parroquial, junto a la fritada y el cuy.',
      },
      {
        emoji: '🌳',
        titulo: 'Parque central e iglesia',
        detalle: 'El corazón de la parroquia y el escenario de sus fiestas.',
      },
      {
        emoji: '🎉',
        titulo: 'Fiestas de San Luis Gonzaga',
        detalle:
          'Las patronales, en junio. Hasta 1945 Imbaya se llamó San Luis de Cobuendo: es la parroquia más joven del cantón.',
      },
      {
        emoji: '🍊',
        titulo: 'Caña de azúcar y cítricos',
        detalle: 'Un valle cálido y agrícola, rodeado por los ríos Ambi, Chorlaví y Tahuando.',
      },
    ],
    color: '#b45309',
    gallery: [],
    mapIcon: '🌿',
  },
};
