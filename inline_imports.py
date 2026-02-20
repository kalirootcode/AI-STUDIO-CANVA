import glob
import re

# Read shared styles
with open('src/packs/ebook-pack/ebook-styles.js', 'r', encoding='utf-8') as f:
    styles_content = f.read().replace('export const', 'const')

# Read shared brand functions
with open('src/packs/ebook-pack/ebook-brand.js', 'r', encoding='utf-8') as f:
    brand_content = f.read().replace('export function', 'function')

# Process templates 01 to 07
for file in glob.glob('src/packs/ebook-pack/ebook-0*.js'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove import lines
    content = re.sub(r'^import .*?;?\n', '', content, flags=re.MULTILINE)
    
    # Prepend shared code
    new_content = f"// --- INJECTED SHARED CODE ---\n{styles_content}\n{brand_content}\n// --- END INJECTED SHARED CODE ---\n\n{content}"
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(new_content)

print("Inlining completed successfully.")
