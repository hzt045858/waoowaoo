#!/usr/bin/env node

import { createRequire } from 'module'
import process from 'process'
import { pathToFileURL } from 'url'

const require = createRequire(import.meta.url)
const core = require('./task-submit-compensation-guard-core.cjs')

export const inspectTaskSubmitCompensation = core.inspectTaskSubmitCompensation
export const findTaskSubmitCompensationViolations = core.findTaskSubmitCompensationViolations
export const main = core.main

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
}
