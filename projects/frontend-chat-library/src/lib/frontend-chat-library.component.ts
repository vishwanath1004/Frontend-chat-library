import { Component, OnInit, Input } from '@angular/core';
import { FrontendChatLibraryService } from './frontend-chat-library.service';

@Component({
  selector: 'lib-frontend-chat-library',
  template: `<router-outlet> </router-outlet>`,
  styleUrls: ['./styles.css'],
})
export class FrontendChatLibraryComponent implements OnInit {
  @Input() config: any;
  constructor(private chatService: FrontendChatLibraryService) {}
  ngOnInit(): void {
    this.config = {
      xAuthToken: '7QsfZcxXUlYj_HwP0hYkGhM1rHByKwFSUG1yoj4st1b',
      userId: 'gGQMHdbEJ9WPqWwdf',
      userName: 'joffin',
    };
    this.chatService.setConfig(this.config);
  }
}
