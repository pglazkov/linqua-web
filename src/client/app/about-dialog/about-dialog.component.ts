import { Component } from '@angular/core';
import { MatDialogContent } from '@angular/material/dialog';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogContent],
})
export class AboutDialogComponent {
  version = environment.version;
}
