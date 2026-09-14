import urllib.request, re

def search():
    url = 'https://docs.recurrente.com'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    # look for text like 'sandbox' or 'pruebas'
    print('pruebas' in html.lower())
    print('sandbox' in html.lower())
    print('api' in html.lower())

search()
