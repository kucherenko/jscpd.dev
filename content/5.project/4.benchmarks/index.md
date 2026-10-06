---
title: Benchmarks
description: How jscpd v5 compares to other copy/paste detectors in speed, format coverage and token efficiency.
navigation:
  icon: i-lucide-gauge
seo:
  title: Benchmarks — jscpd
  description: Benchmark comparisons of jscpd v5 against 5 other copy/paste detection tools, in detection speed, multi-format support and AI token efficiency.
---

jscpd v5 is benchmarked against five other copy/paste detection tools (jscpd-rs, Duplo, Simian, PMD CPD, and Fallow) across three dimensions:

- [Detection speed](/project/benchmarks/detection-speed): jscpd@5 completes in 84ms, the only tool under 100ms and 428× faster than PMD CPD
- [Multi-format detection](/project/benchmarks/cross-format): clones across Vue, Svelte, Astro and Markdown blocks
- [AI token efficiency](/project/benchmarks/ai-token-efficiency): the `ai` reporter needs an eighth of the console reporter's tokens on the benchmark corpus, and about 79% fewer on the smaller fixtures run

[Embedding Models](/project/benchmarks/embedding-models) compares nine open embedding models inside jscpd's experimental `--semantic` mode, with the thresholds each one needs.

All benchmarks include full methodology and raw data.
