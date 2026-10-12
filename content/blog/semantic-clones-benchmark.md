---
title: I ran jscpd --semantic against eight other tools
description: Two days of runs on 50 repositories in 14 languages, 102 candidate tools looked at, eight of them run. Where embeddings win, where a syntax tree beats them, and what changes in jscpd after this.
date: 2026-10-13
publishedAt: 2026-10-13T08:00:00Z
authors:
  - kucherenko
tags:
  - benchmark
  - semantic
navigation: false
seo:
  title: jscpd --semantic against eight other semantic clone finders
  description: A benchmark of jscpd --semantic and eight other tools that look for functions with the same meaning, on 50 repositories in 14 languages, with recall, precision judged blind, speed and the fixes it led to.
---

`--semantic` is the experimental mode of jscpd that looks for functions that do the same thing but are written differently, or in different languages. A validation rule that lives in a Rust backend and again in a Svelte frontend, a port of a library where every function has a twin on the other side. Tokens and syntax trees cannot see that, so jscpd turns every function into a vector of a code embedding model and compares the vectors. I wanted to know how good it is, honestly, so I spent two days running it next to everything comparable I could find. This is what came out.

## What I compared

I went through 102 candidates, CLIs built on embeddings, hybrid detectors, MCP servers, research prototypes. Eight of them run locally on a CPU and give pairs with a place in the code, so those eight went into the benchmark: codedupes, fallow, nose, codebase-memory-mcp, sensegrep, Deslop, clonehunter, and one tool that works through Ollama. Twenty more run locally but did not fit, they give no report of all pairs, no line numbers, compare something other than function bodies, or do not build. The rest fell off at once. 32 are not semantic at all, they match tokens, trees or hashes and call it semantic. 24 are not tools, prototypes without weights, papers, empty repositories. 13 need a paid API, mostly LLM recipes. Three are cloud services, two are gone.

The corpora are 50 repositories. 28 single-language projects, two per language for 14 languages, without tests, vendored and generated code. 10 applications with a backend and a frontend, Go, Python, Ruby, Rust or Kotlin on the server and TypeScript, JavaScript or Swift on the client, the place where validation and formatting rules get written twice. 12 sets of ports, one library implemented in several languages, diff-match-patch, the QR Code generator, Open Location Code, flatbuffers, ANTLR4, markdown-it, esprima, jsonnet and others.

One machine, a Xeon E3-1240 v6 without a GPU, four hardware threads per run, 12 GB of memory and 30 minutes per corpus. Every tool got the settings that make it comparable, cross-language search on where it exists, result limits off, otherwise defaults. Every run starts with an empty cache, and the time includes loading the model.

Recall is measured on clones I planted and on natural ports. A planted clone is a copy of a real function rewritten in another style (R1), with another algorithm (R2), translated into another language (X), or with every name replaced by a random word (S0). The natural ports are the functions of the port sets matched by name. A clone counts as found when a reported pair covers at least 70% of the function, the usual criterion from Bellon's benchmark. Precision is a blind review. From the real reports I took 60 pairs within one language and 40 across languages per tool, mixed across repositories, and an LLM judge with a fixed rubric labelled each pair without knowing the tool or the score. Duplicate means a maintainer would merge them into one implementation. Related means they are connected but do different work, the caller and the callee, encode and decode, two implementations of one interface. Different means no real similarity.

## Across languages nothing comes close

jscpd finds 92% of the translations and 89% of the natural ports, across all 14 languages. The closest is codedupes on its five languages, and only with a review level that is hidden by default. On the same clones it finds 18 translations of 20 against 15 for jscpd, and 376 ports of 409 against 373. The strict precision of that level is 7 to 18%, and without it codedupes finds 40% of the translations and 67% of the ports. Deslop found 63 ports of 150 on the three sets it managed to finish, jscpd 137 on the same three. sensegrep, even with its `--cross-language` flag, found none of 91. The rest almost nothing.

## Rewritten functions: ahead, codedupes close

A function rewritten in another style jscpd finds in 72% of the cases, one rewritten with another algorithm in 67%. codedupes on its languages gets 68% and 58%, and on the same clones it is behind, 53 and 45 against 63 and 56 of 78. fallow, which reads only JavaScript and TypeScript, gets 26% and 37%, nose and codebase-memory-mcp 16 to 22%, sensegrep 17% and 10% on the four corpora it finished, Deslop 4 of 8 and 3 of 7 on its four (jscpd 4 and 4 on the same), clonehunter close to zero.

## Random names break the embeddings

Take a copy where every name is replaced by a random word. The model loses it. `--semantic` finds 13% of those copies, codedupes 42%. The structural tools find almost all of them: `--similarity` 97%, nose 93%, codebase-memory-mcp 86%. sensegrep normalizes names before comparing and found all 13 on its corpora, Deslop compares parse trees next to the embeddings and found all 7 on its corpora, where jscpd found 2.

