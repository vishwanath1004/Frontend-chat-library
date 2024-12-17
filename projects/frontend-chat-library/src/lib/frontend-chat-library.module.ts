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
import { HttpClientModule } from '@angular/common/http';
import { FrontendChatLibraryModuleRouting } from './frontend-chat-library-routing.module';
import { RouterModule } from '@angular/router';
import { Demo2Component } from 'projects/frontend-chat-library/src/lib/demo2/demo2.component';
import { DemoComponent } from 'projects/frontend-chat-library/src/lib/demo/demo.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    FrontendChatLibraryComponent,
    MessageListingComponent,
    ChatViewComponent,
    Demo2Component,
    DemoComponent,
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    HttpClientModule,
    FrontendChatLibraryModuleRouting,
    RouterModule,
    FormsModule,
  ],
  exports: [
    FrontendChatLibraryComponent,
    ChatViewComponent,
    MessageListingComponent,
    FrontendChatLibraryModuleRouting,
    Demo2Component,
    DemoComponent,
  ],
})
export class FrontendChatLibraryModule {}
