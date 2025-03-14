import { Component } from '@angular/core';
import { FrontendChatLibraryService } from 'projects/frontend-chat-library/src/public-api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  
  constructor(private fls: FrontendChatLibraryService) {

  }
  // allUserMessages = [
  //   {
  //     image: 'https://via.placeholder.com/150',
  //     name: 'John Doe',
  //     lastMessage: 'Hey, how are you?',
  //     time: new Date()
  //   },
  //   {
  //     image: 'https://via.placeholder.com/150',
  //     name: 'Jane Smith',
  //     lastMessage: 'Are we meeting tomorrow?',
  //     time: new Date(Date.now() - 600000)
  //   },
  //   {
  //     image: 'https://via.placeholder.com/150',
  //     name: 'Bob Johnson',
  //     lastMessage: 'Call me when you are free.',
  //     time: new Date(Date.now() - 1200000)
  //   },
  //   {
  //     image: 'https://via.placeholder.com/150',
  //     name: 'David',
  //     lastMessage: 'Hey, how are you?',
  //     time: new Date()
  //   },
  //   {
  //     image: 'https://via.placeholder.com/150',
  //     name: 'Jack Sparrow',
  //     lastMessage: 'Are we meeting tomorrow?',
  //     time: new Date(Date.now() - 600000)
  //   },
  //   {
  //     image: 'https://via.placeholder.com/150',
  //     name: 'Joseph',
  //     lastMessage: 'Hey man!!.',
  //     time: new Date(Date.now() - 1200000)
  //   }
  // ];

  chatConfig = {
    "xAuthToken": "hRl9I58TI-VNfbnjNGfRBbRMzu6ECpIYosNJFSQP1vV",
    "userId": "rEY8H5eGEWDYR3zw9",
    "textColor": "#fff",
    "bgColor": "#832215"
};

  ngOninit() {
    this.fls.setConfig(this.chatConfig)
  }
}
