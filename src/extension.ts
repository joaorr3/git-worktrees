import { commands, ExtensionContext, extensions, window } from "vscode";
import { Commands } from "./commands";
import { GitExtension } from "./git";
import { WorkTreeInfoModel } from "./models";
import { createGitWorkTreeTreeView } from "./tree";

export function activate(context: ExtensionContext) {
  console.log("Activated");
  const { refresh } = createGitWorkTreeTreeView("explorer");

  const gitExtension = extensions.getExtension<GitExtension>("vscode.git")?.exports;
  if (gitExtension) {
    const git = gitExtension?.getAPI(1);

    try {
      git?.repositories[0].state.onDidChange(() => {
        refresh();
      });
    } catch (error) {
      console.log("error: ", error);
    }
  }

  commands.registerCommand("git-worktrees.cmd.open", (item: WorkTreeInfoModel) => {
    Commands.open(item);
  });

  commands.registerCommand("git-worktrees.cmd.refresh", () => {
    window.showInformationMessage("Refresh WorkTrees");
    refresh();
  });

  commands.registerCommand("git-worktrees.cmd.add", () => {
    Commands.add({ refresh });
  });

  commands.registerCommand("git-worktrees.cmd.delete", (item: WorkTreeInfoModel) => {
    Commands.delete(item).then(() => refresh());
  });
}

// this method is called when your extension is deactivated
export function deactivate() {}
