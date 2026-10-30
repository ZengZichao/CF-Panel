// src/main/iqtree-adapter.test.ts
// Unit tests for IQ-TREE adapter pattern

import { describe, it, expect } from 'vitest'
import {
  iqtree2Adapter,
  iqtree3Adapter,
  getAdapter,
  detectAdapter,
  detectVersionNumber,
  type IQTreeRunParams,
} from './iqtree-adapter'

const mockParams: IQTreeRunParams = {
  speciesTree: '/path/to/species.tree',
  modelFile: '/path/to/loci.best_model.nex',
  geneTrees: '/path/to/loci.treefile',
  outputDir: '/path/to/output',
  scflQuartets: 100,
  threads: 'AUTO',
}

describe('iqtree2Adapter', () => {
  it('should detect IQ-TREE 2 version strings', () => {
    expect(iqtree2Adapter.detectVersion('IQ-TREE 2.4.0')).toBe(true)
    expect(iqtree2Adapter.detectVersion('IQ-TREE 2.4.0 COVID-edition')).toBe(true)
  })

  it('should not detect IQ-TREE 3 version strings', () => {
    expect(iqtree2Adapter.detectVersion('IQ-TREE 3.1.4')).toBe(false)
  })

  it('should build sCF step args with --scfl', () => {
    const step = iqtree2Adapter.buildScflStep(mockParams)
    expect(step.args).toContain('--scfl')
    expect(step.args).toContain('100')
    expect(step.args).toContain('-te')
    expect(step.args).toContain('/path/to/species.tree')
    expect(step.args).toContain('-p')
    expect(step.args).toContain('/path/to/loci.best_model.nex')
    expect(step.args).toContain('-T')
    expect(step.args).toContain('AUTO')
  })

  it('should build gCF step args with --gcf', () => {
    const step = iqtree2Adapter.buildGcfStep(mockParams)
    expect(step.args).toContain('--gcf')
    expect(step.args).toContain('/path/to/loci.treefile')
    expect(step.args).toContain('-te')
    expect(step.args[step.args.indexOf('-te') + 1]).toContain('scfl.cf.tree')
  })

  it('should return correct output file names', () => {
    const files = iqtree2Adapter.getOutputFiles('/path/to/prefix')
    expect(files.cfStat).toBe('/path/to/prefix.cf.stat')
    expect(files.cfTree).toBe('/path/to/prefix.cf.tree')
    expect(files.cfBranch).toBe('/path/to/prefix.cf.branch')
  })
})

describe('iqtree3Adapter', () => {
  it('should detect IQ-TREE 3 version strings', () => {
    expect(iqtree3Adapter.detectVersion('IQ-TREE 3.1.4')).toBe(true)
    expect(iqtree3Adapter.detectVersion('IQ-TREE 3.1.4 COVID-edition')).toBe(true)
  })

  it('should not detect IQ-TREE 2 version strings', () => {
    expect(iqtree3Adapter.detectVersion('IQ-TREE 2.4.0')).toBe(false)
  })

  it('should build sCF step args with --scfl', () => {
    const step = iqtree3Adapter.buildScflStep(mockParams)
    expect(step.args).toContain('--scfl')
    expect(step.args).toContain('100')
    expect(step.args).toContain('-te')
    expect(step.args).toContain('-p')
    expect(step.args).toContain('-T')
    expect(step.args).toContain('AUTO')
  })

  it('should build gCF step args with --gcf', () => {
    const step = iqtree3Adapter.buildGcfStep(mockParams)
    expect(step.args).toContain('--gcf')
    expect(step.args).toContain('/path/to/loci.treefile')
    expect(step.args).toContain('-te')
  })

  it('should return correct output file names', () => {
    const files = iqtree3Adapter.getOutputFiles('/path/to/prefix')
    expect(files.cfStat).toBe('/path/to/prefix.cf.stat')
    expect(files.cfTree).toBe('/path/to/prefix.cf.tree')
    expect(files.cfBranch).toBe('/path/to/prefix.cf.branch')
  })
})

describe('adapter factory', () => {
  it('getAdapter should return correct adapter', () => {
    expect(getAdapter('2')).toBe(iqtree2Adapter)
    expect(getAdapter('3')).toBe(iqtree3Adapter)
  })

  it('detectAdapter should detect from version string', () => {
    expect(detectAdapter('IQ-TREE 2.4.0')).toBe(iqtree2Adapter)
    expect(detectAdapter('IQ-TREE 3.1.4')).toBe(iqtree3Adapter)
    expect(detectAdapter('unknown version')).toBeNull()
  })

  it('detectVersionNumber should return version number', () => {
    expect(detectVersionNumber('IQ-TREE 2.4.0')).toBe('2')
    expect(detectVersionNumber('IQ-TREE 3.1.4')).toBe('3')
    expect(detectVersionNumber('unknown')).toBeNull()
  })
})
