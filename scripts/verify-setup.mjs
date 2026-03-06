/**
 * Viaxo AI Dashboard - Setup Verification Script
 * 
 * Run this after downloading/cloning to verify everything is in place:
 *   node scripts/verify-setup.mjs
 * 
 * What it checks:
 *   1. All required public assets exist (agent avatars, logo)
 *   2. Dependencies are installed
 *   3. Build environment is ready
 * 
 * If assets are missing, it generates placeholder SVGs so the app still renders.
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

const requiredAssets = [
  "public/agents/marnie.png",
  "public/agents/dave.png",
  "public/agents/luna.png",
  "public/agents/sadie.png",
  "public/agents/paul.png",
  "public/images/viaxo-ai-logo.png",
]

const requiredDirs = [
  "public/agents",
  "public/images",
]

console.log("=== Viaxo AI Dashboard - Setup Verification ===\n")

// Step 1: Ensure directories exist
let dirsCreated = 0
for (const dir of requiredDirs) {
  const fullPath = path.join(root, dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
    dirsCreated++
    console.log(`  [CREATED] ${dir}/`)
  } else {
    console.log(`  [OK]      ${dir}/`)
  }
}

// Step 2: Check assets
console.log("\nAssets:")
let missingAssets = []
for (const asset of requiredAssets) {
  const fullPath = path.join(root, asset)
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath)
    console.log(`  [OK]      ${asset} (${(stats.size / 1024).toFixed(1)}KB)`)
  } else {
    missingAssets.push(asset)
    console.log(`  [MISSING] ${asset}`)
  }
}

// Step 3: Generate placeholder SVG avatars for any missing agent images
if (missingAssets.length > 0) {
  console.log(`\n${missingAssets.length} asset(s) missing. Generating placeholders...\n`)
  
  const agentColors = {
    marnie: "#b45309",
    dave: "#2563eb",
    luna: "#7c3aed",
    sadie: "#db2777",
    paul: "#d97706",
  }
  
  for (const asset of missingAssets) {
    const fullPath = path.join(root, asset)
    const dir = path.dirname(fullPath)
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // For agent avatars, create an SVG placeholder
    if (asset.includes("/agents/")) {
      const name = path.basename(asset, ".png")
      const initial = name[0].toUpperCase()
      const color = agentColors[name] || "#6b7280"
      
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="64" fill="${color}"/>
  <text x="64" y="72" font-family="system-ui, sans-serif" font-size="52" font-weight="700" fill="white" text-anchor="middle">${initial}</text>
</svg>`
      
      fs.writeFileSync(fullPath.replace(".png", ".svg"), svg)
      console.log(`  [GENERATED] ${asset.replace(".png", ".svg")} (SVG placeholder)`)
      console.log(`    NOTE: Replace with real .png avatar for production.`)
    }
    
    // For logo, create a simple placeholder
    if (asset.includes("viaxo-ai-logo")) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" viewBox="0 0 200 60">
  <rect width="200" height="60" rx="8" fill="#0d0d0d"/>
  <text x="100" y="38" font-family="system-ui, sans-serif" font-size="24" font-weight="800" fill="#d4a018" text-anchor="middle">VIAXO</text>
</svg>`
      
      fs.writeFileSync(fullPath.replace(".png", ".svg"), svg)
      console.log(`  [GENERATED] ${asset.replace(".png", ".svg")} (SVG placeholder)`)
    }
  }
}

// Step 4: Check dependencies
console.log("\nDependencies:")
const nodeModules = path.join(root, "node_modules")
if (fs.existsSync(nodeModules)) {
  console.log("  [OK]      node_modules/ exists")
} else {
  console.log("  [MISSING] node_modules/ -- run: pnpm install")
}

const lockFile = path.join(root, "pnpm-lock.yaml")
const lockFileNpm = path.join(root, "package-lock.json")
if (fs.existsSync(lockFile)) {
  console.log("  [OK]      pnpm-lock.yaml")
} else if (fs.existsSync(lockFileNpm)) {
  console.log("  [OK]      package-lock.json (using npm)")
} else {
  console.log("  [INFO]    No lock file found. Run: pnpm install")
}

// Step 5: Check .env (optional)
console.log("\nEnvironment:")
const envFile = path.join(root, ".env.local")
if (fs.existsSync(envFile)) {
  console.log("  [OK]      .env.local exists")
} else {
  console.log("  [INFO]    No .env.local found (not required for demo mode)")
}

// Summary
console.log("\n=== Summary ===")
if (missingAssets.length === 0) {
  console.log("All assets present. Ready to run!\n")
  console.log("  pnpm install   # if not done yet")
  console.log("  pnpm dev       # start dev server")
  console.log("  pnpm build     # production build")
} else {
  console.log(`${missingAssets.length} asset(s) were missing and have SVG placeholders.`)
  console.log("The app will render with fallback initials where images are missing.")
  console.log("Replace placeholder SVGs with real PNGs for production.\n")
  console.log("  pnpm install   # install dependencies")
  console.log("  pnpm dev       # start dev server")
}
console.log("")
