// Results of the embedding-model comparison on
// content/5.benchmarks/5.embedding-models.md; the tables on that page hold
// the same numbers.

export interface EmbeddingModelResult {
  /** The short name the article's tables use. */
  name: string
  /** jscpd's default model. */
  isDefault?: boolean
  /** Rosetta Code recall at jina-v2's precision. */
  recallAcross: number
  recallWithin: number
  /** Share of duplicates among 30 blind-judged pairs, in percent, with its margin. */
  duplicateShare: number
  duplicateMargin: number
  /** Pairs reported on the 14 projects every model finished. */
  pairs: number
  /** pairs × duplicate share. */
  estimatedDuplicates: number
  /** Median cosine of a function and its partner, and of the closest impostor. */
  partnerCosine: number
  impostorCosine: number
  /** The calibrated threshold for a pair across languages. */
  threshold: number
}

export const embeddingModels: EmbeddingModelResult[] = [
  { name: 'jina-v2', recallAcross: 0.538, recallWithin: 0.374, duplicateShare: 83, duplicateMargin: 7, pairs: 2613, estimatedDuplicates: 2178, partnerCosine: 0.69, impostorCosine: 0.51, threshold: 0.6 },
  { name: 'CodeRankEmbed', isDefault: true, recallAcross: 0.565, recallWithin: 0.380, duplicateShare: 93, duplicateMargin: 5, pairs: 2935, estimatedDuplicates: 2739, partnerCosine: 0.54, impostorCosine: 0.34, threshold: 0.4125 },
  { name: 'jina-code-0.5b', recallAcross: 0.587, recallWithin: 0.460, duplicateShare: 83, duplicateMargin: 7, pairs: 3006, estimatedDuplicates: 2505, partnerCosine: 0.70, impostorCosine: 0.46, threshold: 0.5625 },
  { name: 'Qwen3-0.6B', recallAcross: 0.576, recallWithin: 0.423, duplicateShare: 80, duplicateMargin: 7, pairs: 3133, estimatedDuplicates: 2506, partnerCosine: 0.70, impostorCosine: 0.51, threshold: 0.5875 },
  { name: 'SFR-Code-400M', recallAcross: 0.532, recallWithin: 0.417, duplicateShare: 90, duplicateMargin: 5, pairs: 2394, estimatedDuplicates: 2155, partnerCosine: 0.80, impostorCosine: 0.72, threshold: 0.7375 },
  { name: 'gte-modernbert', recallAcross: 0.535, recallWithin: 0.325, duplicateShare: 87, duplicateMargin: 6, pairs: 2645, estimatedDuplicates: 2292, partnerCosine: 0.75, impostorCosine: 0.65, threshold: 0.6875 },
  { name: 'codesage-small-v2', recallAcross: 0.579, recallWithin: 0.356, duplicateShare: 67, duplicateMargin: 9, pairs: 3074, estimatedDuplicates: 2049, partnerCosine: 0.49, impostorCosine: 0.25, threshold: 0.3125 },
  { name: 'granite-r2', recallAcross: 0.507, recallWithin: 0.350, duplicateShare: 70, duplicateMargin: 8, pairs: 2770, estimatedDuplicates: 1939, partnerCosine: 0.88, impostorCosine: 0.83, threshold: 0.8625 },
  { name: 'bge-m3', recallAcross: 0.440, recallWithin: 0.288, duplicateShare: 80, duplicateMargin: 7, pairs: 2384, estimatedDuplicates: 1907, partnerCosine: 0.71, impostorCosine: 0.66, threshold: 0.7 },
]
