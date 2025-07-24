import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm!: FormGroup;
  loading = false;
  showSuccess = false;
  submitError = '';

private formspreeUrl = 'https://formspree.io/f/mnnzdqdp';
; 

  constructor(
    private formBuilder: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.contactForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      subject: ['', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.submitError = '';
    this.showSuccess = false;

    // 📧 Send email via Formspree
    this.sendEmail(this.contactForm.value);
  }

  private sendEmail(formData: any): void {
    // Format data for Formspree
    const emailData = {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone || 'Not provided',
      subject: formData.subject,
      message: `
Subject: ${formData.subject}

Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
Phone: ${formData.phone || 'Not provided'}

Message:
${formData.message}

---
Sent from InMind Contact Form
Time: ${new Date().toLocaleString()}
      `.trim()
    };

    // 📧 Send to Formspree
    this.http.post(this.formspreeUrl, emailData, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response) => {
        console.log('✅ Email sent successfully:', response);
        this.loading = false;
        this.showSuccess = true;
        this.contactForm.reset();
        this.initializeForm(); // Reset form validation
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          this.showSuccess = false;
        }, 5000);
      },
      error: (error) => {
        console.error('❌ Email failed:', error);
        this.loading = false;
        this.submitError = 'Failed to send message. Please try again later or contact us directly.';
        
        // Hide error after 10 seconds
        setTimeout(() => {
          this.submitError = '';
        }, 10000);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} must be at least ${requiredLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message'
    };
    return labels[fieldName] || fieldName;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contactForm.controls).forEach(key => {
      const control = this.contactForm.get(key);
      control?.markAsTouched();
    });
  }
}