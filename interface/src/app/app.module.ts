import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { GraphViewerComponent } from './graph-viewer/graph-viewer.component';
import { HttpClientModule } from '@angular/common/http';
import { GraphOptionsComponent } from './graph-options/graph-options.component';

@NgModule({
  declarations: [
    AppComponent,
    GraphViewerComponent,
    GraphOptionsComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
