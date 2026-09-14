import urllib.request
import re

url = 'https://developers.facebook.com/documentation/business-messaging/whatsapp/embedded-signup/onboarding-business-app-users/'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        # strip tags
        text = re.sub(r'<script[\s\S]*?</script>', '', html)
        text = re.sub(r'<style[\s\S]*?</style>', '', html)
        text = re.sub(r'<[^>]+>', ' ', text)
        text = ' '.join(text.split())
        print(text[:4000])
except Exception as e:
    print('Error:', e)
