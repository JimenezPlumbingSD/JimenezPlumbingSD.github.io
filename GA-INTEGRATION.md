# JPS Plumbing Services - Google Analytics Integration Guide

## 📊 Google Analytics Setup

### 1. Create Google Analytics Account
1. Go to [Google Analytics](https://analytics.google.com/) and sign in with your Google account
2. Click "Start measuring" to create a new account
3. **Account Setup**:
   - Account name: JPS Plumbing Services
   - Check all data sharing options as appropriate
4. **Property Setup**:
   - Property name: JPS Plumbing Website
   - Reporting time zone: Pacific Time (US & Canada)
   - Currency: US Dollar
5. **About your business**:
   - Industry category: Business and Industrial Markets
   - Business size: Small (1-10 employees)
   - Select how you intend to use Google Analytics
6. Click "Create" and accept the terms of service

### 2. Set Up Data Stream
1. In your new property, click "Data Streams" under the Property column
2. Click "Add stream" and select "Web"
3. **Web stream details**:
   - Website URL: https://jimenezplumbingsd.github.io
   - Stream name: JPS Plumbing Production Website
4. Click "Create stream"

### 3. Get Tracking Code
1. After creating the stream, you'll see the "Web stream details" page
2. Note the "Measurement ID" (format: G-XXXXXXXXXX)
3. Under "Tagging instructions", expand "Global site tag (gtag.js)"
4. Copy the entire code snippet (should look like the example below)

```html
<!-- Global site tag (gtag.js) - Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## 🌐 Website Integration

### 1. Add Tracking Code to Website

**Option A: Direct Integration (Recommended)**

Add the Google Analytics tracking code to the `<head>` section of your `index.html` file:

```html
<!-- Add this before the closing </head> tag -->
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Option B: Google Tag Manager (Advanced)**

If you prefer to use Google Tag Manager:
1. Create a GTM account at [tagmanager.google.com](https://tagmanager.google.com/)
2. Create a container for your website
3. Add the GTM container code to your website
4. Set up Google Analytics as a tag within GTM

### 2. Create Thank You Page Tracking

Update the form submission handler in `script.js` to track form completions:

```javascript
// Update the form submission success handler
if (data.success) {
    // Track form submission
    if (typeof gtag !== 'undefined') {
        gtag('event', 'conversion', {
            'send_to': 'G-XXXXXXXXXX/form_submission',
            'value': 1.0,
            'currency': 'USD'
        });
    }
    
    // Redirect to thank you page
    window.location.href = data.redirect;
}
```

### 3. Set Up Phone Call Tracking

Add event tracking for phone number clicks:

```javascript
// Add to script.js - setupEventListeners function
function setupEventListeners() {
    // [Existing code...]
    
    // Phone number click tracking
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    'event_category': 'Phone Call',
                    'event_label': this.textContent.trim()
                });
            }
        });
    });
    
    // CTA button click tracking
    const ctaButtons = document.querySelectorAll('.cta-button, .service-link');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    'event_category': 'CTA',
                    'event_label': this.textContent.trim()
                });
            }
        });
    });
}
```

## 🎯 Goal & Conversion Tracking

### 1. Set Up Goals in Google Analytics

1. Go to your Google Analytics property
2. Click "Admin" (gear icon) in the bottom left
3. In the View column, click "Goals"
4. Click "+ New Goal"

**Recommended Goals to Set Up:**

1. **Form Submissions**
   - Goal name: Form Submission
   - Type: Destination
   - Destination: /thank-you.html (Equals to)
   - Value: On (set a value, e.g., $50 for lead value)
   - Funnel: Off

2. **Phone Calls**
   - Goal name: Phone Call
   - Type: Event
   - Category: Equals to "Phone Call"
   - Action: Equals to "click"
   - Label: Contains "(619)" (or your actual area code)
   - Value: On (set a value, e.g., $100 for call value)

3. **Service Page Views**
   - Goal name: Service Page View
   - Type: Pages/Screens per session
   - Pages/Screens per session: Greater than 2

4. **Time on Site**
   - Goal name: Engaged Visitor
   - Type: Duration
   - Duration: Greater than 2 minutes

### 2. Set Up Ecommerce Tracking (Optional)

If you want to track service bookings as transactions:

1. Enable Ecommerce in Google Analytics:
   - Admin → View → Ecommerce Settings
   - Enable Ecommerce: On
   - Enable Enhanced Ecommerce Reporting: On

2. Add transaction tracking to your booking confirmation:

```javascript
// Example for tracking a service booking
if (typeof gtag !== 'undefined') {
    gtag('event', 'purchase', {
        "transaction_id": "ORDER12345",
        "affiliation": "JPS Plumbing Services",
        "value": 299.99,
        "currency": "USD",
        "tax": 24.00,
        "shipping": 0,
        "items": [{
            "item_id": "EMERGENCY",
            "item_name": "Emergency Plumbing Repair",
            "item_category": "Service",
            "price": 299.99,
            "quantity": 1
        }]
    });
}
```

## 📈 Recommended Reports to Monitor

### 1. Acquisition Reports
- **Channels**: See which marketing channels drive the most traffic
- **Source/Medium**: Identify top traffic sources (Google, Yelp, Facebook, etc.)
- **Referrals**: Track traffic from review sites and local directories

### 2. Behavior Reports
- **Site Content**: Identify most popular pages
- **Landing Pages**: See which pages visitors enter your site through
- **Exit Pages**: Identify pages where visitors leave your site
- **Behavior Flow**: Visualize user journey through your website

### 3. Conversion Reports
- **Goals Overview**: Track completion of all goals
- **Goal URLs**: See which pages convert best
- **Reverse Goal Path**: Understand the path users take before converting
- **Funnel Visualization**: If you set up a funnel, see where users drop off

### 4. Audience Reports
- **Overview**: Basic user metrics (sessions, users, pageviews)
- **Geo**: Location data to ensure you're reaching local customers
- **Mobile**: Device breakdown to optimize for mobile users
- **Demographics**: Age and gender of your visitors

## 🔧 Advanced Tracking Setup

### 1. Event Tracking for Key Interactions

Add these event trackers to your `script.js`:

```javascript
// Track service card clicks
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('click', function() {
        const serviceTitle = this.querySelector('.service-title').textContent;
        if (typeof gtag !== 'undefined') {
            gtag('event', 'click', {
                'event_category': 'Service',
                'event_label': serviceTitle
            });
        }
    });
});

// Track review link clicks
document.querySelectorAll('a[href*="reviews"], a[href*="yelp"], a[href*="angi"]')
    .forEach(link => {
        link.addEventListener('click', function() {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    'event_category': 'Review Site',
                    'event_label': this.textContent.trim()
                });
            }
        });
    });

// Track scroll depth
window.addEventListener('scroll', function() {
    const scrollPercentage = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollPercentage > 25 && scrollPercentage <= 35) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'scroll', {
                'event_category': 'Engagement',
                'event_label': '25%'
            });
        }
    } else if (scrollPercentage > 50 && scrollPercentage <= 60) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'scroll', {
                'event_category': 'Engagement',
                'event_label': '50%'
            });
        }
    } else if (scrollPercentage > 75 && scrollPercentage <= 85) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'scroll', {
                'event_category': 'Engagement',
                'event_label': '75%'
            });
        }
    }
});
```

### 2. Set Up Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console/)
2. Add your property (https://jimenezplumbingsd.github.io)
3. Verify ownership (GitHub Pages verification is straightforward)
4. Submit your sitemap (create one if you haven't already)
5. Monitor search performance and indexing issues

### 3. Create Custom Dashboards

**Recommended Custom Dashboards:**

1. **Lead Generation Dashboard**
   - Form submissions
   - Phone calls
   - Contact page views
   - Conversion rates

2. **Local SEO Dashboard**
   - Organic search traffic
   - Local keyword rankings
   - Google My Business insights
   - Review site referrals

3. **User Engagement Dashboard**
   - Bounce rate
   - Pages per session
   - Average session duration
   - Scroll depth
   - Returning vs new visitors

## 📅 Implementation Checklist

1. [ ] Create Google Analytics account
2. [ ] Set up property and data stream
3. [ ] Add tracking code to website
4. [ ] Set up goals for key conversions
5. [ ] Implement event tracking for important interactions
6. [ ] Set up Google Search Console
7. [ ] Create custom dashboards
8. [ ] Test tracking implementation
9. [ ] Set up regular reporting schedule
10. [ ] Train team on using Google Analytics

## 🛠 Troubleshooting

**Issue: No data appearing in Google Analytics**
- Verify tracking code is installed correctly (use Google Tag Assistant)
- Check that the Measurement ID matches your property
- Ensure no JavaScript errors are preventing the code from executing
- Verify that your website is live and accessible

**Issue: Form submissions not tracking**
- Check that the thank you page URL is correct
- Verify that the goal is set up with the correct destination
- Ensure the form submission actually redirects to the thank you page
- Test the form submission process manually

**Issue: Phone calls not tracking**
- Verify that the tel: links have the click event listeners
- Check that the event category and label match exactly
- Test phone number clicks manually
- Ensure no JavaScript errors are preventing the tracking code

## 📚 Resources

- [Google Analytics Help Center](https://support.google.com/analytics)
- [Google Tag Assistant (Chrome Extension)](https://chrome.google.com/webstore/detail/tag-assistant-by-google/kejbdjndbnbjgmefkgdddjlbokphdefk)
- [Google Analytics Demo Account](https://analytics.google.com/analytics/web/demoAccount)
- [Google Analytics Academy (Free Courses)](https://analytics.google.com/analytics/academy/)
- [Google Data Studio (for advanced reporting)](https://datastudio.google.com/)