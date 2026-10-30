// src/renderer/lib/parse.test.ts
// Unit tests for parse.ts — Newick parser, cf.stat parser, vector builder
// Uses Vitest with bird_400 dataset fixtures

import { describe, it, expect } from 'vitest'
import {
  parseCfStat,
  parseNewick,
  buildVectors,
  parseProject,
  getTernaryCoords,
  getPsiValues,
  getColorByScheme,
} from './parse'

// ──────────────────────────────────────────────
// Test fixtures (mini bird_400-like data)
// ──────────────────────────────────────────────

const GCF_STAT = `# IQ-TREE 2.4.0 concordance factor
# ...
ID\tgCF\tgCF_N\tgDF1\tgDF1_N\tgDF2\tgDF2_N\tgDFP\tgDFP_N\tgN\tLabel\tLength
1\t99.70\t398\t0.50\t2\t0.30\t1\t0.50\t2\t400\t[q1=0.9972;q2=7.9e-6;q3=2.8e-6;f1=296.48;f2=30.25;f3=26.27;pp1=1.0;pp2=0.0;pp3=0.0;QC=721240;EN=353.0]/99.7\t0.012345
2\t51.50\t206\t30.20\t121\t18.30\t73\t0\t0\t400\t[q1=0.8398;q2=0.0857;q3=0.0744;f1=296.48;f2=30.25;f3=26.27;pp1=1.0;pp2=0.0;pp3=0.0;QC=721240;EN=353.0]/51.5\t0.023456
3\t1.15\t4.6\t48.30\t193.2\t50.55\t202.2\t0\t0\t400\t[q1=0.0115;q2=0.4830;q3=0.5055;f1=4.6;f2=193.2;f3=202.2;pp1=0.01;pp2=0.45;pp3=0.54;QC=721240;EN=353.0]/1.15\t0.034567`

const SCFL_STAT = `# IQ-TREE 2.4.0 likelihood-based sCF
# ...
ID\tsCF\tsCF_N\tsDF1\tsDF1_N\tsDF2\tsDF2_N\tsN\tLabel\tLength
1\t98.50\t348.0\t1.20\t4.2\t0.30\t1.1\t353\t[q1=0.9972;q2=7.9e-6;q3=2.8e-6;f1=296.48;f2=30.25;f3=26.27;pp1=1.0;pp2=0.0;pp3=0.0;QC=721240;EN=353.0]/99.7\t0.012345
2\t49.20\t173.7\t30.10\t106.3\t20.70\t73.0\t353\t[q1=0.8398;q2=0.0857;q3=0.0744;f1=296.48;f2=30.25;f3=26.27;pp1=1.0;pp2=0.0;pp3=0.0;QC=721240;EN=353.0]/51.5\t0.023456
3\t1.05\t3.7\t50.30\t177.6\t48.65\t171.7\t353\t[q1=0.0115;q2=0.4830;q3=0.5055;f1=4.6;f2=193.2;f3=202.2;pp1=0.01;pp2=0.45;pp3=0.54;QC=721240;EN=353.0]/1.15\t0.034567`

const CBL_STAT = `# Coalescent branch lengths
# ...
ID\tsCF\tsCF_N\tsDF1\tsDF1_N\tsDF2\tsDF2_N\tsN\tLabel\tLength
1\t98.50\t348.0\t1.20\t4.2\t0.30\t1.1\t353\t[q1=0.9972;q2=7.9e-6;q3=2.8e-6;f1=296.48;f2=30.25;f3=26.27;pp1=1.0;pp2=0.0;pp3=0.0;QC=721240;EN=353.0]/99.7\t0.567890
2\t49.20\t173.7\t30.10\t106.3\t20.70\t73.0\t353\t[q1=0.8398;q2=0.0857;q3=0.0744;f1=296.48;f2=30.25;f3=26.27;pp1=1.0;pp2=0.0;pp3=0.0;QC=721240;EN=353.0]/51.5\t0.678901
3\t1.05\t3.7\t50.30\t177.6\t48.65\t171.7\t353\t[q1=0.0115;q2=0.4830;q3=0.5055;f1=4.6;f2=193.2;f3=202.2;pp1=0.01;pp2=0.45;pp3=0.54;QC=721240;EN=353.0]/1.15\t0.789012`

