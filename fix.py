import glob

for file in glob.glob('/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/ebook-pack/*.js'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace literal \` with `
    content = content.replace('\\`', '`')
    # Replace literal \${ with ${
    content = content.replace('\\${', '${')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    
print("Fixed all files")
