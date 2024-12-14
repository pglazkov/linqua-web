import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { firebaseConfig } from '@linqua/firebase-config';

import { environment } from '../environments/environment';
import { provideFirebase } from './firebase';
import { MatDialogOverride } from './mat-dialog-override/mat-dialog.override';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideFirebase(firebaseConfig),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideAnimations(),
    {
      provide: MatDialog,
      useClass: MatDialogOverride,
    },
  ],
};
