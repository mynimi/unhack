const fs = require('fs');

const pageContent = document.querySelector('.container')

const functions = require("./functions.js");

const sideNavigation = document.querySelector('.sidenav .navigation')

sideNavigation.addEventListener('click', function(e){
    let others = document.querySelector('.sidenav span.active')
    let el = e.target 
    let htmlFile = el.dataset.htmlfile
    if(htmlFile != ""){
        if (others)
            others.classList.remove("active")
        el.classList.add("active")
        let contentPath = functions.htmlPath(htmlFile)
        fs.readFile(contentPath, (err, data) => {
            pageContent.innerHTML = data
        })
    }
})