The two modes of jscpd run in one scan, and together they find 97.7%. That is the practical lesson of the whole exercise, `--semantic` and the structural search are two halves of one job.

```bash
jscpd . --similarity --semantic
```

## It finds more related code than duplicates

The judges called 15% of jscpd's pairs within one language duplicates, and 38% of the pairs across languages. Almost everything else is related code, two implementations of one interface, one skeleton over different fields, a client and its endpoint. Unrelated pairs are rare, 1 of 60 and 6 of 40. The other tools have the same picture, fallow, codebase-memory-mcp, codedupes, clonehunter, sensegrep and Deslop sit at 11 to 20% within a language too. The tools with a high threshold are more precise, nose has 35% and 76%, but they find far less, mostly near-verbatim copies.

Across languages everything depends on the application. In the port sets 15 pairs of 21 are duplicates. In the applications with a backend and a frontend, none of the 19 judged pairs. Those are a server handler and the frontend function that calls it, the same field names, the same words, different work. Three pairs from the reports show the whole picture.

A duplicate across languages, from the esprima port. The constructor of a FunctionExpression node in the Python and the TypeScript parser, cosine 0.89, judged a duplicate. Most cross-language findings in the port sets look like this.

```python
    def __init__(self, id, params, body, generator):
        self.type = Syntax.FunctionExpression
        self.expression = False
        self.isAsync = False
        self.id = id
        self.params = params
        self.body = body
        self.generator = generator
```

```ts
    constructor(id: Identifier | null, params: FunctionParameter[], body: BlockStatement, generator: boolean) {
        this.type = Syntax.FunctionExpression;
        this.id = id;
        this.params = params;
        this.body = body;
        this.generator = generator;
        this.expression = false;
        this.async = false;
    }
```

A related pair across languages, from ntfy. The Go handler that verifies an email token and the frontend function that posts the token to it, cosine 0.61, judged related. Shared words and fields, different work. Nearly every cross-language pair in the applications is of this kind.

```go
func (s *Server) handleAccountEmailVerify(w http.ResponseWriter, r *http.Request, v *visitor) error {
	req, err := readJSONWithLimit[apiAccountEmailVerifyRequest](r.Body, jsonBodyBytesLimit, false)
	if err != nil {
		return err
	} else if req.Token == "" {
		return errHTTPBadRequestEmailVerificationLinkInvalid
	}
	m, err := s.userManager.VerifyEmail(req.Token)
	if errors.Is(err, user.ErrMagicLinkNotFound) {
		return errHTTPBadRequestEmailVerificationLinkInvalid
	} else if err != nil {
		return err
	}
	logvr(v, r).Tag(tagAccount).Field("email", m.Email).Info("Email verified")
	s.publishSyncEventForUserIDAsync(v, m.UserID)
	return s.writeJSON(w, newSuccessResponse())
}
```

```js
  async verifyEmailToken(token) {
    const url = accountEmailVerifyUrl(config.base_url);
    console.log(`[AccountApi] Verifying email token ${url}`);
    await fetchOrThrow(url, {
      method: "POST",
      body: JSON.stringify({
        token,
      }),
    });
  }
```

A related pair within one language, from gin. Render for raw bytes and Render for YAML, cosine 0.73, judged related. One skeleton, different work, and this is the most common pair jscpd reports within a language.

```go
func (r Data) Render(w http.ResponseWriter) (err error) {
	r.WriteContentType(w)
	if len(r.Data) > 0 {
		w.Header().Set("Content-Length", strconv.Itoa(len(r.Data)))
	}
	_, err = w.Write(r.Data)
	return
}
```

```go
func (r YAML) Render(w http.ResponseWriter) error {
	r.WriteContentType(w)

	bytes, err := yaml.Marshal(r.Data)
	if err != nil {
		return err
	}

	_, err = w.Write(bytes)
	return err
}
```

## The cross-language threshold can go up

jscpd reports a cross-language pair from cosine 0.4125, a same-language pair from 0.6375, and on top of that the two functions have to be each other's near-best neighbours and stand out from the rest of their neighbours by three standard deviations. The low cross-language bar is there because functions in different languages always look less alike, whatever they do.

I replayed the reports with the bar at 0.55. Recall barely moves, 68 translations of 75 instead of 69, 1607 ports of 1819 instead of 1615. The share of duplicates among the judged cross-language pairs goes from 38% to 65%, and what drops out is mostly the client and endpoint pairs from the applications, 13 of the 19 go away. Within a language a higher bar does not help, at 0.75 the share of duplicates goes from 15% to 24% and the recall on rewritten functions falls from 72% to 51%. Related pairs need features, not a threshold.

## Speed is the model

