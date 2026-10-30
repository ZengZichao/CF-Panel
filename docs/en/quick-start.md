# Quick Start

> **Version 0.1.0**

## 5-Minute Guide

### Step 1: Launch CF-Panel

Upon launch, you'll see a welcome screen with three entry points:

- **Load Example Data** — Built-in bird_400 dataset (363 branches), experience all features without any external files
- **Open IQ-TREE Output Directory** — Select a folder containing CF analysis output
- **Select Individual Files** — Manually select CF files

### Step 2: Load Data

**Click "Load Example Data" first** — it's the fastest way to explore CF-Panel's features.

If you have your own IQ-TREE output:

1. Click "Open Directory"
2. Select the directory containing these files:
   - `gcf.cf.stat` — Gene concordance statistics
   - `scfl.cf.stat` — Site concordance statistics
   - `coalescent_bl.cf.stat` — Coalescent branch length statistics
   - `gcf.cf.tree` — Newick tree with labels
   - `gcf.cf.branch` — Newick tree with branch IDs

### Step 3: Three-View Linked Exploration

After loading, the main interface shows three linked views:

| View | Function |
|------|----------|
| **🌲 Tree Canvas** | Phylogenetic tree SVG/Canvas rendering with branch-level CF coloring |
| **△ Ternary Plot** | Ψ₁/Ψ₂/Ψ₃ scatter plot on an equilateral triangle |
| **📋 Vector Table** | 33-column CF vector data (32 + Label), sortable, searchable, paginated |

**Linked interactions:**
- Click a tree branch → Ternary plot highlights corresponding point, table scrolls to corresponding row
- Click a ternary plot point → Tree branch selected, table row highlighted
- Click a table row → Tree branch and ternary plot synchronized
- Press **↑↓** keys to navigate between branches

### Step 4: Switch CF Type

Use the **Gene / Site / Quartet** selector in the top toolbar to switch between three concordance factor types:

- **🧬 Gene** — gCF (gene concordance factor)
- **🧪 Site** — sCF (site concordance factor)
- **⬡ Quartet** — qCF (quartet concordance factor)

All views update their coloring and data columns automatically.

### Step 5: View Branch Details

After clicking any branch, the right panel displays:

- Heatmap of Ψ₁/Ψ₂/Ψ₃/Ψ₄ for the current CF type
- Comparison table across all CF types
- Branch lengths (subs/site, coalescent)
- Quartet posterior probabilities

### Step 6: Export Data

Click the "Export CSV" button to export the 33-column CF vector data (32 + Label) as a CSV file, aligned with Lanfear's `concordance_vector.R` output format.

## View Modes

The view toggle buttons in the top-right corner switch between four modes:

| Icon | Mode | Description |
|------|------|-------------|
| ⊞ | All | Three views + detail panel |
| 🌲 | Tree | Tree canvas only (fullscreen) |
| △ | Ternary | Ternary plot only (fullscreen) |
| 📋 | Table | Vector table only (fullscreen) |

## Theme & Language

- **Theme**: Click the 🌙/☀️ button to toggle dark/light theme
- **Language**: Click the 🇬🇧/🇨🇳 button to toggle English/Chinese
