# Web from scratch

What can you create in 5 hours with an empty directory and no external libraries?

## Overview

One Sunday afternoon I got it into my head to see what I could whip up if I spent a few hours making a single-page web app from scratch. Total time spent: ~4.5 hours

I encourage others to give it a try. Create an empty file and start typing.

Three rules:

1. No `npm` nor any external libraries of any kind
2. No resources other than [MDN Web Docs](https://developer.mozilla.org), caniuse.com, and mock data generators ([Unsplash](https://source.unsplash.com/), [JSON Generator](https://next.json-generator.com/), Lipsum, etc...)
3. Your starting point is `mkdir web-from-scratch && cd web-from-scratch`

## Usage

Open [`./wwwroot/index.html`](./wwwroot/index.html) in a browser 😲. But really, the whole point is the code, so open [`./wwwroot/scripts/main.js`](./wwwroot/scripts/main.js) in VSCode.

> I started working on navigation/history manipulation at about hour 4 and needed a server for that. Upshot is you can also execute `dotnet run` from the root directory and open `http://localhost:5000`
