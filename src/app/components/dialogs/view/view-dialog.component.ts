import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';

export interface ViewDialogData {
  title: string;
  data: Record<string, any>;
}

@Component({
  selector: 'app-view-dialog',
  standalone: true,
  imports: [MaterialModule, MatDialogModule],
  templateUrl: './view-dialog.component.html',
})
export class ViewDialogComponent {
  dialogData = inject<ViewDialogData>(MAT_DIALOG_DATA);
  dialogRef  = inject(MatDialogRef<ViewDialogComponent>);

  get entries() {
    return Object.entries(this.dialogData.data).map(([key, value]) => ({ key, value }));
  }

  close() { this.dialogRef.close(); }
}