const NEWICK_SIMPLE = '(A:0.1,(B:0.2,C:0.3):0.4);'
const NEWICK_WITH_LABELS = "('[q1=0.8;q2=0.1;q3=0.1]'/82.4/99.7:0.1,Tip_B:0.2);"
const NEWICK_WITH_BRANCH_IDS = '(1:0.1,(2:0.2,3:0.3)4:0.4);'

// ──────────────────────────────────────────────
// cf.stat parser tests
// ──────────────────────────────────────────────

describe('parseCfStat', () => {
  it('should parse gcf.cf.stat with 12 columns', () => {
    const rows = parseCfStat(GCF_STAT)
    expect(rows).toHaveLength(3)
    expect(rows[0].id).toBe(1)
    expect(rows[0].gCF).toBe(99.70)
    expect(rows[0].gCF_N).toBe(398)
    expect(rows[0].gDF1).toBe(0.50)
    expect(rows[0].gDF2).toBe(0.30)
    expect(rows[0].gDFP).toBe(0.50)
    expect(rows[0].gN).toBe(400)
    expect(rows[0].length).toBe(0.012345)
  })

  it('should parse scfl.cf.stat with 10 columns', () => {
    const rows = parseCfStat(SCFL_STAT)
    expect(rows).toHaveLength(3)
    expect(rows[0].id).toBe(1)
    expect(rows[0].sCF).toBe(98.50)
    expect(rows[0].sCF_N).toBe(348.0)
    expect(rows[0].sDF1).toBe(1.20)
    expect(rows[0].sDF2).toBe(0.30)
    expect(rows[0].sN).toBe(353)
  })

  it('should skip comment lines starting with #', () => {
    const rows = parseCfStat(GCF_STAT)
    expect(rows).toHaveLength(3)
    // All rows should have valid IDs
    for (const row of rows) {
      expect(row.id).toBeGreaterThan(0)
    }
  })

  it('should handle empty content', () => {
    const rows = parseCfStat('')
    expect(rows).toHaveLength(0)
  })

  it('should parse Label column with quartet annotation', () => {
    const rows = parseCfStat(SCFL_STAT)
    expect(rows[0].label).toContain('[q1=0.9972')
    expect(rows[0].label).toContain('EN=353.0]')
  })
})

// ──────────────────────────────────────────────
// Newick parser tests
// ──────────────────────────────────────────────

describe('parseNewick', () => {
  it('should parse simple Newick tree', () => {
    const { rootNode } = parseNewick(NEWICK_SIMPLE)
    expect(rootNode).toBeDefined()
    expect(rootNode.children).toHaveLength(2)
    expect(rootNode.children[0].name).toBe('A')
    expect(rootNode.children[0].branchLength).toBe(0.1)
    expect(rootNode.children[0].isLeaf).toBe(true)
  })

  it('should parse nested structure', () => {
    const { rootNode } = parseNewick(NEWICK_SIMPLE)
    const secondChild = rootNode.children[1]
    expect(secondChild.isLeaf).toBe(false)
    expect(secondChild.children).toHaveLength(2)
    expect(secondChild.children[0].name).toBe('B')
    expect(secondChild.children[1].name).toBe('C')
  })

  it('should parse branch IDs from internal nodes', () => {
    const { rootNode, branchIdMap } = parseNewick(NEWICK_WITH_BRANCH_IDS)
    expect(branchIdMap.size).toBeGreaterThan(0)
    expect(branchIdMap.has(1)).toBe(true)
    expect(branchIdMap.has(4)).toBe(true)
  })

  it('should handle quoted labels with brackets', () => {
    const { rootNode } = parseNewick(NEWICK_WITH_LABELS)
    expect(rootNode).toBeDefined()
    expect(rootNode.children.length).toBeGreaterThan(0)
  })

  it('should parse trailing semicolon-less strings', () => {
    const { rootNode } = parseNewick('(A:0.1,B:0.2)')
    expect(rootNode.children).toHaveLength(2)
  })

  it('should handle empty or whitespace strings', () => {
    const { rootNode } = parseNewick(';')
    expect(rootNode).toBeDefined()
  })
})

