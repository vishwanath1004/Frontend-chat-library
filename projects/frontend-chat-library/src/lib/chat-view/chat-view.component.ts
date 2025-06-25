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
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
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
  @Output() limitExceededEvent = new EventEmitter();
  @Input() meta: any;

  textLimit = 250;
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
  canSendMessage: boolean = true;
  CHAT_LIB_META_KEYS: any;

  constructor(
    private rocketChatApi: RocketChatApiService,
    private chatService: FrontendChatLibraryService,
    private cdk: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngAfterViewInit() {
    this.rocketChatApi.getTextLimit().then((limit: any) => {
      this.textLimit = limit;
    });
    this.scrollToBottom();
    this.endDate = new Date();
    this.startDate = new Date(this.endDate);
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

    this.ws = new WebSocket(this.config.chatWebSocketUrl);
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
    this.friendDetails.profilePic = await this.rocketChatApi.resolveImageUrl(this.friendDetails.user.username);
    this.canSendMessage = this.friendDetails?.user?.active;
    this.isLoading = false;
    this.ws.onmessage = async (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.msg === 'ping') {
        this.ws.send(JSON.stringify({ msg: 'pong' }));
      }
      if (data.msg === 'changed' && data.collection === 'stream-room-messages') {
        const newMessage = data.fields?.args?.[0];
        if (newMessage && newMessage.rid === this.rid) {
          const isAuthor = this.currentUser._id === newMessage.u._id;
          const content = this.sanitizer.bypassSecurityTrustHtml(this.convertLinks(newMessage.msg));
          const timestamp = new Date(newMessage.ts?.$date || newMessage.ts);
          const formattedTime = timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const image = await this.rocketChatApi.resolveImageUrl(newMessage.u.username);
          const formattedMessage = {
            author: isAuthor,
            content,
            time: formattedTime,
            image,
          };
          const date = timestamp.toLocaleDateString();
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
      this.lastTimestamp = newMessages[newMessages.length - 1].ts.$date;
      const filtered = newMessages.filter((msg: any) => {
        const msgDate = new Date(msg.ts.$date);
        if (!this.startDate || msgDate < this.startDate) {
          this.startDate = msgDate;
        }
        if (!this.endDate || msgDate > this.endDate) {
          this.endDate = msgDate;
        }
        return msgDate >= this.startDate && msgDate <= this.endDate;
      });

      if (filtered.length === 0) {
        this.allMessagesLoaded = true;
        return;
      }

      const groupedMessages = this.groupMessagesByDate(filtered);
      this.messages = [...(await groupedMessages), ...this.messages];
      this.endDate = new Date(this.startDate);
      this.startDate = new Date(this.endDate);
      this.startDate.setDate(this.endDate.getDate() - this.pageSizeInDays);
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

  async groupMessagesByDate(allMessages: any[]) {
    const messages = [...allMessages].reverse();
    const processedMessages = await Promise.all(
      messages.map(async (message) => {
        return {
          date: new Date(message.ts.$date).toLocaleDateString(),
          message: {
            author: this.currentUser._id === message.u._id,
            image: await this.rocketChatApi.resolveImageUrl(message.u.username),
            content: this.sanitizer.bypassSecurityTrustHtml(this.convertLinks(message.msg)),
            time: new Date(message.ts.$date).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }),
          }
        };
      })
    );
    const grouped: any = {};
    processedMessages.forEach(({ date, message }) => {
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(message);
    });
    return Object.entries(grouped).map(([date, messages]) => ({
      date,
      messages
    }));
  }

  async sendMessage() {
    if (!this.messageText.trim()) return;
      if(this.messageText.length > this.textLimit) {
        this.limitExceededEvent.emit(this.textLimit);
        return;
      }
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
    this.profileEvent.emit(this.friendDetails?.user?._id);
  }

  trackByDate(index: number, item: any): string {
    return item.date;
  }

  convertLinks(text: string): string {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      const encodedUrl = encodeURI(url);
      return `<a href="${encodedUrl}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  }
}
