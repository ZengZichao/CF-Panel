// src/renderer/lib/example-data.ts
// 内置示例数据加载器
// 通过 Vite 的 ?raw 导入将示例文件嵌入到应用中
// 这样即使没有 IQ-TREE 或外部文件，应用也能正常显示界面和示例数据

import gcfStatRaw from '../example-data/gcf.cf.stat?raw'
import scflStatRaw from '../example-data/scfl.cf.stat?raw'
import cblStatRaw from '../example-data/coalescent_bl.cf.stat?raw'
import gcfTreeRaw from '../example-data/gcf.cf.tree?raw'
import gcfBranchRaw from '../example-data/gcf.cf.branch?raw'
import { parseProject } from './parse'
import type { CFProject } from '../types/cf'

export interface ExampleDataResult {
  project: CFProject
  branchIdTree: string
}

/**
 * 加载内置的 bird_400 示例数据集
 * 数据来源：IQ-TREE recipe 的 bird_400 数据集（MIT 许可）
 * 包含 363 个分支的完整 CF 分析输出
 */
export function loadExampleData(): ExampleDataResult {
  const parsed = parseProject({
    gcfStat: gcfStatRaw,
    scflStat: scflStatRaw,
    cblStat: cblStatRaw,
    gcfTree: gcfTreeRaw,
    gcfBranch: gcfBranchRaw
  })

  return {
    project: parsed,
    branchIdTree: parsed.branchIdTree || parsed.treeNewick
  }
}

export { gcfTreeRaw, gcfBranchRaw }
