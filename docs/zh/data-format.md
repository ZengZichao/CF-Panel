# 数据格式说明

> **版本：0.1.0**

## 1. IQ-TREE 输出文件

CF-Panel 解析 IQ-TREE `--gcf` / `--scf` / `--scfl` 生成的 5 类文件：

### 1.1 `gcf.cf.stat`

**格式**：制表符分隔，`#` 开头的行为注释

**列**：12 列

| 列名 | 类型 | 说明 |
|------|------|------|
| ID | int | 分支 ID（与 cf.branch 中的 label 对应） |
| gCF | float | 基因一致性因子（百分比） |
| gCF_N | float | 一致基因树数量 |
| gDF1 | float | 第一冲突因子（百分比） |
| gDF1_N | float | 第一冲突基因树数量 |
| gDF2 | float | 第二冲突因子（百分比） |
| gDF2_N | float | 第二冲突基因树数量 |
| gDFP | float | 全部其他冲突因子（百分比） |
| gDFP_N | float | 全部其他冲突基因树数量 |
| gN | int | 基因树总数 |
| Label | string | quartet 注解标签 |
| Length | float | 分支长度（替换/位点） |

**Label 列格式**：
```
'[q1=0.8398;q2=0.0857;q3=0.0744;f1=296.48;f2=30.25;f3=26.27;pp1=1.0;pp2=0.0;pp3=0.0;QC=721240;EN=353.0]'/51.5
```

- 方括号内为 quartet 注解：
  - `q1/q2/q3`：quartet 频率（0-1）
  - `f1/f2/f3`：quartet 计数
  - `pp1/pp2/pp3`：后验概率
  - `QC`：quartet count 总数
  - `EN`：有效 N
- 斜杠后的数字为 bootstrap 值

### 1.2 `scfl.cf.stat`

**格式**：制表符分隔，`#` 开头的行为注释

**列**：10 列

| 列名 | 类型 | 说明 |
|------|------|------|
| ID | int | 分支 ID |
| sCF | float | 位点一致性因子（百分比） |
| sCF_N | float | 一致位点数量 |
| sDF1 | float | 第一冲突因子（百分比） |
| sDF1_N | float | 第一冲突位点数量 |
| sDF2 | float | 第二冲突因子（百分比） |
| sDF2_N | float | 第二冲突位点数量 |
| sN | int | 采样位点数 |
| Label | string | quartet 注解标签 |
| Length | float | 分支长度（替换/位点） |

### 1.3 `coalescent_bl.cf.stat`

**格式**：与 `scfl.cf.stat` 相同

**区别**：`Length` 列为 coalescent branch length（溯祖分支长度），而非 substitution rate length

### 1.4 `gcf.cf.tree`

**格式**：Newick

**分支标签格式**：
```
'[q1=0.9972;q2=7.9e-6;...]'/82.4/99.7
```
- 方括号内为 quartet 注解（同上）
- 斜杠后依次为 sCF 和 gCF 值

### 1.5 `gcf.cf.branch`

**格式**：Newick

**分支标签格式**：
```
382
```
- 仅为分支 ID 数字，作为 cf.stat 文件中 ID 列的 join 键

## 2. CF-Panel 输出格式

### 2.1 33 列 CF 向量

CF-Panel 构建的 CF 向量与 Lanfear 的 `concordance_vector.R` 输出对齐，共 33 列（32 + Label）：

```
ID,
gene_psi1, gene_psi2, gene_psi3, gene_psi4,
gene_psi1_N, gene_psi2_N, gene_psi3_N, gene_psi4_N, gene_N,
site_psi1, site_psi2, site_psi3, site_psi4,
site_psi1_N, site_psi2_N, site_psi3_N, site_psi4_N, site_N,
quartet_psi1, quartet_psi2, quartet_psi3, quartet_psi4,
quartet_psi1_N, quartet_psi2_N, quartet_psi3_N, quartet_psi4_N, quartet_N,
quartet_psi1_pp, quartet_psi2_pp, quartet_psi3_pp,
length_subs_per_site, length_coalescent
```

### 2.2 Ψ 值映射规则

#### Gene（来自 gcf.cf.stat）

| Ψ | 公式 | 说明 |
|-----|------|------|
| Ψ₁ | gCF | 一致性因子 |
| Ψ₂ | max(gDF1, gDF2) | 主要冲突（排序后较大值） |
| Ψ₃ | min(gDF1, gDF2) | 次要冲突（排序后较小值） |
| Ψ₄ | gDFP | 全部其他冲突 |

#### Site（来自 scfl.cf.stat）

| Ψ | 公式 | 说明 |
|-----|------|------|
| Ψ₁ | sCF | 一致性因子 |
| Ψ₂ | max(sDF1, sDF2) | 主要冲突 |
| Ψ₃ | min(sDF1, sDF2) | 次要冲突 |
| Ψ₄ | 0 | 位点层面不存在第四分量 |

#### Quartet（从 Label 注解提取）

| Ψ | 公式 | 说明 |
|-----|------|------|
| Ψ₁ | round(100 × q1, 2) | 一致四分组频率 |
| Ψ₂ | round(100 × max(q2, q3), 2) | 主要冲突 |
| Ψ₃ | round(100 × min(q2, q3), 2) | 次要冲突 |
| Ψ₄ | 0 | 不存在第四分量 |
| Ψ₁_N | round(f1, 2) | 一致四分组计数 |
| Ψ₂_N | round(max(f2, f3), 2) | 主要冲突计数 |
| Ψ₃_N | round(min(f2, f3), 2) | 次要冲突计数 |
| N | round(EN, 1) | 有效样本量 |
| pp₁ | round(pp1, 1) | 一致后验概率 |
| pp₂ | round(max(pp2, pp3), 1) | 主要冲突后验概率 |
| pp₃ | round(min(pp2, pp3), 1) | 次要冲突后验概率 |

### 2.3 Join 逻辑

1. 以 `scfl.cf.stat` 为主表（R 脚本中 scv 是 left join 的左表）
2. 按 ID 列 left join `gcf.cf.stat`（Gene 数据）
3. 按 ID 列 left join `coalescent_bl.cf.stat`（溯祖分支长度）
4. 从 `scfl.cf.stat` 的 Label 列提取 Quartet 注解

## 3. 示例数据

内置的 bird_400 数据集来自 IQ-TREE recipe（MIT 许可），包含 363 个分支的完整 CF 分析输出。
