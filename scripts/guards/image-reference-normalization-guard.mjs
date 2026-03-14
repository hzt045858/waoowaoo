#!/usr/bin/env node

import { createRequire } from 'module'
import process from 'process'
import { pathToFileURL } from 'url'

const require = createRequire(import.meta.url)
const core = require('./image-reference-normalization-guard-core.cjs')

export const NORMALIZATION_HELPER_ALLOWLIST = core.NORMALIZATION_HELPER_ALLOWLIST
export const inspectImageReferenceNormalization = core.inspectImageReferenceNormalization
export const findImageReferenceNormalizationViolations = core.findImageReferenceNormalizationViolations
export const main = core.main

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
