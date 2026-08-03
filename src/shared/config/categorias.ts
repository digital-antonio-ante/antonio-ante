/**
 * categorias.ts — Fuente única de verdad para los metadatos visuales de las
 * categorías de eventos y obras.
 *
 * Por qué existe: estos mapas vivían DUPLICADOS como literales en seis archivos
 * (EventoCard, EventoDestacado, eventos/[slug], ObrasGrid, ObraDestacada,
 * obras/[slug]). Además de obligar a editar seis sitios para cambiar un color,
 * ya habían divergido entre sí. Aquí se unifican una sola vez.
 *
 * Los colores NO son hex: son ranuras de la paleta categórica definida en
 * src/styles/global.css (`--color-tag-*`). Se emiten como `var(...)` porque se
 * consumen desde atributos `style` inline, donde la variable de :root resuelve
 * igual que en una hoja de estilos. Cambiar un color de categoría es cambiar el
 * token, no este archivo.
 *
 * Sobre las DOS etiquetas: no es redundancia. `label` es la forma breve que cabe
 * en un chip de filtro o en la esquina de una tarjeta; `labelLargo` es la forma
 * completa de la ficha de detalle y del destacado. La divergencia era real en el
 * código anterior y se conserva a propósito.
 */

export interface CategoriaEvento {
  /** Forma breve — chips de filtro y tarjetas de listado. */
  readonly label: string;
  /** Forma extendida — ficha de detalle y bloque destacado. */
  readonly labelLargo: string;
  readonly emoji: string;
  /** Color de texto/acento — ranura de la paleta categórica. */
  readonly color: string;
  /** Fondo del badge, emparejado con `color` a ≥ 4.5:1. */
  readonly bg: string;
}

export interface CategoriaObra {
  readonly label: string;
  readonly color: string;
  readonly bg: string;
}

export interface EstadoObra {
  readonly label: string;
  readonly color: string;
  /** Color del punto indicador; más claro que `color` en estados inactivos. */
  readonly dot: string;
}

export const CATEGORIAS_EVENTO: Readonly<Record<string, CategoriaEvento>> = {
  feria: {
    label: 'Ferias',
    labelLargo: 'Ferias y exposiciones',
    emoji: '🎪',
    color: 'var(--color-tag-violeta)',
    bg: 'var(--color-tag-violeta-bg)',
  },
  cultura: {
    label: 'Cultura',
    labelLargo: 'Cultura y arte',
    emoji: '🎭',
    color: 'var(--color-tag-rosa)',
    bg: 'var(--color-tag-rosa-bg)',
  },
  deporte: {
    label: 'Deporte',
    labelLargo: 'Deporte y recreación',
    emoji: '🏃',
    color: 'var(--color-tag-azul)',
    bg: 'var(--color-tag-azul-bg)',
  },
  civico: {
    label: 'Cívico',
    labelLargo: 'Cívico',
    emoji: '🏛️',
    color: 'var(--color-tag-verde)',
    bg: 'var(--color-tag-verde-bg)',
  },
  comunitario: {
    label: 'Comunitario',
    labelLargo: 'Comunitario',
    emoji: '🤝',
    color: 'var(--color-tag-ambar)',
    bg: 'var(--color-tag-ambar-bg)',
  },
  agropecuario: {
    label: 'Agropecuario',
    labelLargo: 'Agropecuario',
    emoji: '🌾',
    color: 'var(--color-tag-cian)',
    bg: 'var(--color-tag-cian-bg)',
  },
};

export const CATEGORIAS_OBRA: Readonly<Record<string, CategoriaObra>> = {
  vialidad: {
    label: 'Vialidad',
    color: 'var(--color-tag-azul)',
    bg: 'var(--color-tag-azul-bg)',
  },
  agua: {
    label: 'Agua y saneamiento',
    color: 'var(--color-tag-cian)',
    bg: 'var(--color-tag-cian-bg)',
  },
  educacion: {
    label: 'Educación',
    color: 'var(--color-tag-violeta-deep)',
    bg: 'var(--color-tag-violeta-bg)',
  },
  salud: {
    label: 'Salud',
    color: 'var(--color-tag-rojo)',
    bg: 'var(--color-tag-rojo-bg)',
  },
  espacios_publicos: {
    label: 'Espacios públicos',
    color: 'var(--color-tag-verde)',
    bg: 'var(--color-tag-verde-bg)',
  },
  productividad: {
    label: 'Productividad',
    color: 'var(--color-tag-ambar)',
    bg: 'var(--color-tag-ambar-bg)',
  },
  cultura: {
    label: 'Cultura y deporte',
    color: 'var(--color-tag-violeta)',
    bg: 'var(--color-tag-violeta-bg)',
  },
};

export const ESTADOS_OBRA: Readonly<Record<string, EstadoObra>> = {
  planificada: {
    label: 'Planificada',
    color: 'var(--color-estado-planificada)',
    dot: 'var(--color-neutral-400)',
  },
  en_progreso: {
    label: 'En progreso',
    color: 'var(--color-estado-progreso)',
    dot: 'var(--color-estado-progreso)',
  },
  completada: {
    label: 'Completada',
    color: 'var(--color-estado-completada)',
    dot: 'var(--color-estado-completada)',
  },
};

/**
 * Categoría de evento con respaldo: una categoría que llegue desde Sanity y no
 * esté en el mapa se pinta con el verde de marca en vez de romper la tarjeta.
 */
export function categoriaEvento(slug: string): CategoriaEvento {
  return (
    CATEGORIAS_EVENTO[slug] ?? {
      label: slug,
      labelLargo: slug,
      emoji: '📅',
      color: 'var(--color-brand-primary)',
      bg: 'var(--color-brand-accent)',
    }
  );
}

/** Categoría de obra con respaldo — mismo criterio que `categoriaEvento`. */
export function categoriaObra(slug: string): CategoriaObra {
  return (
    CATEGORIAS_OBRA[slug] ?? {
      label: slug,
      color: 'var(--color-brand-primary)',
      bg: 'var(--color-brand-accent)',
    }
  );
}

/** Estado de obra con respaldo — un estado desconocido se pinta como neutro. */
export function estadoObra(slug: string): EstadoObra {
  return (
    ESTADOS_OBRA[slug] ?? {
      label: slug,
      color: 'var(--color-neutral-500)',
      dot: 'var(--color-neutral-400)',
    }
  );
}

/**
 * Translucidez sobre un color de categoría.
 *
 * Los componentes concatenaban un alfa hexadecimal al valor (`${cat.color}33`).
 * Eso dejó de funcionar cuando los colores pasaron a ser `var(--token)`: no se
 * puede concatenar alfa a una función CSS. `color-mix` hace lo mismo y además
 * funciona con cualquier notación de color.
 *
 * @param color  Color base (token, hex o cualquier color CSS).
 * @param pct    Opacidad resultante en porcentaje (0–100).
 */
export function alfa(color: string, pct: number): string {
  return `color-mix(in srgb, ${color} ${pct}%, transparent)`;
}
