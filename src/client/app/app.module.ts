import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApplicationRef, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { firebaseConfig } from './firebase-config';

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

import { AuthModule, FirebaseAppModule, StorageModule, TranslationModule } from 'shared';
import { CommonModule } from '@angular/common';
import { EntryEditorDialogComponent } from './entry-editor-dialog';
import { EntryListComponent, EntryItemComponent } from './entry-list';

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
    EntryListComponent,
    EntryEditorDialogComponent,
    EntryItemComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    ...materialModules,
    StorageModule,
    TranslationModule,
    FirebaseAppModule.initializeApp(firebaseConfig),
    AuthModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [EntryEditorDialogComponent]
})
export class AppModule {
  constructor(appRef: ApplicationRef) {
    appRef.isStable.subscribe(v => {
      console.log(v);
    });
  }
}
