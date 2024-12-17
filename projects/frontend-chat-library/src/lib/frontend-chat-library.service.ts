import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FrontendChatLibraryService {
  config: any;

  constructor() {}

  setConfig(data: any) {
    this.config = data;
  }
}
