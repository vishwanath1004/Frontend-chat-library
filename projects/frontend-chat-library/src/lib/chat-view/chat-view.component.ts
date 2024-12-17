import { Component, OnInit, Input } from '@angular/core';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';
import { urlConstants } from '../constants/urlConstants';
import { FrontendChatLibraryService } from '../frontend-chat-library.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'lib-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.css'],
})
export class ChatViewComponent implements OnInit {
  history: any;
  @Input() config: any;
  currentUser: any;
  ws: any;
  rid: string | undefined;
  messages: any = [];
  messageText: string = '';
  roomDetails: any;
  friendDetails: any;
  constructor(
    private rocketChatApi: RocketChatApiService,
    private chatService: FrontendChatLibraryService,
    private routerParams: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.routerParams.queryParams.subscribe((params: any) => {
      this.rid = params.rid;
    });

    this.config = this.config || this.chatService.config;

    if (!this.rid) {
      console.error('Room ID (rid) is required');
      return;
    }

    await this.initializeWebSocket();
    this.loadChatHistory();
  }

  async initializeWebSocket() {
    this.ws = new WebSocket(urlConstants.websocketUrl);
    await this.rocketChatApi.setHeadersAndWebsocket(this.config, this.ws);
    this.currentUser = await this.rocketChatApi.getCurrentUserDetails();
    this.roomDetails = await this.rocketChatApi.getRoomInfo(this.rid);
    await this.rocketChatApi.subscribeToRoomChat(
      this.config,
      this.ws,
      this.rid
    );

    let friendName = await this.roomDetails?.room?.usernames.find(
      (name: any) => {
        name !== this.currentUser.username;
      }
    );

    // await this.rocketChatApi.subscribeToRoomChat(
    //   this.config,
    //   this.ws,
    //   this.rid
    // );
    // await this.rocketChatApi.getUserInfoByUsername();

    console.log(this.roomDetails.room, 'roomInfo');
    console.log(this.currentUser, 'user', friendName);
    // this.ws.onopen = () => {
    //   const loginMessage = {
    //     msg: 'method',
    //     method: 'login',
    //     id: '' + new Date().getTime(),
    //     params: [
    //       {
    //         resume: this.config.xAuthToken,
    //       },
    //     ],
    //   };
    //   this.ws.send(JSON.stringify(loginMessage));

    // };

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);

      if (data.msg === 'ping') {
        const pongMessage = {
          msg: 'pong',
        };
        this.ws.send(JSON.stringify(pongMessage));
      }
      console.log('WebSocket message received werwr:', data);

      if (
        data.msg === 'changed' &&
        data.collection === 'stream-room-messages'
      ) {
        const newMessage = data.fields.args[0];
        if (newMessage && newMessage.rid === this.rid) {
          console.log(
            this.currentUser._id,
            'this.currentUser._id ====',
            newMessage.u._id
          );
          const formattedMessage = {
            author: this.currentUser._id === newMessage.u._id ? true : false,
            content: newMessage.msg,
            ts: newMessage.ts.$date,
          };
          this.addNewMessage(formattedMessage);
        }
      }
    };

    this.ws.onerror = (error: any) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      setTimeout(() => this.initializeWebSocket(), 5000); // Reconnect after 5 seconds
    };
  }

  async loadChatHistory() {
    this.history = await this.rocketChatApi.getChatHistory(this.ws, {
      url: urlConstants.API_URLS.LOAD_HISTORY,
      payload: {
        message: JSON.stringify({
          msg: 'method',
          method: 'loadHistory',
          id: '' + new Date().getTime(),
          params: [this.rid, null, 60, null],
        }),
      },
    });

    if (!this.history) {
      console.error('Failed to load chat history');
      return;
    }

    const rawMessages: any = JSON.parse(this.history.message);
    if (!Array.isArray(rawMessages.result.messages)) {
      console.error('Messages is not an array');
      return;
    }
    console.log(rawMessages.result.messages, 'rawMessages.result.messages');
    this.messages = this.groupMessagesByDate(rawMessages.result.messages);
  }

  addNewMessage(message: any) {
    console.log(message, 'message message');
    const date = new Date(message.ts).toLocaleDateString();
    const formattedMessage = {
      author: this.currentUser._id === message.u._id ? true : false,
      content: message.content,
      time: new Date(message.ts).toLocaleTimeString(),
    };

    const group = this.messages.find((m: any) => m.date === date);
    if (group) {
      group.messages.push(formattedMessage);
    } else {
      this.messages.push({
        date,
        messages: [formattedMessage],
      });
    }

    // Force Angular change detection
    this.messages = [...this.messages];
  }

  groupMessagesByDate(messages: any[]) {
    const grouped = messages.reduce((acc, message) => {
      const date = new Date(message.ts.$date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push({
        author: this.currentUser._id === message.u._id ? true : false,
        image: urlConstants.BASE_URL + '/avatar/' + message.u.username,
        content: message.msg,
        time: new Date(message.ts.$date).toLocaleTimeString(),
      });
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  }

  async sendMessage() {
    if (!this.messageText.trim()) {
      return; // Ignore empty messages
    }

    const payload = {
      msg: 'method',
      method: 'sendMessage',
      id: '' + new Date().getTime(),
      params: [
        {
          rid: this.rid,
          msg: this.messageText,
        },
      ],
    };

    this.ws?.send(JSON.stringify(payload));
    console.log('Message sent:', this.messageText);

    this.messageText = ''; // Clear input field
  }
}
