import inquirer from 'inquirer'
import ci from 'miniprogram-ci'
import type { Project, IUploadOptions } from 'miniprogram-ci'
import {
  Console,
  checkVersionValid,
  generateNextVersion,
  getDefaultVersionFromInput,
  getPackageJson,
  getProjectJson,
} from './util'
import path from 'node:path'

export type ProjectOption = ConstructorParameters<typeof Project>[0]
export type ProjectType = ProjectOption['type']
export type UploadOption = Parameters<typeof ci.preview>[0]
export type CompileSetting = UploadOption['setting']

export interface BuildOption extends ProjectOption {
  version?: string
  desc?: string
  needBuildNpm?: boolean
}

export default class Builder {
  private mpProject: Project
  private desc: string
  private version: string
  private projectPath: string
  private hasBuildNpm: boolean
  constructor(option: BuildOption) {
    const {
      projectPath = '.',
      type = 'miniProgram',
      ignores = ['node_modules/**/*'],
      version = generateNextVersion(getPackageJson(projectPath)?.version),
      needBuildNpm = true,
      desc = '',
      ...ciOption
    } = option

    this.desc = desc
    this.version = version
    this.projectPath = projectPath
    this.hasBuildNpm = !needBuildNpm
    this.mpProject = new ci.Project({
      type,
      ignores,
      projectPath,
      ...ciOption,
    })
  }

  async buildNpm() {
    return new Promise((resolve, reject) => {
      ci.packNpm(this.mpProject, {
        ignores: ['pack_npm_ignore_list'],
        reporter: (info) => {
          // clean some cache files
          Console.success(`Build WeChat NPM done, It takes ${info.pack_time}ms.🍻`)

          resolve(info)
          this.hasBuildNpm = true
        },
      })
    })
  }

  async preview(compileSetting: CompileSetting) {
    if (!this.hasBuildNpm) {
      await this.buildNpm()
    }

    const result = await ci.preview({
      project: this.mpProject,
      desc: this.desc,
      version: this.version,
      setting: this.transformProjectConfig(compileSetting),
      qrcodeFormat: 'terminal',
      qrcodeOutputDest: path.resolve(this.projectPath, './cache/'),
      onProgressUpdate: (info) => Console.info(typeof info === 'string' ? info : info?.message),
    })
  }

  private transformProjectConfig(rewriteSetting: CompileSetting): CompileSetting {
    const { setting = {} } = getProjectJson(this.projectPath)

    const {
      es6,
      es7,
      minify,
      codeProtect,
      minifyJS,
      minifyWXML,
      minifyWXSS,
      autoPrefixWXSS,
      disableUseStrict,
      compileWorklet,
    } = setting

    return {
      es6,
      es7,
      minify,
      codeProtect,
      minifyJS,
      minifyWXML,
      minifyWXSS,
      autoPrefixWXSS,
      disableUseStrict,
      compileWorklet,
      ...rewriteSetting,
    }
  }
}
