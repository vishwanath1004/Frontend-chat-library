import { Component, OnInit } from '@angular/core';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';

@Component({
  selector: 'lib-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.css']
})
export class ChatViewComponent implements OnInit {
config :any;
ws!: WebSocket;
  constructor(
    private chatService : RocketChatApiService
  ) { }

  ngOnInit(): void {
    let data :any = localStorage.getItem('userData'); 
  this.config = JSON.parse(data);
  this.ws = new WebSocket(this.config.websocketUrl);
  this.ws.onopen = () => console.log('WebSocket connected');
  this.ws.onclose = () => console.log('WebSocket closed');
  this.ws.onerror = (error:any) => console.error('WebSocket error:', error);
    this.loadHistory();
  }
  


   loadHistory(){
   let chatHistory =  this.chatService.loadHistory(this.config,this.ws);
   console.log(chatHistory,"chatHistory");
  }
}