// ──────────────────────────────────────────────
// Vector builder tests
// ──────────────────────────────────────────────

describe('buildVectors', () => {
  const gcfRows = parseCfStat(GCF_STAT)
  const scflRows = parseCfStat(SCFL_STAT)
  const cblRows = parseCfStat(CBL_STAT)

  it('should produce vectors with all 32 columns', () => {
    const vectors = buildVectors(gcfRows, scflRows, cblRows)
    expect(vectors).toHaveLength(3)
    const v = vectors[0]
    // Gene psi values
    expect(v.genePsi1).toBe(99.70)
    expect(v.genePsi2).toBe(Math.max(0.50, 0.30)) // 0.50
    expect(v.genePsi3).toBe(Math.min(0.50, 0.30)) // 0.30
    expect(v.genePsi4).toBe(0.50)
    expect(v.geneN).toBe(400)
    // Site psi values
    expect(v.sitePsi1).toBe(98.50)
    expect(v.sitePsi2).toBe(Math.max(1.20, 0.30)) // 1.20
    expect(v.sitePsi3).toBe(Math.min(1.20, 0.30)) // 0.30
    expect(v.sitePsi4).toBe(0)
    expect(v.siteN).toBe(353)
  })

  it('should extract quartet annotation from Label', () => {
    const vectors = buildVectors(gcfRows, scflRows, cblRows)
    const v = vectors[0]
    expect(v.quartetPsi1).toBeCloseTo(99.72, 1)
    // q2 and q3 are very small for branch 1 (near 1.0 concordance), but should still be ordered
    expect(v.quartetPsi2).toBeGreaterThanOrEqual(v.quartetPsi3)
    expect(v.quartetN).toBeCloseTo(353, 0)
  })

  it('should set lengthSubsPerSite from scfl.cf.stat', () => {
    const vectors = buildVectors(gcfRows, scflRows, cblRows)
    expect(vectors[0].lengthSubsPerSite).toBe(0.012345)
  })

  it('should set lengthCoalescent from coalescent_bl.cf.stat', () => {
    const vectors = buildVectors(gcfRows, scflRows, cblRows)
    expect(vectors[0].lengthCoalescent).toBe(0.567890)
  })

  it('should handle missing gcf rows gracefully', () => {
    const vectors = buildVectors([], scflRows, cblRows)
    expect(vectors).toHaveLength(3)
    expect(vectors[0].genePsi1).toBe(0)
    expect(vectors[0].geneN).toBe(0)
  })

  it('should handle missing cbl rows gracefully', () => {
    const vectors = buildVectors(gcfRows, scflRows, [])
    expect(vectors).toHaveLength(3)
    expect(vectors[0].lengthCoalescent).toBe(0)
  })

  it('should sort psi2 >= psi3 (matching R script behavior)', () => {
    const vectors = buildVectors(gcfRows, scflRows, cblRows)
    for (const v of vectors) {
      expect(v.genePsi2).toBeGreaterThanOrEqual(v.genePsi3)
      expect(v.sitePsi2).toBeGreaterThanOrEqual(v.sitePsi3)
      expect(v.quartetPsi2).toBeGreaterThanOrEqual(v.quartetPsi3)
    }
  })
})

// ──────────────────────────────────────────────
// parseProject integration test
// ──────────────────────────────────────────────

describe('parseProject', () => {
  it('should parse complete project from all files', () => {
    const project = parseProject({
      gcfStat: GCF_STAT,
      scflStat: SCFL_STAT,
      cblStat: CBL_STAT,
      gcfTree: NEWICK_SIMPLE,
      gcfBranch: NEWICK_WITH_BRANCH_IDS,
    })
    expect(project.vectors).toHaveLength(3)
    expect(project.treeNewick).toBe(NEWICK_SIMPLE)
    expect(project.branchIdTree).toBe(NEWICK_WITH_BRANCH_IDS)
  })

  it('should handle missing optional files', () => {
    const project = parseProject({
      scflStat: SCFL_STAT,
    })
    expect(project.vectors).toHaveLength(3)
    expect(project.treeNewick).toBe('')
  })
})

