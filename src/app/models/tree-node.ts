export interface TreeNode<T = any> {
  data: T;
  children: TreeNode<T>[];
  directCount: number;
  totalCount: number;
  expanded: boolean;
  selected: boolean;
}

export interface FlatNode<T = any> {
  node: TreeNode<T>;
  depth: number;
}