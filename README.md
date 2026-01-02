# Secure Payment Card – Reusable Web Component
![Angular](https://img.shields.io/badge/Angular-18.2-red?logo=angular)

A framework-agnostic, secure payment card input form built with **Angular Elements** and encapsulated using **Shadow DOM**.

## Built With
- Angular 18.2
- Angular Elements
- Shadow DOM (full style and DOM encapsulation)

## Features
- Interactive 3D card preview with flip animation (shows CVC on back)
- Real-time card number formatting (spaces every 4 digits)
- Luhn algorithm validation
- Automatic card type detection (Visa, Mastercard, American Express, Discover)
- Dynamic CVC length (3 digits normally, 4 digits for Amex)
- Expiry date formatting (MM/YY) and validation
- Postal code field
- Full accessibility: ARIA labels, `role="alert"` for errors, `aria-describedby` linking
- Highly customizable via CSS custom properties
- Emits `paymentSuccess` and `paymentError` events
- Simulated tokenization and payment processing (for demo purposes)

## Live Demo
After following the setup steps below, open:  
**http://localhost:8080/demo.html**

**Test card details** (any that pass Luhn check work):
- Card number: `4242 4242 4242 4242` (Visa)
- Expiry: any future date, e.g. `12/30`
- CVC: `123` (or `1234` for Amex)
- Postal code: any, e.g. `90210`

Payment succeeds ~85% of the time (simulated).

## Setup & Run

```bash
# 1. Clone and install dependencies
git clone https://github.com/your-username/secure-payment-card.git
cd secure-payment-card
npm install

# 2. Build the web component (no file hashing for easy demo loading)
ng build --configuration production --output-hashing none

# 3. Copy the demo file into the build output
cp demo.html dist/payment/

# 4. Serve locally
npx http-server dist/payment -p 8080
