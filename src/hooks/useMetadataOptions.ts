import { useEffect, useState, useCallback } from 'react';
import { metadataRepository as defaultRepo } from '../services/metadata';
import type { IMetadataRepository, MetadataCategory } from '../services/metadata/types';

export interface UseMetadataOptionsResult {
  brands: string[];
  colors: string[];
  sizes: string[];
  tags: string[];
  addOption: (category: MetadataCategory, name: string) => Promise<string>;
}

export function useMetadataOptions(
  repository: IMetadataRepository = defaultRepo
): UseMetadataOptionsResult {
  const [brands, setBrands] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const unsubBrands = repository.subscribe('brands', setBrands);
    const unsubColors = repository.subscribe('colors', setColors);
    const unsubSizes = repository.subscribe('sizes', setSizes);
    const unsubTags = repository.subscribe('tags', setTags);

    return () => {
      unsubBrands();
      unsubColors();
      unsubSizes();
      unsubTags();
    };
  }, [repository]);

  const addOption = useCallback(
    async (category: MetadataCategory, name: string) => {
      return await repository.addOption(category, name);
    },
    [repository]
  );

  return {
    brands,
    colors,
    sizes,
    tags,
    addOption,
  };
}
