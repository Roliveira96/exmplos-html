from PIL import Image
import os
import re

def optimize_image(path, target_width=None, quality=80):
    try:
        if not os.path.exists(path):
            print(f"File not found: {path}")
            return

        img = Image.open(path)
        
        if target_width:
             w_percent = (target_width / float(img.size[0]))
             if w_percent < 1: 
                 h_size = int((float(img.size[1]) * float(w_percent)))
                 img = img.resize((target_width, h_size), Image.Resampling.LANCZOS)
        
        img.save(path, "WEBP", quality=quality, optimize=True)
        print(f"Re-optimized {path} to width {target_width}px")
        
    except Exception as e:
        print(f"Error optimizing {path}: {e}")

def minify_css(input_path, output_path):
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            css = f.read()
        
        # Remove comments
        css = re.sub(r'/\*[\s\S]*?\*/', '', css)
        # Remove newlines and extra spaces
        css = re.sub(r'\s+', ' ', css)
        css = re.sub(r'\s*([{:;,])\s*', r'\1', css)
        css = css.replace(';}', '}')
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(css)
            
        print(f"Minified CSS saved to {output_path}")
    except Exception as e:
        print(f"Error minifying CSS: {e}")

# 1. Resize profile to 280px (2x retina for 140px display) - User complained about size
optimize_image("img/perfil.webp", target_width=280, quality=85)

# 2. Minify CSS for inlining
minify_css("style.css", "style.min.css")
