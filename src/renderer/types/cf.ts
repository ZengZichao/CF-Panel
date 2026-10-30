// src/renderer/types/cf.ts
// Concordance Factor 数据类型定义
// 与 Lanfear 的 concordance_vectors.csv 32 列语义对齐

export interface CFVector {
  id: number;                    // IQ-TREE branch ID

  // Gene concordance (from gcf.cf.stat)
  genePsi1: number; genePsi2: number; genePsi3: number; genePsi4: number;
  genePsi1N: number; genePsi2N: number; genePsi3N: number; genePsi4N: number;
  geneN: number;

  // Site concordance (from scfl.cf.stat)
  sitePsi1: number; sitePsi2: number; sitePsi3: number; sitePsi4: number;
  sitePsi1N: number; sitePsi2N: number; sitePsi3N: number; sitePsi4N: number;
  siteN: number;

  // Quartet concordance (extracted from Label annotation in cf.stat)
  quartetPsi1: number; quartetPsi2: number; quartetPsi3: number; quartetPsi4: number;
  quartetPsi1N: number; quartetPsi2N: number; quartetPsi3N: number; quartetPsi4N: number;
  quartetN: number;
  quartetPsi1Pp: number; quartetPsi2Pp: number; quartetPsi3Pp: number;

  // Branch lengths
  lengthSubsPerSite: number;     // from scfl.cf.stat Length column
  lengthCoalescent: number;      // from coalescent_bl.cf.stat Length column

  // Original Label annotation (from cf.stat)
  label: string;

  // Source file availability flags (for capability detection)
  hasGcfStat: boolean;
  hasScflStat: boolean;
  hasCblStat: boolean;
}

export interface CFProject {
  treeNewick: string;           // 来自 gcf.cf.tree（含 sCF/gCF 标签）
  branchIdTree: string;         // 来自 gcf.cf.branch（含分支 ID）
  vectors: CFVector[];          // 32 列向量数据
  hasGcfStat: boolean;          // gcf.cf.stat 是否存在
  hasScflStat: boolean;         // scfl.cf.stat 是否存在
  hasCblStat: boolean;          // coalescent_bl.cf.stat 是否存在
}

export type CFType = 'gene' | 'site' | 'quartet'

export type TreeLayoutType = 'rectangular' | 'unrooted' | 'circular'

export type ColorSchemeType = 'rainbow' | 'heat' | 'blueRed' | 'monochrome'

export interface TreeNode {
  name: string;
  branchId: number | null;     // 内部分支 ID (来自 cf.branch 的 label)
  branchLength: number;
  label: string;               // 原始标签
  children: TreeNode[];
  parent: TreeNode | null;
  isLeaf: boolean;
  // 布局坐标
  x: number;
  y: number;
  angle: number;
  // 环形树布局用的半径
  radius: number;
  // 环形布局圆心（仅根节点携带，供弧线渲染 / 弧线命中测试使用）
  cx?: number;
  cy?: number;
  // 关联的 CF 向量
  vector?: CFVector;
}
