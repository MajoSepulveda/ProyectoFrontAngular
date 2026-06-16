import { Category } from './Category';

export interface TreeNode {
  category: Category;
  children: TreeNode[];
  directCount: number;
  totalCount: number;
  expanded: boolean;
  selected: boolean;
}

export interface FlatNode {
  node: TreeNode;
  depth: number;
}