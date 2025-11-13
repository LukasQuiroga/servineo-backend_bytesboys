// services/common/search.service.ts
export class SearchService {
  /**
   * Búsqueda básica con regex simple
   */
  static build(searchText: string | undefined, fields: string[]): any {
    if (!searchText?.trim()) return {};

    const regex = new RegExp(searchText.trim(), 'i');
    return {
      $or: fields.map((field) => ({ [field]: regex })),
    };
  }

  /**
   * Búsqueda con normalizador (para acentos, etc)
   */
  static buildWithNormalizer(
    searchText: string | undefined,
    fields: string[],
    normalizer: (text: string) => string,
  ): any {
    if (!searchText?.trim()) return {};

    const normalized = normalizer(searchText.trim());
    const regex = new RegExp(normalized, 'i');
    return {
      $or: fields.map((field) => ({ [field]: regex })),
    };
  }

  /**
   * Búsqueda por tokens (palabras separadas)
   * Busca documentos que contengan TODOS los tokens
   */
  static buildTokenSearch(
    searchText: string | undefined,
    fields: string[],
    normalizer?: (text: string) => string,
  ): any {
    if (!searchText?.trim()) return {};

    const tokens = searchText
      .trim()
      .split(/[\s,\-_.]+/)
      .filter((token) => token.length > 0);

    if (tokens.length === 0) return {};

    // Si solo hay un token, usar búsqueda simple
    if (tokens.length === 1) {
      const token = tokens[0];
      const basePattern = normalizer ? normalizer(token) : token;

      // Use word-boundary matching for single-token searches on all fields to avoid
      // matching substrings inside other words (e.g. 'ana' matching 'ventanas').
      const bounded = `\\b${basePattern}\\b`;

      return {
        $or: fields.map((field) => ({ [field]: new RegExp(bounded, 'i') })),
      };
    }

    // Múltiples tokens: cada campo debe contener TODOS los tokens
    return {
      $or: fields.map((field) => ({
        $and: tokens.map((token) => {
          const part = normalizer ? normalizer(token) : token;
          const pattern = `\\b${part}\\b`;
          return { [field]: new RegExp(pattern, 'i') };
        }),
      })),
    };
  }

  /**
   * Búsqueda inteligente: detecta si debe buscar por tokens o simple
   */
  static buildSmartSearch(
    searchText: string | undefined,
    fields: string[],
    normalizer?: (text: string) => string,
  ): any {
    if (!searchText?.trim()) return {};

    const trimmed = searchText.trim();

    // Si contiene separadores, usar búsqueda por tokens
    if (/[,\-_.\s]/.test(trimmed)) {
      return this.buildTokenSearch(trimmed, fields, normalizer);
    }

    // Búsqueda simple
    const pattern = normalizer ? normalizer(trimmed) : trimmed;
    const bounded = `\\b${pattern}\\b`;
    return {
      $or: fields.map((field) => ({ [field]: new RegExp(bounded, 'i') })),
    };
  }

  static buildWeightedSearch(searchText: string | undefined): Record<string, unknown> {
    if (!searchText?.trim()) return {};

    // Para usar con MongoDB text index. _fieldsConfig is ignored here but kept
    // for callers that pass a config (compatibility).
    return {
      $text: { $search: searchText.trim() },
    };
  }
}
