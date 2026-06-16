import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';
import { EditField } from '../edit/edit-dialog.component';

export interface CreateDialogData {
  title: string;
  fields: EditField[];
  existingData?: any[];
  uniqueKeys?: { key: string; label: string }[];
}

@Component({
  selector: 'app-create-dialog',
  standalone: true,
  imports: [MaterialModule, MatDialogModule, ReactiveFormsModule],
  templateUrl: './create-dialog.component.html',
})
export class CreateDialogComponent {
  dialogData = inject<CreateDialogData>(MAT_DIALOG_DATA);
  dialogRef  = inject(MatDialogRef<CreateDialogComponent>);

  form: FormGroup;
  imagePreviews: Record<string, string> = {};
  duplicateError: string | null = null;

  constructor() {
    const controls: Record<string, FormControl> = {};
    for (const field of this.dialogData.fields) {
      controls[field.key] = new FormControl(
        field.type === 'boolean' ? false : '',
        field.type === 'email' ? [Validators.email] : [],
      );
    }
    this.form = new FormGroup(controls);
  }

  onFileSelected(event: Event, key: string): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.form.get(key)?.setValue(result);
      this.imagePreviews[key] = result;
    };
    reader.readAsDataURL(file);
  }

  confirm(): void {
    this.duplicateError = null;

    if (this.dialogData.uniqueKeys?.length && this.dialogData.existingData?.length) {
      const values = this.form.value;
      for (const { key, label } of this.dialogData.uniqueKeys) {
        const val = values[key]?.toString().trim().toLowerCase();
        if (!val) continue;
        const exists = this.dialogData.existingData.some(
          item => item[key]?.toString().trim().toLowerCase() === val
        );
        if (exists) {
          this.duplicateError = `Ya existe una entidad con el mismo ${label}. Por favor usa uno diferente.`;
          return;
        }
      }
    }

    this.dialogRef.close(this.toTypedPayload(this.form.value));
  }

  private toTypedPayload(raw: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {};
    for (const field of this.dialogData.fields) {
      const val = raw[field.key];
      if (field.type === 'number') {
        payload[field.key] = val !== '' && val !== null && val !== undefined ? Number(val) : null;
      } else {
        payload[field.key] = val;
      }
    }
    return payload;
  }

  cancel(): void { this.dialogRef.close(null); }
}
