# Use a Local Server

```sh
npm i -g five-server@latest && five-server --port=8000
```

For the options below, we should develop projects using a local server so that files are properly served. Options of local servers include:

    Running 'npm i -g five-server@latest && five-server --port=8000' in a terminal in the same directory as your HTML file.
    Running 'python -m SimpleHTTPServer' (or 'python -m http.server' for _Python 3_) in a terminal in the same directory as your HTML file.

Once we are running our server, we can open our project in the browser using the local URL and port which the server is running on (e.g., http://localhost:8000). Try not to open the project using the file:// protocol which does not provide a domain; absolute and relative URLs may not work.