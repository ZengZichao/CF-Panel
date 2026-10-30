# Installation Guide

> **Version 0.1.0**

## Option 1: Prebuilt Binaries (Recommended)

1. Go to the [Releases page](../../releases) and download the package for your platform:
   - **Windows**: `CF-Panel-Setup-0.1.0.exe` (installer) or `CF-Panel-0.1.0-portable.exe` (portable)
   - **macOS**: `CF-Panel-0.1.0.dmg`
   - **Linux**: `CF-Panel-0.1.0.AppImage` or `CF-Panel-0.1.0.deb`

2. **Windows**: Double-click the `.exe` file to install, or run the portable version directly.
3. **macOS**: Double-click the `.dmg` file, then drag CF-Panel to the Applications folder.
4. **Linux**:
   ```bash
   # AppImage
   chmod +x CF-Panel-0.1.0.AppImage
   ./CF-Panel-0.1.0.AppImage

   # deb
   sudo dpkg -i CF-Panel-0.1.0.deb
   ```

## Option 2: Build from Source

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (LTS recommended)
- [npm](https://www.npmjs.com/) 9+ or [pnpm](https://pnpm.io/) 8+
- [Git](https://git-scm.com/)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/cf-panel/cf-panel.git
cd cf-panel

# 2. Install dependencies
npm install

# 3. Run in development mode
npm run dev

# 4. Build for production
npm run build

# 5. Package for current platform
npm run dist

# Package for a specific platform
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

Packaged files will be in the `dist/` directory.

## IQ-TREE (Optional)

CF-Panel can parse IQ-TREE output files directly without requiring IQ-TREE to be installed. However, if you want to run concordance analysis from within CF-Panel, you need to install IQ-TREE:

- **IQ-TREE 2**: http://www.iqtree.org/
- **IQ-TREE 3**: https://github.com/iqtree/iqtree3

Make sure the `iqtree2` or `iqtree3` command is available in your system PATH. CF-Panel will auto-detect the installed IQ-TREE version.

## System Requirements

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| Windows | Windows 10 64-bit | Windows 11 64-bit |
| macOS | macOS 11 (Big Sur) | macOS 14 (Sonoma) |
| Linux | Ubuntu 20.04 / Debian 11 | Ubuntu 22.04+ |
| RAM | 4 GB | 8 GB+ |
| Disk | 200 MB (app only) | 1 GB (with example data) |
