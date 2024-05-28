import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageListingComponent } from './message-listing.component';

describe('MessageListingComponent', () => {
  let component: MessageListingComponent;
  let fixture: ComponentFixture<MessageListingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageListingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MessageListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
