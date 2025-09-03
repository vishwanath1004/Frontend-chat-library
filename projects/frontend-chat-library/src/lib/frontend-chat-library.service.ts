import { Injectable } from '@angular/core';

import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FrontendChatLibraryService {
  config: any;
  public showBadge = new Subject<boolean>();
  public initialBadge:boolean =false;
  public isNotFileSupported = new Subject<boolean>();


  constructor() {}

  
   setConfig(data: any) {
    this.config = data;
  }


  messageBadge(value: boolean) {
    this.showBadge.next(value);
  }



isFileAllowed(file: File, allowedTypes = [
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp',
  // Videos
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'mpeg', 'mpg',
  // Documents
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'
]): boolean {
  if (!file || !allowedTypes || allowedTypes.length === 0) {
    return false;
  }

  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();
  const fileMimeType = file.type.toLowerCase();

  return allowedTypes.some(type => {
    const normalizedType = type.toLowerCase();
    
    if (fileExtension === normalizedType) {
      return true;
    }
    
    if (normalizedType === 'image' && fileMimeType.startsWith('image/')) {
      return true;
    }
    if (normalizedType === 'video' && fileMimeType.startsWith('video/')) {
      return true;
    }
    if (normalizedType === 'pdf' && fileMimeType === 'application/pdf') {
      return true;
    }
    
    return false;
  });
}
}
