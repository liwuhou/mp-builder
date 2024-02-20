import physicalCpuCount from "physical-cpu-count";
import readline from "node:readline";
import ci, { packNpm } from "miniprogram-ci";
import type { Project, IUploadOptions } from "miniprogram-ci";
import {
  Console,
  ConsoleType,
  PackNpmRelationInfo,
  checkVersionValid,
  generateNextVersion,
  getDefaultVersionFromInput,
  getPackageJson,
  getPrintHead,
  getProjectJson,
} from "./util";
import path from "node:path";

export type ProjectOption = ConstructorParameters<typeof Project>[0];
export type ProjectType = ProjectOption["type"];
export type UploadOption = Parameters<typeof ci.preview>[0];
export type CompileSetting = UploadOption["setting"];

export interface BuildOption extends ProjectOption {
  version?: string;
  desc?: string;
  needBuildNpm?: boolean;
  threads?: number;
  packNpmRelationInfo?: PackNpmRelationInfo;
}

export default class Builder {
  private mpProject: Project;
  private desc: string;
  private version: string;
  private projectPath: string;
  private hasBuildNpm: boolean;
  private threads: number;
  private packNpmRelationInfo?: PackNpmRelationInfo;
  constructor(option: BuildOption) {
    const {
      projectPath = ".",
      type = "miniProgram",
      ignores = ["node_modules/**/*"],
      version = generateNextVersion(getPackageJson(projectPath)?.version),
      needBuildNpm = true,
      desc = "",
      threads = physicalCpuCount ?? 2,
      packNpmRelationInfo,
      ...ciOption
    } = option;

    this.desc = desc;
    this.version = version;
    this.threads = threads;
    this.projectPath = projectPath;
    this.hasBuildNpm = !needBuildNpm;
    this.packNpmRelationInfo = packNpmRelationInfo;
    this.mpProject = new ci.Project({
      type,
      ignores,
      projectPath,
      ...ciOption,
    });
  }

  private getProjectSetting() {
    return getProjectJson(this.projectPath)?.setting ?? {};
  }

  get isPackNpmManually() {
    const { packNpmManually = false, packNpmRelationList = {} } =
      this.getProjectSetting();
    return packNpmManually;
  }

  async buildNpm() {
    const { packNpmManually = false, packNpmRelationList = [] } =
      this.getProjectSetting();

    if (!packNpmManually) {
      return new Promise((resolve, reject) => {
        ci.packNpm(this.mpProject, {
          ignores: ["pack_npm_ignore_list"],
          reporter: (info) => {
            // clean some cache files
            Console.success(
              `Build WeChat NPM done, It takes ${info.pack_time}ms.🍻`
            );

            resolve(info);
            this.hasBuildNpm = true;
          },
        });
      });
    } else {
      // handle pack npm manually case
      let start = Date.now();
      const result = await ci.packNpmManually({
        ignores: ["pack_npm_ignore_list"],
        ...packNpmRelationList[0],
        ...this.packNpmRelationInfo,
      });
      Console.success(
        `Build WeChat NPM done, It takes ${Date.now() - start}ms.🍻`
      );
      return result;
    }
  }

  async preview(compileSetting: CompileSetting) {
    if (!this.hasBuildNpm) {
      await this.buildNpm();
      console.log("\n");
    }

    try {
      const { subPackageInfo, pluginInfo } = await ci.preview({
        project: this.mpProject,
        desc: this.desc,
        version: this.version,
        setting: this.transformProjectConfig(compileSetting),
        qrcodeFormat: "terminal",
        qrcodeOutputDest: path.resolve(this.projectPath, "./cache/"),
        allowIgnoreUnusedFiles: true,
        bigPackageSizeSupport: true,
        useCOS: false,
        threads: physicalCpuCount ?? 2,
        onProgressUpdate: (info) => {
          const message = typeof info === "string" ? info : info?.message;
          if (message) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(
              `${getPrintHead(ConsoleType.info)} ${message}`
            );
          }
        },
      });
      // TODO: success
      Console.success("Preview sucess, scan above qr code to preview. 🎊");
    } catch (e: any) {
      console.log("🤔 ~ Builder ~ preview ~ e:", e);
      if (e.code === 20003) {
        Console.error(
          "Invalid ip, please check the white list in mp server. reference: https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html"
        );
      }
    }
  }

  async upload(compileSetting: CompileSetting) {
    try {
      const result = await ci.upload({
        project: this.mpProject,
        desc: this.desc,
        version: this.version,
        setting: this.transformProjectConfig(compileSetting),
        allowIgnoreUnusedFiles: true,
        useCOS: false,
        threads: physicalCpuCount ?? 2,
        onProgressUpdate: (info) => {
          const message = typeof info === "string" ? info : info?.message;
          if (message) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(
              `${getPrintHead(ConsoleType.info)} ${message}`
            );
          }
        },
      });
      // Upload success
    } catch (e) {
      console.log("🤔 ~ Builder ~ upload ~ e:", e);
    }
  }

  private transformProjectConfig(
    rewriteSetting: CompileSetting
  ): CompileSetting {
    const { setting = {} } = getProjectJson(this.projectPath);

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
    } = setting;

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
    };
  }
}
