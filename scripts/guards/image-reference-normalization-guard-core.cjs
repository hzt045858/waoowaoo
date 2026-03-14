/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')
const process = require('process')

const root = process.cwd()

const NORMALIZATION_HELPER_ALLOWLIST = new Set([
  'src/lib/workers/handlers/image-task-handler-shared.ts',
])

const ACCEPTED_NORMALIZATION_MARKERS = [
  /\bnormalizeReferenceImagesForGeneration\s*\(/,
  /\bnormalizeToBase64ForGeneration\s*\(/,
  /\bgenerateLabeledImageToCos\s*\(/,
]

function fail(title, details = []) {
  process.stderr.write(`\n[image-reference-normalization-guard] ${title}\n`)
  for (const detail of details) {
    process.stderr.write(`  - ${detail}\n`)
  }
  process.exit(1)
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === '.next' || entry.name === 'node_modules') continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, out)
      continue
    }
    if (entry.name.endsWith('.ts')) out.push(fullPath)
  }
  return out
}

function usesGenerationReferenceImages(content) {
  return /\bresolveImageSourceFromGeneration\s*\(/.test(content) && /\breferenceImages\s*:/.test(content)
}

function hasNormalizationMarker(content) {
  return ACCEPTED_NORMALIZATION_MARKERS.some((pattern) => pattern.test(content))
}

function inspectImageReferenceNormalization(relPath, content) {
  if (NORMALIZATION_HELPER_ALLOWLIST.has(relPath)) return []
  if (!usesGenerationReferenceImages(content)) return []
  if (hasNormalizationMarker(content)) return []
  return [
    `${relPath} uses resolveImageSourceFromGeneration with referenceImages but does not reference normalizeReferenceImagesForGeneration/normalizeToBase64ForGeneration/generateLabeledImageToCos`,
  ]
}

function findImageReferenceNormalizationViolations(scanRoot = root) {
  const scanDir = path.join(scanRoot, 'src', 'lib', 'workers', 'handlers')
  return walk(scanDir)
    .map((fullPath) => {
      const relPath = path.relative(scanRoot, fullPath).split(path.sep).join('/')
      const content = fs.readFileSync(fullPath, 'utf8')
      return inspectImageReferenceNormalization(relPath, content)
    })
    .flat()
}

function main() {
  const handlersDir = path.join(root, 'src', 'lib', 'workers', 'handlers')
  if (!fs.existsSync(handlersDir)) {
    fail('Missing src/lib/workers/handlers directory')
  }

  const handlerFiles = walk(handlersDir)
  const violations = handlerFiles
    .map((fullPath) => {
      const relPath = path.relative(root, fullPath).split(path.sep).join('/')
      const content = fs.readFileSync(fullPath, 'utf8')
      return inspectImageReferenceNormalization(relPath, content)
    })
    .flat()

  if (violations.length > 0) {
    fail('Found image reference normalization violations', violations)
  }

  process.stdout.write(
    `[image-reference-normalization-guard] OK handlers=${handlerFiles.length} allowlist=${NORMALIZATION_HELPER_ALLOWLIST.size}\n`,
  )
}

module.exports = {
  NORMALIZATION_HELPER_ALLOWLIST,
  findImageReferenceNormalizationViolations,
  inspectImageReferenceNormalization,
  main,
}
