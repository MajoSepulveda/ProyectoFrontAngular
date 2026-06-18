import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { TreeNode, FlatNode } from '../../models/tree-node';

@Component({
  selector: 'app-tree-filter',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './tree-filter.component.html',
  styleUrl: './tree-filter.component.scss',
})
export class TreeFilterComponent<T> {
  @Input({ required: true }) nodes: TreeNode<T>[] = [];
  @Input() loading = false;
  @Input({ required: true }) labelKey!: keyof T;
  @Input() showCounts = true;
  @Input() emptyMessage = 'No items available';
  @Input() loadingMessage = 'Loading…';
  @Input() clearButtonLabel = 'Clear Filters';

  @Output() filterChange = new EventEmitter<void>();

  get visibleNodes(): FlatNode<T>[] {
    const result: FlatNode<T>[] = [];
    for (const root of this.nodes) {
      this.flattenNode(root, 0, result);
    }
    return result;
  }

  private flattenNode(node: TreeNode<T>, depth: number, result: FlatNode<T>[]): void {
    result.push({ node, depth });
    if (node.expanded && node.children.length > 0) {
      for (const child of node.children) {
        this.flattenNode(child, depth + 1, result);
      }
    }
  }

  toggleNode(node: TreeNode<T>): void {
    node.expanded = !node.expanded;
  }

  onCheckboxChange(node: TreeNode<T>): void {
    node.selected = !node.selected;
    if (node.selected && node.children.length > 0) {
      node.expanded = true;
    }
    this.filterChange.emit();
  }

  clearFilters(): void {
    for (const root of this.nodes) {
      this.clearNodeRecursive(root);
    }
    this.filterChange.emit();
  }

  private clearNodeRecursive(node: TreeNode<T>): void {
    node.selected = false;
    node.expanded = false;
    for (const child of node.children) {
      this.clearNodeRecursive(child);
    }
  }
}
