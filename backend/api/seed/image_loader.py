"""
Image loader for seed data.

Scans backend/api/seed/assets/ for image files, copies them to MEDIA_ROOT/room_images/
with unique names, and returns their relative paths for use in RoomImageFactory.

Falls back to Pillow-generated placeholders if no assets exist.
"""
import os
import shutil
import uuid
from pathlib import Path
from typing import List

from django.conf import settings
from PIL import Image, ImageDraw, ImageFont


def get_room_images(count: int = None) -> List[str]:
    """
    Returns list of image paths (relative to MEDIA_ROOT) for room images.
    If assets exist, copies them. Otherwise generates placeholders.

    Args:
        count: Optional limit on number of images to return (None = all available)

    Returns:
        List of paths like ["room_images/abc123.jpg", ...]
    """
    # Ensure destination directory exists
    media_root = Path(settings.MEDIA_ROOT)
    room_images_dir = media_root / "room_images"
    room_images_dir.mkdir(parents=True, exist_ok=True)

    # Check for assets
    assets_dir = Path(settings.BASE_DIR) / "api" / "seed" / "assets"
    
    if assets_dir.exists():
        asset_files = list(assets_dir.glob("*.jpg")) + list(assets_dir.glob("*.jpeg")) + list(assets_dir.glob("*.png"))
    else:
        asset_files = []

    image_paths = []

    if asset_files:
        # Use real images from assets
        files_to_use = asset_files if count is None else asset_files[:count]
        
        for asset_file in files_to_use:
            # Generate unique filename
            unique_name = f"{uuid.uuid4().hex[:12]}{asset_file.suffix}"
            dest_path = room_images_dir / unique_name
            
            # Copy file
            shutil.copy2(asset_file, dest_path)
            
            # Return relative path (from MEDIA_ROOT)
            image_paths.append(f"room_images/{unique_name}")
    else:
        # Generate placeholders
        num_placeholders = count if count else 10
        
        for i in range(num_placeholders):
            unique_name = f"placeholder_{uuid.uuid4().hex[:12]}.jpg"
            dest_path = room_images_dir / unique_name
            
            # Generate simple colored placeholder
            _generate_placeholder(dest_path, index=i)
            
            image_paths.append(f"room_images/{unique_name}")

    return image_paths


def _generate_placeholder(dest_path: Path, index: int = 0):
    """
    Generate a simple colored placeholder image using Pillow.
    
    Args:
        dest_path: Where to save the generated image
        index: Used to vary colors
    """
    # Create 800x600 image with gradient-like color
    colors = [
        (100, 150, 200),  # Blue
        (150, 100, 150),  # Purple
        (200, 150, 100),  # Orange
        (100, 180, 150),  # Teal
        (180, 180, 100),  # Yellow
        (150, 150, 150),  # Gray
        (120, 160, 180),  # Light blue
        (180, 140, 120),  # Tan
        (140, 180, 140),  # Green
        (200, 130, 160),  # Pink
    ]
    
    color = colors[index % len(colors)]
    
    img = Image.new('RGB', (800, 600), color=color)
    draw = ImageDraw.Draw(img)
    
    # Add text overlay
    try:
        # Try to use a basic font (may not work on all systems)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
    except:
        # Fall back to default font
        font = ImageFont.load_default()
    
    text = f"Room #{index + 1}"
    
    # Center text
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((800 - text_width) / 2, (600 - text_height) / 2)
    draw.text(position, text, fill=(255, 255, 255), font=font)
    
    # Save
    img.save(dest_path, "JPEG", quality=85)
