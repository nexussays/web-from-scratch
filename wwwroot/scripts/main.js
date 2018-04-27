//
// DOM
//

function DOM(name, ...children) {
   const result = document.createElement(name);
   DOM.populate(result, ...children);
   return result;
}
DOM.populate = (element, ...children) => {
   if (children == null || children.length < 1) {
      return;
   }
   for (let c of children) {
      if (typeof c == "string") {
         element.appendChild(document.createTextNode(c));
      }
      else if (c instanceof HTMLElement) {
         element.appendChild(c);
      }
      else if (c instanceof Array) {
         DOM.populate(element, ...c);
      }
      // if provided an object, set properties on the element
      else if (c.constructor === Object) {
         for (let k of Object.keys(c)) {
            if (c[k] === undefined) {
               continue;
            }
            // special event handler to trigger when element is added to the DOM
            if (k === "load" || k === "onload") {
               __onLoad.push([element, c[k]]);
            }
            else if (("on" + k) in element) {
               element.addEventListener(k, c[k]);
            }
            else if (k in element) {
               if (k.startsWith("on")) {
                  element.addEventListener(k.substring(2), c[k]);
               }
               // if providing style as an object instead of a string, stringify it.
               else if (k === "style") {
                  const styles = c[k];
                  if (typeof c[k] === "object") {
                     for (let style of Object.keys(styles)) {
                        element.style[style] = styles[style];
                     }
                  }
                  else {
                     element.setAttribute(k, styles);
                  }
               } else {
                  element[k] = c[k];
               }
            }
            else if (k === "class") {
               element["className"] = c[k];
            }
            else {
               throw new Error(`No property "${k}" found on ${element}`);
            }
         }
      }
      else {
         console.warn("Don't know how to render", c.constructor, Object.getPrototypeOf(c));
      }
   }
};
DOM.elements = ["div", "span", "input", "button", "a", "p", "h1", "h2", "h3", "h4",
   "br", "hr", "table", "tbody", "tr", "th", "td", "thead", "textarea",
   "select", "option", "li", "ol", "ul", "dt", "dd", "pre", "code", "kbd",
   "strong", "em", "nav"];

for (let el of DOM.elements) {
   DOM[el] = (...children) => DOM(el, ...children);
}

//
// styled-components-style API
//

const styled = {};
for (let el of DOM.elements) {
   styled[el] = (text, ...replacements) => (...children) => DOM[el]({
      style: text.reduce((p, c, i) => p + c + (i < replacements.length ? replacements[i] : ""), "")
   }, ...children);
}

//
// Navigation
//

const Nav = new (function (w) {
   let h = w.history;
   let currentState = w.location.pathname;
   this.go = (path, state = {}) => {
      if (currentState !== path) {
         h.pushState(state, "", path);
         currentState = path;
         refresh();
      }
   };
   this.back = () => {
      h.go(-1);
   }
   Object.defineProperty(this, "currentState", {
      get: () => currentState
   });
   w.onpopstate = (e) => {
      currentState = e.target.location.pathname;
   };
})(window);

//
// DOMContentLoaded
//

document.addEventListener("DOMContentLoaded", e => {
   (new MutationObserver((r, a) => {
      if (__onLoad == null || __onLoad.length < 1) {
         return;
      }
      const check = (n) => {
         const index = __onLoad.findIndex(x => x[0] === n);
         if (index != -1) {
            try {
               __onLoad[index][1](__onLoad[index][0]);
            }
            finally {
               __onLoad.splice(index, 1);
            }
         }
         for (let c of n.childNodes) {
            check(c);
         }
      };
      for (let m of r) {
         if (m.type === "childList") {
            for (let n of m.addedNodes) {
               check(n);
            }
         }
      }
   })).observe(document.body, {
      childList: true,
      attributes: false,
      characterData: true,
      subtree: true,
   });
   __root = document.getElementById("root");
   __renderLoop = setInterval(__refresh, 50);
});

let __root = null;
let __renderLoop = undefined;
let __oldState = {};
let __onLoad = [];
let state = {
   clicked: 0,
};

const fontColor = "#999";
const fontFamily = "Consolas";

function refresh(force = false) {
   __renderLoop && clearInterval(__renderLoop);
   __refresh(force);
   __renderLoop = __renderLoop && setInterval(__refresh, 50);
}

