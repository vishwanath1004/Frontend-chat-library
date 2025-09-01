import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  pure: true
})
export class FileSizePipe implements PipeTransform {
  transform(attachment: any): string {
    let bytes = attachment?.size || attachment?.video_size || attachment?.image_size || 0;
    if (isNaN(bytes) || bytes < 0) return '0 Bytes';

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return bytes.toFixed(2) + ' ' + units[i];
  }
}