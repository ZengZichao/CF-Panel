# 安装指南

> **版本：0.1.0**

## 方式一：使用预编译包（推荐）

1. 前往 [Releases 页面](../../releases) 下载对应平台的安装包：
   - **Windows**：`CF-Panel-Setup-0.1.0.exe`（安装版）或 `CF-Panel-0.1.0-portable.exe`（免安装版）
   - **macOS**：`CF-Panel-0.1.0.dmg`
   - **Linux**：`CF-Panel-0.1.0.AppImage` 或 `CF-Panel-0.1.0.deb`

2. **Windows**：双击 `.exe` 文件安装后运行，或直接运行免安装版。
3. **macOS**：双击 `.dmg` 文件，将 CF-Panel 拖入 Applications 文件夹。
4. **Linux**：
   ```bash
   # AppImage
   chmod +x CF-Panel-0.1.0.AppImage
   ./CF-Panel-0.1.0.AppImage

   # deb
   sudo dpkg -i CF-Panel-0.1.0.deb
   ```

## 方式二：从源码构建

### 前置要求

- [Node.js](https://nodejs.org/) 18+（推荐 LTS 版本）
- [npm](https://www.npmjs.com/) 9+ 或 [pnpm](https://pnpm.io/) 8+
- [Git](https://git-scm.com/)

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/cf-panel/cf-panel.git
cd cf-panel

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run dev

# 4. 构建生产版本
npm run build

# 5. 打包当前平台
npm run dist

# 打包特定平台
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

打包后的文件位于 `dist/` 目录下。

## IQ-TREE（可选）

CF-Panel 可以直接解析 IQ-TREE 的输出文件，无需 IQ-TREE 运行在系统中。但如果您希望在 CF-Panel 内直接运行 concordance 分析，则需要安装 IQ-TREE：

- **IQ-TREE 2**：http://www.iqtree.org/
- **IQ-TREE 3**：https://github.com/iqtree/iqtree3

安装后确保 `iqtree2` 或 `iqtree3` 命令在系统 PATH 中可用。CF-Panel 会自动检测已安装的 IQ-TREE 版本。

## 系统要求

| 平台 | 最低要求 | 推荐配置 |
|------|----------|----------|
| Windows | Windows 10 64-bit | Windows 11 64-bit |
| macOS | macOS 11 (Big Sur) | macOS 14 (Sonoma) |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04+ |
| 内存 | 4 GB | 8 GB+ |
| 磁盘 | 200 MB（应用本体） | 1 GB（含示例数据） |
