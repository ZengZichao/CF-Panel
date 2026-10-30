// src/main/iqtree-adapter.ts
// IQ-TREE version adapter pattern — supports IQ-TREE 2 and IQ-TREE 3 CLI differences

export type IQTreeVersion = '2' | '3'

export interface IQTreeRunParams {
  speciesTree: string
  modelFile: string
  geneTrees: string
  outputDir: string
  scflQuartets: number
  threads: string
}

export interface IQTreeStepArgs {
  args: string[]
  description: string
}

export interface IQTreeAdapter {
  /** Detect IQ-TREE version from `--version` output */
  detectVersion(versionString: string): boolean
  /** Build CLI args for step 1: site concordance factor (sCF) analysis */
  buildScflStep(params: IQTreeRunParams): IQTreeStepArgs
  /** Build CLI args for step 2: gene concordance factor (gCF) analysis */
  buildGcfStep(params: IQTreeRunParams): IQTreeStepArgs
  /** Get the expected output file names */
  getOutputFiles(prefix: string): {
    cfStat: string
    cfTree: string
    cfBranch: string
  }
}

// ─── IQ-TREE 2 Adapter ───

export const iqtree2Adapter: IQTreeAdapter = {
  detectVersion(versionString: string): boolean {
    // IQ-TREE 2.x.x format: "IQ-TREE 2.4.0" or includes "iqtree2"
    return /IQ-TREE\s+2\./i.test(versionString) || /iqtree2/i.test(versionString)
  },

  buildScflStep(params: IQTreeRunParams): IQTreeStepArgs {
    const { speciesTree, modelFile, outputDir, scflQuartets, threads } = params
    // IQ-TREE 2 syntax: --scfl <N>
    return {
      args: [
        '-te', speciesTree,
        '-p', modelFile,
        '--scfl', String(scflQuartets),
        '--prefix', `${outputDir}/scfl`,
        '-T', threads || 'AUTO',
      ],
      description: 'IQ-TREE 2: site concordance factor (likelihood-based sCF)',
    }
  },

  buildGcfStep(params: IQTreeRunParams): IQTreeStepArgs {
    const { geneTrees, outputDir, threads } = params
    return {
      args: [
        '-te', `${outputDir}/scfl.cf.tree`,
        '--gcf', geneTrees,
        '--prefix', `${outputDir}/gcf`,
        '-T', threads || 'AUTO',
      ],
      description: 'IQ-TREE 2: gene concordance factor (gCF)',
    }
  },

  getOutputFiles(prefix: string) {
    return {
      cfStat: `${prefix}.cf.stat`,
      cfTree: `${prefix}.cf.tree`,
      cfBranch: `${prefix}.cf.branch`,
    }
  },
}

// ─── IQ-TREE 3 Adapter ───

export const iqtree3Adapter: IQTreeAdapter = {
  detectVersion(versionString: string): boolean {
    // IQ-TREE 3.x.x format: "IQ-TREE 3.1.4" or includes "iqtree3"
    return /IQ-TREE\s+3\./i.test(versionString) || /iqtree3/i.test(versionString)
  },

  buildScflStep(params: IQTreeRunParams): IQTreeStepArgs {
    const { speciesTree, modelFile, outputDir, scflQuartets, threads } = params
    // IQ-TREE 3 syntax differences:
    // - --scfl is now --scfl <N> (same positional, but some builds use --cf-scale)
    // - -p is still supported but --alignment is the preferred long form
    // - --threads replaces -T in some builds, but -T still works
    return {
      args: [
        '-te', speciesTree,
        '-p', modelFile,
        '--scfl', String(scflQuartets),
        '--prefix', `${outputDir}/scfl`,
        '-T', threads || 'AUTO',
      ],
      description: 'IQ-TREE 3: site concordance factor (likelihood-based sCF)',
    }
  },

  buildGcfStep(params: IQTreeRunParams): IQTreeStepArgs {
    const { geneTrees, outputDir, threads } = params
    // IQ-TREE 3: --gcf still works, but also supports --gcf-file as long form
    return {
      args: [
        '-te', `${outputDir}/scfl.cf.tree`,
        '--gcf', geneTrees,
        '--prefix', `${outputDir}/gcf`,
        '-T', threads || 'AUTO',
      ],
      description: 'IQ-TREE 3: gene concordance factor (gCF)',
    }
  },

  getOutputFiles(prefix: string) {
    return {
      cfStat: `${prefix}.cf.stat`,
      cfTree: `${prefix}.cf.tree`,
      cfBranch: `${prefix}.cf.branch`,
    }
  },
}

// ─── Adapter factory ───

const adapters: IQTreeAdapter[] = [iqtree2Adapter, iqtree3Adapter]

export function getAdapter(version: IQTreeVersion): IQTreeAdapter {
  return version === '3' ? iqtree3Adapter : iqtree2Adapter
}

export function detectAdapter(versionString: string): IQTreeAdapter | null {
  for (const adapter of adapters) {
    if (adapter.detectVersion(versionString)) {
      return adapter
    }
  }
  return null
}

export function detectVersionNumber(versionString: string): IQTreeVersion | null {
  const adapter = detectAdapter(versionString)
  if (adapter === iqtree3Adapter) return '3'
  if (adapter === iqtree2Adapter) return '2'
  return null
}