jscpd does 63 lines of code per second on four threads. The Ollama-based tool does 63 as well, codedupes on torch 59, fallow 69 but it stops at a million pairs. clonehunter is four times slower, sensegrep with a 0.6B embedding model 10 to 15 times, and Deslop, which sends every subtree of the syntax tree to the model, 40 to 80 times, under a line per second, 40 minutes to two hours for a corpus of two to five thousand lines. `--similarity` and nose work without a neural network and are a thousand times faster.

In practice a project of 25 thousand lines takes six or seven minutes the first time, and the vector cache makes the next run count only the functions that changed.

## What only jscpd has in one place

The model runs inside the process, no Python, no Ollama. 14 languages plus Vue, Svelte and Astro. Cross-language search on by default. SARIF, JSON and HTML reports. In codedupes, Deslop and sensegrep the cross-language search is a separate switch. Deslop, sensegrep and the Ollama-based tool need a model server next to them. fallow reads JavaScript and TypeScript, codedupes five languages, sensegrep four and Vue, codebase-memory-mcp does not compare files with different extensions at all.

This is what a run looks like. The demo shop from the repository has a Rust backend and a Svelte frontend with eight rules written on both sides, and two features written twice within one language. The default scan finds nothing, `--semantic` finds the eight cross-language pairs, and with the same-language bar at 0.55 the two twins come in as well:

```bash
jscpd fixtures/semantic-demo --semantic --semantic-same-threshold 0.55 -r html,json
# Semantic clones (experimental): embedding 38 functions with nomic-ai/CodeRankEmbed on this machine
# Found 10 clones.
```

::report-screenshot
---
light: /images/semantic/demo-report-light.png
width: 1560
height: 1200
href: /examples/semantic-demo.html
link-text: Open the HTML report
alt: "The HTML report of jscpd --semantic on the demo shop: a dashboard with 39 files, 1,514 lines, 10 clones and 194 duplicated lines, the table of formats, and the Rust section listing each pair of functions with a Show code button, the first pair expanded to its code."
caption: "The HTML report of that run: ten pairs, eight across Rust and Svelte and two within one language, each with the code of both sides a click away."
---
::

The same run is there as [JSON](/examples/semantic-demo.json), the shape the SARIF and Code Climate reporters build on, and the demo itself is [fixtures/semantic-demo](https://github.com/kucherenko/jscpd/tree/master/fixtures/semantic-demo) in the repository, with the commands and the expected output in its README.

## What changes in jscpd

In the order of value against effort.

1. The cross-language threshold goes from 0.4125 to 0.55. Recall stays, precision goes from 38% to 65%.
2. A client and its endpoint should not pass as a duplicate. The sign is there, the same API path or the same DTO field name in the string literals on both sides. The threshold removes two thirds of these pairs, the rest get a kind of their own or a lower rank.
3. The rule that the two functions must not call each other gets wider. Right now only a plain call by name counts, and the function's own name is skipped so that a port is not taken for a call. So delegation to a method of the same name, `Engine.addRoute` calling `this.router.addRoute`, a constructor call that is not linked to the class, and a thin wrapper in between all slip through.
4. Related pairs within a language get their own kind or at least their own place in the list, below the duplicates. Two implementations of one interface, one skeleton over different fields, the caller and the callee. The analogs do this in different ways, codedupes grades pairs by whether tokens and structure confirm them, sensegrep names the kind of the finding, fallow shows a confidence band.
5. The docs will say to run `--semantic` together with `--similarity`, and the structural pass may just come along with `--semantic`.
6. Speed. The batch is limited to 2048 tokens, so long functions go three or four at a time, and the CPU sits at 2.9 of 4. A bigger budget is worth a try. int8 quantization is not, the author of decombine reports that the int8 version of the same model breaks while fp16 works.
7. Two small things in the reports. The summary line of the silent and markdown reporters says "exact clones" even when every clone is semantic, and the JSON reporter writes a Vue or Svelte block as `File.vue:typescript` while the line numbers belong to the whole file.

## What this benchmark does not prove

The rewrites and translations were made by an LLM. I checked a hundred of them, all equivalent to the original, but the text usually keeps the skeleton, a human would rewrite more freely. The random names test is harder than a real rename, real names keep their meaning. The port pairs were matched by name, and some of them have drifted apart over the years, so the recall on them is an upper bound. The precision samples are small and the judge is a model, not a person. Every tool ran with its defaults, and both recall and precision depend on the threshold. And there was no GPU, with one the embedding tools would have different speeds.

If you use `--semantic`, the setup is in the [semantic clones guide](/guides/semantic-clones), and the [embedding models benchmark](/project/benchmarks/embedding-models) explains why CodeRankEmbed is the default model. The threshold change and the report fixes will be in the next release. If you want the raw numbers of a particular tool or corpus, ask in the comments and I will post them.
