#!/bin/bash

# JPS Plumbing Services - Contact Information Update Script
# Usage: ./update_contact_info.sh [PHONE_NUMBER] [EMAIL] [LICENSE_NUMBER]

# Configuration
REPO_DIR="/var/home/gringo/plumbing-landing"
BACKUP_DIR="$REPO_DIR/backups/$(date +%Y%m%d_%H%M%S)"
PHONE_PLACEHOLDER="6195551234"
EMAIL_PLACEHOLDER="info@jpsplumbingsd.com"
LICENSE_PLACEHOLDER="PL987654"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup files before modification
echo "🔒 Creating backup of all files in $BACKUP_DIR..."
cp -a "$REPO_DIR"/*.html "$BACKUP_DIR"/
cp -a "$REPO_DIR"/*.md "$BACKUP_DIR"/
cp -a "$REPO_DIR"/*.js "$BACKUP_DIR"/

# Function to update contact info
update_contact_info() {
    local phone_number=$1
    local email_address=$2
    local license_number=$3
    
    echo "🔄 Updating contact information:"
    echo "   Phone: $phone_number"
    echo "   Email: $email_address"
    echo "   License: $license_number"
    
    # Update HTML files
    find "$REPO_DIR" -name "*.html" -type f | while read -r file; do
        echo "   Processing $file..."
        
        # Backup original
        cp "$file" "$file.bak"
        
        # Update phone numbers (various formats)
        sed -i "" "s/(\\d\\{3\\}) \\d\\{3\\}-\\d\\{4\\}/(\\\(${phone_number:0:3}\\\) ${phone_number:3:3}-${phone_number:6:4}/g" "$file"
        sed -i "" "s/\\d\\{3\\}-\\d\\{3\\}-\\d\\{4\\}/${phone_number:0:3}-${phone_number:3:3}-${phone_number:6:4}/g" "$file"
        sed -i "" "s/\\d\\{3\\}\\.\\d\\{3\\}\\.\\d\\{4\\}/${phone_number:0:3}.${phone_number:3:3}.${phone_number:6:4}/g" "$file"
        sed -i "" "s/tel:$PHONE_PLACEHOLDER/tel:$phone_number/g" "$file"
        
        # Update email addresses
        sed -i "" "s/$EMAIL_PLACEHOLDER/$email_address/g" "$file"
        
        # Update license number
        sed -i "" "s/$LICENSE_PLACEHOLDER/$license_number/g" "$file"
        
        # Clean up backup
        rm "$file.bak"
    done
    
    # Update JavaScript files
    find "$REPO_DIR" -name "*.js" -type f | while read -r file; do
        echo "   Processing $file..."
        
        # Backup original
        cp "$file" "$file.bak"
        
        # Update phone numbers in JS
        sed -i "" "s/$PHONE_PLACEHOLDER/$phone_number/g" "$file"
        
        # Clean up backup
        rm "$file.bak"
    done
    
    # Update Markdown files
    find "$REPO_DIR" -name "*.md" -type f | while read -r file; do
        echo "   Processing $file..."
        
        # Backup original
        cp "$file" "$file.bak"
        
        # Update placeholders in markdown
        sed -i "" "s/$PHONE_PLACEHOLDER/$phone_number/g" "$file"
        sed -i "" "s/$EMAIL_PLACEHOLDER/$email_address/g" "$file"
        sed -i "" "s/$LICENSE_PLACEHOLDER/$license_number/g" "$file"
        
        # Clean up backup
        rm "$file.bak"
    done
    
    echo "✅ Contact information updated successfully!"
}

# Execute update
if [ $# -eq 3 ]; then
    update_contact_info "$1" "$2" "$3"
else
    echo "📞 JPS Plumbing Services - Contact Information Update"
    echo ""
    echo "Usage: $0 [PHONE_NUMBER] [EMAIL] [LICENSE_NUMBER]"
    echo ""
    echo "Example: $0 6195551234 info@jpsplumbing.com PL123456"
    echo ""
    echo "Current placeholders:"
    echo "  Phone: $PHONE_PLACEHOLDER"
    echo "  Email: $EMAIL_PLACEHOLDER"
    echo "  License: $LICENSE_PLACEHOLDER"
    echo ""
    read -p "Enter phone number (10 digits, no formatting): " phone
    read -p "Enter email address: " email
    read -p "Enter license number: " license
    
    update_contact_info "$phone" "$email" "$license"
fi

# Generate update report
echo "📋 Contact Information Update Report" > "$REPO_DIR/contact_update_report.txt"
echo "==================================" >> "$REPO_DIR/contact_update_report.txt"
echo "Date: $(date)" >> "$REPO_DIR/contact_update_report.txt"
echo "Phone Number: $phone" >> "$REPO_DIR/contact_update_report.txt"
echo "Email Address: $email" >> "$REPO_DIR/contact_update_report.txt"
echo "License Number: $license" >> "$REPO_DIR/contact_update_report.txt"
echo "Backup Location: $BACKUP_DIR" >> "$REPO_DIR/contact_update_report.txt"
echo "Files Modified:" >> "$REPO_DIR/contact_update_report.txt"
find "$REPO_DIR" -name "*.html" -o -name "*.js" -o -name "*.md" | sort >> "$REPO_DIR/contact_update_report.txt"

echo "📊 Update report generated: $REPO_DIR/contact_update_report.txt"