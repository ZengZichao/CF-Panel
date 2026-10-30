# FAQ

> **Version 0.1.0**

## 1. General

### Q: Does CF-Panel support both IQ-TREE 2 and IQ-TREE 3?

A: Yes. The file formats CF-Panel parses (`gcf.cf.stat`, `scfl.cf.stat`, etc.) are compatible between IQ-TREE 2 and 3. If IQ-TREE 3 changes output formats, the parser layer uses an adapter pattern for easy adaptation.

### Q: Does CF-Panel require IQ-TREE to be installed?

A: No. CF-Panel can parse existing IQ-TREE output files directly. IQ-TREE is only needed if you want to run concordance analysis from within CF-Panel.

### Q: What operating systems are supported?

A: Windows 10+, macOS 11+, Linux (Ubuntu 20.04+/Debian 11+).

### Q: Is CF-Panel free?

A: Yes. CF-Panel is licensed under MIT and is completely free and open source.

## 2. Data Loading

### Q: What file formats are supported?

A: CF-Panel parses the following IQ-TREE output files:
- `gcf.cf.stat` (required)
- `scfl.cf.stat` (required)
- `coalescent_bl.cf.stat` (optional)
- `gcf.cf.tree` (optional)
- `gcf.cf.branch` (optional)

### Q: I get "No valid CF data found" after opening a directory

A: Check that the selected directory contains `gcf.cf.stat` and `scfl.cf.stat` files. These are required. If filenames differ, use "Open Files" to select them manually.

### Q: Can I load only some files?

A: Yes. Use the "Open Files" button to select the files you need. CF-Panel auto-identifies file types by filename. Missing files' corresponding columns will show as 0.

### Q: What is the example data?

A: The bird_400 dataset from the IQ-TREE recipe (MIT license), containing 363 branches of complete CF analysis output. You can experience all features without any external files.

## 3. Features

### Q: What do Ψ₁/Ψ₂/Ψ₃/Ψ₄ represent?

A:
- **Ψ₁**: Concordance factor — proportion concordant with the reference tree
- **Ψ₂**: Major discordance — max(DF1, DF2)
- **Ψ₃**: Minor discordance — min(DF1, DF2)
- **Ψ₄**: All-other discordance (gene type only), 0 for other types

### Q: What do the points in the ternary plot represent?

A: Each point represents an internal branch. Its position is determined by the normalized Ψ₁/Ψ₂/Ψ₃ values. Closer to the bottom-left vertex (Ψ₁) means higher concordance; closer to the bottom-right or top means more discordance.

### Q: What is the exported CSV format?

A: 33-column CSV (32 + Label), aligned with Lanfear's `concordance_vector.R` script output. Includes ID, Label, gene/site/quartet Ψ values and N values, posterior probabilities, and branch lengths.

### Q: How do I switch language?

A: Click the 🇬🇧/🇨🇳 button in the top-right corner to toggle English/Chinese. The preference is persisted to browser storage.

### Q: How do I switch theme?

A: Click the 🌙/☀️ button in the top-right corner to toggle dark/light theme. The preference is persisted.

## 4. Performance

### Q: Will it lag with large trees?

A: CF-Panel uses SVG/Canvas rendering (auto-selected based on branch count), which performs well for trees up to ~1000 branches. Larger trees can use zoom and pan.

### Q: How large a dataset can it handle?

A: Tested with 363 branches (bird_400 dataset) with smooth rendering. It can theoretically parse thousands of branches, but rendering performance may be limited.

## 5. Relationship with Other Tools

### Q: How does CF-Panel relate to Lanfear's concordance_vectors R script?

A: CF-Panel's parser layer is semantically aligned with Lanfear's R script output. The exported CSV file can be directly compared with the R script's output for validation.

### Q: How does CF-Panel differ from FigTree/iTOL/Dendroscope?

A: CF-Panel is designed specifically for concordance factor analysis, solving the problem that FigTree/iTOL/Dendroscope cannot correctly parse cf.tree slash labels, and provides three-view linked exploration.

### Q: How does CF-Panel relate to IQ-TREE?

A: CF-Panel is an independent third-party tool that does not include IQ-TREE source code. CF-Panel parses IQ-TREE output files and can also serve as a CLI wrapper to call IQ-TREE for concordance analysis.
