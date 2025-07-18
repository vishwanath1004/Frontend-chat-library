import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AttachmentPreviewDialogComponent } from './attachment-preview-dialog.component';

@NgModule({
  declarations: [AttachmentPreviewDialogComponent],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule
  ],
  exports: [AttachmentPreviewDialogComponent]
})
export class AttachmentPreviewDialogModule { }
