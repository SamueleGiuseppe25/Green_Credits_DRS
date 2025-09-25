# GreenCredits – Requirements

## Problem Statement
The problem of having physical printed receipts with QR codes that can be lost, or leaving your house with a big bag full of bottles to recycle, heading to the returning machine and finding out it’s full or out of service, affects every person that participates in the Deposit Return Scheme (DRS).  

This results in:
- Needing to keep fragile paper receipts as proof of credit.
- Uncertainty whether return machines are working before traveling.
- Lack of transparency about donated credits and where the funds go.  

A successful solution would provide:
- A unified digital wallet for bottle return credits.
- A map of verified, available return points.
- Clear status of donation collections.
- A faster, paperless, and more user-friendly experience.

---

## MVP User Stories

### Recycler (End-User)
1. **Register & Login**  
   *As a recycler, I want to create an account and sign in, so that my returns and credits are saved.*  

2. **View Wallet Balance & History**  
   *As a recycler, I want to see my current balance and past transactions, so that I know what I’ve earned or donated.*  

3. **Add Credits via Machine Simulator**  
   *As a recycler, I want to simulate returning bottles/cans, so that I can see credits increase in my wallet.*  

4. **Submit Receipt Image (Upload)**  
   *As a recycler, I want to upload a photo of a receipt to claim credit, so that I can digitize paper receipts.*  

5. **Scan via Web Camera (Phase 1)**  
   *As a recycler, I want to scan a receipt barcode with my browser camera, so that I don’t need to upload files manually.*  

### Admin
6. **Moderate Claims**  
   *As an admin, I want to approve/reject receipt claims, so that credits are not abused.*  

7. **View Analytics**  
   *As an admin, I want to see totals (returns, donations, active users), so that I can report impact.*  

### Optional Future Role (Charity)
8. **Donation Summary**  
   *As a charity rep, I want to view monthly donations attributed to our org, so that I can report funding.*  

---

## Non-Functional Goals

- **Security**  
  - JWT auth (access + refresh tokens).  
  - Role-based access control (User, Admin, Charity).  
  - Signed, short-lived QR tokens with replay protection.  
  - Strong input validation and rate limiting.  

- **Privacy & Compliance**  
  - Store minimal personal data.  
  - Remove EXIF metadata on uploaded images.  
  - GDPR compliance: allow export/delete of account data.  

- **Reliability & Availability**  
  - Target uptime ≥ 99% (Railway).  
  - Health check endpoint `/healthz`.  
  - Graceful timeouts and error handling.  

- **Performance**  
  - p95 < 300 ms for simple GET requests.  
  - p95 < 800 ms for uploads (excluding network).  
  - Indexed queries and paginated lists.  

- **Scalability**  
  - Backend and frontend containerized separately.  
  - Background jobs via Celery + Redis (optional).  

- **Observability**  
  - Structured JSON logs with request IDs.  
  - Sentry for error tracking.  
  - Prometheus metrics for requests, latency, OCR success.  

- **Maintainability**  
  - OpenAPI contract–first development.  
  - Clear module boundaries, typed models (Pydantic).  
  - ADRs for recording key architecture decisions.  

- **Testability**  
  - Backend: pytest unit + integration tests with DB containers.  
  - Frontend: MSW + component tests, a few E2E smoke tests.  

- **Accessibility**  
  - WCAG AA: keyboard navigation, alt text, contrast compliance.  

- **CI/CD**  
  - GitHub Actions: lint, test, build on every PR.  
  - Auto-deploy to Railway on merge to `main`.  
