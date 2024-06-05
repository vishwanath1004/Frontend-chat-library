import { TestBed } from '@angular/core/testing';

import { RocketChatApiService } from './rocket-chat-api.service';

describe('RocketChatApiService', () => {
  let service: RocketChatApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RocketChatApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
