
import os
import re

PACK_DIR = "/home/rk13/RK13CODE/POWERPOST/CYBER-CANVAS-ELECTRON/src/packs/kr-edu-pack"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip files that don't look like templates or already have editable Title
    if "TemplateUtils.renderEditable('TITLE'" in content:
        print(f"Skipping {os.path.basename(filepath)} (Already patched)")
        return

    # 1. Update TITLE (H1)
    # Pattern: <h1 ... >${esc(d.TITLE)}</h1> or ${titleHtml}
    # We want to replace the CONTENT of H1.
    # Regex to find h1 tag and its content
    # This is tricky because of attributes. 
    # Let's try replacing specific known variable patterns first.

    new_content = content

    # REPLACEMENT 1: d.TITLE / d.title inside H1 or similar
    # We look for ${esc(d.TITLE)} or ${titleHtml} that are likely main headers
    # and wrap them. 
    # Actually, a safer bet is to replace specific STRINGS that we know are fields.
    
    # Map of Field -> ID
    fields_to_wrap = {
        r"\$\{esc\(d\.TITLE\)\}": "TITLE",
        r"\$\{titleHtml\}": "TITLE",
        r"\$\{esc\(d\.SUBTITLE\)\}": "SUBTITLE",
        r"\$\{esc\(d\.COMMAND\)\}": "COMMAND",
        r"\$\{esc\(d\.COMMAND_STRUCTURE\)\}": "COMMAND_STRUCTURE",
        r"\$\{esc\(d\.TIP\)\}": "TIP",
        r"\$\{esc\(d\.WARNING_TEXT\)\}": "WARNING",
        r"\$\{esc\(d\.context\)\}": "CONTEXT",
        r"\$\{esc\(d\.CONTEXT\)\}": "CONTEXT",
        r"\$\{esc\(d\.STORY\)\}": "STORY",
        r"\$\{esc\(d\.DESCRIPTION\)\}": "DESCRIPTION",
        r"\$\{esc\(d\.CODE\)\}": "CODE",
        r"\$\{esc\(d\.QUOTE\)\}": "QUOTE",
        r"\$\{esc\(d\.AUTHOR\)\}": "AUTHOR",
        r"\$\{esc\(d\.PROBLEM\)\}": "PROBLEM",
        r"\$\{esc\(d\.SOLUTION\)\}": "SOLUTION",
        r"\$\{esc\(d\.BEFORE_LABEL\)\}": "BEFORE_LABEL",
        r"\$\{esc\(d\.AFTER_LABEL\)\}": "AFTER_LABEL",
        r"\$\{esc\(d\.STAT_NUMBER\)\}": "STAT_NUMBER",
        r"\$\{esc\(d\.STAT_LABEL\)\}": "STAT_LABEL",
        r"\$\{esc\(d\.CHAPTER_TITLE\)\}": "CHAPTER_TITLE",
        r"\$\{esc\(d\.CHAPTER_SUBTITLE\)\}": "CHAPTER_SUBTITLE",
        r"\$\{esc\(d\.CHAPTER_NUMBER\)\}": "CHAPTER_NUMBER",
    }

    for pattern, my_id in fields_to_wrap.items():
        # strict replacement: only if NOT already wrapped
        # We search for the pattern.
        # We replace it with: ${TemplateUtils.renderEditable('ID', PATTERN_MATCH, data._overrides)}
        # But we must match the distinct string.
        
        # Regex to match the exact interpolation, ensuring it's not inside a renderEditable call?
        # A simple replacement of the exact string might be enough if the string is unique.
        
        # We need to escape the pattern for regex, but I defined them as regex strings already.
        # But wait, we need to capture the exact usage.
        
        # Logic: Replace occurance, but avoid replacing if it's inside quotes (like alt="...")?
        # Most usage in these templates is content: <div>${esc(d.TITLE)}</div>
        
        def replacer(match):
            # match.group(0) is the matched string like ${esc(d.TITLE)}
            orig = match.group(0)
            return f"${{TemplateUtils.renderEditable('{my_id}', `{orig}`, data._overrides)}}"
        
        # We use a negative lookbehind/lookahead to ensure we aren't inside a quote? 
        # Easier: Just replace and hope usage isn't in attributes. 
        # Reviewing templates: Title/Subtitle mostly distinct.
        # Images use d.IMG usually.
        
        new_content = re.sub(pattern, replacer, new_content)

    # 2. Terminal Body Special Case
    # Often: <div class="term-body" ...> ... </div>
    # We might want to wrap the *entire content* of term-body?
    # Or just specific fields inside it.
    # The fields replacement above handles d.COMMAND inside terminal.
    # d.OUTPUT matches usually implied by logic.

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Patched {os.path.basename(filepath)}")
    else:
        print(f"No changes for {os.path.basename(filepath)}")

def main():
    files = sorted([f for f in os.listdir(PACK_DIR) if f.startswith("kr-clidn-") and f.endswith(".js")])
    for f in files:
        process_file(os.path.join(PACK_DIR, f))

if __name__ == "__main__":
    main()
