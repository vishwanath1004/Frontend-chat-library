import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { FrontendChatLibraryComponent } from './frontend-chat-library.component';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { MessageListingComponent } from './message-listing/message-listing.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { HttpClientModule } from '@angular/common/http';
import { FrontendChatLibraryModuleRouting } from './frontend-chat-library-routing.module';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AttachmentPreviewDialogComponent } from './attachment-preview-dialog/attachment-preview-dialog.component';

@NgModule({
  declarations: [
    FrontendChatLibraryComponent,
    MessageListingComponent,
    ChatViewComponent,
    AttachmentPreviewDialogComponent
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    HttpClientModule,
    RouterModule,
    FormsModule,
  ],
  exports: [
    FrontendChatLibraryComponent,
    ChatViewComponent,
    MessageListingComponent,
    AttachmentPreviewDialogComponent
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class FrontendChatLibraryModule {
  constructor() {
    console.log('FrontendChatLibraryModule ');
  }
}
