// src/app/pages/profile/profile.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    ProfileComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule, // ✅ For formGroup
    FormsModule,         // ✅ For ngModel
    ProfileRoutingModule,
    SharedModule
  ]
})
export class ProfileModule { } // ✅ Make sure this export exists