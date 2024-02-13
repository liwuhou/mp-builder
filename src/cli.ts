#!/usr/bin/env node

import inquirer from 'inquirer'
import { checkVersionValid, getDefaultVersionFromInput } from './util'

!(async () => {
  const answer = await inquirer.prompt({
    type: 'input',
    message: 'Input current version',
    name: 'receivedVersion',
    default: getDefaultVersionFromInput(),
    validate: (data) => {
      if (!checkVersionValid(data)) {
        console.error('The version is invalid!')
        process.exit(1)
      }
      return true
    },
  })
  return answer?.receivedVersion ?? ''
})()
