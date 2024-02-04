import inquirer from "inquirer";
import ci from "miniprogram-ci";

// 获取下个小程序版本号
function getNextMPVersion(): string | undefined {
  const receivedVersion = process.argv.slice(2)[0];
  if (checkVersionValid(receivedVersion)) {
    return receivedVersion;
  }
}

// 检测版本号是否规范
function checkVersionValid(version: string): boolean {
  if (!version) return false;
  return !~version.indexOf(".");
}

async function receiveVersionPrompt() {
  const answer = await inquirer.prompt({
    type: "input",
    message: "Input current version",
    name: "receivedVersion",
    default: getNextMPVersion(),
    validate: (data) => {
      if (!checkVersionValid) {
        console.error("The version is invalid!");
        process.exit(1);
      }
      return true;
    },
  });
  return answer.receivedVersion ?? "";
}
