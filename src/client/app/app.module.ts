import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';

import { AppComponent } from './app.component';
import { firebaseConfig } from './firebase-config';
import { environment } from 'environments/environment';



import { AuthModule, FirebaseAppModule, StorageModule, TimeGroupingModule, TranslationModule } from 'shared';
import { CommonModule } from '@angular/common';
import { EntryEditorDialogComponent } from './entry-editor-dialog';
import { HomeComponent, EntryItemComponent, RandomEntryComponent } from './home';
import { RandomEntryService } from './home/random-entry/random-entry.service';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

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
  MatSidenavModule,
  MatButtonToggleModule
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
