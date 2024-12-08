import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'lib-frontend-chat-library',
  template: `
    <router-outlet> </router-outlet>
  `,
  styles: [
  ]
})
export class FrontendChatLibraryComponent implements OnInit {
@Input() config :any ;
  constructor() { }

  ngOnInit(): void {
      console.log(this.config,"consfi")
    if(this.config){
      localStorage.setItem('userData',JSON.stringify(this.config));
    }
  }

  

}
