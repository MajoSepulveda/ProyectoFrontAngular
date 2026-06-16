import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-report-chat',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './report-chat.component.html',
})
export class ReportChatComponent {
  @Input() loading = false;
  @Output() submitQuery = new EventEmitter<string>();

  query = '';

  send(): void {
    const value = this.query.trim();

    if (!value || this.loading) {
      return;
    }

    this.submitQuery.emit(value);
    this.query = '';
  }
}