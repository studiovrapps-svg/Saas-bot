import urllib.request
import urllib.parse
import re
import json

queries = [
    'whatsapp cloud api use same number on phone whatsapp business app 2024 2025 2026',
    'botpress whatsapp integration keep whatsapp on phone',
    'meta whatsapp cloud api co-existence whatsapp business app'
]

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

for q in queries:
    print(f"=== QUERY: {q} ===")
    url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote(q)
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # Extract links and snippets
            results = re.findall(r'<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)</a>', html)
            if not results:
                # simpler regex
                snippets = re.findall(r'class="result__snippet"[^>]*>([\s\S]*?)</a>', html)
                for s in snippets[:4]:
                    clean = re.sub(r'<[^>]+>', '', s).strip()
                    print("- ", clean)
            else:
                for href, title, snip in results[:4]:
                    clean_title = re.sub(r'<[^>]+>', '', title).strip()
                    clean_snip = re.sub(r'<[^>]+>', '', snip).strip()
                    print(f"Title: {clean_title}")
                    print(f"Snippet: {clean_snip}\n")
    except Exception as e:
        print("Error:", e)
