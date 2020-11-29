const OK = "200";

// PONER URL REAL
const topicsListUrl = 'http://localhost:8080';

function displayTopicsList(topics) {
    var topicosElement = document.getElementById("topicos");
    topicosElement.innerHTML = "";

    for(i = 0; i < topics.length; i++) {
        var li = document.createElement("LI");
        li.innerHTML = topics[i];
        topicosElement.appendChild(li);
    }
}


function getTopicsList() {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (this.readyState == 4 && xmlHttp.status == OK) {
            let topicsArray = JSON.parse(xmlHttp.responseText);
            displayTopicsList(topicsArray);
        } 
        else {
            displayTopicsList(["Error"]);
            console.log("error");
        }  
    }
    xmlHttp.open("GET", topicsListUrl, true); // true for asynchronous 
    xmlHttp.send();
}