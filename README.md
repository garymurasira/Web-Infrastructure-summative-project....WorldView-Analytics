# WorldView Analytics

A web application that lets users explore real-time economic indicators, development metrics, and demographic data for 190+ countries — powered by the [World Bank API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation).

**Live app:** https://www.god3v.tech

---

## Features

- **Country search** — search any country by name or select from quick picks
- **9 indicator categories** — Economy, Health, Technology, Environment, Education, Population, Poverty, Gender, Inequality
- **Live data** — all values fetched directly from the World Bank API (no mock data)
- **Progress bars** — visual comparison of each indicator relative to its global scale
- **10-year trend chart** — Chart.js line chart showing historical data for the active category
- **Country comparison** — overlay a second country's trend on the chart for side-by-side comparison
- **Sort indicators** — sort any category highest to lowest or lowest to highest
- **Error handling** — graceful N/A display when API data is unavailable; informative alerts for invalid searches
- **Input validation & XSS protection** — all user inputs are sanitized before processing; all dynamic HTML is escaped before insertion into the DOM

---

## Project Structure

```
WorldBank API project/
├── index.html              # Main HTML — landing page + dashboard
├── scripts/
│   ├── config.js           # WB API base URL and all indicator definitions
│   ├── api.js              # All World Bank API fetch functions and caching
│   ├── landing.js          # Landing page interactions (search, quick picks)
│   └── dashboard.js        # Dashboard UI rendering and event listeners
├── styles/
│   └── styles.css          # All styles (landing + dashboard + responsive)
└── README.md
```

---

## Running Locally

No build tools or dependencies required. This is a pure HTML/CSS/JS application.

1. Clone the repository:
   ```bash
   git clone https://github.com/garymurasira/Web-Infrastructure-summative-project....WorldView-Analytics
   cd Web-Infrastructure-summative-project....WorldView-Analytics
   ```

2. Open `index.html` in your browser:
   - Double-click `index.html`, **or**
   - Use a local server to avoid any browser CORS restrictions:
     ```bash
     # Python
     python -m http.server 8000

     # Node (if http-server is installed)
     npx http-server .
     ```
   - Then visit `http://localhost:8000`

> **Note:** The World Bank API does not require an API key. No environment setup is needed.

---

## API Reference

### World Bank Indicators API

- **Base URL:** `https://api.worldbank.org/v2`
- **Documentation:** https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation
- **Authentication:** None required — fully open API
- **Rate limits:** No strict rate limit for reasonable usage
- **Key endpoints used:**

| Endpoint | Purpose |
|---|---|
| `/country?format=json&per_page=500` | Fetch all countries for name-based search |
| `/country/{iso2}/indicator/{id}?format=json&mrv=5` | Fetch most recent value for an indicator |
| `/country/{iso2}/indicator/{id}?format=json&date={start}:{end}` | Fetch time series for chart |

---

## Deployment

The application is deployed on two web servers (Web01 and Web02) behind a load balancer (Lb01).

### Prerequisites on each server

```bash
sudo apt update
sudo apt install nginx -y
```

### Deploy to Web01 and Web02

Run these steps on **both** Web01 and Web02:

1. SSH into the server:
   ```bash
   ssh -i your-key.pem ubuntu@<server-ip>
   ```

2. Create the app directory:
   ```bash
   sudo mkdir -p /var/www/worldview
   sudo chown -R ubuntu:ubuntu /var/www/worldview
   ```

3. From your **local machine**, transfer the files:
   ```bash
   scp -i your-key.pem -r index.html scripts/ styles/ ubuntu@<server-ip>:/var/www/worldview/
   ```

4. Configure Nginx on the server:
   ```bash
   sudo nano /etc/nginx/sites-available/worldview
   ```

   Paste the following:
   ```nginx
   server {
       listen 80;
       server_name _;

       root /var/www/worldview;
       index index.html;

       location / {
           try_files $uri $uri/ =404;
       }
   }
   ```

5. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/worldview /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. Verify by visiting `http://<server-ip>` in your browser.

Repeat steps 1–6 for the second server.

---

### Configure the Load Balancer (Lb01)

The load balancer (Lb01) runs **HAProxy**, which was already installed and configured on the server. HAProxy handles HTTPS termination and round-robin load balancing between Web01 and Web02.

1. SSH into Lb01:
   ```bash
   ssh -i your-key.pem ubuntu@<lb01-ip>
   ```

2. Edit the HAProxy config:
   ```bash
   sudo nano /etc/haproxy/haproxy.cfg
   ```

   The relevant backend section points to both web servers:
   ```
   backend www-backend
       balance roundrobin
       server web-01 <web01-ip>:80 check
       server web-02 <web02-ip>:80 check
   ```

3. Verify and restart HAProxy:
   ```bash
   sudo haproxy -c -f /etc/haproxy/haproxy.cfg
   sudo systemctl restart haproxy
   ```

4. Visit `https://www.god3v.tech` — HAProxy will round-robin requests between Web01 and Web02.

---

### Verifying Load Balancing

To confirm traffic is being distributed between both servers, add a temporary identifier to each server's response:

```bash
# On Web01
echo "Web01" | sudo tee /var/www/worldview/server.txt

# On Web02
echo "Web02" | sudo tee /var/www/worldview/server.txt
```

Then repeatedly hit `https://www.god3v.tech/server.txt` — the response should alternate between `Web01` and `Web02`.

---

## Challenges

- **World Bank API name search** — The WB API has no native name-search endpoint. Solved by fetching the full countries list on startup and filtering client-side, with results cached in memory.
- **Missing/sparse data** — Some indicators have no recent data for certain countries. Handled with `N/A` display and progress bars that render as empty rather than breaking.
- **Dual-axis chart removed** — Original design had GDP + Life Expectancy on the same chart with two Y-axes. Replaced with a single indicator per chart to keep it clean and comparable across countries.
- **HAProxy conflict on Lb01** — Attempting to run Nginx on the load balancer failed because HAProxy was already occupying port 80. Resolved by using the pre-configured HAProxy instead of Nginx, which also provided the added benefit of HTTPS support via an existing SSL certificate.
- **XSS protection** — User inputs are passed through a `sanitizeInput()` function that strips HTML characters (`< > & " '`) and limits length to 100 characters. Dynamic content inserted into `innerHTML` is passed through `escapeHTML()` to prevent script injection.

---

## Credits & Resources

| Resource | Link |
|---|---|
| World Bank Indicators API | https://datahelpdesk.worldbank.org/knowledgebase/articles/889392 |
| Chart.js | https://www.chartjs.org/ |
| World Bank Open Data | https://data.worldbank.org/ |

---

