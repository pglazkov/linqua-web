import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppComponent } from './app.component';
import { firebaseConfig } from './firebase-config';
import { environment } from 'environments/environment';

import {
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatSidenavModule,
  MatToolbarModule
} from '@angular/material';

import { AuthModule, FirebaseAppModule, StorageModule, TimeGroupingModule, TranslationModule } from 'shared';
import { CommonModule } from '@angular/common';
import { EntryEditorDialogComponent } from './entry-editor-dialog';
import { HomeComponent, EntryItemComponent, RandomEntryComponent } from './home';
import { RandomEntryService } from './home/random-entry/random-entry.service';

const materialModules = [
  MatListModule,
  MatButtonModule,
  MatCardModule,
  MatIconModule,
  MatInputModule,
  MatDialogModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatButtonModule,
  MatIconModule,
  MatToolbarModule,
  MatCardModule,
  MatSidenavModule
];

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    EntryEditorDialogComponent,
    EntryItemComponent,
    RandomEntryComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    ServiceWorkerModule.register('/ngsw-worker.js', {enabled: environment.production}),
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    ...materialModules,
    StorageModule,
    TranslationModule,
    FirebaseAppModule.initializeApp(firebaseConfig),
    AuthModule.forRoot(),
    TimeGroupingModule.forRoot()
  ],
  providers: [
    RandomEntryService
  ],
  bootstrap: [AppComponent],
  entryComponents: [EntryEditorDialogComponent]
})
export class AppModule {

}
