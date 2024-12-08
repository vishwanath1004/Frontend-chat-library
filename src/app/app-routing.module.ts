import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FrontendChatLibraryModule } from 'frontend-chat-library';

const routes: Routes = [
  {path :'', loadChildren: () => import('frontend-chat-library').then(m => m.FrontendChatLibraryModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
