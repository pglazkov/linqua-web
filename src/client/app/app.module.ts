import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';

import { FirebaseAppModule } from 'ng-firebase-lite';

import { AppComponent } from './app.component';
import { firebaseConfig } from './firebase-config';
import { environment } from 'environments/environment';



import { AuthModule, TimeGroupingModule, TranslationModule } from '@linqua/shared';
import { CommonModule } from '@angular/common';
import { EntryEditorDialogComponent } from './entry-editor-dialog';
import { HomeComponent, EntryItemComponent, RandomEntryComponent } from './home';
import { RandomEntryService } from './home/random-entry/random-entry.service';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AboutDialogComponent } from './about-dialog/about-dialog.component';

const materialModules = [
  MatListModule,
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatInputModule,
  MatDialogModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatToolbarModule,
  MatButtonToggleModule
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    EntryEditorDialogComponent,
    EntryItemComponent,
    RandomEntryComponent,
    AboutDialogComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    FormsModule,
    ReactiveFormsModule,
    ...materialModules,
    TranslationModule,
    FirebaseAppModule.initializeApp(firebaseConfig),
    AuthModule.forRoot(),
    TimeGroupingModule.forRoot()
  ],
  providers: [
    RandomEntryService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

}
