import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {

  entries: { text: string }[] = [
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' },
    { text: 'word' }
  ];

  constructor() { }

  ngOnInit() {
  }

}
