import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestComponent } from './test.component';

@NgModule({
  imports: [
    CommonModule,
    TestComponent
  ],
  exports: [
    TestComponent
  ]
})
export class TestModule { }