// ──────────────────────────────────────────────
// Ternary coordinate tests
// ──────────────────────────────────────────────

describe('getTernaryCoords', () => {
  it('should return center for zero values', () => {
    const { x, y } = getTernaryCoords(0, 0, 0)
    expect(x).toBeCloseTo(0.3333, 3)
    expect(y).toBeCloseTo(0.3333, 3)
  })

  it('should place pure psi1 at bottom-left', () => {
    const { x, y } = getTernaryCoords(100, 0, 0)
    expect(x).toBeCloseTo(0, 1)
    expect(y).toBeCloseTo(0, 1)
  })

  it('should place pure psi2 at bottom-right', () => {
    const { x, y } = getTernaryCoords(0, 100, 0)
    expect(x).toBeCloseTo(1, 1)
    expect(y).toBeCloseTo(0, 1)
  })

  it('should place pure psi3 at top', () => {
    const { x, y } = getTernaryCoords(0, 0, 100)
    expect(x).toBeCloseTo(0.5, 1)
    expect(y).toBeCloseTo(Math.sqrt(3) / 2, 2)
  })
})

// ──────────────────────────────────────────────
// Color scheme tests
// ──────────────────────────────────────────────

describe('getColorByScheme', () => {
  it('should return gray for zero values', () => {
    expect(getColorByScheme(0, 0, 0, 0, 'heat')).toBe('#5a5a5a')
  })

  it('should return valid rgb string for heat scheme', () => {
    const color = getColorByScheme(80, 10, 10, 0, 'heat')
    expect(color).toMatch(/^rgb\(/)
  })

  it('should return valid rgb string for rainbow scheme', () => {
    const color = getColorByScheme(80, 10, 10, 0, 'rainbow')
    expect(color).toMatch(/^rgb\(/)
  })

  it('should return valid rgb string for blueRed scheme', () => {
    const color = getColorByScheme(50, 30, 20, 0, 'blueRed')
    expect(color).toMatch(/^rgb\(/)
  })

  it('should return valid rgb string for monochrome scheme', () => {
    const color = getColorByScheme(80, 10, 10, 0, 'monochrome')
    expect(color).toMatch(/^rgb\(/)
  })
})

// ──────────────────────────────────────────────
// getPsiValues tests
// ──────────────────────────────────────────────

describe('getPsiValues', () => {
  const mockVector = {
    id: 1,
    genePsi1: 80, genePsi2: 10, genePsi3: 5, genePsi4: 5,
    genePsi1N: 320, genePsi2N: 40, genePsi3N: 20, genePsi4N: 20, geneN: 400,
    sitePsi1: 70, sitePsi2: 20, sitePsi3: 10, sitePsi4: 0,
    sitePsi1N: 280, sitePsi2N: 80, sitePsi3N: 40, sitePsi4N: 0, siteN: 400,
    quartetPsi1: 90, quartetPsi2: 7, quartetPsi3: 3, quartetPsi4: 0,
    quartetPsi1N: 300, quartetPsi2N: 23, quartetPsi3N: 10, quartetPsi4N: 0,
    quartetN: 353, quartetPsi1Pp: 1.0, quartetPsi2Pp: 0, quartetPsi3Pp: 0,
    lengthSubsPerSite: 0.01, lengthCoalescent: 0.5,
  } as any

  it('should return gene psi values', () => {
    const psi = getPsiValues(mockVector, 'gene')
    expect(psi.psi1).toBe(80)
    expect(psi.psi2).toBe(10)
  })

  it('should return site psi values', () => {
    const psi = getPsiValues(mockVector, 'site')
    expect(psi.psi1).toBe(70)
    expect(psi.psi2).toBe(20)
  })

  it('should return quartet psi values', () => {
    const psi = getPsiValues(mockVector, 'quartet')
    expect(psi.psi1).toBe(90)
    expect(psi.psi2).toBe(7)
  })
})
