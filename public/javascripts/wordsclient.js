window.addEventListener("load", function () {
    var countField = document.getElementById("countWord");
    var countDisplay = document.getElementById("displayCount");
    var searchfield = document.getElementById("searchField")
    var wordList = document.getElementById("wordList");
    var addword = document.getElementById("addword");
    var wordData = document.getElementById("wordData");
    var theWord = document.getElementById("theWord");
    var wordID = document.getElementById("wordIdDiv");
    var deleteWord = document.getElementById("deleteWord");
    var messages = document.getElementById("messages");
    var changeSpellingField = document.getElementById("changeSpellingField");
    var changeSpellingButton = document.getElementById("changeSpellingButton");
    var newDefinition = document.getElementById("newDefinition");
    var addUpdate = document.getElementById("addUpdate");
    var definitionList = document.getElementById("definitionList");


    countField.addEventListener("keyup", function () {
        var abbrev = countField.value;
        if (abbrev.length <= 2) {
            return;
        }
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                //var resp = JSON.parse(xhr.responseText); 
                var resp = xhr.response;
                /*countDisplay.innerHTML = "<li>" + resp.count + " words match "
                + resp.abbrev + "</li>";*/
                countDisplay.innerHTML = " ";
                for (var i = 0; i < resp.length; i++) {
                    countDisplay.innerHTML += "<li>" + resp[i].count + " words match " + resp[i].abbrev + "</li>";
                }
            }
        }
        xhr.open("GET", "/wordsapi/v1/count/" + abbrev);
        xhr.responseType = 'json';
        xhr.send();
    });

    searchfield.addEventListener("keyup", function () {
        messages.style.visibility = "hidden";
        var abbrev = searchField.value;
        if (abbrev.length <= 3) {
            return
        }
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                var resp = xhr.response;
                wordList.style.visibility = "visible";
                wordList.innerHTML = "";

                if (xhr.response.length == 0) {
                    wordList.style.visibility = "hidden";
                    addword.style.visibility = "visible";
                    addword.removeAttribute("disabled")
                } else {
                    wordList.style.visibility = "visible";
                    addword.style.visibility = "hidden";
                    addword.setAttribute("disabled", true);
                }

                if (xhr.response.length <= 10) {
                    wordList.setAttribute("size", xhr.response.length);
                } else {
                    wordList.setAttribute("size", 10);
                }

                for (var i = 0; i < xhr.response.length; i++) {
                    var opt = document.createElement("option");
                    opt.value = xhr.response[i].id;
                    opt.label = xhr.response[i].word;
                    opt.innerHTML = xhr.response[i].word;

                    wordList.appendChild(opt);

                }
            }
        }
        xhr.open("GET", "wordsapi/v1/search/" + abbrev);
        xhr.responseType = 'json';
        xhr.send();

    });

    addword.addEventListener("click", function () {
        var word = searchfield.value;
        var body = {
            word: word
        };
        var bodyJSON = JSON.stringify(body);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                //wordData.innerHTML = xhr.response;
                if (xhr.status == 201) {
                    //alert("WOO HOO!");
                    //modify words.js on server
                    //create an options element for the new word.
                    //Get the id and the word value from xhr.response
                    //use them to populate the new options element.
                    //add new option to the child of the wordlist
                    //make sure to set the option as selected.
                    //Call chooseWord() to show word in wordData
                    console.log(xhr.response);
                    messages.innerHTML = xhr.response.word + " added. URL is: ";
                    messages.innerHTML += xhr.getResponseHeader("Location")
                    messages.style.visibility = "visible";
                    var opt = document.createElement("option");
                    opt.value = xhr.response.id;
                    opt.label = xhr.response.word;
                    opt.innerHTML = xhr.response.word;
                    wordList.appendChild(opt);
                    opt.setAttribute("selected", "true");
                    chooseWord();
                }
            }
        }
        xhr.open("POST", "/wordsapi/v1/dictionary");
        xhr.responseType = 'json';
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(bodyJSON); //converts js object to json string
    });
    
    deleteWord.addEventListener("click", function () {
        var wordId = wordList.options[wordList.selectedIndex].value;
        var word = wordList.options[wordList.selectedIndex].label;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 204) {
                    //theWord.style.textDecoration = "line-through";
                    console.log(xhr.response);
                    messages.innerHTML = word + " deleted.";
                    messages.style.visibility = "visible";
                    wordData.style.visibility = "hidden";
                    searchfield.value = "";
                }
            }
        }
        xhr.open("DELETE", "/wordsapi/v1/dictionary/" + wordId);
        xhr.send();

    });
    
    changeSpellingButton.addEventListener("click", function () {
        var wordId = wordList.options[wordList.selectedIndex].value;
        var word = changeSpellingField.value;
        var body = { id: wordID, word: word};
        var bodyJSON = JSON.stringify(body);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    //theWord.style.textDecoration = "line-through";
                    console.log(xhr.response);
                    messages.innerHTML = xhr.responseText;
                    messages.style.visibility = "visible";
                    //wordData.style.visibility = "hidden";
                    theWord.innerHTML = word;
                    
                }
                else{
                    messages.innerHTML = xhr.status + ": " + xhr.responseText;
                    messages.style.visibility = "visible";
                }
            }
        }
        xhr.open("PUT", "/wordsapi/v1/dictionary/" + wordId);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(bodyJSON);

    });
    
    addUpdate.addEventListener("click", function () {
        var wordId = wordList.options[wordList.selectedIndex].value;
        var definition = newDefinition.value;
        var body = {
            wordId: wordId,
            definition: definition
        };
        var bodyJSON = JSON.stringify(body);
        console.log(bodyJSON);
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                //wordData.innerHTML = xhr.response;
                if (xhr.status == 201) {
                    console.log(xhr.response);
                    messages.innerHTML =" Definition added ";
                    messages.innerHTML += xhr.getResponseHeader("Location");
                    messages.style.visibility = "visible";
                    showDefinitions(wordId);
                  
                }
            }
        }
        xhr.open("POST", "/wordsapi/v1/dictionary/"+ wordId+ "/definition");
        xhr.responseType = 'json';
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(bodyJSON); //converts js object to json string
    });
    
        var showDefinitions = function (wordId){
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function (){
                if (xhr.readyState == 4){
                    if (xhr.status == 200){
                        definitionList.innerHTML ="";
                        var defs = xhr.response;
                        for (var i=0; i<defs.length; i++){
                            var defContainer = document.createElement("div");
                            
                            var div = document.createElement("div");
                            div.setAttribute("class","definition");
                            div.innerHTML = defs[i].definition;
                            defContainer.appendChild(div);                                             
                            var delButton = document.createElement("div");
                            delButton.setAttribute("class", "defDelete");
                            delButton.innerHTML = "x";
                            defContainer.appendChild(delButton);
                            
                            definitionList.appendChild(defContainer);

                        }
                    }
                }
            }
        
        xhr.open("GET", "/wordsapi/v1/dictionary/" + wordId + "/definition");
        xhr.responseType = 'json';
        xhr.send();
}


    var chooseWord = function (evt) {
        var word = wordList.options[wordList.selectedIndex].label;
        var wordId = wordList.options[wordList.selectedIndex].value;
        wordList.style.visibility = "hidden";
        wordList.setAttribute("size",0);
        searchfield.value = word;
        theWord.innerHTML = word;
        changeSpellingField.value = word;
        wordID.innerHTML = wordId;
        theWord.style.textDecoration = "none";
        wordData.style.visibility = "visible";
        searchfield.value = "";
        showDefinitions(wordId);

    }
    wordList.addEventListener("blur", chooseWord);
    wordList.addEventListener("click", chooseWord);
    
})
