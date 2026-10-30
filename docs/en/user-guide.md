# User Guide

> **Version 0.1.0**

## 1. Overview

CF-Panel is a desktop application for exploring IQ-TREE concordance factor analysis results. It provides three linked views to help researchers intuitively understand concordance and conflict between gene trees and species trees.

## 2. Interface Layout

### 2.1 Top Toolbar

| Feature | Description |
|---------|-------------|
| 📁 Open Directory | Select an IQ-TREE output directory; auto-detects CF files |
| 📄 Open Files | Manually select one or more CF files |
| 📊 Example Data | Load built-in bird_400 example dataset |
| 💾 Export CSV | Export 33-column CF vectors (32 + Label) as CSV |
| ✕ Clear | Clear current data, return to welcome screen |
| 🧬/🧪/⬡ | Switch Gene / Site / Quartet CF type |
| ⊞🌲△📋 | Switch view mode (All/Tree/Ternary/Table) |
| 🇬🇧/🇨🇳 | Switch language (English/Chinese) |
| 🌙/☀️ | Switch theme (Dark/Light) |

### 2.2 Tree Canvas

The tree canvas renders the phylogenetic tree as SVG/Canvas (auto-selected based on branch count):

- **Branch coloring**: Based on current CF type; higher Ψ₁ (concordance) = greener, lower = redder
- **Branch IDs**: Numbers displayed above internal nodes
- **Leaf labels**: Taxon names shown on the right
- **Interactions**:
  - Click branch: Select and link other views
  - Hover branch: Highlight and link ternary plot and table
  - Ctrl+Drag: Pan the canvas
  - Scroll: Zoom
  - Control buttons (top-right): Zoom in/out/reset
- **Settings panel** (gear icon):
  - Layout: Rectangular, Unrooted, or Circular
  - Branch length: Toggle use branch lengths or cladogram mode
  - Color scheme: Heatmap, Rainbow, Blue-Red, or Monochrome
  - Branch width: Adjustable slider (0.5-5px)
  - Font size: Adjustable label font size (6-24px)
  - Font color: Custom color picker
  - Show/hide leaf labels and branch IDs
- **Search box** (top-left): Search branches by name or ID, with optional regex mode
- **Resizable panels**: Drag dividers between panels to adjust their relative sizes

### 2.3 Ternary Plot

The ternary plot projects each branch's Ψ₁/Ψ₂/Ψ₃ values (normalized) onto an equilateral triangle:

- **Ψ₁ (concordance)**: Bottom-left vertex
- **Ψ₂ (major discordance)**: Bottom-right vertex
- **Ψ₃ (minor discordance)**: Top vertex
- **Interactions**:
  - Click point: Select branch and link
  - Hover point: Show tooltip (branch ID, Ψ values)
  - Other points fade when a branch is selected

### 2.4 Vector Table

The vector table displays complete CF vector data:

- **Dynamic columns**: Different columns shown based on current CF type
  - Gene: gΨ₁/gΨ₂/gΨ₃/gΨ₄/gN
  - Site: sΨ₁/sΨ₂/sΨ₃/sΨ₄/sN
  - Quartet: qΨ₁/qΨ₂/qΨ₃/qΨ₄/qN/qpp₁/qpp₂/qpp₃
  - Always shown: Subs/site, Coalescent
- **Features**:
  - Search: Filter by keyword
  - Sort: Click column header to sort
  - Pagination: 50 rows per page
  - Click row: Select branch and link

### 2.5 Branch Detail Panel

After selecting a branch, the right panel shows:

- **Heatmap**: Ψ₁/Ψ₂/Ψ₃/Ψ₄ values for the current CF type, color intensity = magnitude
- **Type comparison table**: Side-by-side Ψ values for Gene/Site/Quartet
- **Branch lengths**:
  - Subs/site: from scfl.cf.stat
  - Coalescent: from coalescent_bl.cf.stat
- **Posterior probabilities**: pp₁/pp₂/pp₃ for Quartet type

## 3. Data Loading

### 3.1 Auto-Detection (Recommended)

Click "Open Directory" and select the IQ-TREE output directory. CF-Panel auto-detects these files:

| Filename | Required | Description |
|----------|----------|-------------|
| `gcf.cf.stat` | Yes | Gene concordance statistics (12 columns) |
| `scfl.cf.stat` | Yes | Site concordance statistics (10 columns) |
| `coalescent_bl.cf.stat` | No | Coalescent branch length statistics |
| `gcf.cf.tree` | No | Newick tree with labels |
| `gcf.cf.branch` | No | Newick tree with branch IDs |

### 3.2 Manual File Selection

Click "Open Files" to select one or more CF files. CF-Panel auto-identifies file types based on filenames.

### 3.3 Example Data

Click "Example Data" to load the built-in bird_400 dataset (from IQ-TREE recipe, MIT license), containing 363 branches of complete CF analysis output.

## 4. CF Type Explanation

### 4.1 Gene CF (gCF)

Gene concordance factor, from `gcf.cf.stat`:

- **Ψ₁ = gCF**: Proportion of gene trees concordant with the reference tree
- **Ψ₂ = max(gDF1, gDF2)**: Major discordance (larger value after sorting)
- **Ψ₃ = min(gDF1, gDF2)**: Minor discordance (smaller value after sorting)
- **Ψ₄ = gDFP**: All other discordance
- **N = gN**: Total number of gene trees

### 4.2 Site CF (sCF)

Site concordance factor, from `scfl.cf.stat`:

- **Ψ₁ = sCF**: Proportion of sites concordant with the reference tree
- **Ψ₂ = max(sDF1, sDF2)**: Major discordance
- **Ψ₃ = min(sDF1, sDF2)**: Minor discordance
- **Ψ₄ = 0** (no fourth component at site level)
- **N = sN**: Number of sampled sites

### 4.3 Quartet CF (qCF)

Quartet concordance factor, extracted from the Label column annotation in `scfl.cf.stat`:

- **Ψ₁ = 100 × q1**: Concordant quartet frequency
- **Ψ₂ = 100 × max(q2, q3)**: Major discordance
- **Ψ₃ = 100 × min(q2, q3)**: Minor discordance
- **Ψ₄ = 0**
- **N = EN**: Effective sample size
- **pp₁/pp₂/pp₃**: Posterior probabilities

## 5. Export

Click "Export CSV" to export the currently loaded 33-column CF vectors (32 + Label) as a CSV file, aligned with Lanfear's `concordance_vector.R` script output format.

## 6. Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| ↑ | Select previous branch |
| ↓ | Select next branch |
| Ctrl + Drag | Pan tree canvas |
| Scroll | Zoom tree canvas |
