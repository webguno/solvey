from flask import Flask

app = Flask(__name__)
const port = process.env.PORT || 4000 
@app.route("/")
def home():
    return "Hello from Render!"

if __name__ == "__main__":
    app.run()
