import urllib.request
import re

url = 'https://whautomate.com/whatsapp-coexistence'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

with urllib.request.urlopen(req, timeout=10) as resp:
    html = resp.read().decode('utf-8', errors='ignore')
    text = re.sub(r'<script[\s\S]*?</script>', '', html)
    text = re.sub(r'<style[\s\S]*?</style>', '', html)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = ' '.join(text.split())
    # find where coexistence setup is discussed
    idx = text.find("How to set up")
    if idx == -1:
        idx = text.find("setup")
    print(text[idx:idx+4000])
