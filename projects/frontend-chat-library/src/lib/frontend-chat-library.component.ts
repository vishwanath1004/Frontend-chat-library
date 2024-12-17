import { Component, OnInit, Input } from '@angular/core';
import { FrontendChatLibraryService } from './frontend-chat-library.service';

@Component({
  selector: 'lib-frontend-chat-library',
  template: `<router-outlet> </router-outlet>`,
  styles: [],
})
export class FrontendChatLibraryComponent implements OnInit {
  @Input() config: any;
  constructor(private chatService: FrontendChatLibraryService) {}

  ngOnInit(): void {
    this.chatService.setConfig(this.config);
  }
}
