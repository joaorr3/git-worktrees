import simpleGit from "simple-git";
import { QuickPickItem, workspace } from "vscode";
import { CreateWorkTreeModel, DeleteWorkTreeModel, ResponseStatusModel, WorkTreeInfoModel } from "./models";

export const rootPath = workspace.workspaceFolders?.[0].uri.path;
export const folderName = workspace.workspaceFolders?.[0].name;

// Git Operations

export const Git = {
  provider: simpleGit({
    baseDir: rootPath,
    binary: "git",
  }),
  isRepo() {
    return this.provider.checkIsRepo();
  },
  async getWorkTressInfo() {
    const res = await this.provider.raw(["worktree", "list"]);
    const exp = /(\/\S*).*\[(.*?)\]/g;
    const workTreeListOutput = res;
    const matches: RegExpMatchArray[] = [...workTreeListOutput.matchAll(exp)];

    const result: WorkTreeInfoModel[] = matches.map((match) => ({
      path: match[1],
      branchName: match[2],
    }));

    return result;
  },
  async createWorkTree({
    addNewBranch,
    workTree: { path, branchName, origin },
  }: CreateWorkTreeModel): Promise<ResponseStatusModel> {
    // if (!origin) {
    //   return { status: "error", message: "No origin" };
    // }

    if (addNewBranch && origin) {
      try {
        const res = await this.provider.raw(["worktree", "add", "-b", branchName, path, origin]);
        return { status: "success", message: res };
      } catch (error) {
        return { status: "error", message: error };
      }
    } else {
      try {
        const res = await this.provider.raw(["worktree", "add", path, branchName]);
        return { status: "success", message: res };
      } catch (error) {
        return { status: "error", message: error };
      }
    }
  },
  async deleteWorkTree({ path }: DeleteWorkTreeModel) {
    try {
      const res = await this.provider.raw(["worktree", "remove", path]);
      const res2 = await this.provider.raw(["worktree", "prune"]);
      return { status: "success", message: `Worktree Deleted` };
    } catch (error) {
      return { status: "error", message: error };
    }
  },
  async getLocalBranches() {
    // const branches = await this.provider.branchLocal();
    const branches = await this.provider.branch();
    return branches;
  },
};

export const createQuickPickItem = (item: QuickPickItem) => {
  return item;
};
