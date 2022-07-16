import { EventEmitter, MarkdownString, TreeDataProvider, TreeItem, window } from "vscode";
import { WorkTreeInfoModel } from "./models";
import { Git, rootPath } from "./utils";

export const createGitWorkTreeTreeView = (id: string) => {
  const provider = gitWorkTreeTreeViewDataProvider();

  window.createTreeView<WorkTreeInfoModel>(`git-worktrees.view.${id}`, {
    treeDataProvider: provider,
    canSelectMany: false,
  });

  return { refresh: provider.refresh };
};

export const gitWorkTreeTreeViewDataProvider = (): TreeDataProvider<WorkTreeInfoModel> & {
  refresh: () => void;
} => {
  const onDidChangeTreeData = new EventEmitter<WorkTreeInfoModel | undefined | void>();

  return {
    onDidChangeTreeData: onDidChangeTreeData.event,
    refresh: () => {
      console.log("refresh tree");
      onDidChangeTreeData.fire();
    },
    getChildren: async (): Promise<WorkTreeInfoModel[]> => {
      const info = await Git.getWorkTressInfo();
      return info;
    },
    getTreeItem: (element: WorkTreeInfoModel): TreeItem => {
      return workTreeItem(element);
    },
  };
};

const workTreeItem = (element: WorkTreeInfoModel): TreeItem => {
  return {
    id: `${element.path}:${element.branchName}`,
    label: element.branchName,
    description: element.path === rootPath ? "current" : undefined,
    contextValue: element.path !== rootPath ? "workTreeItem" : undefined,
    tooltip: new MarkdownString(
      `Path: **${element.path}**  
      Branch: **${element.branchName}**`
    ),
  };
};
