import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';

@Component({
  selector: 'lib-attachment-preview-dialog',
  templateUrl: './attachment-preview-dialog.component.html',
  styleUrls: ['./attachment-preview-dialog.component.css']
})
export class AttachmentPreviewDialogComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  messageText: string = '';
  currentIndex = 0;

  constructor(
    public dialogRef: MatDialogRef<AttachmentPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private rocketChatApi: RocketChatApiService
  ) {}

  isImage(file: any): boolean {
    return file.file.type.startsWith('image/');
  }

  isVideo(file: any): boolean {
    return file.file.type.startsWith('video/');
  }

  removeFile(index: number): void {
    this.data.files.splice(index, 1);
    if (this.currentIndex >= this.data.files.length) {
      this.currentIndex = this.data.files.length - 1;
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }

  previous(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  next(): void {
    if (this.currentIndex < this.data.files.length - 1) {
      this.currentIndex++;
    }
  }

  setCurrentIndex(index: number): void {
    this.currentIndex = index;
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          if (this.isImage({ file })) {
          this.data.files.push({ file: file, preview: e.target.result, type: 'image' });
          } else if (this.isVideo({ file })) {
          this.data.files.push({ file: file, preview: 'video_file', type: 'video' });
          } else if (file.type === 'application/pdf') {
          this.data.files.push({ file: file, preview: 'picture_as_pdf', type: 'pdf' });
          } else {
          this.data.files.push({ file: file, preview: 'docs', type: 'doc' });
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }

  async sendMessage() {
    if (!this.messageText.trim() && this.data.files.length === 0) return;
    if (this.messageText.length > this.data.textLimit) {
      alert(`Message length should not exceed ${this.data.textLimit} characters.`);
      return;
    }

    if (this.data.files.length > 0) {
      const uploadPromises = this.data.files.map((file: any) => this.rocketChatApi.uploadFile(this.data.rid, file.file));
      const uploadResults = await Promise.all(uploadPromises);

      const fileLinks = uploadResults.map(result => {
        console.log("Upload result:", result);
        const file = result?.message?.file;
        const attachment = result?.message?.attachments?.[0];
        if (attachment && attachment.title_link) {
          return `[${attachment.title}](${attachment.title_link})`;
        } else if (file) {
          return `[${file.name}](/file-upload/${file._id}/${encodeURIComponent(file.name)})`;
        }
        return '';
      }).join('\n');
      
      const messageWithFiles = `${this.messageText}\n${fileLinks}`;

      const payload = {
        msg: 'method',
        method: 'sendMessage',
        id: '' + Date.now(),
        params: [{ rid: this.data.rid, msg: messageWithFiles }],
      };
      this.data.ws.send(JSON.stringify(payload));
    } else {
      const payload = {
        msg: 'method',
        method: 'sendMessage',
        id: '' + Date.now(),
        params: [{ rid: this.data.rid, msg: this.messageText }],
      };
      this.data.ws.send(JSON.stringify(payload));
    }

    this.dialogRef.close(true);
  }
}