//
// Professional Plumbing Services JavaScript
// ========================================
//
// FUNCTIONAL OVERVIEW:
// - Sticky header with scroll effect
// - Mobile menu toggle
// - Form validation
// - Back-to-top button
// - Smooth scrolling for anchor links
// - Dynamic year in footer
//

// DOM Ready Wrapper
function domReady(callback) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(callback, 1);
    } else {
        document.addEventListener("DOMContentLoaded", callback);
    }
}

// Initialize Application
domReady(function() {
    // Header scroll effect
    initStickyHeader();
    
    // Mobile menu functionality
    initMobileMenu();
    
    // Form validation
    initFormValidation();
    
    // Back to top button
    initBackToTop();
    
    // Smooth scrolling for anchor links
    initSmoothScrolling();
    
    // Dynamic year in footer
    updateCopyrightYear();
    
    // Set up event listeners
    setupEventListeners();
});

// Sticky Header
function initStickyHeader() {
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// Mobile Menu
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    mobileMenuButton.addEventListener('click', function() {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', !isExpanded);
        mobileMenu.classList.toggle('active');
        
        // Animate mobile menu icon
        const icons = this.querySelectorAll('.mobile-menu-icon');
        if (mobileMenu.classList.contains('active')) {
            icons[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            icons[1].style.opacity = '0';
            icons[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            icons[0].style.transform = '';
            icons[1].style.opacity = '';
            icons[2].style.transform = '';
        }
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!mobileMenuButton.contains(event.target) && !mobileMenu.contains(event.target)) {
            mobileMenuButton.setAttribute('aria-expanded', 'false');
            mobileMenu.classList.remove('active');
            
            // Reset mobile menu icon
            const icons = mobileMenuButton.querySelectorAll('.mobile-menu-icon');
            icons[0].style.transform = '';
            icons[1].style.opacity = '';
            icons[2].style.transform = '';
        }
    });
}

// Form Validation
function initFormValidation() {
    const form = document.getElementById('inquiry-form');
    
    if (!form) return;
    
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        let isValid = true;
        
        // Validate Name
        const name = document.getElementById('name');
        const nameError = document.getElementById('name-error');
        if (!name.value.trim()) {
            nameError.textContent = 'Name is required';
            isValid = false;
        } else {
            nameError.textContent = '';
        }
        
        // Validate Phone
        const phone = document.getElementById('phone');
        const phoneError = document.getElementById('phone-error');
        const phoneRegex = /^[\(]?(\d{3})[\)]?[\s-]?(\d{3})[\s-]?(\d{4})$/;
        if (!phone.value.trim()) {
            phoneError.textContent = 'Phone number is required';
            isValid = false;
        } else if (!phoneRegex.test(phone.value.trim())) {
            phoneError.textContent = 'Please enter a valid phone number';
            isValid = false;
        } else {
            phoneError.textContent = '';
        }
        
        // Validate Email
        const email = document.getElementById('email');
        const emailError = document.getElementById('email-error');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.value.trim()) {
            emailError.textContent = 'Email is required';
            isValid = false;
        } else if (!emailRegex.test(email.value.trim())) {
            emailError.textContent = 'Please enter a valid email address';
            isValid = false;
        } else {
            emailError.textContent = '';
        }
        
        // Validate Service
        const service = document.getElementById('service');
        const serviceError = document.getElementById('service-error');
        if (!service.value) {
            serviceError.textContent = 'Please select a service';
            isValid = false;
        } else {
            serviceError.textContent = '';
        }
        
        // If form is valid, submit it (in production, this would send to a server)
        if (isValid) {
            alert('Thank you for your inquiry! We will contact you shortly.');
            form.reset();
        }
    });
    
    // Real-time validation for better UX
    const inputs = form.querySelectorAll('.form-input, .form-select');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            const errorElement = document.getElementById(this.id + '-error');
            if (!this.value.trim()) {
                errorElement.textContent = this.previousElementSibling.textContent.replace('*', '') + ' is required';
            } else if (this.id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value.trim())) {
                errorElement.textContent = 'Please enter a valid email address';
            } else if (this.id === 'phone' && !/^[\(]?(\d{3})[\)]?[\s-]?(\d{3})[\s-]?(\d{4})$/.test(this.value.trim())) {
                errorElement.textContent = 'Please enter a valid phone number';
            } else {
                errorElement.textContent = '';
            }
        });
        
        input.addEventListener('focus', function() {
            const errorElement = document.getElementById(this.id + '-error');
            errorElement.textContent = '';
        });
    });
}

// Back to Top Button
function initBackToTop() {
    const backToTopButton = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.style.display = 'flex';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Smooth Scrolling for Anchor Links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            // Skip for mobile menu links to avoid closing menu
            if (this.closest('.mobile-menu')) return;
            
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                const mobileMenuButton = document.getElementById('mobile-menu-button');
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu.classList.contains('active')) {
                    mobileMenuButton.setAttribute('aria-expanded', 'false');
                    mobileMenu.classList.remove('active');
                    
                    // Reset mobile menu icon
                    const icons = mobileMenuButton.querySelectorAll('.mobile-menu-icon');
                    icons[0].style.transform = '';
                    icons[1].style.opacity = '';
                    icons[2].style.transform = '';
                }
            }
        });
    });
}

// Update Copyright Year
function updateCopyrightYear() {
    const yearElement = document.querySelector('.copyright');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.textContent = yearElement.textContent.replace('2025', currentYear);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Add any additional event listeners here
    
    // Example: Add hover effects for service cards
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
}

// Expose functions to global scope for debugging (remove in production)
window.plumbingApp = {
    initStickyHeader,
    initMobileMenu,
    initFormValidation,
    initBackToTop,
    initSmoothScrolling,
    updateCopyrightYear
};