import { Component } from '@angular/core';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss']
})
export class AboutDialogComponent {
  version = environment.version;

}
