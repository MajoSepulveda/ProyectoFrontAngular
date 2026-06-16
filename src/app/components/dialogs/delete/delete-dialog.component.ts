import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';

export interface DeleteDialogData {
  itemName: string;
}

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [MaterialModule, MatDialogModule],
  templateUrl: './delete-dialog.component.html',
})
export class DeleteDialogComponent {
  dialogData = inject<DeleteDialogData>(MAT_DIALOG_DATA);
  dialogRef  = inject(MatDialogRef<DeleteDialogComponent>);

  confirm() { this.dialogRef.close(true); }
  cancel()  { this.dialogRef.close(false); }
}
