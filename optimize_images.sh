#!/bin/bash

# JPS Plumbing Services - Image Optimization Pipeline
# Usage: ./optimize_images.sh [source_directory] [target_directory]

# Configuration
SOURCE_DIR=${1:-./raw_images}
TARGET_DIR=${2:-./images}
QUALITY=85
MAX_WIDTH=2000
MAX_HEIGHT=2000

# Create target directory structure
echo "📁 Creating target directory structure..."
mkdir -p "$TARGET_DIR/team"
mkdir -p "$TARGET_DIR/services"
mkdir -p "$TARGET_DIR/equipment"
mkdir -p "$TARGET_DIR/before-after"
mkdir -p "$TARGET_DIR/gallery"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick is not installed. Please install it first:"
    echo "   sudo apt-get install imagemagick"
    exit 1
fi

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo "⚠️  WebP converter (cwebp) is not installed. Installing..."
    sudo apt-get install webp -y || {
        echo "❌ Failed to install WebP converter"
        exit 1
    }
fi

# Function to optimize image
optimize_image() {
    local source_file=$1
    local target_dir=$2
    local filename=$(basename "$source_file")
    local base_name=${filename%.*}
    local ext=${filename##*.}
    local target_file_jpg="$target_dir/$base_name.jpg"
    local target_file_webp="$target_dir/$base_name.webp"
    
    echo "   Processing $filename..."
    
    # Convert to JPG with optimization
    convert "$source_file" -strip -interlace Plane -quality $QUALITY \
            -resize "${MAX_WIDTH}x${MAX_HEIGHT}>" \
            -define jpeg:extent=300kb "$target_file_jpg"
    
    # Create WebP version
    cwebp -q $QUALITY "$target_file_jpg" -o "$target_file_webp"
    
    # Generate placeholder
    convert "$target_file_jpg" -thumbnail 20x20^ -gravity center -extent 20x20 \
            -quality 50 "$target_dir/${base_name}_placeholder.jpg"
    
    echo "   ✅ Created: $target_file_jpg, $target_file_webp, ${base_name}_placeholder.jpg"
}

# Function to process directory
process_directory() {
    local source_path=$1
    local target_path=$2
    local category=$(basename "$target_path")
    
    echo "📂 Processing $category images..."
    
    if [ -d "$source_path" ]; then
        find "$source_path" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | while read -r img; do
            optimize_image "$img" "$target_path"
        done
    else
        echo "   ⚠️  Source directory $source_path not found. Skipping..."
    fi
}

# Process all image categories
process_directory "$SOURCE_DIR/team" "$TARGET_DIR/team"
process_directory "$SOURCE_DIR/services" "$TARGET_DIR/services"
process_directory "$SOURCE_DIR/equipment" "$TARGET_DIR/equipment"
process_directory "$SOURCE_DIR/before-after" "$TARGET_DIR/before-after"
process_directory "$SOURCE_DIR/gallery" "$TARGET_DIR/gallery"

# Create optimized placeholders for website
echo "🎨 Creating optimized placeholders for website..."

# Hero image placeholder
convert -size 2000x1200 xc:"#005A9C" -fill "#EF3E42" -pointsize 72 -gravity center \
        -draw "text 0,0 'Professional Plumbing Services'" \
        "$TARGET_DIR/hero_placeholder.jpg"
convert "$TARGET_DIR/hero_placeholder.jpg" -quality 80 -resize 2000x1200 "$TARGET_DIR/hero_placeholder.webp"

# Team placeholder
convert -size 800x600 xc:white -fill "#005A9C" -pointsize 36 -gravity center \
        -draw "text 0,-50 'Our Professional Team'" -fill "#666" -pointsize 24 \
        -draw "text 0,20 'Available 24/7'" \
        "$TARGET_DIR/team/team_placeholder.jpg"
convert "$TARGET_DIR/team/team_placeholder.jpg" -quality 80 "$TARGET_DIR/team/team_placeholder.webp"

# Service placeholders
services=("Emergency Repairs" "Drain Cleaning" "Water Heaters" "Leak Detection")
for service in "${services[@]}"; do
    convert -size 800x600 xc:white -fill "#005A9C" -pointsize 32 -gravity center \
            -draw "text 0,0 '$service'" -fill "#EF3E42" -pointsize 24 \
            -draw "text 0,40 'Professional Service'" \
            "$TARGET_DIR/services/${service// /_}_placeholder.jpg"
    convert "$TARGET_DIR/services/${service// /_}_placeholder.jpg" -quality 80 "$TARGET_DIR/services/${service// /_}_placeholder.webp"
done

# Before/After placeholder
convert -size 1000x800 xc:white -fill "#005A9C" -pointsize 36 -gravity center \
        -draw "text 0,-100 'Before'" -fill "#EF3E42" -pointsize 48 \
        -draw "text 0,-20 '➜'" -fill "#005A9C" -pointsize 36 \
        -draw "text 0,60 'After'" \
        "$TARGET_DIR/before-after/before_after_placeholder.jpg"
convert "$TARGET_DIR/before-after/before_after_placeholder.jpg" -quality 80 "$TARGET_DIR/before-after/before_after_placeholder.webp"

# Generate image manifest
echo "📋 Generating image manifest..."
cat > "$TARGET_DIR/manifest.json" <<EOF
{
    "generated": "$(date -u)",
    "quality": $QUALITY,
    "max_dimensions": "${MAX_WIDTH}x${MAX_HEIGHT}",
    "categories": {
        "team": {
            "count": $(find "$TARGET_DIR/team" -type f | wc -l),
            "formats": ["jpg", "webp"]
        },
        "services": {
            "count": $(find "$TARGET_DIR/services" -type f | wc -l),
            "formats": ["jpg", "webp"]
        },
        "equipment": {
            "count": $(find "$TARGET_DIR/equipment" -type f | wc -l),
            "formats": ["jpg", "webp"]
        },
        "before-after": {
            "count": $(find "$TARGET_DIR/before-after" -type f | wc -l),
            "formats": ["jpg", "webp"]
        },
        "gallery": {
            "count": $(find "$TARGET_DIR/gallery" -type f | wc -l),
            "formats": ["jpg", "webp"]
        }
    },
    "optimization": {
        "tool": "ImageMagick + cwebp",
        "quality_setting": $QUALITY,
        "max_file_size": "300KB"
    }
}
EOF

echo "✅ Image optimization complete!"
echo "   Optimized images saved to: $TARGET_DIR"
echo "   Image manifest generated: $TARGET_DIR/manifest.json"
echo ""
echo "📝 Next steps:"
echo "1. Replace placeholder images with actual business photos"
echo "2. Run this script again after adding new images"
echo "3. Update website HTML to use optimized images"