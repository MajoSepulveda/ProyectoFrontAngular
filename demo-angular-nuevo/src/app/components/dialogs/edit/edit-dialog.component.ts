import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';

export interface EditField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'boolean';
  readonly?: boolean;
}

export interface EditDialogData {
  title: string;
  data: Record<string, any>;
  fields: EditField[];
}

@Component({
  selector: 'app-edit-dialog',
  standalone: true,
  imports: [MaterialModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './edit-dialog.component.html',
})
export class EditDialogComponent {
  dialogData = inject<EditDialogData>(MAT_DIALOG_DATA);
  dialogRef  = inject(MatDialogRef<EditDialogComponent>);

  form: FormGroup;

  constructor() {
    const controls: Record<string, FormControl> = {};
    for (const field of this.dialogData.fields) {
      controls[field.key] = new FormControl({
        value: this.dialogData.data[field.key] ?? '',
        disabled: field.readonly ?? false,
      });
    }
    this.form = new FormGroup(controls);
  }

  confirm() { this.dialogRef.close(this.form.getRawValue()); }
  cancel()  { this.dialogRef.close(null); }
}
