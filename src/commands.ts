import { commands, OpenDialogOptions, QuickPickItem, QuickPickItemKind, Uri, window, workspace } from "vscode";
import { Refresh, WorkTreeInfoModel } from "./models";
import { Git, rootPath, folderName } from "./utils";
import * as path from "path";

const openDialogOptions: OpenDialogOptions = {
  canSelectMany: false,
  openLabel: "Select",
  canSelectFiles: false,
  canSelectFolders: true,
  title: "Select new worktree path",
};

export const Commands = {
  open(item: WorkTreeInfoModel) {
    window.showInformationMessage(item.path);
    const uri = Uri.file(item.path);
    commands.executeCommand("vscode.openFolder", uri, {
      options: {
        forceNewWindow: false,
      },
    });
  },
  async add(callbacks: Refresh) {
    window.showInformationMessage("Add WorkTree");

    const items: QuickPickItem[] = [
      {
        label: "New Branch",
        description: "This will create a branch for you",
        detail: "Next: Choose a name for your branch",
        picked: true,
        alwaysShow: true,
      },
      {
        label: "Existing Branch",
        description: "I already have one checked out",
        detail: "Next: Pick a local branch from the list",
        alwaysShow: true,
      },
    ];

    try {
      const creationMethodDialogResponse = await window.showQuickPick(items, {
        title: "How do you want to create this worktree?",
      });

      if (!creationMethodDialogResponse) {
        window.showWarningMessage(`WorkTree creation aborted`);
        throw new Error("WorkTree creation aborted");
      }

      const branches = await Git.getLocalBranches();

      // Create a new branch or use an existing one.
      if (creationMethodDialogResponse.label === "New Branch") {
        const newBranchName = await window.showInputBox({
          title: "Enter the new branch name",
          value: "myNewBranch",
          prompt: "Next: Choose the path to the worktree",
        });

        if (!newBranchName) {
          window.showWarningMessage(`WorkTree creation aborted`);
          throw new Error("WorkTree creation aborted");
        }

        const { res, path } = await createWorkTree({
          branchName: newBranchName,
          currentBranch: branches.current,
          addNewBranch: true,
        });

        if (res.status === "success") {
          window.showInformationMessage(`Git says: ${res.message}`);
          callbacks.refresh();
          this.open({
            branchName: newBranchName,
            path,
          });
        } else {
          window.showErrorMessage(`Ups: ${res.message}`);
        }
      } else {
        const allBranches = branches.all.filter((b) => b !== branches.current);

        const pickedBranch = await window.showQuickPick(allBranches, {
          title: "Pick a local branch",
        });

        if (!pickedBranch) {
          window.showWarningMessage(`WorkTree creation aborted`);
          throw new Error("WorkTree creation aborted");
        }

        const { res, path } = await createWorkTree({
          branchName: pickedBranch,
          currentBranch: branches.current,
          addNewBranch: false,
        });

        if (res.status === "success") {
          window.showInformationMessage(`Git says: ${res.message}`);
          callbacks.refresh();
          this.open({
            branchName: pickedBranch,
            path,
          });
        } else {
          window.showErrorMessage(`Ups: ${res.message}`);
        }
      }
    } catch (error) {
      console.log(`WorkTree creation failed`);
    }
  },
  async delete(item: WorkTreeInfoModel) {
    const deleteDialogResponse = (await window.showQuickPick(["Yes", "No"], {
      title: `You're about to delete: ${item.branchName}`,
    })) as "Yes" | "No" | undefined;

    if (!deleteDialogResponse) {
      window.showWarningMessage(`WorkTree creation aborted`);
      throw new Error("WorkTree creation aborted");
    }

    if (deleteDialogResponse === "Yes") {
      const res = await Git.deleteWorkTree({
        path: item.path,
      });

      if (res.status === "success") {
        window.showInformationMessage(`Git says: ${res.message}`);
      } else {
        window.showErrorMessage(`Ups: ${res.message}`);
      }
    }
  },
};

const createWorkTree = async ({
  branchName,
  addNewBranch,
  currentBranch,
}: {
  branchName: string;
  addNewBranch: boolean;
  currentBranch: string;
}) => {
  const regex = /\//g;

  const branch = branchName.replace(regex, "_");

  const basePath = path.join(path.dirname(rootPath ?? ""), `${folderName}.worktrees`);
  const defaultPath = path.join(basePath, branch);
  const defaultUri = Uri.file(defaultPath);

  await workspace.fs.createDirectory(defaultUri);

  const uri = await window.showOpenDialog({
    ...openDialogOptions,
    defaultUri,
  });

  const chosenPath = uri?.[0].path;

  const workTreePath = chosenPath || defaultUri.path;

  const res = await Git.createWorkTree({
    workTree: {
      branchName: branch,
      path: workTreePath,
      origin: currentBranch,
    },
    addNewBranch,
  });

  if (res.status === "error" || chosenPath !== defaultUri.path) {
    await workspace.fs.delete(defaultUri, { recursive: true });
  }

  return {
    res,
    path: workTreePath,
  };
};
