import os
import re

html_files = []
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all main.js inclusions
    matches = re.findall(r'<script\s+src="[^"]*js/main\.js"[^>]*></script>', content)
    
    if not matches:
        continue

    # Remove all existing main.js inclusions
    new_content = re.sub(r'\s*<script\s+src="[^"]*js/main\.js"[^>]*></script>', '', content)
    
    # Add one to the head with defer
    # Look for </head>
    if '</head>' in new_content:
        # Check if we are in index.html to be extra careful or just apply globally
        script_tag = '\n    <script src="./js/main.js" defer></script>\n'
        new_content = new_content.replace('</head>', script_tag + '</head>')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}: Moved main.js to head with defer and removed duplicates.")
    else:
        print(f"Warning: {file_path} has no </head> tag.")
