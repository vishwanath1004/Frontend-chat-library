import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'lib-message-listing',
  templateUrl: './message-listing.component.html',
  styleUrls: ['./message-listing.component.css']
})
export class MessageListingComponent implements OnInit {
  messages = [
    {
      image: 'https://via.placeholder.com/150',
      name: 'John Doe',
      lastMessage: 'Hey, how are you?',
      time: new Date()
    },
    {
      image: 'https://via.placeholder.com/150',
      name: 'Jane Smith',
      lastMessage: 'Are we meeting tomorrow?',
      time: new Date(Date.now() - 600000)
    },
    {
      image: 'https://via.placeholder.com/150',
      name: 'Bob Johnson',
      lastMessage: 'Call me when you are free.',
      time: new Date(Date.now() - 1200000)
    },
    {
      image: 'https://via.placeholder.com/150',
      name: 'David',
      lastMessage: 'Hey, how are you?',
      time: new Date()
    },
    {
      image: 'https://via.placeholder.com/150',
      name: 'Jack Sparrow',
      lastMessage: 'Are we meeting tomorrow?',
      time: new Date(Date.now() - 600000)
    },
    {
      image: 'https://via.placeholder.com/150',
      name: 'Joseph',
      lastMessage: 'Hey man!!.',
      time: new Date(Date.now() - 1200000)
    }
  ];
  constructor() { }

  ngOnInit(): void {
  }

}
