# JPS Plumbing Services - Smoke Test Plan

## 🔥 Smoke Test Overview
This smoke test plan validates the core functionality of the JPS Plumbing Services website before deployment. The test ensures all critical features work as expected and identifies any immediate issues.

## 📋 Test Environment
- **URL**: https://jimenezplumbingsd.github.io
- **Environment**: Production (GitHub Pages)
- **Browser**: Chrome, Firefox, Safari, Edge (latest versions)
- **Devices**: Desktop, Tablet, Mobile
- **Test Data**: Use test contact information (name: Test User, email: test@example.com, phone: 7605551234)

## ✅ Test Cases

### 1. Website Accessibility
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Website loads successfully | Homepage loads without errors | ⬜ |
| All pages load (index, privacy, terms, warranty, thank-you) | Each page loads without 404 errors | ⬜ |
| Mobile responsiveness | Website adapts to mobile screens | ⬜ |
| Cross-browser compatibility | Works on Chrome, Firefox, Safari, Edge | ⬜ |

### 2. Visual & UI Testing
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Dodgers branding colors | Blue (#005A9C), white (#FFFFFF), red (#EF3E42) used consistently | ⬜ |
| Logo displays correctly | JPS logo shows on all pages | ⬜ |
| Images load properly | Placeholder images display without broken links | ⬜ |
| Font consistency | Montserrat (headings) and Open Sans (body) used consistently | ⬜ |
| Navigation works | All menu links navigate correctly | ⬜ |

### 3. Functional Testing
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| **Form Submission** | | |
| Submit valid form | Redirects to thank-you page, shows success message | ⬜ |
| Submit empty form | Shows validation errors for required fields | ⬜ |
| Submit with invalid email | Shows email validation error | ⬜ |
| Submit with invalid phone | Shows phone validation error | ⬜ |
| **Contact Information** | | |
| Click-to-call buttons | Opens phone dialer with correct number (7607893980) | ⬜ |
| Email links | Opens email client with correct address (jpsjimenez33@gmail.com) | ⬜ |
| Telegram link | Opens Telegram with correct bot (@jimenezplumbingbot) | ⬜ |
| **Navigation** | | |
| Sticky header | Header remains fixed when scrolling | ⬜ |
| Mobile menu | Mobile menu opens/closes properly | ⬜ |
| Anchor links | Smooth scrolling to sections | ⬜ |
| Back-to-top button | Button appears when scrolling, returns to top | ⬜ |

### 4. Integration Testing
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Google Analytics | Tracking code loads, page views recorded | ⬜ |
| Form submission tracking | Form submission event recorded in GA | ⬜ |
| Phone call tracking | Phone click events recorded in GA | ⬜ |
| Botwave SMTP integration | Form submissions received via email | ⬜ |
| Legal page links | Privacy, Terms, Warranty links work | ⬜ |

### 5. Performance Testing
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| Page load time | Homepage loads in < 3 seconds | ⬜ |
| Image loading | Images load without significant delay | ⬜ |
| Form submission speed | Form submits within 2 seconds | ⬜ |
| Mobile performance | Website performs well on mobile devices | ⬜ |

### 6. Security Testing
| Test Case | Expected Result | Status |
|-----------|-----------------|--------|
| HTTPS connection | Website loads over secure HTTPS | ⬜ |
| Form security | Form data submitted securely | ⬜ |
| No console errors | No JavaScript errors in console | ⬜ |
| No broken links | All links work without 404 errors | ⬜ |

## 🧪 Test Execution

### Test Setup
1. Deploy website to GitHub Pages
2. Open browser developer tools (Console, Network tabs)
3. Clear cache before testing
4. Use incognito mode to avoid cached data

### Test Procedure
1. Execute each test case in sequence
2. Record results in the Status column
3. Note any issues or unexpected behavior
4. Capture screenshots of any failures
5. Test on multiple devices if possible

## 📊 Test Results

**Overall Status**: ⬜ Pass ⬜ Fail ⬜ Partial

**Issues Found**: 
- 
- 
- 

**Notes**: 

## 📸 Validation Receipts

### Screenshots to Capture
1. Homepage on desktop and mobile
2. Form validation errors
3. Successful form submission
4. Thank you page
5. Legal pages (privacy, terms, warranty)
6. Console with no errors
7. Google Analytics real-time view showing active users
8. Email received from form submission

### Logs to Capture
1. Browser console output
2. Network requests during form submission
3. Google Analytics events
4. Any server-side logs (if available)

## ✅ Sign-off

**Tester Name**: 
**Date**: 
**Version Tested**: 

**Approval**: 
⬜ Ready for Production 
⬜ Needs Fixes (Specify):