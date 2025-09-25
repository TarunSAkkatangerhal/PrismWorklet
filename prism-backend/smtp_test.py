import smtplib

smtp_host = "smtp.gmail.com"
smtp_port = 587
smtp_user = "rubydoll789@gmail.com"
smtp_pass = "vnknxacwtcqbrlbo"

try:
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.set_debuglevel(1)
    server.starttls()
    server.login(smtp_user, smtp_pass)
    print("SMTP login successful!")
    server.quit()
except Exception as e:
    print("SMTP login failed:", e)
