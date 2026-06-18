import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MaterialModule } from 'src/app/material.module';
import { ApiService } from 'src/app/services/api.service';

export interface EditField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'boolean' | 'select' | 'image';
  readonly?: boolean;
  required?: boolean;
  options?: { value: string | number; label: string }[];
}

export interface EditDialogData {
  title: string;
  data: Record<string, any>;
  fields: EditField[];
  endpoint?: string;
  idKey?: string;
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
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  imagePreviews: Record<string, string> = {};
  serverError: string | null = null;
  saving = false;

  constructor() {
    const controls: Record<string, FormControl> = {};
    for (const field of this.dialogData.fields) {
      const validators = [];
      if (field.type === 'email') validators.push(Validators.email);
      if (field.required !== false && field.type !== 'boolean' && field.type !== 'image' && !field.readonly) validators.push(Validators.required);
      controls[field.key] = new FormControl(
        {
          value: this.dialogData.data[field.key] ?? (field.type === 'boolean' ? false : ''),
          disabled: field.readonly ?? false,
        },
        validators,
      );
      if (field.type === 'image' && this.dialogData.data[field.key]) {
        this.imagePreviews[field.key] = this.dialogData.data[field.key];
      }
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
    this.serverError = null;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const payload = this.toTypedPayload(this.form.getRawValue());

    if (this.dialogData.endpoint && this.dialogData.idKey) {
      this.saving = true;
      this.apiService.put(`${this.dialogData.endpoint}/${this.dialogData.data[this.dialogData.idKey]}`, payload).subscribe({
        next: () => {
          this.snackBar.open('Actualizado exitosamente', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.saving = false;
          this.serverError = err.error?.message || 'Error al actualizar. Intenta de nuevo.';
        },
      });
    } else {
      this.dialogRef.close(payload);
    }
  }
  cancel():  void { this.dialogRef.close(null); }

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
}
