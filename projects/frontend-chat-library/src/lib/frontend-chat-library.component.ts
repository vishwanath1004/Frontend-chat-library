import { Component, OnInit, Input } from '@angular/core';
import { FrontendChatLibraryService } from './frontend-chat-library.service';

@Component({
  selector: 'lib-frontend-chat-library',
  template: `<lib-message-listing> </lib-message-listing>`,
  styleUrls: ['./styles.css'],
})
export class FrontendChatLibraryComponent implements OnInit {
  @Input() config: any;
  constructor(private chatService: FrontendChatLibraryService) {}
  ngOnInit(): void {
    // this.config = {
    //   xAuthToken: '',
    //   userId: '',
    // };
    this.chatService.setConfig(this.config);
  }
}
