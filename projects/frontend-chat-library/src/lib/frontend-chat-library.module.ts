import { NgModule } from '@angular/core';
import { FrontendChatLibraryComponent } from './frontend-chat-library.component';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { MessageListingComponent } from './message-listing/message-listing.component';



@NgModule({
  declarations: [
    FrontendChatLibraryComponent,
    ChatViewComponent,
    MessageListingComponent,
    ChatViewComponent
  ],
  imports: [
  ],
  exports: [
    FrontendChatLibraryComponent,
    ChatViewComponent
  ]
})
export class FrontendChatLibraryModule { }
