import re

with open('bot-engine-frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

target_fetch = """          if (Array.isArray(resData)) {
              setOrders(resData);
              setTotalOrders(resData.length);
          } else {
              setOrders(resData.data);
              setTotalOrders(resData.total);
          }"""

replacement_fetch = """          if (Array.isArray(resData)) {
              setOrders(resData);
              setTotalOrders(resData.length);
          } else if (resData.data && Array.isArray(resData.data)) {
              setOrders(resData.data);
              setTotalOrders(resData.total || resData.data.length);
          } else {
              setOrders([]);
              setTotalOrders(0);
          }"""

code = code.replace(target_fetch, replacement_fetch)

# Just in case the orders.length check crashes if orders is undefined
target_orders_check = """orders.length === 0"""
replacement_orders_check = """(!orders || orders.length === 0)"""
code = code.replace(target_orders_check, replacement_orders_check)

with open('bot-engine-frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
print("Orders safety checks injected.")
