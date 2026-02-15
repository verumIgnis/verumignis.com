from flask import Flask, render_template, send_from_directory
from flaskext.markdown import Markdown
import json

app = Flask(__name__)
Markdown(app)

with open("posts.json", 'r') as f:
    posts = json.load(f)

    content = []
    for post in posts:
        with open(f"posts/{post['content']}", 'r') as file:
            postMd = file.read()

        tmp = {
            "title": post['title'],
            "thumbnail": post['thumbnail'],
            "content": postMd,
            "url": post['url']
        }
        content.append(tmp)

    revContent = content[::-1]
    #print(posts)
    #print(content)

@app.route('/')
def index():
    return render_template('index.html', content=revContent)

@app.route('/post/<post>')
def post(post):
    try:
        postContent = content[int(post)]['content']
        postTitle = content[int(post)]['title']
    except:
        return "Invalid Post", 404
    return render_template('post.html', content=postContent, title=postTitle)

@app.route("/ukbusmap")
def ukbusmap():
    return render_template("busmap.html", dziURL="/busmap-dzi/ukbusmap.dzi") # uses openseadragon

@app.route("/tnak")
def tnak():
    with open(f"static/tnak-docs.md", 'r') as file:
        tnakDocs = file.read()
    return render_template("tnak.html", content=tnakDocs) # Totally Not A Keyboard


@app.route('/<path:filename>')
def serve(filename):
    try:
        return send_from_directory("static", filename)
    except FileNotFoundError:
        return 'File not found', 404

if __name__ == '__main__':
    app.run(host='0.0.0.0')
