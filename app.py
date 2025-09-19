from flask import Flask, request, render_template, session, jsonify, g
import sqlite3
import os

app = Flask(__name__)
app.secret_key = "sudoku-secret"

# Database setup
DATABASE = "sudoku.db"

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

def init_db():
    if not os.path.exists(DATABASE):
        with sqlite3.connect(DATABASE) as conn:
            c = conn.cursor()
            c.execute('''CREATE TABLE results (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            username TEXT,
                            password TEXT,
                            time INTEGER,
                            status TEXT
                        )''')
            conn.commit()

# Puzzle (81 chars, 0 = empty)
PUZZLE = (
    "080701030"
    "409000000"
    "050060418"
    "700009000"
    "800610500"
    "035000029"
    "060407090"
    "100008004"
    "020050070"
)

# Correct solution (81 chars)
SOLUTION = (
    "286741935"
    "419385762"
    "357962418"
    "741529386"
    "892613547"
    "635874129"
    "568437291"
    "173298654"
    "924156873"
)

@app.route("/")
def home():
    return render_template("page1.html")

@app.route("/login", methods=["POST"])
def login():
    username = request.form["username"]
    password = request.form["password"]

    session["user"] = username
    session["pass"] = password

    return render_template("page2.html", puzzle=PUZZLE, solution=SOLUTION)

@app.route("/submit_time", methods=["POST"])
def submit_time():
    data = request.get_json()
    username = session.get("user")
    password = session.get("pass")

    if username:
        with sqlite3.connect(DATABASE) as conn:
            c = conn.cursor()
            c.execute("INSERT INTO results (username, password, time, status) VALUES (?, ?, ?, ?)",
                      (username, password, data.get("time"), data.get("status")))
            conn.commit()

    return jsonify({"message": "Time recorded"})

@app.route("/leaderboard")
def leaderboard():
    with sqlite3.connect(DATABASE) as conn:
        c = conn.cursor()
        c.execute("SELECT username, time, status FROM results ORDER BY time ASC")
        rows = c.fetchall()
    return render_template("leaderboard.html", results=rows)
if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), debug=True)

