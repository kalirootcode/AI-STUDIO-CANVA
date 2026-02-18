import os
import re

TARGET_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"

# Auto-Fit JS Logic
AUTO_FIT_SCRIPT = """
<script>
    (function() {
        function fitContent() {
            const safeZone = document.querySelector('.safe-zone');
            if (!safeZone) return;

            // Prioritize shrinking body text first, then headings
            const bodyTargets = Array.from(document.querySelectorAll('.definition, .description, .term-output, .term-body, .cmd-desc, .intro, .text-content, p, .point-item span, .example-box span'));
            const headerTargets = Array.from(document.querySelectorAll('h1, h2, .term-name, .cmd-name, .title'));

            let overflow = safeZone.scrollHeight > safeZone.clientHeight;
            let loopCount = 0;
            const maxLoops = 50; // Safety brake

            while (overflow && loopCount < maxLoops) {
                let resized = false;

                // 1. Try shrinking body text first
                bodyTargets.forEach(el => {
                    let size = parseFloat(window.getComputedStyle(el).fontSize);
                    if (size > 14) { // Don't go below 14px
                        el.style.fontSize = (size - 1) + 'px';
                        resized = true;
                    }
                });

                // Check overflow again
                if (safeZone.scrollHeight <= safeZone.clientHeight) break;

                // 2. If body text is small or still overflowing, shrink headers
                if (!resized || loopCount % 3 === 0) { // Shrink headers less often? No, let's shrink them too if body is stuck
                    headerTargets.forEach(el => {
                        let size = parseFloat(window.getComputedStyle(el).fontSize);
                        if (size > 20) { // Don't go below 20px
                            el.style.fontSize = (size - 1) + 'px';
                            resized = true;
                        }
                    });
                }
                
                if (!resized) break; // Cannot shrink further

                overflow = safeZone.scrollHeight > safeZone.clientHeight;
                loopCount++;
            }
            
            // Final check: if still overflowing, maybe hide last items or ellipsis?
            // For now, shrinking is usually enough for reasonable text.
        }

        window.addEventListener('load', fitContent);
        window.addEventListener('resize', fitContent);
    })();
</script>
"""

# HTML injection logic
def inject_script(content):
    if "function fitContent()" in content:
        # Already has it? Maybe update it?
        # Remove old script block if exists using Regex?
        # content = re.sub(r'<script>\s*\(function\(\)\s*\{\s*function fitContent.+?</script>', '', content, flags=re.DOTALL)
        pass # Skip for now to avoid duplicates or complex replace
        
    # Inject before </body>
    if "</body>" in content:
        return content.replace("</body>", AUTO_FIT_SCRIPT + "\n</body>")
    else:
        return content + AUTO_FIT_SCRIPT

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = inject_script(content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")
    else:
        print(f"Skipped {filepath} (No change)")

def main():
    files = sorted(os.listdir(TARGET_DIR))
    for filename in files:
        if filename.startswith("kr-clidn-") and filename.endswith(".js"):
            full_path = os.path.join(TARGET_DIR, filename)
            process_file(full_path)

if __name__ == "__main__":
    main()
