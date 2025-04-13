import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  AfterViewInit
} from '@angular/core';
import { RocketChatApiService } from '../services/rocket-chat-api/rocket-chat-api.service';
import { urlConstants } from '../constants/urlConstants';
import { FrontendChatLibraryService } from '../frontend-chat-library.service';

@Component({
  selector: 'lib-chat-view',
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.css'],
})
export class ChatViewComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  @Input() config: any;
  @Input() rid: any;
  @Output() backEvent = new EventEmitter();
  @Output() profileEvent = new EventEmitter();

  currentUser: any;
  ws: any;
  messages: any = [];
  messageText: string = '';
  roomDetails: any;
  friendDetails: any;
  private lastTimestamp: any = null;
  private isLoadingHistory = false;
  private allMessagesLoaded = false;
  private isFirstLoad = true;
  isLoading: boolean = true;

  private pageSizeInDays = 7;
private startDate!: Date;
private endDate!: Date;

  constructor(
    private rocketChatApi: RocketChatApiService,
    private chatService: FrontendChatLibraryService,
    private cdk: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.scrollToBottom();
    this.endDate = new Date();
this.startDate = new Date(this.endDate);
// this.startDate.setDate(this.endDate.getDate() - this.pageSizeInDays + 1);
  }

  async ngOnInit() {
    this.config = this.config || this.chatService.config;
    if (!this.rid) return;

    await this.initializeWebSocket();
    await this.loadChatHistory();

    this.isLoading = false;
    this.scrollToBottom();
  }

  async initializeWebSocket() {
    this.isLoading = true;

    this.ws = new WebSocket(urlConstants.websocketUrl);
    await this.rocketChatApi.setHeadersAndWebsocket(this.config, this.ws);
    this.currentUser = await this.rocketChatApi.getCurrentUserDetails();
    this.roomDetails = await this.rocketChatApi.getRoomInfo(this.rid);
    await this.rocketChatApi.subscribeToRoomChat(
      this.config,
      this.ws,
      this.rid,
      this.roomDetails.room._id
    );

    let friendName = this.roomDetails?.room?.usernames.find(
      (name: any) => name !== this.currentUser.username
    );

    this.friendDetails = await this.rocketChatApi.getUserInfoByUsername(friendName);
    this.friendDetails.profilePic =
      urlConstants.BASE_URL + '/avatar/' + this.friendDetails.user.username;

    this.isLoading = false;

    this.ws.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);

      if (data.msg === 'ping') {
        this.ws.send(JSON.stringify({ msg: 'pong' }));
      }

      if (data.msg === 'changed' && data.collection === 'stream-room-messages') {
        const newMessage = data.fields.args[0];

        if (newMessage && newMessage.rid === this.rid) {
          const formattedMessage = {
            author: this.currentUser._id === newMessage.u._id,
            content: newMessage.msg,
            time: new Date(newMessage.ts.$date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
            image: urlConstants.BASE_URL + '/avatar/' + newMessage.u.username,
          };

          const date = new Date(newMessage.ts.$date).toLocaleDateString();
          const group = this.messages.find((m: any) => m.date === date);

          if (group) {
            group.messages.push(formattedMessage);
          } else {
            this.messages.push({ date, messages: [formattedMessage] });
          }

          this.cdk.detectChanges();
          this.scrollToBottom();
        }
      }
    };

    this.ws.onerror = (error: any) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      setTimeout(() => this.initializeWebSocket(), 5000);
    };
  }

  async loadChatHistory(): Promise<void> {
    if (this.isLoadingHistory || this.allMessagesLoaded) return;
    this.isLoadingHistory = true;
    try {
      const response = await this.rocketChatApi.getChatHistory(this.ws, {
        url: urlConstants.API_URLS.LOAD_HISTORY,
        payload: {
          message: JSON.stringify({
            msg: 'method',
            method: 'loadHistory',
            id: Date.now().toString(),
            params: [
              this.rid,
              this.lastTimestamp ? { $date: this.lastTimestamp } : null,
              50,
              { $date: Date.now() }
            ]
          })
        }
      });
      const rawMessages: any = JSON.parse(response.message);
      const newMessages = rawMessages?.result?.messages || [];
      if (newMessages.length === 0) {
        this.allMessagesLoaded = true;
        return;
      }
  
      // Update timestamp for next load
      this.lastTimestamp = newMessages[newMessages.length - 1].ts.$date;
  
      const filtered = newMessages.filter((msg: any) => {
        const msgDate = new Date(msg.ts.$date);
        if (msgDate < this.startDate) {
          this.startDate = msgDate; 
        }
        return msgDate >= this.startDate && msgDate <= this.endDate;
      });
  
      if (filtered.length === 0) {
        this.allMessagesLoaded = true;
        return;
      }
      const groupedMessages = this.groupMessagesByDate(filtered);
      this.messages = [...groupedMessages,...this.messages];
      this.endDate = new Date(this.startDate);
      this.startDate = new Date(this.endDate);
      this.startDate.setDate(this.endDate.getDate() - this.pageSizeInDays);
    this.isLoadingHistory = false;
    } catch (error) {
    } finally {
      this.isLoadingHistory = false;
    }
  }
  
  onScroll(event: any) {
    if (event.target.scrollTop === 0 && !this.isLoadingHistory) {
      this.loadChatHistory();
    }
  }

  addNewMessage(message: any) {
    const date = new Date(message.ts).toLocaleDateString();
    const formattedMessage = {
      author: this.currentUser._id === message.u._id,
      content: message.content,
      time: new Date(message.ts).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const group = this.messages.find((m: any) => m.date === date);
    if (group) {
      group.messages.push(formattedMessage);
    } else {
      this.messages.push({ date, messages: [formattedMessage] });
    }

    this.messages = [...this.messages];
  }

  groupMessagesByDate(allMessages: any[]) {
    const messages = [...allMessages].reverse();
    const grouped: any = messages.reduce((acc, message) => {
      const date = new Date(message.ts.$date).toLocaleDateString();
      if (!acc[date]) acc[date] = [];

      acc[date].push({
        author: this.currentUser._id === message.u._id,
        image: urlConstants.BASE_URL + '/avatar/' + message.u.username,
        content: message.msg,
        time: new Date(message.ts.$date).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
      });

      return acc;
    }, {});

    return Object.entries(grouped).map(([date, msgs]) => ({
      date,
      messages: msgs,
    }));
  }

  async sendMessage() {
    if (!this.messageText.trim()) return;

    const payload = {
      msg: 'method',
      method: 'sendMessage',
      id: '' + Date.now(),
      params: [{ rid: this.rid, msg: this.messageText }],
    };

    this.ws?.send(JSON.stringify(payload));
    this.messageText = '';
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    setTimeout(() => {
      this.scrollContainer?.nativeElement.scrollTo({
        top: this.scrollContainer?.nativeElement.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  }

  goBack() {
    this.backEvent.emit();
  }

  profile() {
    this.profileEvent.emit(this.currentUser?._id);
  }

  trackByDate(index: number, item: any): string {
    return item.date;
  }
}
