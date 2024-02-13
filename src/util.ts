import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import chalk from 'chalk'
import semver from 'semver'
import { CompileSetting } from '.'

// Check version is valid
export function checkVersionValid(version: string): boolean {
  return !!semver.valid(version)
}

export function generateNextVersion(version: string): string {
  if (!checkVersionValid(version)) return ''
  const versionSplit = version.split('.')
  if (versionSplit.length > 3) return semver.inc(version, 'prerelease')!
  return semver.inc(version, 'patch')!
}

export function getDefaultVersionFromInput(): string | void {
  const receivedVersion = process.argv.slice(2)[0]
  if (checkVersionValid(receivedVersion)) {
    return receivedVersion
  }
}

export type PackageJsonInfo = Record<'name' | 'version' | string, string>
export function getPackageJson(projectPath: string): PackageJsonInfo {
  const packageJsonPath = path.resolve(projectPath, './package.json')
  if (!existsSync(packageJsonPath)) {
    Console.warn(
      "Can't find 'package.json'. Please checkout 'projectPath' option and ensure the 'package.json' in this project!"
    )
    return { version: '0.0.0' }
  }
  return JSON.parse(readFileSync(packageJsonPath, { encoding: 'utf-8' }))
}

export type ProjectInfo = {
  setting?: CompileSetting
}
export function getProjectJson(projectPath: string): Record<string, any> & ProjectInfo {
  const projectJsonPath = path.resolve(projectPath, './project.config.json')
  if (!existsSync(projectJsonPath)) {
    Console.warn(
      "Can't find 'project.config.json'. Please checkout 'projectPath' option and ensure the 'project.config.json' in this project!"
    )
    return {}
  }
  return JSON.parse(readFileSync(projectJsonPath, { encoding: 'utf-8' }))
}

export enum ConsoleType {
  success = 'success',
  error = 'error',
  info = 'info',
  warn = 'warn',
}

function getPrintHead(type: ConsoleType): string {
  switch (type) {
    case ConsoleType.success:
      return chalk.bgGreen.black.bold(' SUCCESS ')

    case ConsoleType.error:
      return chalk.bgRed.white.bold(' ERROR ')

    case ConsoleType.info:
      return chalk.bgBlue.white.bold(' INFO ')

    case ConsoleType.warn:
      return chalk.bgYellow.black.bold(' WARN ')
  }
}
function print(type: ConsoleType, content: string): void {
  console.log(getPrintHead(type), content)
}

export const Console: Record<ConsoleType, (content: string) => void> = {
  [ConsoleType.success](content) {
    print(ConsoleType.success, content)
  },
  [ConsoleType.error](content) {
    print(ConsoleType.error, content)
  },
  [ConsoleType.info](content) {
    print(ConsoleType.info, content)
  },
  [ConsoleType.warn](content) {
    print(ConsoleType.warn, content)
  },
}
