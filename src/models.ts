export type WorkTreeInfoModel = {
  path: string;
  branchName: string;
};

export type WorkTreesModel = {
  workTrees: WorkTreeInfoModel[];
};

export type CreateWorkTreeModel = {
  addNewBranch?: boolean;
  workTree: WorkTreeInfoModel & { origin?: string };
};

export type DeleteWorkTreeModel = Pick<WorkTreeInfoModel, "path">;

export type Refresh = { refresh: () => void };

export type ResponseStatusModel = {
  status: "success" | "error";
  message?: string | unknown;
};