function __refresh(force = false) {
   const start = performance.now();
   // this is surprisingly not terrible performance-wise
   const newState = JSON.stringify(state);
   if (force || JSON.stringify(__oldState) != newState) {
      __onLoad.splice(0, __onLoad.length);
      __oldState = JSON.parse(newState);
      const newRoot = render();
      __root.parentElement.replaceChild(newRoot, __root);
      __root = newRoot;
      //console.log((force ? "force " : "") + "render took", performance.now() - start, "ms");
   }
   else {
      //console.log("render check took", performance.now() - start, "ms");
   }
}

function render() {
   with (DOM) return div(
      "Hello World!",
      div(
         (__renderLoop === undefined ? "Start Render Loop" : "Stop Render Loop"),
         {
            onclick: (e) => {
               console.log(state);
               if (__renderLoop !== undefined) {
                  clearInterval(__renderLoop);
                  __renderLoop = undefined;
               }
               else {
                  __renderLoop = setInterval(__refresh, 50);
               }
               setTimeout(() => refresh(true), 1);
            },
            style: {
               cursor: "pointer",
               border: "1px solid black",
               padding: "1em",
            }
         },
      ),
      div(
         input({
            id: "location",
            keypress: (e) => {
               if (e.keyCode === 13) {
                  document.getElementById("location-trigger").click();
               }
            },
            value: Nav.currentState
         }),
         button("history", {
            id: "location-trigger",
            click: (e) => {
               const input = document.getElementById("location");
               Nav.go(input.value);
            }
         }),
         button("log history", { click: () => console.log(window.history.state) }),
      ),
      hr({ class: "big" }),
      button(
         {
            click: (e) => {
               state.filler[0].index += 1;
               refresh();
            },
            style: {
               position: "fixed",
               right: "50px",
               margin: "1em",
               padding: ".5em",
               border: "1px solid #f0f",
               borderBottom: "5px dotted grey",
            },
            value: "foo",
         },
         "Click ME!"
      ),
      div(
         h1("Big heading"),
         p("This is a paragraph of text"),
         p(`You have clicked it ${state.filler[0].index} times`),
      ),
      {
         style: "background-color:#333; color:#fff; padding: 1em",
      },
      itemsList({
         items: state.filler,
         editing: state.editing,
         cancelEdit: () => {
            state.editing = undefined;
         },
         edit: (id) => {
            state.editing = id;
         }
      }),
      header({ heading: "wow!", subheading: "small subheading goes here", style: "background-color:#666" }),
      header2({ heading: "wow!", subheading: "small subheading goes here", style: "background-color:#666" }),
   );
}
function header(props) {
   const { heading, subheading, ...rest } = props;
   with (DOM) return div(
      h2(heading, {
         class: "heading"
      }),
      span(subheading, {
         style: {
            color: fontColor,
            fontSize: ".8rem",
            fontFamily: fontFamily,
         }
      }),
      { ...rest }
   );
}

const Heading = styled.h2`
   font-family: ${fontFamily};
`;
const Subheading = styled.span`
   color: ${fontColor};
   font-size: .8rem;
   font-family: ${fontFamily};
`;
function header2({ heading, subheading, ...rest }) {
   with (DOM) return div(
      Heading(heading),
      Subheading(subheading),
      { ...rest}
   );
}

function itemsList({ items, editing, edit, cancelEdit }) {
   with (DOM) return items.map(item =>
      div(
         (editing === item._id
            ? div(
               textarea(item.about, {
                  keypress: (e) => {
                     if (e.keyCode === 27) {
                        cancelEdit();
                     }
                     else if (e.ctrlKey && e.charCode == "s".charCodeAt(0)) {
                        item.about = e.target.value;
                        cancelEdit();
                        e.preventDefault();
                     }
                  },
                  load: (e) => {
                     e.focus();
                  },
                  style: {
                     width: "100%",
                  },
               })
            )
            : p(item.about, {
               click: _ => edit(item._id)
            })
         ),
         input({
            value: item.balance,
            keypress: (e, a) => {
               console.log(e, e.target.value);
            }
         }),
         input({
            value: item.email,
            type: "email"
         }),
      ));
}

