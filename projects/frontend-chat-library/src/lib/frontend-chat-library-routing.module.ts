import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { MessageListingComponent } from './message-listing/message-listing.component';

const routes: Routes = [
  { path: 'messages', component: MessageListingComponent },
  { path: 'chat', component: ChatViewComponent },
  { path: '', redirectTo: '/messages', pathMatch: 'full' },
  { path: '**', redirectTo: '/messages', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class FrontendChatLibraryModuleRouting {
  constructor() {
    console.log('FrontendChatLibraryModuleRouting ');
  }
}
