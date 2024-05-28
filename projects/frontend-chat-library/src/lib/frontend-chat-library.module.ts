import { NgModule } from '@angular/core';
import { FrontendChatLibraryComponent } from './frontend-chat-library.component';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { MessageListingComponent } from './message-listing/message-listing.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';

@NgModule({
  declarations: [
    FrontendChatLibraryComponent,
    MessageListingComponent,
    ChatViewComponent
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  exports: [
    FrontendChatLibraryComponent,
    ChatViewComponent,
    MessageListingComponent
  ]
})
export class FrontendChatLibraryModule { }
