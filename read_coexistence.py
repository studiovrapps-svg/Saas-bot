import urllib.request
import re

urls = [
    'https://whautomate.com/whatsapp-coexistence',
    'https://www.ycloud.com/blog/whatsapp-business-app-coexistence-meta-update'
]

for u in urls:
    print("=== URL:", u)
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            text = re.sub(r'<script[\s\S]*?</script>', '', html)
            text = re.sub(r'<style[\s\S]*?</style>', '', html)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = ' '.join(text.split())
            print(text[:3000])
            print("\n" + "="*50 + "\n")
    except Exception as e:
        print("Error fetching:", e)