// populate state with mock data
Object.assign(state, {
   filler: [
      {
         "_id": "5ad86048456716b21a911d8e",
         "index": 0,
         "guid": "67fe7b91-6f7d-4cfc-9f99-b0bdaca0cc21",
         "isActive": true,
         "balance": "$1,363.50",
         "picture": "http://placehold.it/32x32",
         "age": 20,
         "eyeColor": "green",
         "name": {
            "first": "Ball",
            "last": "Dalton"
         },
         "company": "COMVEY",
         "email": "ball.dalton@comvey.com",
         "phone": "+1 (896) 565-2476",
         "address": "668 Coyle Street, Cloverdale, Oregon, 3263",
         "about": "Velit exercitation duis est commodo tempor deserunt ullamco minim non do tempor reprehenderit tempor nulla. Dolore voluptate deserunt occaecat Lorem sunt commodo proident. Minim excepteur elit eu velit exercitation fugiat incididunt. Aliquip dolore officia reprehenderit consectetur nulla. Irure officia qui ex veniam esse aute esse. Cupidatat ullamco reprehenderit qui ea tempor sit exercitation et dolor irure fugiat deserunt ullamco.",
         "registered": "Sunday, January 24, 2016 9:56 PM",
         "latitude": "48.399149",
         "longitude": "-15.567957",
         "tags": [
            "aliquip",
            "veniam",
            "voluptate",
            "dolore",
            "nostrud"
         ],
         "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
         ],
         "friends": [
            {
               "id": 0,
               "name": "Lora Skinner"
            },
            {
               "id": 1,
               "name": "Zamora Patton"
            },
            {
               "id": 2,
               "name": "Patricia Snow"
            }
         ],
         "greeting": "Hello, Ball! You have 8 unread messages.",
         "favoriteFruit": "apple"
      },
      {
         "_id": "5ad86048534c92c2ed46174a",
         "index": 1,
         "guid": "f407a63c-e09f-4532-82e4-4fd773b55e08",
         "isActive": false,
         "balance": "$3,661.31",
         "picture": "http://placehold.it/32x32",
         "age": 29,
         "eyeColor": "blue",
         "name": {
            "first": "Amie",
            "last": "Ashley"
         },
         "company": "TETRATREX",
         "email": "amie.ashley@tetratrex.ca",
         "phone": "+1 (861) 545-3236",
         "address": "978 Lombardy Street, Catherine, Puerto Rico, 6437",
         "about": "Laboris ut eu ex voluptate in esse elit et est eiusmod adipisicing fugiat voluptate nulla. Ullamco magna consectetur adipisicing consectetur aliqua ipsum nulla irure cillum ea et ea esse labore. Incididunt aute quis consectetur nisi est consectetur do elit et. Ad ad aliqua do fugiat aliqua excepteur consequat excepteur in nostrud. In cillum mollit proident veniam esse aute quis sunt cillum do fugiat fugiat magna.",
         "registered": "Friday, November 20, 2015 10:31 PM",
         "latitude": "-71.291243",
         "longitude": "1.458207",
         "tags": [
            "aute",
            "esse",
            "eu",
            "velit",
            "culpa"
         ],
         "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
         ],
         "friends": [
            {
               "id": 0,
               "name": "Tracey Daniels"
            },
            {
               "id": 1,
               "name": "Bettie Haley"
            },
            {
               "id": 2,
               "name": "Burgess Holder"
            }
         ],
         "greeting": "Hello, Amie! You have 8 unread messages.",
         "favoriteFruit": "banana"
      },
      {
         "_id": "5ad8604845febb42f39af4a6",
         "index": 2,
         "guid": "9d530210-8c9f-4a2f-b95a-f33928e30548",
         "isActive": true,
         "balance": "$3,681.96",
         "picture": "http://placehold.it/32x32",
         "age": 38,
         "eyeColor": "brown",
         "name": {
            "first": "Olsen",
            "last": "Howard"
         },
         "company": "MICROLUXE",
         "email": "olsen.howard@microluxe.org",
         "phone": "+1 (964) 415-2328",
         "address": "215 Atlantic Avenue, Idamay, Maine, 3825",
         "about": "Amet non esse sint ex consequat sint fugiat veniam. Culpa amet do occaecat sint adipisicing. Enim adipisicing nisi excepteur laboris minim nisi voluptate velit dolore. Elit ut laboris amet dolore pariatur eu elit fugiat aliquip ea ullamco ad ipsum non.",
         "registered": "Sunday, March 2, 2014 9:10 PM",
         "latitude": "37.770236",
         "longitude": "154.160424",
         "tags": [
            "esse",
            "magna",
            "incididunt",
            "laboris",
            "reprehenderit"
         ],
         "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
         ],
         "friends": [
            {
               "id": 0,
               "name": "Augusta Velez"
            },
            {
               "id": 1,
               "name": "Hodges Dawson"
            },
            {
               "id": 2,
               "name": "Richardson Keller"
            }
         ],
         "greeting": "Hello, Olsen! You have 8 unread messages.",
         "favoriteFruit": "strawberry"
      },
      {
         "_id": "5ad86048f10c5c529fe5dd64",
         "index": 3,
         "guid": "02ebd04f-06fc-457d-82b4-bfa550d0a78a",
         "isActive": true,
         "balance": "$3,423.72",
         "picture": "http://placehold.it/32x32",
         "age": 20,
         "eyeColor": "green",
         "name": {
            "first": "Latisha",
            "last": "Fry"
         },
         "company": "COSMOSIS",
         "email": "latisha.fry@cosmosis.me",
         "phone": "+1 (995) 585-2833",
         "address": "866 Hendrickson Street, Tyhee, Federated States Of Micronesia, 9440",
         "about": "Qui irure nulla qui aliqua minim ut voluptate nisi. Laboris nisi est cillum commodo. Incididunt magna sunt anim deserunt ea eu pariatur enim eu. Aute fugiat magna ex aliquip aliqua occaecat nulla ad. Excepteur ad mollit ad culpa eu veniam pariatur consequat quis ad. Non amet tempor exercitation magna ipsum exercitation fugiat duis. Cupidatat mollit pariatur deserunt consequat laborum.",
         "registered": "Sunday, February 5, 2017 5:11 PM",
         "latitude": "26.486469",
         "longitude": "-51.818404",
         "tags": [
            "esse",
            "elit",
            "id",
            "reprehenderit",
            "exercitation"
         ],
         "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
         ],
         "friends": [
            {
               "id": 0,
               "name": "Middleton Hines"
            },
            {
               "id": 1,
               "name": "Harmon Dale"
            },
            {
               "id": 2,
               "name": "Thomas Justice"
            }
         ],
         "greeting": "Hello, Latisha! You have 7 unread messages.",
         "favoriteFruit": "apple"
      },
      {
         "_id": "5ad86048b3beeb45650c1f78",
         "index": 4,
         "guid": "897cd65f-6992-4bca-b4dc-ef208a124e9b",
         "isActive": true,
         "balance": "$3,743.19",
         "picture": "http://placehold.it/32x32",
         "age": 34,
         "eyeColor": "brown",
         "name": {
            "first": "Walker",
            "last": "Becker"
         },
         "company": "AUSTECH",
         "email": "walker.becker@austech.io",
         "phone": "+1 (948) 429-3843",
         "address": "964 Pine Street, Wakarusa, California, 2066",
         "about": "Et reprehenderit cupidatat ut culpa deserunt duis nisi. Officia nostrud culpa tempor proident incididunt ea. Duis fugiat eiusmod amet officia labore aute proident ut ea aute consequat commodo.",
         "registered": "Monday, March 30, 2015 11:13 AM",
         "latitude": "-57.33563",
         "longitude": "119.266588",
         "tags": [
            "sit",
            "elit",
            "sunt",
            "pariatur",
            "ad"
         ],
         "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
         ],
         "friends": [
            {
               "id": 0,
               "name": "Ella Callahan"
            },
            {
               "id": 1,
               "name": "Francis Lawrence"
            },
            {
               "id": 2,
               "name": "Gentry Harmon"
            }
         ],
         "greeting": "Hello, Walker! You have 7 unread messages.",
         "favoriteFruit": "banana"
      },
      {
         "_id": "5ad86048609e5f5870409a51",
         "index": 5,
         "guid": "a9ca1fb0-d0e0-4e1c-be4a-9659a5c8c0d6",
         "isActive": false,
         "balance": "$3,374.86",
         "picture": "http://placehold.it/32x32",
         "age": 22,
         "eyeColor": "brown",
         "name": {
            "first": "Edwards",
            "last": "Cook"
         },
         "company": "PYRAMI",
         "email": "edwards.cook@pyrami.name",
         "phone": "+1 (831) 513-2800",
         "address": "680 Johnson Street, Dixonville, Colorado, 2265",
         "about": "Cupidatat laboris incididunt id aute sunt dolor laborum consequat consequat proident. Magna ut id cillum nulla aliqua qui labore deserunt consectetur nisi tempor aliquip. Voluptate nisi amet elit sint ut non minim ipsum consectetur velit ex sit id. Commodo id consectetur magna voluptate aute et reprehenderit. Commodo excepteur amet qui voluptate aliqua. Aliquip tempor commodo laborum magna quis officia.",
         "registered": "Wednesday, August 27, 2014 2:56 AM",
         "latitude": "38.300066",
         "longitude": "151.920162",
         "tags": [
            "aliquip",
            "culpa",
            "incididunt",
            "consectetur",
            "consectetur"
         ],
         "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
         ],
         "friends": [
            {
               "id": 0,
               "name": "Davis Alvarez"
            },
            {
               "id": 1,
               "name": "Ayala White"
            },
            {
               "id": 2,
               "name": "Walter Murphy"
            }
         ],
         "greeting": "Hello, Edwards! You have 5 unread messages.",
         "favoriteFruit": "apple"
      },
      {
         "_id": "5ad860486c589b28a75e73aa",
         "index": 6,
         "guid": "70a25f67-50c9-46dc-bd92-b3f4e95dd25d",
         "isActive": false,
         "balance": "$1,114.01",
         "picture": "http://placehold.it/32x32",
         "age": 38,
         "eyeColor": "brown",
         "name": {
            "first": "Caitlin",
            "last": "Cortez"
         },
         "company": "MICRONAUT",
         "email": "caitlin.cortez@micronaut.biz",
         "phone": "+1 (949) 525-2908",
         "address": "917 Bridgewater Street, Bodega, Virgin Islands, 3457",
         "about": "Lorem veniam aliqua velit incididunt sint nostrud reprehenderit consequat eu do et occaecat. Pariatur dolor veniam dolore aute. Aliqua cillum adipisicing culpa nostrud pariatur minim ad sint ut elit id adipisicing elit. Veniam reprehenderit reprehenderit aliqua magna quis laboris voluptate ex minim reprehenderit.",
         "registered": "Saturday, August 8, 2015 5:15 AM",
         "latitude": "51.747048",
         "longitude": "127.987978",
         "tags": [
            "esse",
            "enim",
            "cillum",
            "laboris",
            "consectetur"
         ],
         "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
         ],
         "friends": [
            {
               "id": 0,
               "name": "English Fulton"
            },
            {
               "id": 1,
               "name": "Shawna Mcguire"
            },
            {
               "id": 2,
               "name": "Clements Holmes"
            }
         ],
         "greeting": "Hello, Caitlin! You have 8 unread messages.",
         "favoriteFruit": "strawberry"
      },
      {
         "_id": "5ad860486ff36208b0df01ff",
         "index": 7,
         "guid": "82eed66c-41cc-4cc1-a52f-2bc8048dae6f",
         "isActive": false,
         "balance": "$3,771.14",
         "picture": "http://placehold.it/32x32",
         "age": 32,
         "eyeColor": "brown",
         "name": {
            "first": "Beverly",
            "last": "Park"
         },
         "company": "BITTOR",
         "email": "beverly.park@bittor.biz",
         "phone": "+1 (875) 593-2811",
         "address": "579 Lloyd Court, Saranap, West Virginia, 9174",
         "about": "Anim nostrud dolor irure occaecat enim culpa in deserunt Lorem. Et anim dolor elit aliquip esse laborum mollit amet incididunt. Culpa dolor ipsum nostrud laborum tempor anim dolor et aute ea reprehenderit officia. Laboris ex elit aute labore aute esse reprehenderit non consequat ut culpa quis est aliqua. Eu occaecat veniam aute in nulla non sunt reprehenderit reprehenderit non ea labore cupidatat incididunt. Magna Lorem qui voluptate irure sit reprehenderit nostrud amet irure nulla mollit aliqua labore consectetur. Consequat nisi qui esse laborum eiusmod cupidatat ut ea ex excepteur cupidatat.",
         "registered": "Monday, April 14, 2014 5:42 PM",
         "latitude": "13.72784",
         "longitude": "-81.322747",
         "tags": [
            "culpa",
            "do",
            "aute",
            "laborum",
            "duis"
         ],
         "range": [
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9
         ],
         "friends": [
            {
               "id": 0,
               "name": "Therese Brock"
            },
            {
               "id": 1,
               "name": "Keith Roach"
            },
            {
               "id": 2,
               "name": "Burke Preston"
            }
         ],
         "greeting": "Hello, Beverly! You have 8 unread messages.",
         "favoriteFruit": "strawberry"
      }
   ]
});
