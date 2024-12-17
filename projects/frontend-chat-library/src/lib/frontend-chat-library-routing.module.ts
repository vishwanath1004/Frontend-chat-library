import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatViewComponent } from './chat-view/chat-view.component';
import { MessageListingComponent } from './message-listing/message-listing.component';
import { Demo2Component } from 'projects/frontend-chat-library/src/lib/demo2/demo2.component';
import { DemoComponent } from 'projects/frontend-chat-library/src/lib/demo/demo.component';

const routes: Routes = [
  { path: 'messages', component: MessageListingComponent },
  { path: 'chat', component: ChatViewComponent },
  { path: 'demo', component: DemoComponent },
  { path: 'demo2', component: Demo2Component },
  { path: '', redirectTo: 'messages', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class FrontendChatLibraryModuleRouting {}
